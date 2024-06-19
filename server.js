const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:8080",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    socket.broadcast.emit('clientDisconnected', { id: socket.id });
  });

  socket.on('addFeature', (data) => {
    socket.broadcast.emit('addFeature', data);
  });

  socket.on('addNote', (data) => {
    socket.broadcast.emit('addNote', data);
  });

  socket.on('updateNode', (data) => {
    socket.broadcast.emit('updateNode', data);
  });

  socket.on('deleteNode', (cellId) => {
    console.log('deleteNode event received:', cellId);
    socket.broadcast.emit('deleteNode', cellId);
  });

  socket.on('connectNodes', (data) => {
    socket.broadcast.emit('connectNodes', data);
  });

  socket.on('cursorMove', (data) => {
    socket.broadcast.emit('cursorMove', data);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
