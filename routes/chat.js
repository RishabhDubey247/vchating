const express = require('express');
const router = express.Router();
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)

router.get('/:room', (req, res) => {
  res.render('room', {roomId: req.params.room})
});

io.on('connection', socket => {
  // When someone attempts to join the room
  socket.on('join-room', (roomId, userId) => {
      socket.join(roomId)  // Join the room
      socket.broadcast.emit('user-connected', userId) // Tell everyone else in the room that we joined
      
      // Communicate the disconnection
      socket.on('disconnect', () => {
          socket.broadcast.emit('user-disconnected', userId)
      })
  })
})
module.exports = router;
