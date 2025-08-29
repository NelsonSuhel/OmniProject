const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with CORS configuration
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Allow connections from the Next.js app
    methods: ["GET", "POST"]
  }
});

const PORT = 3001;

// Store user positions in memory (for simplicity)
// In a real app, you might use a database like Redis
const users = {};
const spheres = {}; // Store sphere positions

io.on('connection', (socket) => {
  console.log(`A user connected: ${socket.id}`);
  
  // Initialize user position
  users[socket.id] = { x: 0, y: 0, z: 0 };

  // Send the current list of users and spheres to the new user
  socket.emit('current_users', users);
  socket.emit('current_spheres', spheres); // Send current sphere states

  // Broadcast the new user to all other users
  socket.broadcast.emit('user_connected', { id: socket.id, pos: users[socket.id] });

  // Listen for position updates from a user
  socket.on('user_position_update', (position) => {
    if (users[socket.id]) {
      users[socket.id] = position;
      // Broadcast the updated position to all other users
      socket.broadcast.emit('user_position_update', { id: socket.id, pos: position });
    }
  });

  // Listen for sphere position updates
  socket.on('sphere_position_update', (data) => {
    const { id, position } = data;
    spheres[id] = position; // Update sphere position
    socket.broadcast.emit('sphere_position_update', { id, position }); // Broadcast to others
  });

  // Listen for disconnections
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    delete users[socket.id];
    // Broadcast the disconnection to all other users
    io.emit('user_disconnected', socket.id);
  });
});

app.get('/api/iot-data', (req, res) => {
  const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16);
  res.json({ color: randomColor });
});

server.listen(PORT, () => {
  console.log(`Socket.IO server listening on port ${PORT}`);
  console.log(`Mock IoT data available at http://localhost:${PORT}/api/iot-data`);
});
