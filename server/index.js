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

let rooms = {
  SOMETHING: {
    code: "SOMETHING",
    players: [],
    turn: "",
    playersNo : 0,
  },
  NOTHING: {
    code: "NOTHING",
    players: [],
    turn: "",
    playersNo : 0,
}
}

const io = new Server(server, {
  cors: {
    origin: process.env.ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true
  }
})

io.on('connection', (socket) => {
  console.log('User connected:', socket.id)

  socket.on("create_room", ({ username }) => {
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    socket.join(roomCode)

    rooms[roomCode] = {
      code: roomCode,
      playersNo: 1,
      turn: username,
      players: [{ id: socket.id, username, score: 0 }]
    };

    socket.emit("room_created", rooms[roomCode])
  })

  socket.on("join_room", ({ RoomCode, username }) => {
    const room = rooms[RoomCode.toUpperCase()]
    if (room) {
      socket.join(RoomCode)
      room.playersNo++
      room.players.push({ id: socket.id, username, score: 0 })
  
      console.log("A user joined room:", username)
  
      io.to(RoomCode).emit("update_players", room)
      io.to(RoomCode).emit("recieve_message", "System", `${username} has joined the room.`)

      socket.emit("turn_update", rooms[RoomCode].turn)

      const host = room.players.find(p => p.username === room.turn)
      console.log("the host is ", host);
      
      if (host) {
        io.to(host.id).emit("request_canvas_sync", socket.id)
      }      
      
    } else {
      socket.emit("error_message", "Room does not exist")
    }
  })

  socket.on("send_message", (username, message, roomCode) => {
    if (rooms[roomCode]) {
      socket.nsp.to(roomCode).emit("recieve_message", username, message);
    }
  })  

  socket.on("drawing", ({ roomCode, pathData }) => {
    socket.to(roomCode).emit("drawing", { pathData })
  })
  
  socket.on("undo_redo", ({ roomCode, fullCanvas }) => {
    socket.to(roomCode).emit("update-canvas", { fullCanvas })
  })
  
  socket.on("send_canvas_sync", ({ target, fullCanvas }) => {
    console.log("inside send canvas server", target, fullCanvas);
    
    io.to(target).emit("receive_canvas_sync", { fullCanvas })
  })

  socket.on("change_turn", ({ roomCode, nextTurn }) => {
    if (rooms[roomCode]) {
      rooms[roomCode].turn = nextTurn
      io.to(roomCode).emit("update_players", rooms[roomCode])
    }
  })

  socket.on("leave_room", ({ username, roomCode }) => {
    if (rooms[roomCode]) {
      rooms[roomCode].players = rooms[roomCode].players.filter(p => p.id !== socket.id)
      console.log(`${username} left room: ${roomCode}`)
  
      io.to(roomCode).emit("recieve_message", "System", `${username} has left the room.`)
      io.to(roomCode).emit("update_players", rooms[roomCode])
  
      socket.leave(roomCode)
  
      socket.emit("room_left")
    }
  });
  

  socket.on("disconnect", () => {
    for (const code in rooms) {
      const index = rooms[code].players.findIndex(p => p.id === socket.id)

      if (index !== -1) {
        const username = rooms[code].players[index].username
        rooms[code].players.splice(index, 1)
        rooms[code].playersNo--

        io.to(code).emit("update_players", rooms[code])
        io.to(code).emit("recieve_message", "System", `${username} has disconnected from the room.`)

        if (rooms[code].players.length === 0) {
          delete rooms[code]
        }

        break
      }
    }

    console.log("Client disconnected:", socket.id)
  })
})

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
