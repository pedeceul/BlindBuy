# OLX Reviews Chrome Extension - Development Guide

## Overview

This Chrome extension adds review functionality to OLX ads using Vue.js frontend and Go Fiber backend.

## Project Structure

```
chrome-extension/
├── src/
│   ├── components/          # Vue.js components
│   │   ├── PopupApp.vue    # Main popup component
│   │   ├── CurrentAdInfo.vue # Current ad info and review form
│   │   ├── MyReviews.vue   # User's review history
│   │   └── Settings.vue    # Extension settings
│   ├── stores/             # Pinia state management
│   │   └── reviewStore.js  # Main store for reviews and ads
│   ├── utils/              # Utility functions
│   │   └── apiClient.js    # GraphQL API client
│   ├── popup.html          # Popup HTML entry point
│   ├── popup.js            # Popup JavaScript entry point
│   ├── popup.css           # Popup styles
│   ├── content.js          # Content script for OLX pages
│   └── background.js       # Background service worker
├── public/                 # Static assets
│   └── icons/             # Extension icons
├── manifest.json           # Chrome extension manifest
├── package.json            # Dependencies and scripts
├── vite.config.js          # Vite build configuration
├── tailwind.config.js      # Tailwind CSS configuration
└── postcss.config.js       # PostCSS configuration
```

## Development Setup

### Prerequisites

- Node.js 18+ and npm
- Chrome browser
- Go Fiber backend running on localhost:4000

### Installation

1. **Clone and setup the extension:**
   ```bash
   cd chrome-extension
   chmod +x setup.sh
   ./setup.sh
   ```

2. **Start Go Fiber backend:**
   ```bash
   # Navigate to backend directory
   cd backend
   
   # Install dependencies
   go mod tidy
   
   # Generate Ent code
   go run entc.go
   
   # Start the server
   go run cmd/server/main.go
   ```

3. **Load extension in Chrome:**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `chrome-extension/dist` folder

### Development Commands

```bash
# Install dependencies
npm install

# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Build and watch for changes
npm run watch

# Preview production build
npm run preview
```

## Architecture

### Frontend (Vue.js)

- **Vue 3** with Composition API
- **Pinia** for state management
- **Tailwind CSS** for styling
- **Vite** for build tooling

### Backend Integration

- **GraphQL** API communication
- **Go Fiber** HTTP server
- **PostgreSQL** database
- **Real-time** updates via WebSocket

### Chrome Extension Features

- **Manifest V3** compliance
- **Content script** injection on OLX pages
- **Background service worker** for persistent tasks
- **Popup interface** for extension management
- **Context menu** integration

## Key Components

### PopupApp.vue
Main popup component with tabbed interface:
- Current Ad tab
- My Reviews tab  
- Settings tab

### CurrentAdInfo.vue
Shows current OLX ad information and review functionality:
- Ad details extraction
- Review submission form
- Rating display
- Recent reviews list

### MyReviews.vue
Manages user's review history:
- Review list with edit/delete
- Review editing modal
- Review statistics

### Settings.vue
Extension configuration:
- API endpoint configuration
- Auto-inject settings
- Data management
- Connection testing

### reviewStore.js
Pinia store for state management:
- Current ad data
- Reviews data
- User reviews
- Settings management
- API communication

### content.js
Content script that runs on OLX pages:
- Ad data extraction
- Review widget injection
- Page interaction
- API communication

### background.js
Service worker for background tasks:
- Extension lifecycle management
- Message routing
- Context menu handling
- Storage management

## Data Flow

1. **User visits OLX ad page**
2. **Content script detects page and extracts ad data**
3. **Widget is injected with current reviews**
4. **User can view/add reviews through widget**
5. **Reviews are sent to Go Fiber backend via GraphQL**
6. **Real-time updates via WebSocket**

## API Integration

### GraphQL Queries

```graphql
# Get ad with reviews
query GetAd($url: String!) {
  ad(url: $url) {
    id
    title
    price
    reviews {
      rating
      comment
      user { name }
    }
  }
}

# Add review
mutation AddReview($input: ReviewInput!) {
  createReview(input: $input) {
    id
    rating
    comment
  }
}
```

### Go Fiber Data Models

The extension expects these models in Go Fiber:

- **Ads**: Store OLX ad information
- **Reviews**: User reviews with ratings
- **Users**: Extension users

## Testing

### Manual Testing

1. **Load extension in Chrome**
2. **Navigate to any OLX ad page**
3. **Verify widget appears**
4. **Test review submission**
5. **Check popup functionality**

### Development Testing

```bash
# Start development server
npm run dev

# In another terminal, start backend
labractl start

# Test GraphQL queries
curl -X POST http://localhost:4000/query \
  -H "Content-Type: application/json" \
  -d '{"query":"query { ads { id title } }"}'
```

## Deployment

### Production Build

```bash
npm run build
```

The `dist/` folder contains the production extension.

### Publishing

1. **Build the extension**
2. **Create a ZIP file of the dist folder**
3. **Upload to Chrome Web Store**

## Troubleshooting

### Common Issues

1. **Extension not loading:**
   - Check manifest.json syntax
   - Verify all files are in dist folder
   - Check Chrome console for errors

2. **Widget not appearing:**
   - Verify content script is injected
   - Check browser console for errors
   - Ensure OLX page detection works

3. **API connection issues:**
   - Verify Go Fiber backend is running
   - Check CORS settings
   - Test GraphQL endpoint directly

4. **Build errors:**
   - Clear node_modules and reinstall
   - Check Vite configuration
   - Verify all imports are correct

### Debug Mode

Enable debug logging:

```javascript
// In content.js or background.js
const DEBUG = true;

if (DEBUG) {
  console.log('OLX Reviews Debug:', message);
}
```

## Contributing

1. **Fork the repository**
2. **Create a feature branch**
3. **Make your changes**
4. **Test thoroughly**
5. **Submit a pull request**

## License

MIT License - see LICENSE file for details. 