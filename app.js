const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const http = require('http');
const socketIo = require('socket.io');

const { v4: uuidV4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Set up view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// Middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));



// Generate a unique room ID and redirect the user to that room
app.get('/', (req, res) => {
  res.redirect(`/chat/${uuidV4()}`);
});

// Render the specified room
app.get('/chat/:room', (req, res) => {
  res.render('chat', { roomId: req.params.room });
});

// Socket.IO logic
io.on('connection', socket => {
  console.log("A user connected");

  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId);
    console.log(`User ${userId} joined room ${roomId}`);

    // Get the list of all clients in the room except the current one
    const clientsInRoom = io.sockets.adapter.rooms.get(roomId);
    const otherUsers = [...clientsInRoom].filter(socketId => socketId !== socket.id);

    if (otherUsers.length > 0) {
      // If there are other users in the room, establish a connection between them
      const otherUserId = otherUsers[0]; // For simplicity, we'll just connect the current user to the first other user
      socket.to(otherUserId).emit('connect-to-user', userId);
      socket.emit('connect-to-user', otherUserId);
    }

    socket.on('disconnect', () => {
      console.log("User disconnected");
      // Emit 'user-disconnected' event to all clients in the room except the current one
      socket.to(roomId).emit('user-disconnected', userId);
    });
  });
});

// Error handling
app.use(function(req, res, next) {
  next(createError(404));
});

app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
