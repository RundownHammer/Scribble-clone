import React, { useState } from "react"
import socket from "../../Socket"
import MessageBox from "./MessageBox"
import ChatList from "./ChatList"

export default function Chat({playerUsername, RoomData}) {

    return(
        <div>
            <ChatList />
            <MessageBox username = {playerUsername} roomData = {RoomData}/>
        </div>
    )
}