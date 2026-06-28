# Wassel - Complete Setup Guide

## 🔑 API Keys Configured

### Google Maps API
```
Key: AIzaSyBUNkR0ggJBX0rbUrYU2IRm4uEZSrMQpcU
```

### LiveKit Cloud
```
Websocket URL: wss://wassel-y6htlkxc.livekit.cloud
API Key: APIfHZv2JFnPGC4
API Secret: [Get from LiveKit Cloud dashboard]
```

## ⚠️ IMPORTANT: Add API Secret

You need to add the LiveKit API Secret to the `.env` file:

1. Go to https://cloud.livekit.io/projects/p_4tp3m1q0y8f/settings/keys
2. Click "Reveal secret"
3. Copy the secret
4. Add it to both `.env` files:

```env
# server/.env and client/.env
LIVEKIT_API_SECRET=your_secret_here
```

## 📦 Installation

### Option 1: Run setup script
```bash
cd /mnt/agents/output/wassel
chmod +x setup.sh
./setup.sh
```

### Option 2: Manual installation

**Client:**
```bash
cd client
npm install @emotion/react @emotion/styled @mui/material @mui/icons-material
npm install @livekit/components-react @livekit/components-styles livekit-client
npm install axios i18next i18next-browser-languagedetector i18next-http-backend
npm install react-router-dom react-i18next
npm install
```

**Server:**
```bash
cd server
npm install express mongoose cors dotenv bcryptjs jsonwebtoken express-validator
npm install livekit-server-sdk multer
npm install -g nodemon
npm install
mkdir -p uploads
```

## 🚀 Running the Application

**Terminal 1 - Server:**
```bash
cd server
npm run dev
# or: node server.js
```

**Terminal 2 - Client:**
```bash
cd client
npm start
```

## 📁 Project Structure

```
wassel/
├── client/
│   ├── .env                          # Environment variables
│   ├── package.json
│   ├── public/
│   └── src/
│       ├── components/
│       │   ├── LocationPicker.jsx    # Google Maps location picker
│       │   └── VideoCall.jsx         # LiveKit video/voice calls
│       ├── i18n/
│       │   ├── ar.json               # Arabic translations
│       │   └── en.json               # English translations
│       └── pages/
│           ├── Chat/
│           │   └── ChatPage.jsx      # Chat with video/voice calls
│           └── CompanySettings/
│               └── CompanySettings.jsx # Company settings
│
└── server/
    ├── .env                          # Environment variables
    ├── package.json
    ├── server.js                     # Main server file
    ├── controllers/
    │   ├── callController.js         # LiveKit call logic
    │   └── companyController.js      # Company settings logic
    ├── middleware/
    │   └── upload.js                 # File upload middleware
    ├── models/
    │   └── Company.js                # Company model
    └── routes/
        ├── callRoutes.js             # Call API routes
        └── companyRoutes.js          # Company API routes
```

## 🎯 Features

### Company Settings
- ✅ Company name (Arabic & English)
- ✅ Logo upload
- ✅ Commercial Registration Number (10 digits)
- ✅ CR Issue/Expiry dates
- ✅ Issuing Authority
- ✅ Tax Number (14 digits, starts with 3)
- ✅ Address, City, Country, Zip Code
- ✅ Google Maps location picker
- ✅ PDF settings (A4, margins, logo)

### Chat
- ✅ Chat list with online/offline status
- ✅ Typing indicators
- ✅ Unread message counters
- ✅ Text messages with read receipts
- ✅ File sharing
- ✅ Voice messages (recording)
- ✅ Reply/Forward/Copy/Delete messages
- ✅ Chat info panel

### Video/Voice Calls (LiveKit)
- ✅ Video calls with multiple participants
- ✅ Voice calls
- ✅ Screen sharing
- ✅ Mute/unmute audio
- ✅ Enable/disable camera
- ✅ In-call chat
- ✅ Participants list
- ✅ Fullscreen mode

## 🔧 Environment Variables

### client/.env
```env
REACT_APP_GOOGLE_MAPS_API_KEY=AIzaSyBUNkR0ggJBX0rbUrYU2IRm4uEZSrMQpcU
REACT_APP_LIVEKIT_URL=wss://wassel-y6htlkxc.livekit.cloud
REACT_APP_LIVEKIT_API_KEY=APIfHZv2JFnPGC4
```

### server/.env
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/wassel
JWT_SECRET=your_jwt_secret_change_this
LIVEKIT_URL=wss://wassel-y6htlkxc.livekit.cloud
LIVEKIT_API_KEY=APIfHZv2JFnPGC4
LIVEKIT_API_SECRET=your_secret_here
```

## 📝 API Endpoints

### Company
- `GET /api/company` - Get company settings
- `PUT /api/company` - Update company settings
- `POST /api/company/logo` - Upload logo

### Calls (LiveKit)
- `POST /api/calls/token` - Generate call token
- `POST /api/calls/room` - Create call room
- `GET /api/calls/config` - Get LiveKit config

## 🐛 Troubleshooting

### "Cannot find module" errors
Make sure all packages are installed:
```bash
cd client && npm install
cd ../server && npm install
```

### LiveKit connection fails
1. Check that LIVEKIT_API_SECRET is set correctly
2. Verify the LiveKit project is active at cloud.livekit.io
3. Check browser console for WebRTC errors

### Google Maps not loading
1. Verify the API key is correct
2. Enable required APIs in Google Cloud Console:
   - Maps JavaScript API
   - Places API
   - Geocoding API
   - Static Maps API

## 📞 Support

For issues with:
- **LiveKit**: https://docs.livekit.io
- **Google Maps**: https://developers.google.com/maps
- **Material UI**: https://mui.com
