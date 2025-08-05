const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');

router.post('/signup', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Missing fields' });
        }
        
        const existing = await User.findOne({ username });
        if (existing) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const user = await User.create({ 
            username, 
            password: hashedPassword 
        });
        
        req.session.user = user;
        req.session.save((err) => {
            if (err) {
                console.error('Session save error:', err);
                return res.status(500).json({ error: 'Session error' });
            }
            console.log('Session saved successfully for new user:', username);
            res.json({ user: { _id: user._id, username: user.username } });
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Missing fields' });
        }
        
        console.log('Login attempt for username:', username);
        
        const user = await User.findOne({ username });
        if (!user) {
            console.log('User not found:', username);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            console.log('Invalid password for user:', username);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        console.log('Login successful for user:', username);
        req.session.user = user;
        req.session.save((err) => {
            if (err) {
                console.error('Session save error:', err);
                return res.status(500).json({ error: 'Session error' });
            }
            console.log('Session saved successfully for user:', username);
            res.json({ user: { _id: user._id, username: user.username } });
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy();
    res.json({ message: 'Logged out successfully' });
});

module.exports = router;