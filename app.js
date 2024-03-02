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

// Object to store active rooms
const activeRooms = {};

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
  const roomId = uuidV4();
  activeRooms[roomId] = true; // Mark the room as active
  res.redirect(`/chat/${roomId}`);
});
let rooom = "85sfdshfdsfh324f";
// Render the specified room
app.get('/chat/:room', (req, res) => {
  console.log(activeRooms)
  res.render('chat', { rooom });
});

// Socket.IO logic
io.on('connection', socket => {
  console.log("A user connected");

  socket.on('join-room', (rooom, userId) => {
    socket.join(rooom);
    console.log(`User ${userId} joined room ${rooom}`);

    // Emit 'user-connected' event to all clients in the room except the current one
    socket.to(rooom).emit('user-connected', userId);

    socket.on('disconnect', () => {
      console.log("User disconnected");
      // Emit 'user-disconnected' event to all clients in the room except the current one
      socket.to(rooom).emit('user-disconnected', userId);
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
