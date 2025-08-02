# OLX Reviews Deployment Guide

## Overview

This guide covers deploying the OLX Reviews Chrome Extension and Go Fiber backend to production.

## Prerequisites

- **VPS/Cloud Server** (Ubuntu 20.04+ recommended)
- **Domain name** (optional but recommended)
- **SSL certificate** (Let's Encrypt)
- **Docker** and **Docker Compose**
- **PostgreSQL** database
- **Nginx** reverse proxy

## Architecture

```
Internet → Nginx → Go Fiber Backend → PostgreSQL
                ↓
         Chrome Extension
```

## 1. Server Setup

### Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Nginx
sudo apt install nginx -y

# Install Certbot for SSL
sudo apt install certbot python3-certbot-nginx -y
```

### Configure Firewall

```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

## 2. Database Setup

### Option A: External PostgreSQL

```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Create database and user
sudo -u postgres psql
CREATE DATABASE labrago;
CREATE USER labrago_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE labrago TO labrago_user;
\q
```

### Option B: Docker PostgreSQL

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: labrago
      POSTGRES_USER: labrago_user
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
```

## 3. Backend Deployment

### Create Production Environment

```bash
# Create project directory
mkdir -p /opt/olx-reviews
cd /opt/olx-reviews

# Clone repository
git clone https://github.com/your-username/olx-reviews-extension.git .
```

### Configure Environment

```bash
# Copy environment template
cp backend/env.example backend/.env

# Edit environment variables
nano backend/.env
```

**Production Environment Variables:**

```env
# Database
DSN=postgres://labrago_user:secure_password@localhost:5432/labrago?sslmode=disable
DB_DIALECT=postgres

# Server
SERVER_PORT=4000
SERVER_HOST=0.0.0.0

# Security
SECRET_KEY=your-super-secure-secret-key-here
SUPER_ADMIN_EMAIL=admin@yourdomain.com
SUPER_ADMIN_PASSWORD=secure-admin-password

# Centrifugo
CENTRIFUGO_API_ADDRESS=http://localhost:8000/api
CENTRIFUGO_API_KEY=your-centrifugo-api-key
CENTRIFUGO_SECRET=your-centrifugo-secret

# CORS
CORS_ALLOWED_ORIGINS=https://yourdomain.com,chrome-extension://*

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Rate Limiting
RATE_LIMIT_REQUESTS=1000
RATE_LIMIT_WINDOW=1m
```

### Docker Production Configuration

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: olx-reviews-postgres
    environment:
      POSTGRES_DB: labrago
      POSTGRES_USER: labrago_user
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    networks:
      - olx-reviews-network

  centrifugo:
    image: centrifugo/centrifugo:latest
    container_name: olx-reviews-centrifugo
    command: centrifugo --config=/etc/centrifugo/config.json
    volumes:
      - ./backend/centrifugo/config.json:/etc/centrifugo/config.json
    restart: unless-stopped
    networks:
      - olx-reviews-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: olx-reviews-backend
    environment:
      - DSN=${DSN}
      - DB_DIALECT=${DB_DIALECT}
      - SERVER_PORT=${SERVER_PORT}
      - SECRET_KEY=${SECRET_KEY}
      - SUPER_ADMIN_EMAIL=${SUPER_ADMIN_EMAIL}
      - CENTRIFUGO_API_ADDRESS=${CENTRIFUGO_API_ADDRESS}
      - CENTRIFUGO_API_KEY=${CENTRIFUGO_API_KEY}
    ports:
      - "4000:4000"
    depends_on:
      - postgres
      - centrifugo
    restart: unless-stopped
    networks:
      - olx-reviews-network
    volumes:
      - ./backend/logs:/app/logs

volumes:
  postgres_data:

networks:
  olx-reviews-network:
    driver: bridge
```

### Deploy Backend

```bash
# Start services
cd /opt/olx-reviews
docker-compose -f docker-compose.prod.yml up -d

# Check logs
docker-compose -f docker-compose.prod.yml logs -f
```

## 4. Nginx Configuration

### Create Nginx Config

```bash
sudo nano /etc/nginx/sites-available/olx-reviews
```

```nginx
server {
    listen 80;
    server_name yourdomain.com api.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Admin Panel
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # CORS Headers
    add_header Access-Control-Allow-Origin "*" always;
    add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
    add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization" always;

    # API Proxy
    location / {
        proxy_pass http://localhost:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Handle preflight requests
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "*";
            add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
            add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization";
            add_header Access-Control-Max-Age 1728000;
            add_header Content-Type "text/plain; charset=utf-8";
            add_header Content-Length 0;
            return 204;
        }
    }
}
```

### Enable Site and SSL

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/olx-reviews /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Get SSL certificates
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com

# Test SSL renewal
sudo certbot renew --dry-run
```

## 5. Chrome Extension Deployment

### Build Extension

```bash
# Build production version
cd chrome-extension
npm install
npm run build
```

### Chrome Web Store

1. **Create developer account** at [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
2. **Upload extension**:
   - Package the `dist` folder as a ZIP file
   - Upload to Chrome Web Store
   - Fill in store listing details
   - Submit for review

### Manual Distribution

For testing or private distribution:

```bash
# Create distribution package
cd chrome-extension
zip -r olx-reviews-extension.zip dist/ manifest.json
```

## 6. Monitoring and Maintenance

### Health Checks

```bash
# Check service status
docker-compose -f docker-compose.prod.yml ps

# Check logs
docker-compose -f docker-compose.prod.yml logs -f backend

# Test API
curl -X GET https://api.yourdomain.com/health
```

### Backup Strategy

```bash
# Database backup script
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup PostgreSQL
docker exec olx-reviews-postgres pg_dump -U labrago_user labrago > $BACKUP_DIR/db_backup_$DATE.sql

# Backup configuration
tar -czf $BACKUP_DIR/config_backup_$DATE.tar.gz /opt/olx-reviews/backend/.env

# Clean old backups (keep 7 days)
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

### Log Rotation

```bash
# Configure logrotate
sudo nano /etc/logrotate.d/olx-reviews
```

```
/opt/olx-reviews/backend/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
}
```

## 7. Scaling Considerations

### Horizontal Scaling

```yaml
# docker-compose.scale.yml
version: '3.8'
services:
  backend:
    deploy:
      replicas: 3
    environment:
      - REDIS_URL=redis://redis:6379
```

### Load Balancer

```nginx
# nginx load balancer config
upstream backend_servers {
    server backend1:4000;
    server backend2:4000;
    server backend3:4000;
}

server {
    listen 443 ssl;
    server_name api.yourdomain.com;
    
    location / {
        proxy_pass http://backend_servers;
        # ... other proxy settings
    }
}
```

## 8. Security Checklist

- [ ] **SSL certificates** installed and auto-renewing
- [ ] **Firewall** configured properly
- [ ] **Database** secured with strong passwords
- [ ] **Environment variables** not committed to git
- [ ] **Rate limiting** enabled
- [ ] **CORS** configured correctly
- [ ] **Logs** monitored for suspicious activity
- [ ] **Backups** automated and tested
- [ ] **Updates** scheduled regularly

## 9. Troubleshooting

### Common Issues

1. **Database connection errors**:
   ```bash
   docker logs olx-reviews-postgres
   ```

2. **API not responding**:
   ```bash
   curl -v https://api.yourdomain.com/health
   ```

3. **SSL certificate issues**:
   ```bash
   sudo certbot certificates
   sudo certbot renew
   ```

4. **Nginx configuration errors**:
   ```bash
   sudo nginx -t
   sudo systemctl status nginx
   ```

### Performance Monitoring

```bash
# Monitor resource usage
docker stats

# Check disk space
df -h

# Monitor network
iftop
```

## 10. Updates and Maintenance

### Update Backend

```bash
cd /opt/olx-reviews
git pull origin main
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build
```

### Update Extension

1. **Build new version**
2. **Update Chrome Web Store listing**
3. **Test thoroughly before publishing**

### Database Migrations

```bash
# Run migrations
docker exec olx-reviews-backend ./migrate up
```

This deployment guide provides a production-ready setup for the OLX Reviews extension with proper security, monitoring, and maintenance procedures. 