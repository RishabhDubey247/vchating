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

let joiningRoom = ""; 

let rooom = ["85sfdshfdsfh324f","whjfghdghf","fjbhdjsvfhjdsvf"];

app.get('/chat/:room', (req, res) => {
  console.log(activeRooms)
  res.render('chat', { joiningRoom });
});

app.get("/leave-chat", (req, res) => {
  res.send("Thanks for joining")
});

io.on('connection', socket => {
  console.log("A user connected");

  function joinOrCreateRoom(userId) {
      let availableRoom = null;

      for (let i = 0; i < rooom.length; i++) {
          let users = io.sockets.adapter.rooms.get(rooom[i]);
          if (!users || users.size < 2) {
              availableRoom = rooom[i];
              break;
          }
      }

      if (!availableRoom) {
          availableRoom = generateNewRoomName(); // Implement your logic for generating a new room name
      }

      socket.join(availableRoom);
      joiningRoom = availableRoom ;
      console.log("User joined room:", availableRoom);
      let currentRoom = availableRoom;
      io.to(currentRoom).emit('user-connected', { userId, roomId: currentRoom });

      socket.on('disconnect', () => {
          console.log("User disconnected");
          socket.to(currentRoom).emit('user-disconnected', userId);
      });
  }
  socket.on('join-room', (userId) => {
    console.log("User joined room with:", userId);
      joinOrCreateRoom(userId);
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
