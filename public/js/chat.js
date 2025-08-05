const socket = io();
const form = document.getElementById('messageForm');
const chatMessages = document.getElementById('chatMessages');
const recipientInput = document.getElementById('recipient');
const messageInput = document.getElementById('messageInput');
const userList = document.getElementById('userList');
const groupToggle = document.getElementById('groupToggle');

let currentUser = localStorage.getItem("username");

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const to = recipientInput.value.trim();
  const message = messageInput.value.trim();
  if (message && to) {
    socket.emit('privateMessage', { to, message });
    appendMessage(currentUser, message, true);
    messageInput.value = '';
  }
});

socket.on('privateMessage', ({ from, message }) => {
  appendMessage(from, message, false);
});

function appendMessage(sender, message, isOwn) {
  const msg = document.createElement('div');
  msg.className = isOwn ? 'own' : 'incoming';
  msg.innerHTML = `<strong>${sender}</strong>: ${message}`;
  chatMessages.appendChild(msg);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

socket.on('userList', users => {
  userList.innerHTML = '';
  users.forEach(user => {
    const li = document.createElement('li');
    li.textContent = user;
    userList.appendChild(li);
  });
});

groupToggle.addEventListener('click', () => {
  recipientInput.value = 'group';
});
