import React, { useState } from "react"
import socket from "../../Socket"

export default function MessageBox({username, roomData}) {

    const [text, setText] = useState("")

    const sendMessage = (e) => {
        e.preventDefault()
        if (text) {
            socket.emit("send_message", username, text, roomData.code)
            setText("")
        }
    }

    return(
        <div>
            <form action="sendMessage">
                <input type="text" value={text} onChange={(e) => {setText(e.target.value)}}/>
                <button type="submit" onClick={sendMessage}>Send</button>
            </form>
        </div>
    )
}