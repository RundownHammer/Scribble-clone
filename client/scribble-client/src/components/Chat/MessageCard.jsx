import React from "react";

export default function MessageCard({username, message}) {
    return(
        <div>
            {username}
            {message}
        </div>
    )
}