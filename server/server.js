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
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

dotenv.config();

// ─── Passport Config ──────────────────────────────────────────────────────
require('./middleware/passport');

// ─── Startup validation ───────────────────────────────────────────────────
const REQUIRED_ENV = ['MONGODB_URI', 'JWT_SECRET'];
const missing = REQUIRED_ENV.filter(k => !process.env[k]);
if (missing.length && process.env.NODE_ENV === 'production') {
  console.error(`❌ Missing required env vars: ${missing.join(', ')}`);
  process.exit(1);
}

// ─── Routes ───────────────────────────────────────────────────────────────
const authRoutes          = require('./routes/authRoutes');
const userRoutes          = require('./routes/userRoutes');
const superAdminRoutes    = require('./routes/superAdminRoutes');
const companyRoutes       = require('./routes/companyRoutes');
const branchRoutes        = require('./routes/branchRoutes');
const warehouseRoutes     = require('./routes/warehouseRoutes');
const inventoryRoutes     = require('./routes/inventoryRoutes');
const supplierRoutes      = require('./routes/supplierRoutes');
const purchaseOrderRoutes = require('./routes/purchaseOrderRoutes');
const employeeRoutes      = require('./routes/employeeRoutes');
const roleRoutes          = require('./routes/roleRoutes');
const reportRoutes        = require('./routes/reportRoutes');
const chatRoutes          = require('./routes/chatRoutes');
const callRoutes          = require('./routes/callRoutes');
const accountingRoutes    = require('./routes/accountingRoutes');
const paymentRoutes       = require('./routes/paymentRoutes');
const setupRoutes         = require('./routes/setupRoutes');

const app    = express();
const server = http.createServer(app);

// ─── Security ─────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

// Rate limiting - generous limits
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/api/health'
});
app.use('/api/', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // 50 attempts per 15 min (was 10)
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'محاولات كثيرة، يرجى الانتظار 15 دقيقة' }
});
app.use('/api/users/login',    authLimiter);
app.use('/api/users/register', authLimiter);

app.use(mongoSanitize());

// ─── CORS ─────────────────────────────────────────────────────────────────
const allowedOrigins = [
  'https://wassel-seven.vercel.app',
  'https://wassel.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL
].filter(Boolean);

const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // Allow server-to-server
    if (allowedOrigins.some(o => origin === o || origin.startsWith(o))) return cb(null, true);
    // Allow any vercel.app subdomain
    if (origin.endsWith('.vercel.app')) return cb(null, true);
    console.warn('CORS blocked:', origin);
    cb(null, true); // Allow all for now to debug
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-company-id']
};

// ─── Socket.io ────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'], credentials: true },
  transports: ['websocket', 'polling']
});
app.set('io', io);
const onlineUsers = new Map();

io.on('connection', (socket) => {
  socket.on('user_online', async (userId) => {
    onlineUsers.set(userId, socket.id);
    socket.userId = userId;
    io.emit('user_status', { userId, isOnline: true });
    try { await require('./models/User').findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() }); } catch {}
  });
  socket.on('join_room',    (roomId) => socket.join(roomId));
  socket.on('leave_room',   (roomId) => socket.leave(roomId));
  socket.on('typing_start', ({ roomId, userId, userName }) =>
    socket.to(roomId).emit('user_typing', { userId, userName, isTyping: true }));
  socket.on('typing_stop',  ({ roomId, userId }) =>
    socket.to(roomId).emit('user_typing', { userId, isTyping: false }));
  socket.on('mark_read',    ({ roomId, userId }) =>
    socket.to(roomId).emit('messages_read', { roomId, userId }));
  socket.on('disconnect', async () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      io.emit('user_status', { userId: socket.userId, isOnline: false });
      try { await require('./models/User').findByIdAndUpdate(socket.userId, { isOnline: false, lastSeen: new Date() }); } catch {}
    }
  });
});

// ─── Middleware ───────────────────────────────────────────────────────────
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(session({
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    ttl: 14 * 24 * 60 * 60
  }),
  secret: process.env.JWT_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production', maxAge: 1000 * 60 * 60 * 24 * 14 }
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── API Routes ───────────────────────────────────────────────────────────
app.use('/api/auth',            authRoutes);
app.use('/api/users',           userRoutes);
app.use('/api/superadmin',      superAdminRoutes);
app.use('/api/company',         companyRoutes);
app.use('/api/branches',        branchRoutes);
app.use('/api/warehouses',      warehouseRoutes);
app.use('/api/inventory',       inventoryRoutes);
app.use('/api/suppliers',       supplierRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/employees',       employeeRoutes);
app.use('/api/roles',           roleRoutes);
app.use('/api/reports',         reportRoutes);
app.use('/api/chat',            chatRoutes);
app.use('/api/calls',           callRoutes);
app.use('/api/accounting',      accountingRoutes);
app.use('/api/payments',        paymentRoutes);
app.use('/api/setup',           setupRoutes);

app.get('/api/health', (req, res) => res.json({
  status: 'ok',
  timestamp: new Date(),
  env: process.env.NODE_ENV,
  architecture: 'multi-tenant',
  modules: ['auth','users','superadmin','company','inventory','suppliers',
    'employees','purchase-orders','chat','accounting','reports']
}));

// ─── Error Handler ────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Server Error' });
});

// ─── Start ────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000
}).then(() => {
  console.log('✅ MongoDB Connected');
  server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
}).catch(err => {
  console.error('❌ MongoDB error:', err.message);
  process.exit(1);
});
