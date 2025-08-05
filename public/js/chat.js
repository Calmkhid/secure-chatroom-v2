const socket = io();
const form = document.getElementById('message-form');
const input = document.getElementById('message-input');
const messages = document.getElementById('messages');
const targetInput = document.getElementById('target-user');
const privateBtn = document.getElementById('start-private-chat');
const groupBtn = document.getElementById('switch-to-group');

let currentTarget = 'group';

form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (input.value.trim()) {
    socket.emit('chat message', {
      content: input.value,
      to: currentTarget,
    });
    input.value = '';
  }
});

socket.on('chat message', ({ from, content }) => {
  const item = document.createElement('div');
  item.textContent = `[${from}]: ${content}`;
  messages.appendChild(item);
  messages.scrollTop = messages.scrollHeight;
});

privateBtn.addEventListener('click', () => {
  const target = targetInput.value.trim();
  if (target) {
    currentTarget = target;
    messages.innerHTML = '';
    const info = document.createElement('div');
    info.textContent = `🔒 Private chat with ${target}`;
    messages.appendChild(info);
  }
});

groupBtn.addEventListener('click', () => {
  currentTarget = 'group';
  messages.innerHTML = '';
  const info = document.createElement('div');
  info.textContent = `👥 Group chat`;
  messages.appendChild(info);
});
