const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: String,
    receiver: String,
    message: String,
    media: {
        type: {
            type: String,
            enum: ['image', 'audio', 'file', 'document']
        },
        data: String,
        filename: String,
        size: Number
    },
    reactions: [{
        user: String,
        reaction: {
            type: String,
            enum: ['like', 'heart', 'laugh', 'wow', 'sad', 'angry']
        }
    }],
    edited: {
        type: Boolean,
        default: false
    },
    editedAt: Date,
    isGroup: Boolean,
    groupName: String,
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema);