const express = require('express');
const http = require('http');
const fs = require("fs");
const https = require("https");
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const { generateColor, generateEmoji } = require('./emoji-generator');
const cors = require('cors');

const leDir = "/etc/letsencrypt/live/ws.trueworks.org"
const privateKey = fs.readFileSync(leDir + "/privkey.pem", "utf8");
const certificate = fs.readFileSync(leDir + "/cert.pem", "utf8");
const ca = fs.readFileSync(leDir + "/chain.pem", "utf8");
const credentials = {
  key: privateKey,
  cert: certificate,
  ca: ca,
};

const defaultChannelName = "default"

const app = express();
const server = http.createServer(app);
const httpsServer = https.createServer(credentials, app);
const wss = new WebSocket.Server({ server: httpsServer });

const clients = new Map();
const rooms = new Map();
const roomTimers = new Map();

const messageHistory = [];
const maxMessageHistory = 10;
const channelMessageHistory = new Map();

app.use(express.static('public'));

// Enable CORS for all routes
app.use(cors());

// Create an HTTP endpoint to serve the message history
app.get('/message-history', (req, res) => {
  const channelId = req.query.channel || defaultChannelName;
  const channelHistory = channelMessageHistory.get(channelId) || [];
  res.json(channelHistory);
});

function getSocketsByChannelId(channelId) {
  const socketsInChannel = [];
  clients.forEach((clientData, socket) => {
    if (clientData.channelId === channelId) {
      socketsInChannel.push(socket);
    }
  });
  return socketsInChannel;
}

function storeMessage(channelId, message) {
  if (!channelMessageHistory.has(channelId)) {
    channelMessageHistory.set(channelId, []);
  }

  const channelHistory = channelMessageHistory.get(channelId);
  channelHistory.push(message);

  if (channelHistory.length > maxMessageHistory) {
    channelHistory.shift();
  }
}

function broadcastMessage(message, sender, channelId) {
  const senderData = clients.get(sender);
  // Store the message before broadcasting
  storeMessage(channelId, { ...message, userColor: senderData.color, emoji: senderData.emoji });
  rooms.get(channelId).forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ ...message, userColor: senderData.color, emoji: senderData.emoji }));
    }
  });
}

wss.on("connection", (socket, req) => {
  const channelId = req.url.substr(1); // Get the channel ID from the URL path
  const color = generateColor(req.socket.remoteAddress, req.headers["user-agent"]);
  const emoji = generateEmoji(req.socket.remoteAddress, req.headers["user-agent"]);

  // Clear the timer for the room if it exists
  if (roomTimers.has(channelId)) {
    clearTimeout(roomTimers.get(channelId));
    roomTimers.delete(channelId);
  }

  if (!rooms.has(channelId)) {
    rooms.set(channelId, []);
  }
  rooms.get(channelId).push(socket);
  clients.set(socket, { color, emoji });

  console.log("setting color and emoji for %s to %s and %s", channelId, color, emoji);

  socket.on("message", (data) => {
    const message = JSON.parse(data);

    if (message.type === "message") {
      broadcastMessage(
        { type: "message", text: message.text },
        socket,
        channelId
      );
    }
  });

  socket.on("close", () => {
    clients.delete(socket);
    if (rooms.has(channelId)) {
      rooms.set(channelId, rooms.get(channelId).filter((client) => client !== socket));
      if (rooms.get(channelId).length === 0) {
        rooms.delete(channelId);
        const timer = setTimeout(() => {
          channelMessageHistory.delete(channelId);
          roomTimers.delete(channelId);
        }, 10000);
        roomTimers.set(channelId, timer);
      }
    }
  });
});


// server.on("upgrade", (req, socket, head) => {
//   wss.handleUpgrade(req, socket, head, (ws) => {
//     wss.emit("connection", ws, req);
//   });
// });

httpsServer.listen(8080, () => {
  console.log("WebSocket server is running on port 8080");
});
