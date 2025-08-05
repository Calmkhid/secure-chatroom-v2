const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const mongoose = require('mongoose');
const session = require('express-session');
const crypto = require('crypto');
require('dotenv').config();

const User = require('./models/User');
const { encryptMessage, decryptMessage } = require('./utils/encryption');

// ✅ MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected'))
.catch((err) => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// ✅ Middleware
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'keyboard cat', // replace with a strong secret in production
  resave: false,
  saveUninitialized: true,
}));

// ✅ Login route
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
  console.log('🟢 A user connected');

  socket.on('join-room', (room) => {
    socket.join(room);
    console.log(`User joined room: ${room}`);
  });

  socket.on('chat-message', ({ room, msg }) => {
    const encrypted = encryptMessage(msg);
    io.to(room).emit('chat-message', encrypted);
  });

  socket.on('disconnect', () => {
    console.log('🔴 A user disconnected');
  });
});

// ✅ Crash safety
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('💥 Unhandled Rejection:', err);
});

// ✅ Start server
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
