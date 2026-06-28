const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const passport = require('passport');
const session = require('express-session');
const http = require('http');
const { Server } = require('socket.io');
const MongoStore = require('connect-mongo');

dotenv.config();

// ─── Startup validation ────────────────────────────────────────────────────
const REQUIRED_ENV = ['MONGODB_URI', 'JWT_SECRET'];
const missing = REQUIRED_ENV.filter(k => !process.env[k]);
if (missing.length && process.env.NODE_ENV === 'production') {
  console.error(`❌ Missing required env vars: ${missing.join(', ')}`);
  process.exit(1);
} else if (missing.length) {
  console.warn(`⚠️  Missing env vars (ok in dev): ${missing.join(', ')}`);
}

// ─── Routes ────────────────────────────────────────────────────────────────
const authRoutes        = require('./routes/authRoutes');
const companyRoutes     = require('./routes/companyRoutes');
const branchRoutes      = require('./routes/branchRoutes');
const warehouseRoutes   = require('./routes/warehouseRoutes');
const inventoryRoutes   = require('./routes/inventoryRoutes');
const supplierRoutes    = require('./routes/supplierRoutes');
const purchaseOrderRoutes = require('./routes/purchaseOrderRoutes');
const employeeRoutes    = require('./routes/employeeRoutes');
const userRoutes        = require('./routes/userRoutes');
const roleRoutes        = require('./routes/roleRoutes');
const reportRoutes      = require('./routes/reportRoutes');
const chatRoutes        = require('./routes/chatRoutes');
const callRoutes        = require('./routes/callRoutes');
const setupRoutes       = require('./routes/setupRoutes');
const accountingRoutes  = require('./routes/accountingRoutes'); // NEW

const app = express();
const server = http.createServer(app);

// ─── CORS ─────────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:3000',
  'http://localhost:3001',
  'https://wassel-seven.vercel.app'
].filter(Boolean);

const corsOptions = {
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.some(o => origin.startsWith(o))) return cb(null, true);
    cb(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// ─── Socket.io ────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ['GET', 'POST'], credentials: true },
  transports: ['websocket', 'polling']
});

app.set('io', io);

const onlineUsers = new Map();

io.on('connection', (socket) => {
  socket.on('user_online', async (userId) => {
    onlineUsers.set(userId, socket.id);
    socket.userId = userId;
    io.emit('user_status', { userId, isOnline: true });
    try {
      const User = require('./models/User');
      await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() });
    } catch {}
  });

  socket.on('join_room', (roomId) => socket.join(roomId));
  socket.on('leave_room', (roomId) => socket.leave(roomId));

  socket.on('typing_start', ({ roomId, userId, userName }) => {
    socket.to(roomId).emit('user_typing', { userId, userName, isTyping: true });
  });

  socket.on('typing_stop', ({ roomId, userId }) => {
    socket.to(roomId).emit('user_typing', { userId, isTyping: false });
  });

  socket.on('mark_read', ({ roomId, userId }) => {
    socket.to(roomId).emit('messages_read', { roomId, userId });
  });

  socket.on('disconnect', async () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      io.emit('user_status', { userId: socket.userId, isOnline: false });
      try {
        const User = require('./models/User');
        await User.findByIdAndUpdate(socket.userId, { isOnline: false, lastSeen: new Date() });
      } catch {}
    }
  });
});

// ─── Middleware ───────────────────────────────────────────────────────────
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(session({
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/wassel',
    ttl: 14 * 24 * 60 * 60
  }),
  secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 * 14
  }
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/setup', setupRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/accounting', accountingRoutes); // NEW

app.get('/api/health', (req, res) => res.json({
  status: 'ok',
  timestamp: new Date(),
  env: process.env.NODE_ENV,
  livekit: !!process.env.LIVEKIT_API_SECRET,
  modules: ['auth', 'inventory', 'suppliers', 'employees', 'purchase-orders', 'chat', 'accounting', 'reports']
}));

// ─── Error Handler ────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Server Error'
  });
});

// ─── Start ────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const mongooseOptions = {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000
};

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wassel', mongooseOptions)
  .then(() => {
    console.log('✅ MongoDB Connected');
    server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  });
