import { useState, useEffect } from "react";
import socket from "../Socket";

export default function Lobby({setRoomData, setMainUsername}) {
    
    const [username, setUsername] = useState("")
    const [roomCode, setRoomCode] = useState("")
    const [message, setMessage] = useState("")

    const handleCreate = () => {
        setMainUsername(username)
        socket.emit("create_room", {username})
    }

    const handleJoin = () => {
        setMainUsername(username)
        socket.emit("join_room", {username, RoomCode: roomCode.toUpperCase() })
    }

    socket.on("room_created", (data) => {
        setRoomData(data)
    })
    
    socket.on("error_message", (msg) => {
        setMessage(msg)
    })

    return (
        <div className="flex flex-col gap-4 items-center">
          <input
            placeholder="Username"
            className="border p-2"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <button onClick={handleCreate} className="bg-blue-500 text-white px-4 py-2 rounded">Create Room</button>
          
          <div className="flex items-center gap-2">
            <input
              placeholder="Room Code"
              className="border p-2"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
            />
            <h4>{message}</h4>
            <button onClick={handleJoin} className="bg-green-500 text-white px-4 py-2 rounded">Join Room</button>
          </div>
        </div>
    )
}
