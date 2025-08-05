# Secure Chatroom

A real-time messaging application with user authentication and encrypted messages.

## Features

- **User Authentication**: Sign up and login with username/password
- **Real-time Messaging**: Instant message delivery using Socket.IO
- **User Search**: Find users by username to start conversations
- **Message History**: View previous conversations even when users are offline
- **Online Status**: See who's currently online
- **Recent Chats**: Quick access to recent conversations
- **Encrypted Messages**: All messages are encrypted for security
- **Modern UI**: Beautiful, responsive design

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set up MongoDB**
   - Make sure MongoDB is running on your system
   - Create a `.env` file in the root directory with:
   ```
   MONGO_URI=mongodb://localhost:27017/secure-chatroom
   PORT=3000
   ```

3. **Start the Application**
   ```bash
   npm start
   ```

4. **Access the Application**
   - Open your browser and go to `http://localhost:3000`
   - Create an account or login with existing credentials
   - Start chatting!

## How to Use

1. **Registration/Login**
   - Visit the homepage to sign up or login
   - Create a unique username and password
   - Share your username with friends

2. **Finding Users**
   - Use the search box to find users by username
   - Click on a user to start chatting
   - See online users in the sidebar

3. **Messaging**
   - Select a user to chat with
   - Type your message and press Enter or click Send
   - Messages are delivered instantly if the user is online
   - Offline users will see messages when they login

4. **Recent Chats**
   - Your recent conversations appear in the sidebar
   - Click on any recent chat to continue the conversation

## Technical Details

- **Backend**: Node.js with Express
- **Database**: MongoDB with Mongoose
- **Real-time**: Socket.IO for instant messaging
- **Authentication**: Session-based with bcrypt password hashing
- **Encryption**: Custom encryption for message security
- **Frontend**: Vanilla JavaScript with modern CSS

## Security Features

- Password hashing with bcrypt
- Session-based authentication
- Message encryption
- Input validation and sanitization
- CSRF protection through session management 