# BlindBuy 🛒

A Chrome Extension for reviewing Romanian OLX ads and sellers with a modern, user-friendly interface.

## ⚠️ Project Status: On Hold

**This project is currently on hold while we explore better UX approaches.** We've encountered challenges with the current implementation approaches:

### 🚫 Current Challenges

1. **Content Injection Issues**: Injecting content directly into OLX pages raises legal and technical concerns
2. **Window UX Problems**: Creating separate windows without Chrome controls provides poor user experience
3. **Extension Limitations**: Chrome Extension API has significant limitations for seamless integration

### 🔍 What We've Tried

- **Content Injection**: Direct DOM manipulation on OLX pages (legal concerns)
- **Frameless Windows**: Attempted to create custom windows without Chrome controls (poor UX)
- **Popup Approach**: Traditional extension popup (limited functionality)
- **Auto-pinning Prompts**: Programmatic extension management (not allowed by Chrome)

### 💡 We Need Your Ideas!

We're looking for innovative approaches to solve these UX challenges. Some areas we're exploring:

- **Better Integration Methods**: How to seamlessly integrate with OLX without injection
- **Alternative UI Patterns**: Different ways to present review functionality
- **Legal Compliance**: Approaches that respect OLX's terms of service
- **User Experience**: How to make the review process intuitive and non-intrusive

**Please submit your ideas as GitHub Issues or Discussions!**

## 🌟 Features (Current Implementation)

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

**We're actively seeking ideas and contributions!** 

### How to Contribute

1. **Submit Ideas**: Create GitHub Issues for UX improvement suggestions
2. **Join Discussions**: Participate in GitHub Discussions about alternative approaches
3. **Fork and Experiment**: Try different implementation approaches
4. **Share Research**: Document findings about Chrome Extension limitations and workarounds

### Areas We Need Help With

- **Legal Research**: Understanding OLX's terms of service and legal boundaries
- **UX Design**: Alternative ways to present review functionality
- **Technical Solutions**: Workarounds for Chrome Extension limitations
- **Integration Methods**: Non-invasive ways to integrate with OLX

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OLX Romania** for providing the platform
- **Ent** for the excellent Go ORM
- **Fiber** for the fast web framework
- **Chrome Extensions API** for the extension capabilities

---

**Made with ❤️ for the Romanian OLX community**

*This project is on hold while we explore better UX approaches. We welcome your ideas and contributions!* 