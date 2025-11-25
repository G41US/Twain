'use client';
import { useState } from "react";
import { useParams } from "next/navigation";

export default function Chat() {
  const params = useParams();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [wingmanReply, setWingmanReply] = useState("");

  const sendMessage = async () => {
    // Add message logic here
    setInput("");
  };

  const getWingman = async () => {
    const res = await fetch("/api/wingman", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ context: "Flirty convo starter" }),
    });
    const data = await res.json();
    setWingmanReply(data.reply);
  };

  return (
    <div className="max-w-2xl mx-auto p-8 h-screen flex flex-col">
      <h1 className="text-3xl font-bold mb-4">Chat with {params.id}</h1>
      <div className="flex-1 border rounded-lg p-4 overflow-y-auto mb-4">
        {messages.map((m: any, i) => <p key={i}>{m.content}</p>)}
        {wingmanReply && <p className="bg-purple-100 p-4 rounded-lg mt-4">AI Wingman: "{wingmanReply}"</p>}
      </div>
      <div className="flex gap-2">
        <input 
          value={input} 
          onChange={e => setInput(e.target.value)} 
          placeholder="Type message..." 
          className="flex-1 p-4 border rounded-lg"
        />
        <button onClick={getWingman} className="bg-purple-600 text-white px-6 py-4 rounded-lg">AI Help</button>
        <button onClick={sendMessage} className="bg-pink-600 text-white px-6 py-4 rounded-lg">Send</button>
      </div>
    </div>
  );
}
