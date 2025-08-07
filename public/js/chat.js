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

// Mobile toggle
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebar = document.querySelector('.sidebar');

// Mobile search elements
const mobileUserSearch = document.getElementById('mobileUserSearch');
const mobileSearchBtn = document.getElementById('mobileSearchBtn');

// Mobile user list
const mobileUserList = document.getElementById('mobileUserList');

// Theme toggle
const themeToggle = document.getElementById('themeToggle');

// Profile button
const profileBtn = document.getElementById('profileBtn');

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

// Profile functionality
if (profileBtn) {
    profileBtn.addEventListener('click', () => {
        showProfileModal();
    });
}

function showProfileModal() {
    const modal = document.createElement('div');
    modal.className = 'profile-modal';
    modal.innerHTML = `
        <div class="profile-modal-content">
            <div class="profile-header">
                <h3><i class="fas fa-user"></i> Profile</h3>
                <button class="close-btn" onclick="this.parentElement.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="profile-body">
                <div class="profile-avatar">
                    <div class="avatar-placeholder">
                        <i class="fas fa-user"></i>
                    </div>
                </div>
                <div class="profile-info">
                    <h4>${currentUser}</h4>
                    <p class="status">Hey there! I'm using Secure Chatroom</p>
                    <p class="member-since">Member since ${new Date().toLocaleDateString()}</p>
                </div>
                <div class="profile-actions">
                    <button class="action-btn" onclick="editStatus()">
                        <i class="fas fa-edit"></i> Edit Status
                    </button>
                    <button class="action-btn" onclick="changeAvatar()">
                        <i class="fas fa-camera"></i> Change Avatar
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

function editStatus() {
    const newStatus = prompt('Enter your new status:', 'Hey there! I\'m using Secure Chatroom');
    if (newStatus && newStatus.trim()) {
        // Here you would typically save to database
        console.log('Status updated:', newStatus);
        alert('Status updated! (This would be saved to database in production)');
    }
}

function changeAvatar() {
    alert('Avatar change feature would be implemented here!');
}

// Dark mode functionality
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    if (themeToggle) {
        const icon = themeToggle.querySelector('i');
        if (theme === 'dark') {
            icon.className = 'fas fa-sun';
            themeToggle.title = 'Switch to Light Mode';
        } else {
            icon.className = 'fas fa-moon';
            themeToggle.title = 'Switch to Dark Mode';
        }
    }
}

// Initialize theme
initTheme();

// Theme toggle event listener
if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
}

// Push Notifications
function requestNotificationPermission() {
    if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                console.log('Notification permission granted');
            }
        });
    }
}

function showNotification(title, body, icon = null) {
    if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification(title, {
            body: body,
            icon: icon || '/favicon.ico',
            badge: '/favicon.ico',
            tag: 'chat-message',
            requireInteraction: false,
            silent: false
        });
        
        // Auto close after 5 seconds
        setTimeout(() => {
            notification.close();
        }, 5000);
        
        // Focus window when notification is clicked
        notification.onclick = () => {
            window.focus();
            notification.close();
        };
    }
}

// Request notification permission on page load
requestNotificationPermission();

// Mobile sidebar toggle
if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('show');
    });
    
    // Close sidebar when clicking outside
    document.addEventListener('click', (e) => {
        if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
            sidebar.classList.remove('show');
        }
    });
}

// Update mobile user list
function updateMobileUserList() {
    if (mobileUserList) {
        mobileUserList.innerHTML = '';
        onlineUsers.forEach(user => {
            if (user !== currentUser) {
                const userDiv = document.createElement('div');
                userDiv.className = 'mobile-user-item';
                userDiv.innerHTML = `
                    <span class="user-name">${user}</span>
                    <span class="status">🟢 Online</span>
                `;
                userDiv.addEventListener('click', () => {
                    selectUser(user);
                    // Highlight selected user
                    document.querySelectorAll('.mobile-user-item').forEach(item => {
                        item.classList.remove('selected');
                    });
                    userDiv.classList.add('selected');
                });
                mobileUserList.appendChild(userDiv);
            }
        });
    }
}

// Mobile search functionality
if (mobileSearchBtn && mobileUserSearch) {
    mobileSearchBtn.addEventListener('click', async () => {
        const searchTerm = mobileUserSearch.value.trim();
        if (!searchTerm) return;
        
        try {
            const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchTerm)}`);
            const users = await response.json();
            
            if (users.length > 0) {
                const user = users[0];
                selectUser(user.username);
                mobileUserSearch.value = '';
                // Close sidebar if open
                sidebar.classList.remove('show');
            } else {
                alert('User not found');
            }
        } catch (error) {
            console.error('Search error:', error);
        }
    });
    
    // Also allow Enter key to search
    mobileUserSearch.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            mobileSearchBtn.click();
        }
    });
}

// Auto-resize textarea
messageInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    
    // Send typing indicator
    if (selectedUser) {
        socket.emit('typing', { to: selectedUser, isTyping: true });
    }
});

// Stop typing indicator when user stops typing
let typingTimeout;
messageInput.addEventListener('input', () => {
    clearTimeout(typingTimeout);
    if (selectedUser) {
        socket.emit('typing', { to: selectedUser, isTyping: true });
    }
    
    typingTimeout = setTimeout(() => {
        if (selectedUser) {
            socket.emit('typing', { to: selectedUser, isTyping: false });
        }
    }, 1000);
});

// Handle typing indicators
socket.on('userTyping', ({ from, isTyping }) => {
    if (selectedUser === from) {
        const typingIndicator = document.getElementById('typingIndicator');
        if (isTyping) {
            if (!typingIndicator) {
                const indicator = document.createElement('div');
                indicator.id = 'typingIndicator';
                indicator.className = 'typing-indicator';
                indicator.innerHTML = `
                    <div class="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                    <span>${from} is typing...</span>
                `;
                chatMessages.appendChild(indicator);
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        } else {
            if (typingIndicator) {
                typingIndicator.remove();
            }
        }
    }
});

// Handle message reactions
socket.on('messageReaction', ({ messageId, reactions }) => {
    const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
    if (messageElement) {
        updateMessageReactions(messageElement, reactions);
    }
});

function updateMessageReactions(messageElement, reactions) {
    let reactionsContainer = messageElement.querySelector('.message-reactions');
    if (!reactionsContainer) {
        reactionsContainer = document.createElement('div');
        reactionsContainer.className = 'message-reactions';
        messageElement.appendChild(reactionsContainer);
    }
    
    // Group reactions by type
    const reactionCounts = {};
    reactions.forEach(reaction => {
        reactionCounts[reaction.reaction] = (reactionCounts[reaction.reaction] || 0) + 1;
    });
    
    reactionsContainer.innerHTML = '';
    Object.entries(reactionCounts).forEach(([reaction, count]) => {
        const reactionSpan = document.createElement('span');
        reactionSpan.className = 'reaction';
        reactionSpan.innerHTML = `${getReactionEmoji(reaction)} ${count}`;
        reactionsContainer.appendChild(reactionSpan);
    });
}

function getReactionEmoji(reaction) {
    const emojis = {
        'like': '👍',
        'heart': '❤️',
        'laugh': '😂',
        'wow': '😮',
        'sad': '😢',
        'angry': '😠'
    };
    return emojis[reaction] || '👍';
}

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
    
    // Close sidebar on mobile
    if (window.innerWidth <= 768) {
        sidebar.classList.remove('show');
    }
    
    // Clear current messages and show loading
    chatMessages.innerHTML = '<div class="loading">Loading chat history...</div>';
    
    // Load chat history
    loadChatHistory(username);
    
    // Add to recent chats
    recentChatsList.add(username);
    updateRecentChats();
}

// Load chat history
async function loadChatHistory(username) {
    try {
        console.log(`Loading chat history for user: ${username}`);
        const response = await fetch(`/api/messages/${username}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const messages = await response.json();
        console.log(`Loaded ${messages.length} messages`);
        
        chatMessages.innerHTML = '';
        
        if (messages && messages.length > 0) {
            messages.forEach((msg, index) => {
                const isOwn = msg.sender === currentUser;
                console.log(`Message ${index + 1}:`, msg);
                appendMessage(msg.sender, msg.message, isOwn, msg.timestamp || msg.createdAt, msg.media);
            });
            
            // Scroll to bottom to show latest messages
            setTimeout(() => {
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }, 100);
        } else {
            // Show a message when no history
            const noHistory = document.createElement('div');
            noHistory.className = 'no-history';
            noHistory.innerHTML = `
                <i class="fas fa-comments" style="font-size: 2em; color: var(--text-secondary); margin-bottom: 10px;"></i>
                <div>No messages yet. Start the conversation!</div>
            `;
            chatMessages.appendChild(noHistory);
        }
    } catch (error) {
        console.error('Error loading chat history:', error);
        chatMessages.innerHTML = `<div class="error"><i class="fas fa-exclamation-triangle"></i> Failed to load chat history: ${error.message}</div>`;
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
        showNotification('New Message', notificationText);
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
            li.addEventListener('click', () => {
                selectUser(user);
                // Highlight the selected user
                document.querySelectorAll('.recent-chat-item, .user-item').forEach(item => {
                    item.style.background = 'var(--bg-secondary)';
                    item.style.color = 'var(--text-primary)';
                });
                li.style.background = 'var(--primary-color)';
                li.style.color = 'white';
            });
            userList.appendChild(li);
        }
    });
    
    // Update status if currently chatting with someone
    if (selectedUser) {
        userStatus.textContent = onlineUsers.has(selectedUser) ? '🟢 Online' : '🔴 Offline';
    }
    
    // Update mobile user list
    updateMobileUserList();
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
            li.addEventListener('click', () => {
                selectUser(user);
                // Highlight the selected user
                document.querySelectorAll('.recent-chat-item, .user-item').forEach(item => {
                    item.style.background = 'var(--bg-secondary)';
                });
                li.style.background = 'var(--primary-color)';
                li.style.color = 'white';
            });
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
    updateMobileUserList(); // Update mobile user list
});

// Handle user connect
socket.on('userConnected', username => {
    onlineUsers.add(username);
    if (selectedUser === username) {
        userStatus.textContent = '🟢 Online';
    }
    updateMobileUserList(); // Update mobile user list
});
