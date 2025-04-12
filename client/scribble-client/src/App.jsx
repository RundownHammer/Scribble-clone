import { useState, useEffect } from 'react'
import Lobby from './components/Lobby'
import Players from "./components/ScoreTab/Players"
import Chat from './components/Chat/Chat'
import Whiteboard from './components/whiteboard/Whiteboard'
import socket from "./Socket"

function App() {
  const [mainUsername, setMainUsername] = useState("")
  const [roomData, setRoomData] = useState("")

  useEffect(() => {
    socket.on("update_players", (room) => {
      setRoomData(room);
    });

    return () => {
      socket.off("update_players");
    };
  }, []);

  useEffect(() => {
    socket.on("connect", () => {
      console.log(`You connected with id ${socket.id}`);
    });

    return () => {
      socket.off("connect");
    };
  }, []);

  const leaveRoom = () => {
    socket.emit("leave_room", {
      username: mainUsername,
      roomCode: roomData.code
    });  
    socket.once("room_left", () => {
      setRoomData("");
      setMainUsername("");
    });
  };

  const getNextPlayer = () => {
    const index = Math.floor(Math.random()*roomData.playersNo)
    return roomData.players[index].username
  }

  if (!roomData) return <Lobby setRoomData={setRoomData} setMainUsername={setMainUsername} />

  return (
    <div>
      <div className="flex justify-end p-2">
        <button 
          onClick={leaveRoom} 
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">
          Leave Room
        </button>
      </div>
      <Players roomData={roomData} setRoomData={setRoomData} />
      <Chat playerUsername={mainUsername} RoomData = {roomData}/>
      <button
        onClick={() => {
          const nextPlayer = getNextPlayer() // you write logic to cycle players
          socket.emit("change_turn", { roomCode: roomData.code, nextTurn: nextPlayer })
        }}>
        Change Turn
      </button>
      <Whiteboard roomCode={roomData.code} mainUsername={mainUsername} roomData={roomData}/>
    </div>
  )
}

export default App