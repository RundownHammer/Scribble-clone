import React, { useState, useEffect } from "react";
import socket from "../../Socket";

export default function ChatList() {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const handleMessage = (username, message) => {
      console.log(`${username} sent message: ${message}`);
      setMessages(prev => [...prev, { username, message }]);
    };

    socket.on("recieve_message", handleMessage);

    return () => {
      socket.off("recieve_message", handleMessage);
    };
  }, []);

  return (
    <div className="bg-black text-white p-4 h-64 overflow-y-auto rounded-md shadow-md">
      <ul className="space-y-1">
        {messages.map((msg, index) => (
          <li key={index} className="text-sm">
            {msg.username === "System" ? (
              <em className="text-gray-400">{msg.message}</em>
            ) : (
              <>
                <strong>{msg.username}:</strong> {msg.message}
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
