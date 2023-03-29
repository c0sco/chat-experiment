const chatMessages = document.querySelector('.chat-messages');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const darkModeToggle = document.getElementById('dark-mode-toggle');
const defaultChannelName = "default";
const defaultWsPort = "8080";

var wsHostname = "ws.trueworks.org";
if (window.location.host == "localhost") {
  wsHostname = "localhost";
}

function getChannelIdFromUrl() {
  const urlSearchParams = new URLSearchParams(window.location.search);
  return urlSearchParams.get('c') || defaultChannelName;
}

const channelId = getChannelIdFromUrl();
const socket = new WebSocket(`wss://${wsHostname}:${defaultWsPort}/${channelId}`);

socket.addEventListener('open', (event) => {
  console.log('WebSocket connected:', event);
});

socket.addEventListener('message', (event) => {
  const messageData = JSON.parse(event.data);
  appendMessage(messageData);
});

chatForm.addEventListener('submit', (event) => {
  event.preventDefault();

  if (chatInput.value.trim() === '') return;

  const message = {
    type: 'message',
    text: chatInput.value,
  };

  socket.send(JSON.stringify(message));
  chatInput.value = '';
});

function appendMessage(messageData) {
  const messageElement = createMessageElement(messageData);
  chatMessages.appendChild(messageElement);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function createMessageElement({ text, emoji, userColor }) {
  const messageElement = document.createElement('div');
  messageElement.classList.add('message');
  messageElement.innerHTML = `${emoji} <span style="color: ${userColor}">${text}</span>`;
  return messageElement;
}

// Fetch the message history
async function fetchMessageHistory() {
  const channelId = getChannelIdFromUrl();
  document.querySelector('.channel-display').innerHTML = `<a href="` + window.location + `">#${channelId}</a>`;
  fetch(`https://${wsHostname}:8080/message-history?channel=${channelId}`)
    .then((response) => response.json())
    .then((chatHistory) => {
      chatHistory.forEach((message) => {
        appendMessage({ text: message.text, emoji: message.emoji, userColor: message.userColor });
      });
    });
}

fetchMessageHistory();

function setChatContainerHeight() {
  const chatContainer = document.getElementById("chat-container");
  const windowHeight = window.innerHeight;

  if (window.innerWidth <= 768) {
    chatContainer.style.height = `${windowHeight - 80}px`;
  } else {
    chatContainer.style.height = "calc(100% - 80px)";
  }
}

window.addEventListener("load", setChatContainerHeight);
window.addEventListener("resize", setChatContainerHeight);


// darkModeToggle.addEventListener('click', () => {
//   document.body.classList.toggle('dark-mode');
//   const icon = darkModeToggle.querySelector('i');
//   icon.classList.toggle('fa-moon');
//   icon.classList.toggle('fa-sun');

//   // Save the dark mode preference
//   const darkModeEnabled = document.body.classList.contains('dark-mode');
//   localStorage.setItem('dark-mode', darkModeEnabled);
// });

// function loadDarkModePreference() {
//   const darkModeEnabled = localStorage.getItem('dark-mode') === 'true';

//   if (darkModeEnabled) {
//     document.body.classList.add('dark-mode');
//     const icon = darkModeToggle.querySelector('i');
//     icon.classList.remove('fa-moon');
//     icon.classList.add('fa-sun');
//   }
// }

// Load the user's preference when the page loads
// loadDarkModePreference();
