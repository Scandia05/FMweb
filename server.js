const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');

// Conectar a MongoDB
mongoose.connect('mongodb://localhost:27017/fmweb', { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);

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
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;
const SECRET_KEY = "your_secret_key";  // Cambia esto por una clave secreta más segura

app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);

  const user = new User({
    username,
    email,
    password: hashedPassword
  });

  try {
    await user.save();
    res.status(201).json({ message: 'User registered successfully!' });
  } catch (error) {
    res.status(400).json({ message: 'User already exists or other error', error });
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user && bcrypt.compareSync(password, user.password)) {
    const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '1h' });
    res.status(200).json({ token, username: user.username });
  } else {
    res.status(400).json({ message: 'Invalid email or password' });
  }
});

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
