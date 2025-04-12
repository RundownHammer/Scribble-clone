import PlayerCard from "./PlayerCard";

export default function Players({ roomData }) {

    return(
    <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Room: {roomData.code}</h1>
        <h2 className="text-xl">Players:</h2>
        <ul className="list-disc ml-6">
            {roomData.players.map(player => (
            <PlayerCard key={player.id} username={player.username} score={player.score}/>
            ))}
        </ul>
    </div>
    )
}
