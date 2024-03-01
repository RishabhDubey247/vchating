var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

const { v4: uuidV4 } = require('uuid');

var app = express(); // Initialize the Express app

// Set up Socket.IO
var server = require('http').createServer(app); // Create HTTP server
const io = require('socket.io')(server)// Initialize Socket.IO
app.use('/socket.io', express.static(__dirname + '/node_modules/socket.io/client-dist'));
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var chatRouter = require('./routes/chat');
app.listen("3000");


// Generate a unique room ID and redirect the user to that room
app.get('/', (req, res) => {
  res.redirect(`/chat/${uuidV4()}`);
});

// Render the specified room
app.get('/chat/:room', (req, res) => {
  console.log(req.params.room)
  res.render('chat', { roomId: req.params.room });
});

// Socket.IO logic
io.on('connection', socket => {
  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId);
    socket.broadcast.to(roomId).emit('user-connected', userId);

    socket.on('disconnect', () => {
      socket.broadcast.to(roomId).emit('user-disconnected', userId);
    });
  });
});

// Catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// Error handler
app.use(function(err, req, res, next) {
  // Set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // Render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = server;
