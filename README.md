# BlindBuy 🛒

A Chrome Extension for reviewing Romanian OLX ads and sellers with a modern, user-friendly interface.

## 🌟 Features

- **Smart Ad Detection**: Automatically detects OLX ad pages and extracts product information
- **Easy Review System**: Rate ads from 1-5 stars with detailed comments
- **Real-time Backend**: Go/Fiber backend with GraphQL API for storing reviews
- **Modern UI**: Clean, responsive interface that integrates seamlessly with OLX
- **Privacy Focused**: No personal data collection, anonymous reviews
- **Error Handling**: Graceful error handling with helpful user messages

## 🏗️ Architecture

### Frontend (Chrome Extension)
- **Content Script**: Injects review widget into OLX pages
- **Background Script**: Handles extension lifecycle and messaging
- **Modern JavaScript**: ES6+ with async/await patterns
- **Error Handling**: Robust error handling with user-friendly messages

### Backend (Go/Fiber)
- **GraphQL API**: Modern API with type-safe queries and mutations
- **PostgreSQL Database**: Reliable data storage with Ent ORM
- **Simplified Schema**: Only essential entities (Ad, Review) for better performance
- **CORS Support**: Cross-origin requests enabled for extension communication

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- Go 1.21+
- PostgreSQL 14+

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/pedeceul/BlindBuy.git
   cd BlindBuy
   ```

2. **Set up the database**
   ```bash
   # Create database
   createdb -U postgres olx_reviews
   
   # Or use the provided script
   cd backend
   ./scripts/setup-db.sh
   ```

3. **Configure environment**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Install dependencies and run**
   ```bash
   cd backend
   go mod download
   go run entc.go  # Generate Ent code
   go run cmd/server/main.go
   ```

   The backend will be available at `http://localhost:4000`

### Chrome Extension Setup

1. **Install dependencies**
   ```bash
   cd chrome-extension
   npm install
   ```

2. **Build the extension**
   ```bash
   npm run build
   ```

3. **Load in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `chrome-extension/dist` folder

## 🧪 Testing

### Backend Tests
```bash
cd backend
go test ./tests/...
```

### Extension Tests
```bash
cd chrome-extension
npm test
```

## 📁 Project Structure

```
BlindBuy/
├── backend/                 # Go backend server
│   ├── cmd/server/         # Main server entry point
│   ├── internal/           # Internal packages
│   │   ├── models/         # Ent schema definitions
│   │   ├── graphql/        # GraphQL handlers
│   │   ├── database/       # Database connection
│   │   └── tests/          # Backend tests
│   ├── scripts/            # Database setup scripts
│   └── .env               # Environment configuration
├── chrome-extension/       # Chrome extension
│   ├── src/               # Source code
│   │   ├── content.js     # Content script
│   │   └── background.js  # Background script
│   ├── dist/              # Built extension
│   ├── tests/             # Extension tests
│   └── package.json       # Dependencies
├── docs/                  # Documentation
└── README.md             # This file
```

## 🔧 Development

### Backend Development
- **Hot Reload**: Use `air` for hot reloading during development
- **Database Migrations**: Ent handles schema migrations automatically
- **API Testing**: Use GraphQL Playground at `http://localhost:4000/playground`

### Extension Development
- **Watch Mode**: `npm run dev` for development with hot reload
- **Testing**: `npm test` runs Jest tests
- **Build**: `npm run build` creates production build

## 🗄️ Database Schema

### Simplified Schema (Current)
- **Ads**: Store OLX ad information (URL, title, price, etc.)
- **Reviews**: Store user reviews with ratings and comments

### Relationships
- One Ad can have many Reviews
- Reviews belong to one Ad

## 🔒 Security & Privacy

- **No Personal Data**: Reviews are anonymous
- **CORS Protection**: Proper CORS configuration for extension
- **Input Validation**: Server-side validation for all inputs
- **Error Handling**: No sensitive information in error messages

## 🐛 Troubleshooting

### Backend Issues
- **Database Connection**: Check PostgreSQL is running and credentials are correct
- **Schema Issues**: Run `go run entc.go` to regenerate Ent code
- **Port Conflicts**: Ensure port 4000 is available

### Extension Issues
- **Not Loading**: Check Chrome extension permissions
- **API Errors**: Verify backend is running on localhost:4000
- **Build Errors**: Run `npm install` and try again

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OLX Romania** for providing the platform
- **Ent** for the excellent Go ORM
- **Fiber** for the fast web framework
- **Chrome Extensions API** for the extension capabilities

---

**Made with ❤️ for the Romanian OLX community** 