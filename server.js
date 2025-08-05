const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const socketio = require('socket.io');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const { ensureAuth } = require('./utils/authMiddleware');
const { encrypt, decrypt } = require('./utils/encryption');
const Message = require('./models/Message');
const User = require('./models/User');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(session({
    secret: 'supersecuresecret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
}));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/auth', authRoutes);

// Auth check
app.get('/chat', ensureAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Socket.io
const users = {};

io.on('connection', (socket) => {
    socket.on('registerUser', async ({ userId, username }) => {
        users[username] = socket.id;
        socket.username = username;
        socket.userId = userId;
    });

    socket.on('privateMessage', async ({ to, message }) => {
        const encrypted = encrypt(message);
        if (users[to]) {
            io.to(users[to]).emit('privateMessage', {
                from: socket.username,
                message: decrypt(encrypted),
            });
        }

        await Message.create({
            sender: socket.username,
            receiver: to,
            message: encrypted,
            isGroup: false,
        });
    });

    socket.on('groupMessage', async ({ message }) => {
        const encrypted = encrypt(message);
        socket.broadcast.emit('groupMessage', {
            from: socket.username,
            message: decrypt(encrypted),
        });

        await Message.create({
            sender: socket.username,
            receiver: 'group',
            message: encrypted,
            isGroup: true,
        });
    });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));