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

// MongoDB connection with fallback
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/secure-chatroom';

mongoose.connect(MONGO_URI, { 
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => {
    console.log('MongoDB connection error:', err.message);
    console.log('Please make sure MongoDB is running or check your connection string');
    console.log('For local development, you can install MongoDB or use MongoDB Atlas');
    // Don't exit for development - let the app run without DB
    console.log('Continuing without database connection...');
});

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET || 'supersecuresecret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ 
        mongoUrl: MONGO_URI,
        ttl: 24 * 60 * 60 // 1 day
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production' && process.env.FORCE_HTTPS !== 'false',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        httpOnly: true,
        sameSite: 'lax'
    }
}));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/auth', authRoutes);

// API Routes
app.get('/api/users/search', ensureAuth, async (req, res) => {
    try {
        const { q } = req.query;
        const users = await User.find({ 
            username: { $regex: q, $options: 'i' },
            _id: { $ne: req.session.user._id }
        }).limit(5);
        res.json(users);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/messages/:username', ensureAuth, async (req, res) => {
    try {
        const { username } = req.params;
        const currentUser = req.session.user.username;
        
        console.log(`Loading messages between ${currentUser} and ${username}`);
        
        const messages = await Message.find({
            $or: [
                { sender: currentUser, receiver: username },
                { sender: username, receiver: currentUser }
            ],
            isGroup: false
        }).sort({ createdAt: 1 });
        
        console.log(`Found ${messages.length} messages`);
        
        const processedMessages = messages.map(msg => {
            const messageObj = msg.toObject();
            
            // Decrypt text messages
            if (messageObj.message && messageObj.message.trim() !== '') {
                try {
                    messageObj.message = decrypt(messageObj.message);
                } catch (error) {
                    console.error('Decryption error:', error);
                    messageObj.message = '[Encrypted message]';
                }
            }
            
            return messageObj;
        });
        
        console.log(`Processed ${processedMessages.length} messages`);
        res.json(processedMessages);
    } catch (error) {
        console.error('Message history error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Health check endpoint for deployment
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Session check endpoint for debugging
app.get('/api/session', (req, res) => {
    res.json({ 
        hasSession: !!req.session,
        hasUser: !!(req.session && req.session.user),
        user: req.session && req.session.user ? { 
            username: req.session.user.username,
            id: req.session.user._id 
        } : null
    });
});

// Root route - redirect logged in users to chat, others to login
app.get('/', (req, res) => {
    console.log('Root route accessed - session:', req.session ? 'exists' : 'null');
    console.log('Root route - user:', req.session && req.session.user ? req.session.user.username : 'no user');
    
    if (req.session && req.session.user) {
        console.log('User is logged in, redirecting to /chat');
        res.redirect('/chat');
    } else {
        console.log('User not logged in, serving login page');
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
});

// Auth check
app.get('/chat', ensureAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});

// Socket.io
const users = {};
const typingUsers = {};

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    socket.on('registerUser', async ({ userId, username }) => {
        users[username] = socket.id;
        socket.username = username;
        socket.userId = userId;
        
        console.log('User registered:', username);
        
        // Notify other users
        socket.broadcast.emit('userConnected', username);
        
        // Send updated user list
        io.emit('userList', Object.keys(users));
    });

    socket.on('typing', ({ to, isTyping }) => {
        if (users[to]) {
            io.to(users[to]).emit('userTyping', {
                from: socket.username,
                isTyping: isTyping
            });
        }
    });

    socket.on('privateMessage', async ({ to, message, media }) => {
        try {
            const timestamp = new Date();
            let encryptedMessage = '';
            let mediaData = null;
            
            if (media) {
                // Handle media message
                mediaData = {
                    type: media.type,
                    data: media.data,
                    filename: media.filename
                };
                console.log(`Saving media message from ${socket.username} to ${to}`);
            } else {
                // Handle text message
                encryptedMessage = encrypt(message);
                console.log(`Saving text message from ${socket.username} to ${to}: "${message}"`);
            }
            
            // Send message to recipient if online
            if (users[to]) {
                io.to(users[to]).emit('privateMessage', {
                    from: socket.username,
                    message: message,
                    timestamp: timestamp,
                    media: mediaData
                });
            }

            // Send confirmation back to sender
            socket.emit('messageSent', {
                to: to,
                message: message,
                timestamp: timestamp,
                media: mediaData
            });

            // Save message to database
            const savedMessage = await Message.create({
                sender: socket.username,
                receiver: to,
                message: encryptedMessage,
                media: mediaData,
                isGroup: false,
                createdAt: timestamp
            });
            
            console.log(`Message saved to database with ID: ${savedMessage._id}`);
            console.log('Message sent from', socket.username, 'to', to, media ? `(${media.type})` : '');
        } catch (error) {
            console.error('Message error:', error);
            socket.emit('messageError', { error: 'Failed to send message' });
        }
    });

    socket.on('addReaction', async ({ messageId, reaction }) => {
        try {
            const message = await Message.findById(messageId);
            if (message) {
                // Remove existing reaction from this user
                message.reactions = message.reactions.filter(r => r.user !== socket.username);
                
                // Add new reaction
                message.reactions.push({
                    user: socket.username,
                    reaction: reaction
                });
                
                await message.save();
                
                // Notify both sender and receiver
                const recipient = message.sender === socket.username ? message.receiver : message.sender;
                if (users[recipient]) {
                    io.to(users[recipient]).emit('messageReaction', {
                        messageId: messageId,
                        reactions: message.reactions
                    });
                }
                
                socket.emit('messageReaction', {
                    messageId: messageId,
                    reactions: message.reactions
                });
            }
        } catch (error) {
            console.error('Reaction error:', error);
        }
    });

    socket.on('disconnect', () => {
        if (socket.username) {
            delete users[socket.username];
            socket.broadcast.emit('userDisconnected', socket.username);
            io.emit('userList', Object.keys(users));
            console.log('User disconnected:', socket.username);
        }
    });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`MongoDB URI: ${MONGO_URI.replace(/\/\/.*@/, '//***:***@')}`); // Hide credentials
});