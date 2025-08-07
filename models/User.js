const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: { type: String, default: null },
    status: { type: String, default: 'Hey there! I\'m using Secure Chatroom' },
    lastSeen: { type: Date, default: Date.now },
    isOnline: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);