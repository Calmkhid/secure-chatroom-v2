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

// Media elements
const imageBtn = document.getElementById('imageBtn');
const voiceBtn = document.getElementById('voiceBtn');
const imageInput = document.getElementById('imageInput');
const voiceInput = document.getElementById('voiceInput');

let currentUser = localStorage.getItem('username');
let currentUserId = localStorage.getItem('userId');
let selectedUser = null;
let onlineUsers = new Set();
let recentChatsList = new Set();
let mediaRecorder = null;
let audioChunks = [];

// Check if user is logged in
if (!currentUser || !currentUserId) {
    window.location.href = '/';
}

// Display current user
currentUserSpan.textContent = `Logged in as: ${currentUser}`;

// Register user with socket
socket.emit('registerUser', { userId: currentUserId, username: currentUser });

// Auto-resize textarea
messageInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 120) + 'px';
});

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

// Image sending functionality
imageBtn.addEventListener('click', () => {
    imageInput.click();
});

imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file && selectedUser) {
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            alert('Image size must be less than 5MB');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageData = e.target.result;
            socket.emit('privateMessage', { 
                to: selectedUser, 
                message: '', 
                media: { type: 'image', data: imageData, filename: file.name }
            });
        };
        reader.readAsDataURL(file);
    } else if (!selectedUser) {
        alert('Please select a user to send image to');
    }
    imageInput.value = ''; // Reset input
});

// Voice recording functionality
voiceBtn.addEventListener('click', async () => {
    if (!selectedUser) {
        alert('Please select a user to send voice note to');
        return;
    }
    
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        // Stop recording
        mediaRecorder.stop();
        voiceBtn.innerHTML = '<i class="fas fa-microphone"></i> Voice';
        voiceBtn.style.background = 'var(--bg-tertiary)';
        voiceBtn.style.color = 'var(--text-secondary)';
    } else {
        // Start recording
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];
            
            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };
            
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                const reader = new FileReader();
                reader.onload = (e) => {
                    const audioData = e.target.result;
                    socket.emit('privateMessage', { 
                        to: selectedUser, 
                        message: '', 
                        media: { type: 'audio', data: audioData, filename: 'voice_note.wav' }
                    });
                };
                reader.readAsDataURL(audioBlob);
                
                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };
            
            mediaRecorder.start();
            voiceBtn.innerHTML = '<i class="fas fa-stop"></i> Stop';
            voiceBtn.style.background = 'var(--error-color)';
            voiceBtn.style.color = 'white';
        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('Unable to access microphone. Please check permissions.');
        }
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
                appendMessage(msg.sender, msg.message, isOwn, msg.timestamp || msg.createdAt, msg.media);
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
socket.on('messageSent', ({ to, message, timestamp, media }) => {
    appendMessage(currentUser, message, true, timestamp, media);
});

// Handle incoming messages
socket.on('privateMessage', ({ from, message, timestamp, media }) => {
    appendMessage(from, message, false, timestamp, media);
    
    // Add to recent chats
    recentChatsList.add(from);
    updateRecentChats();
    
    // If not currently chatting with this user, show notification
    if (selectedUser !== from) {
        const notificationText = media ? 
            `${from} sent a ${media.type}` : 
            `${from}: ${message}`;
        showNotification(notificationText);
    }
});

// Handle message errors
socket.on('messageError', ({ error }) => {
    alert('Failed to send message: ' + error);
});

// Append message to chat
function appendMessage(sender, message, isOwn, timestamp, media = null) {
    const msg = document.createElement('div');
    msg.className = isOwn ? 'message own' : 'message incoming';
    
    const time = timestamp ? new Date(timestamp).toLocaleTimeString() : new Date().toLocaleTimeString();
    
    let mediaContent = '';
    if (media) {
        if (media.type === 'image') {
            mediaContent = `
                <div class="message-media">
                    <img src="${media.data}" alt="Image" onclick="openImageModal('${media.data}')" style="cursor: pointer;">
                </div>
            `;
        } else if (media.type === 'audio') {
            mediaContent = `
                <div class="message-media">
                    <audio controls>
                        <source src="${media.data}" type="audio/wav">
                        Your browser does not support the audio element.
                    </audio>
                </div>
            `;
        }
    }
    
    msg.innerHTML = `
        <div class="message-content">
            <div class="message-header">
                <strong>${sender}</strong>
                <span class="message-time">${time}</span>
            </div>
            ${message ? `<div class="message-text">${message}</div>` : ''}
            ${mediaContent}
        </div>
    `;
    
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Open image in modal
function openImageModal(imageSrc) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        cursor: pointer;
    `;
    
    const img = document.createElement('img');
    img.src = imageSrc;
    img.style.cssText = `
        max-width: 90%;
        max-height: 90%;
        object-fit: contain;
        border-radius: 8px;
    `;
    
    modal.appendChild(img);
    document.body.appendChild(modal);
    
    modal.addEventListener('click', () => {
        document.body.removeChild(modal);
    });
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
