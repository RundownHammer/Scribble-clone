import { useState } from 'react'
import Lobby from './components/Lobby'
import Players from "./components/Players";
import socket from "./Socket";

function App() {
  const [roomData, setRoomData] = useState("")

  socket.on("update_players", ({room}) => {
    setRoomData(room)
  })

  if (!roomData) return <Lobby setRoomData={setRoomData} />

  return (
    <Players roomData = {roomData} setRoomData = {setRoomData} />
  )
}

export default App