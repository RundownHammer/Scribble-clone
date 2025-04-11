import express from 'express'
import http from 'http'
import cors from 'cors'
import { Server } from 'socket.io'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const server = http.createServer(app)

app.use(cors({
  origin: process.env.ORIGIN,
  credentials: true
}))

const rooms = {}

const io = new Server(server, {
  cors: {
    origin: process.env.ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true
  }
})

io.on('connection', (socket) => {
  console.log('User connected:', socket.id)

  socket.on("create_room", ({username}) => {
    const roomCode = Math.random().toString(36).substr(2, 6).toUpperCase()
    socket.join(roomCode)

    rooms[roomCode] = [{
      id: socket.id,
      username,
      score: 0,
    }]

    socket.emit('room_created', {roomCode, players: rooms[roomCode] })
    io.to(roomCode).emit('update_players', rooms[roomCode])
  })

  socket.on("join_room", ({roomCode, username}) => {
    const room = rooms[roomCode]
    if (room) {
      socket.join(roomCode)
      room.push({ id: socket.id, username, score: 0 })
      console.log("a user joined room", room);
      
      socket.emit("joined_room", {roomCode, players: room})
      io.to(roomCode).emit("update_palyers", room)

    } else {
      socket.emit("error_message", "Room does not exist")
    }
  })

  socket.on('disconnect', () => {

    for ( const code in rooms ) {
      const room = rooms[code]
      const index = room.findIndex(p => p.id === socket.id)
      if (index !== -1) {
        room.splice(index, 1)
        io.to(code).emit("update_players", room)
        break
      }
    }

    console.log('Client disconnected:', socket.id)
  })
})

const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
