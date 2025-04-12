

export default function PlayerCard({username, score}) {
    return(
        <div>
            <h4>{username}</h4>
            <p>{score}</p>
        </div>
    )
}