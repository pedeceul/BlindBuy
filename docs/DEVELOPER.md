# BlindBuy Developer Documentation

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Development Setup](#development-setup)
5. [Project Structure](#project-structure)
6. [Backend Development](#backend-development)
7. [Chrome Extension Development](#chrome-extension-development)
8. [Database Schema](#database-schema)
9. [API Documentation](#api-documentation)
10. [Testing](#testing)
11. [Deployment](#deployment)
12. [Contributing](#contributing)

## Project Overview

BlindBuy is a Chrome Extension that adds review functionality to OLX ads and sellers, helping users make informed purchasing decisions. The project consists of:

- **Chrome Extension** (Manifest V3): Frontend interface for users
- **Go Backend** (Fiber): GraphQL API with PostgreSQL database
- **Database**: PostgreSQL with Ent ORM

### Key Features Implemented

✅ **Chrome Extension**
- Two-tab popup interface (Ad Reviews / Seller Reviews)
- Star rating system (1-5 stars)
- Form validation
- Content script for data extraction from OLX pages
- Navigation detection (works without page refresh)
- Background service worker
- Modern UI with Tailwind CSS

✅ **Backend API**
- GraphQL API with gqlgen
- PostgreSQL database with Ent ORM
- CORS configuration for Chrome Extension
- Health check endpoints
- Error handling and validation

✅ **Database**
- Ad, Seller, and Review entities
- Proper relationships and constraints
- Calculated fields for average ratings

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Chrome        │    │   Go Backend    │    │   PostgreSQL    │
│   Extension     │◄──►│   (Fiber)       │◄──►│   Database      │
│                 │    │                 │    │                 │
│ • Popup UI      │    │ • GraphQL API   │    │ • Ads           │
│ • Content Script│    │ • JWT Auth      │    │ • Sellers       │
│ • Background    │    │ • CORS          │    │ • Reviews       │
│   Service Worker│    │ • Validation    │    │ • Relationships │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Data Flow

1. **User visits OLX ad page**
2. **Content script extracts ad data** (title, seller, price, etc.)
3. **User clicks extension icon**
4. **Popup shows ad info and existing reviews**
5. **User submits review via GraphQL API**
6. **Backend validates and stores in database**
7. **Real-time updates via WebSocket (planned)**

## Technology Stack

### Backend
- **Language**: Go 1.24+
- **Framework**: Go Fiber
- **ORM**: Ent (Go ORM)
- **Database**: PostgreSQL
- **API**: GraphQL (gqlgen)
- **Authentication**: JWT (planned)

### Frontend (Chrome Extension)
- **Manifest**: V3
- **Framework**: Vanilla JavaScript + Vue.js
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Package Manager**: npm

### Development Tools
- **Version Control**: Git
- **Database**: PostgreSQL
- **Testing**: Go testing framework
- **Documentation**: Markdown

## Development Setup

### Prerequisites

```bash
# Required software
- Go 1.24+
- PostgreSQL 15+
- Node.js 18+
- Chrome Browser
- Git
```

### 1. Clone Repository

```bash
git clone https://github.com/your-username/blindbuy.git
cd blindbuy
```

### 2. Database Setup

```bash
# Start PostgreSQL (macOS)
brew services start postgresql

# Use the setup script
chmod +x backend/scripts/setup-db.sh
./backend/scripts/setup-db.sh
```

### 3. Backend Setup

```bash
cd backend

# Install Go dependencies
go mod tidy

# Generate Ent code
go run entc.go

# Create environment file
cat > .env << EOF
# Database Configuration
DSN=postgres://olx_user:olx_password@localhost:5432/olx_reviews?sslmode=disable
DB_DIALECT=postgres

# Server Configuration
PORT=4000

# Security
SECRET_KEY=your-secret-key-here

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:4000,chrome-extension://*
EOF

# Start server
go run cmd/server/main.go
```

### 4. Chrome Extension Setup

```bash
cd chrome-extension

# Install dependencies
npm install

# Development build
npm run dev

# Production build
npm run build
```

### 5. Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `chrome-extension/dist` folder
5. The BlindBuy extension should now appear

## Project Structure

```
blindbuy/
├── backend/                    # Go Backend
│   ├── cmd/
│   │   └── server/
│   │       └── main.go        # Server entry point
│   ├── internal/
│   │   ├── database/          # Database initialization
│   │   ├── models/            # Ent entities
│   │   │   ├── ad.go         # Ad entity
│   │   │   ├── seller.go     # Seller entity
│   │   │   └── review.go     # Review entity
│   │   ├── graphql/          # GraphQL schema and resolvers
│   │   │   ├── generated.go  # Generated GraphQL code
│   │   │   ├── handler.go    # GraphQL handler
│   │   │   └── schema.graphql # GraphQL schema
│   │   └── handlers/         # HTTP handlers
│   ├── scripts/
│   │   └── setup-db.sh      # Database setup
│   ├── go.mod               # Go dependencies
│   ├── go.sum               # Go checksums
│   ├── gqlgen.yml          # GraphQL generation config
│   └── entc.go             # Ent code generation
├── chrome-extension/         # Chrome Extension
│   ├── src/
│   │   ├── components/      # Vue components
│   │   │   ├── PopupApp.vue
│   │   │   ├── CurrentAdInfo.vue
│   │   │   ├── MyReviews.vue
│   │   │   ├── SellerReviews.vue
│   │   │   └── Settings.vue
│   │   ├── stores/          # Pinia stores
│   │   │   └── reviewStore.js
│   │   ├── utils/           # Utilities
│   │   │   └── apiClient.js
│   │   ├── popup.html       # Popup HTML
│   │   ├── popup.js         # Popup logic
│   │   ├── content.js       # Content script
│   │   └── background.js    # Background script
│   ├── dist/               # Built extension
│   ├── manifest.json       # Extension manifest
│   ├── package.json        # npm dependencies
│   ├── vite.config.js      # Vite configuration
│   └── tailwind.config.js  # Tailwind configuration
├── docs/                   # Documentation
│   ├── DEVELOPER.md        # This file
│   ├── BUSINESS.md         # Business documentation
│   ├── API.md             # API documentation
│   └── DEPLOYMENT.md      # Deployment guide
└── README.md              # Project overview
```

## Backend Development

### Database Models

The backend uses Ent ORM with three main entities:

#### Ad Entity
```go
type Ad struct {
    ent.Schema
}

func (Ad) Fields() []ent.Field {
    return []ent.Field{
        field.String("url").Unique().NotEmpty(),
        field.String("title").Optional(),
        field.String("price").Optional(),
        field.String("category").Optional(),
        field.String("seller_id").Optional(),
        field.String("phone").Optional(),
        field.Float("average_rating").Default(0),
        field.Int("review_count").Default(0),
        field.Time("created_at").Default(time.Now),
        field.Time("updated_at").Default(time.Now).UpdateDefault(time.Now),
    }
}
```

#### Seller Entity
```go
type Seller struct {
    ent.Schema
}

func (Seller) Fields() []ent.Field {
    return []ent.Field{
        field.String("id").Unique().NotEmpty(),
        field.String("name").Optional(),
        field.String("phone").Optional(),
        field.Float("average_rating").Default(0),
        field.Int("review_count").Default(0),
        field.Time("created_at").Default(time.Now),
        field.Time("updated_at").Default(time.Now).UpdateDefault(time.Now),
    }
}
```

#### Review Entity
```go
type Review struct {
    ent.Schema
}

func (Review) Fields() []ent.Field {
    return []ent.Field{
        field.Int("rating").Min(1).Max(5),
        field.String("comment").NotEmpty(),
        field.String("phone").Optional(),
        field.Time("created_at").Default(time.Now),
    }
}
```

### GraphQL Schema

```graphql
type Ad {
  id: ID!
  url: String!
  title: String
  price: String
  category: String
  sellerId: String
  phone: String
  averageRating: Float!
  reviewCount: Int!
  createdAt: Time!
  updatedAt: Time!
  reviews: [Review!]
}

type Seller {
  id: ID!
  name: String
  phone: String
  averageRating: Float!
  reviewCount: Int!
  createdAt: Time!
  updatedAt: Time!
  reviews: [Review!]
}

type Review {
  id: ID!
  rating: Int!
  comment: String!
  phone: String
  createdAt: Time!
  ad: Ad
  seller: Seller
}

input CreateReviewInput {
  adUrl: String!
  sellerId: String
  rating: Int!
  comment: String!
  phone: String
}

type Mutation {
  createReview(input: CreateReviewInput!): Review!
}

type Query {
  ad(url: String!): Ad
  seller(id: String!): Seller
  reviewsByAdId(adId: ID!): [Review!]!
  reviewsBySellerId(sellerId: String!): [Review!]!
}
```

### API Endpoints

#### GraphQL
- `POST /query`: Main GraphQL endpoint
- `GET /playground`: GraphQL playground

#### REST
- `GET /health`: Health check
- `GET /admin/health`: Admin health check

### Development Commands

```bash
# Generate Ent code after schema changes
go run entc.go

# Generate GraphQL code
go run github.com/99designs/gqlgen generate

# Run tests
go test ./...

# Hot reload (if using air)
air

# Database migrations
go run -mod=mod entgo.io/ent/cmd/ent migrate --dir=./internal/models
```

## Chrome Extension Development

### Manifest V3 Structure

```json
{
  "manifest_version": 3,
  "name": "BlindBuy",
  "version": "1.0.0",
  "description": "Add reviews and ratings to OLX ads and sellers",
  "permissions": [
    "activeTab",
    "storage",
    "scripting"
  ],
  "host_permissions": [
    "https://*.olx.ro/*",
    "https://*.olx.pl/*",
    "https://*.olx.ua/*",
    "https://*.olx.com/*",
    "http://localhost:4000/*"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["https://*.olx.ro/*"],
      "js": ["content.js"],
      "run_at": "document_end"
    }
  ],
  "action": {
    "default_popup": "popup.html",
    "default_title": "BlindBuy"
  }
}
```

### Vue.js Components

The extension uses Vue.js with Pinia for state management:

#### PopupApp.vue
Main popup component with tab navigation.

#### CurrentAdInfo.vue
Displays current ad information and existing reviews.

#### MyReviews.vue
Shows user's submitted reviews with edit/delete functionality.

#### SellerReviews.vue
Displays seller reviews and allows submitting new ones.

#### Settings.vue
Extension settings and configuration.

### State Management

```javascript
// stores/reviewStore.js
import { defineStore } from 'pinia'

export const useReviewStore = defineStore('review', {
  state: () => ({
    currentAd: null,
    currentSeller: null,
    reviews: [],
    loading: false,
    error: null
  }),
  
  actions: {
    async fetchAdReviews(adUrl) {
      // GraphQL query implementation
    },
    
    async submitReview(reviewData) {
      // GraphQL mutation implementation
    }
  }
})
```

### Content Script

The content script extracts data from OLX pages:

```javascript
// content.js
function extractAdData() {
  const adData = {
    url: window.location.href,
    title: document.querySelector('[data-cy="ad_title"]')?.textContent,
    price: document.querySelector('[data-cy="ad_price"]')?.textContent,
    seller: document.querySelector('[data-cy="ad_seller"]')?.textContent,
    // ... more selectors
  }
  
  chrome.runtime.sendMessage({
    type: 'AD_DATA_EXTRACTED',
    data: adData
  })
}
```

### Development Workflow

```bash
# Development with hot reload
npm run dev

# Build for production
npm run build

# Load extension in Chrome
# 1. Go to chrome://extensions/
# 2. Click "Reload" on BlindBuy extension
```

## Database Schema

### Entity Relationships

```
Ad (1) ──── (N) Review
Seller (1) ──── (N) Review
```

### Database Tables

#### ads
```sql
CREATE TABLE ads (
    id SERIAL PRIMARY KEY,
    url VARCHAR(500) UNIQUE NOT NULL,
    title VARCHAR(255),
    price VARCHAR(100),
    category VARCHAR(100),
    seller_id VARCHAR(100),
    phone VARCHAR(50),
    average_rating DECIMAL(3,2) DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### sellers
```sql
CREATE TABLE sellers (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255),
    phone VARCHAR(50),
    average_rating DECIMAL(3,2) DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### reviews
```sql
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    ad_id INTEGER REFERENCES ads(id),
    seller_id VARCHAR(100) REFERENCES sellers(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    phone VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Database Operations

```bash
# Connect to database
psql -d olx_reviews

# View tables
\dt

# View data
SELECT * FROM ads LIMIT 5;
SELECT * FROM sellers LIMIT 5;
SELECT * FROM reviews LIMIT 5;

# Check relationships
SELECT a.title, r.rating, r.comment 
FROM ads a 
JOIN reviews r ON a.id = r.ad_id 
LIMIT 10;
```

## API Documentation

### GraphQL Queries

#### Get Ad by URL
```graphql
query GetAd($url: String!) {
  ad(url: $url) {
    id
    url
    title
    price
    category
    averageRating
    reviewCount
    reviews {
      id
      rating
      comment
      createdAt
    }
  }
}
```

#### Get Seller by ID
```graphql
query GetSeller($id: String!) {
  seller(id: $id) {
    id
    name
    phone
    averageRating
    reviewCount
    reviews {
      id
      rating
      comment
      createdAt
    }
  }
}
```

### GraphQL Mutations

#### Create Review
```graphql
mutation CreateReview($input: CreateReviewInput!) {
  createReview(input: $input) {
    id
    rating
    comment
    createdAt
    ad {
      id
      title
      averageRating
      reviewCount
    }
  }
}
```

### REST Endpoints

#### Health Check
```bash
curl http://localhost:4000/health
```

Response:
```json
{
  "status": "ok",
  "message": "OLX Reviews Backend is running",
  "time": "2024-01-01T00:00:00Z"
}
```

## Testing

### Backend Testing

```bash
# Run all tests
go test ./...

# Run specific test
go test ./internal/models

# Run with coverage
go test -cover ./...

# Run with verbose output
go test -v ./...
```

### Chrome Extension Testing

```bash
# Run extension tests
npm test

# Test specific component
npm test -- --grep "PopupApp"
```

### Manual Testing

1. **Backend API Testing**
   ```bash
   # Test GraphQL endpoint
   curl -X POST http://localhost:4000/query \
     -H "Content-Type: application/json" \
     -d '{"query":"{ __typename }"}'
   ```

2. **Chrome Extension Testing**
   - Navigate to any OLX ad page
   - Click extension icon
   - Test review submission
   - Verify data extraction

### Test Data

```bash
# Insert test data
psql -d olx_reviews -c "
INSERT INTO ads (url, title, price, category) VALUES 
('https://www.olx.ro/d/test-ad-1', 'iPhone 12 Pro', '2500 RON', 'Electronics'),
('https://www.olx.ro/d/test-ad-2', 'MacBook Air', '3500 RON', 'Electronics');

INSERT INTO sellers (id, name, phone) VALUES 
('seller1', 'John Doe', '+40123456789'),
('seller2', 'Jane Smith', '+40987654321');

INSERT INTO reviews (ad_id, seller_id, rating, comment) VALUES 
(1, 'seller1', 5, 'Great seller, fast delivery!'),
(1, 'seller1', 4, 'Good communication'),
(2, 'seller2', 3, 'Average experience');
"
```

## Deployment

### Development Deployment

```bash
# Backend
cd backend
go run cmd/server/main.go

# Chrome Extension
cd chrome-extension
npm run build
# Load dist/ folder in Chrome
```

### Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed production deployment instructions.

## Contributing

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/new-feature
   ```
3. **Make your changes**
4. **Add tests if applicable**
5. **Run tests**
   ```bash
   go test ./...
   npm test
   ```
6. **Commit your changes**
   ```bash
   git commit -m "feat: add new feature"
   ```
7. **Push to your fork**
   ```bash
   git push origin feature/new-feature
   ```
8. **Create a pull request**

### Code Style

#### Go
- Use `gofmt` for formatting
- Follow Go naming conventions
- Add comments for exported functions
- Use meaningful variable names

#### JavaScript/Vue.js
- Use ESLint configuration
- Follow Vue.js style guide
- Use meaningful component names
- Add JSDoc comments for functions

### Pull Request Guidelines

1. **Clear title** describing the change
2. **Detailed description** of what was changed
3. **Screenshots** for UI changes
4. **Tests** for new functionality
5. **Documentation** updates if needed

### Issue Reporting

When reporting issues, include:
1. **Environment details** (OS, browser version, etc.)
2. **Steps to reproduce**
3. **Expected vs actual behavior**
4. **Screenshots or logs**
5. **Browser console errors**

## Troubleshooting

### Common Issues

#### Backend Issues

**Database connection failed**
```bash
# Check PostgreSQL is running
brew services list | grep postgresql

# Check database exists
psql -l | grep olx_reviews

# Test connection
psql -d olx_reviews -c "SELECT 1;"
```

**Port 4000 in use**
```bash
# Kill process using port 4000
lsof -ti:4000 | xargs kill -9
```

**GraphQL generation errors**
```bash
# Regenerate GraphQL code
go run github.com/99designs/gqlgen generate
```

#### Chrome Extension Issues

**Extension not loading**
- Check manifest.json syntax
- Verify all files exist in dist/ folder
- Check Chrome console for errors

**Content script not working**
- Verify content script is injected
- Check selectors match OLX page structure
- Test in Chrome DevTools

**API calls failing**
- Verify backend is running on port 4000
- Check CORS configuration
- Verify host permissions in manifest.json

### Debug Tools

#### Backend Debugging
```bash
# Enable debug logging
export LOG_LEVEL=debug

# Run with verbose output
go run -v cmd/server/main.go

# Check server logs
tail -f backend/server.log
```

#### Chrome Extension Debugging
```bash
# Open DevTools for extension
# 1. Go to chrome://extensions/
# 2. Click "Details" on BlindBuy
# 3. Click "Inspect views: service worker"
# 4. Check Console tab for errors
```

### Performance Monitoring

```bash
# Monitor backend performance
go tool pprof http://localhost:4000/debug/pprof/profile

# Monitor database queries
psql -d olx_reviews -c "SELECT query, calls, total_time FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"
```

---

This developer documentation provides comprehensive information for contributing to the BlindBuy project. For business documentation, see [BUSINESS.md](./BUSINESS.md). 