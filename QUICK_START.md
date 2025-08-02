# BlindBuy Chrome Extension - Quick Start

## 🚀 Quick Setup Guide

### Prerequisites
- Node.js (v16 or higher)
- Go (v1.24 or higher)
- PostgreSQL
- Chrome browser

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install Go dependencies
go mod tidy

# Generate Ent models
go run entc.go

# Set up database
chmod +x scripts/setup-db.sh
./scripts/setup-db.sh

# Create .env file
cat > .env << EOF
DSN=postgres://olx_user:olx_password@localhost:5432/olx_reviews?sslmode=disable
PORT=4000
SECRET_KEY=your-secret-key-here
EOF

# Start the backend
go run cmd/server/main.go
```

### 2. Chrome Extension Setup

```bash
# Navigate to chrome-extension directory
cd chrome-extension

# Install dependencies
npm install

# Build the extension (automatically copies all required files)
npm run build
```

### 3. Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `chrome-extension/dist` folder
5. The BlindBuy extension should now appear in your extensions list

### 4. Test the Extension

1. Navigate to any OLX ad page (e.g., https://www.olx.ro)
2. Click the BlindBuy extension icon in your browser toolbar
3. You should see a popup with two tabs: "Review Ad" and "Review Seller"
4. Try rating an ad or seller and submitting a review

### 5. Verify Backend

```bash
# Test health endpoint
curl http://localhost:4000/health

# Test GraphQL endpoint
curl -X POST http://localhost:4000/query \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __typename }"}'
```

## 🛠️ Development

### Backend Development
- **Port**: 4000
- **GraphQL**: http://localhost:4000/query
- **Health Check**: http://localhost:4000/health

### Extension Development
- **Build**: `npm run build` (automatically copies all files)
- **Watch**: `npm run dev` (if available)
- **Reload**: After changes, rebuild and reload the extension in Chrome

## 📁 Project Structure

```
missing-reviews/
├── backend/                    # Go Fiber + GraphQL + PostgreSQL
│   ├── cmd/server/main.go     # Main server entry point
│   ├── internal/
│   │   ├── database/          # Database initialization
│   │   ├── models/            # Ent entities (Ad, Seller, Review, User)
│   │   └── graphql/           # GraphQL schema and resolvers
│   ├── scripts/
│   │   └── setup-db.sh       # Database setup script
│   └── .env                   # Environment configuration
├── chrome-extension/          # Chrome Extension (Manifest V3)
│   ├── manifest.json          # Extension manifest
│   ├── popup.html             # Two-tab popup interface
│   ├── popup.js               # Popup logic and API calls
│   ├── content.js             # Data extraction from OLX pages
│   ├── background.js          # Service worker
│   ├── icons/                 # Extension icons (16px, 48px, 128px)
│   └── dist/                  # Built extension files
└── README.md                  # Comprehensive documentation
```

## 🔧 Troubleshooting

### Extension Won't Load
- Make sure you ran `npm run build` (not just `vite build`)
- The build script automatically copies `manifest.json`, `popup.html`, and `icons/`
- Check that all required files are in the `dist` folder
- Verify the extension is loaded from the correct folder

### Backend Won't Start
- Check PostgreSQL is running
- Verify database exists: `psql -U olx_user -d olx_reviews`
- Check `.env` file configuration
- Run `go mod tidy` to fix dependencies

### GraphQL Errors
- Ensure backend is running on port 4000
- Check CORS configuration for Chrome Extension
- Verify GraphQL schema is properly generated

### Icon Issues
- Make sure PNG icon files exist in `dist/icons/`
- Verify icon files are valid PNG format
- Check manifest.json icon paths are correct

### Popup Issues
- Ensure `popup.html` is in the `dist/` folder (not `dist/src/`)
- Check that `popup.js` and `popup.css` are built
- Verify manifest.json popup path is correct

### Build Issues
- Always use `npm run build` instead of `vite build`
- The build script automatically copies all required files
- Check that `package.json` has the correct build scripts

## 🎯 Features

- **Two-Tab Interface**: Separate tabs for reviewing ads and sellers
- **Star Rating System**: Interactive 1-5 star rating
- **Data Extraction**: Automatically extracts seller ID and phone from OLX pages
- **GraphQL API**: Modern API with proper error handling
- **Database Storage**: PostgreSQL with Ent ORM for data persistence

## 📞 Support

For issues or questions, check the main README.md file for detailed documentation and troubleshooting guides. 