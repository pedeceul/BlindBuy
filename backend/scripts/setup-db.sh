#!/bin/bash

# Database setup script for OLX Reviews

echo "Setting up PostgreSQL database for OLX Reviews..."

# Check if PostgreSQL is running
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "PostgreSQL is not running. Please start PostgreSQL first."
    echo "On macOS with Homebrew: brew services start postgresql"
    exit 1
fi

# Create database
echo "Creating database 'olx_reviews'..."
createdb olx_reviews 2>/dev/null || echo "Database 'olx_reviews' already exists"

# Create user (optional)
echo "Creating user 'olx_user'..."
psql -d olx_reviews -c "CREATE USER olx_user WITH PASSWORD 'olx_password';" 2>/dev/null || echo "User 'olx_user' already exists"

# Grant privileges
echo "Granting privileges..."
psql -d olx_reviews -c "GRANT ALL PRIVILEGES ON DATABASE olx_reviews TO olx_user;" 2>/dev/null || echo "Privileges already granted"

echo "Database setup complete!"
echo "You can now start the backend server." 