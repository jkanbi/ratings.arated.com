#!/bin/bash

echo "🚀 Starting Ratings and Reviews API..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file..."
    cat > .env << EOF
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
HELMET_ENABLED=true
LOG_LEVEL=combined
EOF
    echo "✅ .env file created with default values"
fi

echo "🌐 Starting server on port 3001..."
echo "📖 API Documentation: http://localhost:3001"
echo "🔍 Health Check: http://localhost:3001/api/health"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm run dev

