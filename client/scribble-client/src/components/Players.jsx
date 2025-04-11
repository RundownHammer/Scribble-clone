import { useState, useEffect } from "react";
import PlayerCard from "./PlayerCard";
import socket from "../Socket";

export default function Players({roomData, setRoomData}) {

    return(
    <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Room: {roomData.roomCode}</h1>
        <h2 className="text-xl">Players:</h2>
        <ul className="list-disc ml-6">
            {roomData.players.map(player => (
            <PlayerCard key={player.id} username={player.username} score={player.score}/>
            ))}
        </ul>
    </div>
    )
}