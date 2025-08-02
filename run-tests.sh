#!/bin/bash

# Comprehensive Test Runner for OLX Reviews Project
# This script runs all tests for both backend and frontend

set -e

echo "🧪 Starting comprehensive test suite..."
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "🔍 Checking prerequisites..."

if ! command_exists go; then
    print_status $RED "❌ Go is not installed. Please install Go first."
    exit 1
fi

if ! command_exists node; then
    print_status $RED "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

if ! command_exists npm; then
    print_status $RED "❌ npm is not installed. Please install npm first."
    exit 1
fi

print_status $GREEN "✅ All prerequisites are installed"

# Check if database is running
echo ""
echo "🗄️  Checking database connection..."
if ! psql -U olx_user -d olx_reviews -c "SELECT 1;" >/dev/null 2>&1; then
    print_status $YELLOW "⚠️  Database not accessible. Some tests may fail."
    print_status $YELLOW "   Run: cd backend/scripts && ./setup-db.sh"
else
    print_status $GREEN "✅ Database connection successful"
fi

# Backend Tests
echo ""
echo "🔧 Running Backend Tests..."
echo "=========================="

cd backend

# Install test dependencies
if [ -f "package.json" ]; then
    print_status $BLUE "📦 Installing backend test dependencies..."
    npm install --silent
fi

# Run Go tests
print_status $BLUE "🧪 Running Go tests..."
if go test ./tests/... -v; then
    print_status $GREEN "✅ Backend tests passed"
else
    print_status $RED "❌ Backend tests failed"
    exit 1
fi

# Run specific test suites
echo ""
print_status $BLUE "🧪 Running database tests..."
if go test ./tests/... -run TestDatabase -v; then
    print_status $GREEN "✅ Database tests passed"
else
    print_status $RED "❌ Database tests failed"
fi

print_status $BLUE "🧪 Running GraphQL tests..."
if go test ./tests/... -run TestGraphQL -v; then
    print_status $GREEN "✅ GraphQL tests passed"
else
    print_status $RED "❌ GraphQL tests failed"
fi

print_status $BLUE "🧪 Running API tests..."
if go test ./tests/... -run TestAPI -v; then
    print_status $GREEN "✅ API tests passed"
else
    print_status $RED "❌ API tests failed"
fi

print_status $BLUE "🧪 Running model tests..."
if go test ./tests/... -run TestModels -v; then
    print_status $GREEN "✅ Model tests passed"
else
    print_status $RED "❌ Model tests failed"
fi

cd ..

# Frontend Tests
echo ""
echo "🎨 Running Frontend Tests..."
echo "==========================="

cd chrome-extension

# Install test dependencies
print_status $BLUE "📦 Installing frontend test dependencies..."
npm install --silent

# Run Jest tests
print_status $BLUE "🧪 Running Jest tests..."
if npm test -- --passWithNoTests; then
    print_status $GREEN "✅ Frontend tests passed"
else
    print_status $RED "❌ Frontend tests failed"
    exit 1
fi

# Run specific test suites
echo ""
print_status $BLUE "🧪 Running content script tests..."
if npm run test:content; then
    print_status $GREEN "✅ Content script tests passed"
else
    print_status $RED "❌ Content script tests failed"
fi

print_status $BLUE "🧪 Running popup tests..."
if npm run test:popup; then
    print_status $GREEN "✅ Popup tests passed"
else
    print_status $RED "❌ Popup tests failed"
fi

# Run coverage report
echo ""
print_status $BLUE "📊 Generating coverage report..."
if npm run test:coverage; then
    print_status $GREEN "✅ Coverage report generated"
else
    print_status $YELLOW "⚠️  Coverage report generation failed"
fi

cd ..

# Integration Tests
echo ""
echo "🔗 Running Integration Tests..."
echo "=============================="

# Test if backend server can start
print_status $BLUE "🚀 Testing backend server startup..."
cd backend
if timeout 10s go run cmd/server/main.go >/dev/null 2>&1 & then
    SERVER_PID=$!
    sleep 2
    
    # Test health endpoint
    if curl -s http://localhost:4000/health >/dev/null; then
        print_status $GREEN "✅ Backend server started successfully"
    else
        print_status $RED "❌ Backend server health check failed"
    fi
    
    # Kill server
    kill $SERVER_PID 2>/dev/null || true
else
    print_status $RED "❌ Backend server failed to start"
fi

cd ..

# Build Tests
echo ""
echo "🔨 Running Build Tests..."
echo "========================"

# Test backend build
print_status $BLUE "🔨 Testing backend build..."
cd backend
if go build -o server cmd/server/main.go; then
    print_status $GREEN "✅ Backend build successful"
    rm -f server
else
    print_status $RED "❌ Backend build failed"
fi
cd ..

# Test frontend build
print_status $BLUE "🔨 Testing frontend build..."
cd chrome-extension
if npm run build; then
    print_status $GREEN "✅ Frontend build successful"
else
    print_status $RED "❌ Frontend build failed"
fi
cd ..

# Summary
echo ""
echo "📋 Test Summary"
echo "==============="

print_status $GREEN "✅ All tests completed!"
print_status $BLUE "📝 Test reports available in:"
print_status $BLUE "   - Backend: backend/coverage.out"
print_status $BLUE "   - Frontend: chrome-extension/coverage/"

echo ""
print_status $GREEN "🎉 Test suite completed successfully!"
print_status $YELLOW "💡 To run specific tests:"
print_status $YELLOW "   Backend: cd backend && npm run test:database"
print_status $YELLOW "   Frontend: cd chrome-extension && npm run test:content" 