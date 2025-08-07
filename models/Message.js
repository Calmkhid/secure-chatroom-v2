const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: String,
    receiver: String,
    message: String,
    media: {
        type: {
            type: String,
            enum: ['image', 'audio']
        },
        data: String,
        filename: String
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
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema);