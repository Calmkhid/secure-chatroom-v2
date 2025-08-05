const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
require('dotenv').config();

const User = require('./models/User');
const { encryptMessage, decryptMessage } = require('./utils/encryption');

// ✅ Connect MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('✅ MongoDB connected'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// ✅ Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Secure sessions (no warnings)
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'sessions'
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',  // only HTTPS in production
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));

// ✅ Login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email, password });
    if (user) {
      req.session.user = user;
      res.redirect('/');
    } else {
      res.status(401).send('Invalid credentials');
    }
  } catch (err) {
    console.error('❌ Login error:', err);
    res.status(500).send('Internal Server Error');
  }
});

// ✅ Socket.io chat
io.on('connection', (socket) => {
  console.log('🟢 User connected');

  socket.on('join-room', (room) => {
    socket.join(room);
    console.log(`User joined room: ${room}`);
  });

  socket.on('chat-message', ({ room, msg }) => {
    const encrypted = encryptMessage(msg);
    io.to(room).emit('chat-message', encrypted);
  });

  socket.on('disconnect', () => {
    console.log('🔴 User disconnected');
  });
});

// ✅ Error catchers
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
});
process.on('unhandledRejection', (err) => {
  console.error('💥 Unhandled Rejection:', err);
});

// ✅ Start
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
