const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io').listen(server)
const faker = require('faker')

const PLAYERS = {}
var BATTERIES = []
const BATTERYNUM = 5
var WEAPONS = [
  {
    name: 'gun',
    damage: 50,
    bulletSpeed: 10,
    position: { x: 1024, y: 1024 },
  },
  {
    name: 'knife',
    damage: 25,
    position: {
      x: Math.floor(Math.random() * 2048),
      y: Math.floor(Math.random() * 2048),
    },
  },
  {
    name: 'bomb',
    damage: 100,
    position: {
      x: Math.floor(Math.random() * 2048),
      y: Math.floor(Math.random() * 2048),
    },
  },
]

var BULLETS = {}

app.use('/assets', express.static(__dirname + '/assets'))

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html')
})

server.testVariable = 'This is a test'

io.on('connection', function(socket) {
  console.log('[SOCKET]: A user has joined the game.')

  // if(!BATTERIES.length){
  //   for (let i = 0; i < BATTERYNUM; i++) {
  //     BATTERIES.push({strength: Math.floor(Math.random() * 100), position: {x: Math.floor(Math.random() * 2048), y: Math.floor(Math.random() * 2048)}})
  //   }
  // }
  var playerNum = Object.keys(PLAYERS).length

  if (playerNum < 5) {
    if (playerNum === 0) {
      console.log('1st guy')
    }

    if (!BATTERIES.length) {
      for (let i = 0; i < BATTERYNUM; i++) {
        BATTERIES.push({
          strength: Math.floor(Math.random() * 100),
          position: {
            x: Math.floor(Math.random() * 2048),
            y: Math.floor(Math.random() * 2048),
          },
        })
      }
    }

    PLAYERS[socket.id] = {
      id: socket.id,
      name: faker.name.firstName(),
      playerNum: 0,
      x: 640,
      y: 400,
      angle: -90,
    }

    socket.emit('currentPlayers', PLAYERS)
    socket.emit('batteries', BATTERIES)
    socket.emit('weapons', WEAPONS)
    socket.broadcast.emit('newPlayer', PLAYERS[socket.id])
  }

  socket.on('killPlayer', function(data) {
    if (PLAYERS[data.id]) {
      socket.broadcast.emit('killPlayerEmit', data)
    }
  })

  socket.on('destroy-battery', function(data) {
    BATTERIES.forEach(function(battery) {
      if (
        battery.position.x === data.position.x &&
        battery.position.y === data.position.y
      ) {
        BATTERIES = BATTERIES.filter(serverBattery => serverBattery !== battery)
        socket.broadcast.emit('destroy-server-battery', battery)
      }
    })
  })

  socket.on('fireGun', function(data) {
    if (BULLETS[data.id]) {
      BULLETS[data.id].push(data)
    } else {
      BULLETS[data.id] = [data]
    }
    socket.broadcast.emit('bulletEmit', data)
  })

  socket.on('rotate', function(data) {
    if (PLAYERS[data.id]) {
      PLAYERS[data.id].angle = data.angle
      socket.broadcast.emit('rotateEmit', PLAYERS[data.id])
    }
  })

  socket.on('moveUp', function(data) {
    PLAYERS[data.id].y = data.position.y
    socket.broadcast.emit('moveUpEmit', PLAYERS[data.id])
  })

  socket.on('moveDown', function(data) {
    PLAYERS[data.id].y = data.position.y
    socket.broadcast.emit('moveDownEmit', PLAYERS[data.id])
  })

  socket.on('moveLeft', function(data) {
    PLAYERS[data.id].x = data.position.x
    socket.broadcast.emit('moveLeftEmit', PLAYERS[data.id])
  })

  socket.on('moveRight', function(data) {
    PLAYERS[data.id].x = data.position.x
    socket.broadcast.emit('moveRightEmit', PLAYERS[data.id])
  })

  socket.on('disconnect', function() {
    console.log('[SOCKET]: A user has left the game.')
    // remove this player from our players object
    delete PLAYERS[socket.id]
    // emit a message to all players to remove this player
    io.emit('disconnect', socket.id)
  })
})

server.listen(8080, function() {
  console.log(`Listening on ${server.address().port}`)
})
