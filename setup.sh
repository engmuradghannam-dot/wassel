#!/bin/bash

echo "🚀 Wassel Setup Script"
echo "======================"

# Install client dependencies
echo "📦 Installing client packages..."
cd client
npm install @emotion/react @emotion/styled @mui/material @mui/icons-material
npm install @livekit/components-react @livekit/components-styles livekit-client
npm install axios i18next i18next-browser-languagedetector i18next-http-backend
npm install react-router-dom react-i18next
npm install

echo "✅ Client packages installed"

# Install server dependencies
echo "📦 Installing server packages..."
cd ../server
npm install express mongoose cors dotenv bcryptjs jsonwebtoken express-validator
npm install livekit-server-sdk multer
npm install -g nodemon
npm install

echo "✅ Server packages installed"

# Create uploads directory
mkdir -p uploads

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start the application:"
echo "  Terminal 1: cd server && npm run dev"
echo "  Terminal 2: cd client && npm start"
