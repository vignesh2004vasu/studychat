import { useState, useEffect } from 'react';
import Pusher from 'pusher-js';
import axios from 'axios';

const BACKEND_URL = 'https://backendchat-tau.vercel.app';

export default function Home() {
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    axios.get(`${BACKEND_URL}/api/messages/sync`)
      .then(response => {
        setMessages(response.data);
      });

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER
    });

    const channel = pusher.subscribe('messages');
    channel.bind('inserted', (newMessage) => {
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, []);

  const sendMessage = async (e) => {
    e.preventDefault();

    await axios.post(`${BACKEND_URL}/api/messages/new`, {
      username,
      message,
      timestamp: new Date().toISOString()
    });

    setMessage('');
  };

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-zinc-800 shadow-md rounded-lg overflow-hidden">
      <div className="flex flex-col h-[400px]">
        <div className="px-4 py-3 border-b dark:border-zinc-700">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-zinc-800 dark:text-white">
              Chat Room
            </h2>
            <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
              Online
            </div>
          </div>
        </div>
        <div className="flex-1 p-3 overflow-y-auto flex flex-col space-y-2" id="chatDisplay">
          {messages.map((msg, index) => (
            <div key={index} className={`chat-message ${msg.username === username ? 'self-end bg-blue-500 text-white' : 'self-start bg-zinc-500 text-white'} max-w-xs rounded-lg px-3 py-1.5 text-sm`}>
              <p>{msg.message}</p>
              <em>{msg.timestamp}</em>
            </div>
          ))}
        </div>
        <div className="px-3 py-2 border-t dark:border-zinc-700">
          <form onSubmit={sendMessage} className="flex gap-2">
            <input
              placeholder="Type your message..."
              className="flex-1 p-2 border rounded-lg dark:bg-zinc-700 dark:text-white dark:border-zinc-600 text-sm"
              id="chatInput"
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1.5 px-3 rounded-lg transition duration-300 ease-in-out text-sm"
              id="sendButton"
              type="submit"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
