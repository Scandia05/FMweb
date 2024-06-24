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

const workspaceSchema = new mongoose.Schema({
  workspaceId: { type: String, required: true },
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  data: { type: mongoose.Schema.Types.Mixed, default: {} }
});

const Workspace = mongoose.model('Workspace', workspaceSchema);

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

app.post('/createWorkspace', async (req, res) => {
  const { token, data } = req.body;
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const workspace = new Workspace({
      workspaceId: uuidv4(),
      users: [decoded.id],
      data: data || {}
    });
    await workspace.save();
    console.log(`Workspace created with ID: ${workspace.workspaceId}`);
    res.status(201).json({ workspaceId: workspace.workspaceId });
  } catch (error) {
    console.error('Error creating workspace:', error);
    res.status(400).json({ message: 'Error creating workspace', error });
  }
});

app.post('/joinWorkspace', async (req, res) => {
  const { token, workspaceId } = req.body;
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const workspace = await Workspace.findOne({ workspaceId });
    if (workspace) {
      if (!workspace.users.includes(decoded.id)) {
        workspace.users.push(decoded.id);
        await workspace.save();
      }
      console.log(`User ${decoded.username} joined workspace ${workspaceId}`);
      res.status(200).json({ message: 'Joined workspace successfully' });
    } else {
      res.status(404).json({ message: 'Workspace not found' });
    }
  } catch (error) {
    console.error('Error joining workspace:', error);
    res.status(400).json({ message: 'Error joining workspace', error });
  }
});

io.use((socket, next) => {
  const token = socket.handshake.query.token;
  if (token) {
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
      if (err) {
        return next(new Error('Authentication error'));
      }
      socket.user = decoded;
      next();
    });
  } else {
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  console.log(`New client connected: ${socket.id} (user: ${socket.user.username})`);

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id} (user: ${socket.user.username})`);
    socket.broadcast.emit('clientDisconnected', { id: socket.id });
  });

  socket.on('joinWorkspace', async (workspaceId) => {
    console.log(`User ${socket.user.username} attempting to join workspace ${workspaceId}`);
    const workspace = await Workspace.findOne({ workspaceId });
    if (workspace) {
      socket.join(workspaceId);
      socket.emit('workspaceData', workspace.data);
      console.log(`User ${socket.user.username} joined workspace ${workspaceId}`);
    }
  });

  socket.on('addFeature', async (data) => {
    const { workspaceId } = data;
    console.log(`addFeature event in workspace ${workspaceId}`);
    await Workspace.updateOne({ workspaceId }, { $push: { "data.features": data } });
    io.to(workspaceId).emit('addFeature', data);
  });

  socket.on('addNote', async (data) => {
    const { workspaceId } = data;
    console.log(`addNote event in workspace ${workspaceId}`);
    await Workspace.updateOne({ workspaceId }, { $push: { "data.notes": data } });
    io.to(workspaceId).emit('addNote', data);
  });

  socket.on('updateNode', async (data) => {
    const { workspaceId } = data;
    console.log(`updateNode event in workspace ${workspaceId}`);
    await Workspace.updateOne({ workspaceId, "data.nodes.id": data.id }, { $set: { "data.nodes.$": data } });
    io.to(workspaceId).emit('updateNode', data);
  });

  socket.on('deleteNode', async (data) => {
    const { workspaceId, cellIds } = data;
    console.log(`deleteNode event in workspace ${workspaceId}`);
    await Workspace.updateOne({ workspaceId }, { $pull: { "data.nodes": { id: { $in: cellIds } } } });
    io.to(workspaceId).emit('deleteNode', data);
  });

  socket.on('connectNodes', async (data) => {
    const { workspaceId } = data;
    console.log(`connectNodes event in workspace ${workspaceId}`);
    await Workspace.updateOne({ workspaceId }, { $push: { "data.connections": data } });
    io.to(workspaceId).emit('connectNodes', data);
  });

  socket.on('cursorMove', (data) => {
    const { workspaceId } = data;
    console.log(`cursorMove event in workspace ${workspaceId}`);
    io.to(workspaceId).emit('cursorMove', data);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
