const socket = io();
const form = document.getElementById('messageForm');
const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const userList = document.getElementById('userList');
const userSearch = document.getElementById('userSearch');
const searchBtn = document.getElementById('searchBtn');
const currentUserSpan = document.getElementById('currentUser');
const logoutBtn = document.getElementById('logoutBtn');
const chatWith = document.getElementById('chatWith');
const userStatus = document.getElementById('userStatus');
const recentChats = document.getElementById('recentChats');

let currentUser = localStorage.getItem('username');
let currentUserId = localStorage.getItem('userId');
let selectedUser = null;
let onlineUsers = new Set();
let recentChatsList = new Set();

// Check if user is logged in
if (!currentUser || !currentUserId) {
    window.location.href = '/';
}

// Display current user
currentUserSpan.textContent = `Logged in as: ${currentUser}`;

// Register user with socket
socket.emit('registerUser', { userId: currentUserId, username: currentUser });

// Logout functionality
logoutBtn.addEventListener('click', async () => {
    try {
        await fetch('/auth/logout');
        localStorage.removeItem('username');
        localStorage.removeItem('userId');
        window.location.href = '/';
    } catch (error) {
        console.error('Logout error:', error);
    }
});

// Search for users
searchBtn.addEventListener('click', async () => {
    const searchTerm = userSearch.value.trim();
    if (!searchTerm) return;
    
    try {
        const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchTerm)}`);
        const users = await response.json();
        
        if (users.length > 0) {
            const user = users[0];
            selectUser(user.username);
            userSearch.value = '';
        } else {
            alert('User not found');
        }
    } catch (error) {
        console.error('Search error:', error);
    }
});

// Handle user selection
function selectUser(username) {
    selectedUser = username;
    chatWith.textContent = `Chatting with: ${username}`;
    userStatus.textContent = onlineUsers.has(username) ? '🟢 Online' : '🔴 Offline';
    loadChatHistory(username);
}

// Load chat history
async function loadChatHistory(username) {
    try {
        const response = await fetch(`/api/messages/${username}`);
        const messages = await response.json();
        
        chatMessages.innerHTML = '';
        
        if (messages && messages.length > 0) {
            messages.forEach(msg => {
                const isOwn = msg.sender === currentUser;
                appendMessage(msg.sender, msg.message, isOwn, msg.timestamp || msg.createdAt);
            });
        } else {
            // Show a message when no history
            const noHistory = document.createElement('div');
            noHistory.className = 'no-history';
            noHistory.textContent = 'No messages yet. Start the conversation!';
            chatMessages.appendChild(noHistory);
        }
        
        chatMessages.scrollTop = chatMessages.scrollHeight;
    } catch (error) {
        console.error('Error loading chat history:', error);
        chatMessages.innerHTML = '<div class="error">Failed to load chat history</div>';
    }
}

// Handle message sending
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = messageInput.value.trim();
    
    if (message && selectedUser) {
        socket.emit('privateMessage', { to: selectedUser, message });
        // Don't append message immediately - wait for confirmation
        messageInput.value = '';
        
        // Add to recent chats
        recentChatsList.add(selectedUser);
        updateRecentChats();
    } else if (!selectedUser) {
        alert('Please select a user to chat with');
    }
});

// Handle message confirmation from server
socket.on('messageSent', ({ to, message, timestamp }) => {
    appendMessage(currentUser, message, true, timestamp);
});

// Handle incoming messages
socket.on('privateMessage', ({ from, message, timestamp }) => {
    appendMessage(from, message, false, timestamp);
    
    // Add to recent chats
    recentChatsList.add(from);
    updateRecentChats();
    
    // If not currently chatting with this user, show notification
    if (selectedUser !== from) {
        showNotification(`${from}: ${message}`);
    }
});

// Handle message errors
socket.on('messageError', ({ error }) => {
    alert('Failed to send message: ' + error);
});

// Append message to chat
function appendMessage(sender, message, isOwn, timestamp) {
    const msg = document.createElement('div');
    msg.className = isOwn ? 'message own' : 'message incoming';
    
    const time = timestamp ? new Date(timestamp).toLocaleTimeString() : new Date().toLocaleTimeString();
    
    msg.innerHTML = `
        <div class="message-content">
            <div class="message-header">
                <strong>${sender}</strong>
                <span class="message-time">${time}</span>
            </div>
            <div class="message-text">${message}</div>
        </div>
    `;
    
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Update online users list
socket.on('userList', users => {
    onlineUsers = new Set(users);
    userList.innerHTML = '';
    
    users.forEach(user => {
        if (user !== currentUser) {
            const li = document.createElement('li');
            li.className = 'user-item';
            li.innerHTML = `
                <span class="user-name">${user}</span>
                <span class="status">🟢 Online</span>
            `;
            li.addEventListener('click', () => selectUser(user));
            userList.appendChild(li);
        }
    });
    
    // Update status if currently chatting with someone
    if (selectedUser) {
        userStatus.textContent = onlineUsers.has(selectedUser) ? '🟢 Online' : '🔴 Offline';
    }
});

// Update recent chats
function updateRecentChats() {
    recentChats.innerHTML = '';
    recentChatsList.forEach(user => {
        if (user !== currentUser) {
            const li = document.createElement('li');
            li.className = 'recent-chat-item';
            li.innerHTML = `
                <span class="user-name">${user}</span>
                <span class="status">${onlineUsers.has(user) ? '🟢' : '🔴'}</span>
            `;
            li.addEventListener('click', () => selectUser(user));
            recentChats.appendChild(li);
        }
    });
}

// Show notification
function showNotification(message) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('New Message', { body: message });
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                new Notification('New Message', { body: message });
            }
        });
    }
}

// Request notification permission on page load
if ('Notification' in window) {
    Notification.requestPermission();
}

// Handle user disconnect
socket.on('userDisconnected', username => {
    onlineUsers.delete(username);
    if (selectedUser === username) {
        userStatus.textContent = '🔴 Offline';
    }
});

// Handle user connect
socket.on('userConnected', username => {
    onlineUsers.add(username);
    if (selectedUser === username) {
        userStatus.textContent = '🟢 Online';
    }
});
