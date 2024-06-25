import { useState, useEffect } from 'react';
import Pusher from 'pusher-js';
import axios from 'axios';

const BACKEND_URL = 'https://backchat-pi.vercel.app/';

export default function Home() {
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [room, setRoom] = useState('maths'); // Default room

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/messages/sync/${room}`);
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  useEffect(() => {
    fetchMessages();

    const intervalId = setInterval(fetchMessages, 2000); // Fetch messages every 2 seconds

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    });

    const channel = pusher.subscribe(`messages-${room}`);
    channel.bind('inserted', (newMessage) => {
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    });

    return () => {
      clearInterval(intervalId);
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, [room]); // Re-run effect when room changes

  const sendMessage = async (e) => {
    e.preventDefault();

    try {
      await axios.post(`${BACKEND_URL}/api/messages/new`, {
        username,
        message,
        timestamp: new Date().toISOString(),
        room,
      });
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const clearChat = async () => {
    try {
      await axios.delete(`${BACKEND_URL}/api/messages/delete-all/${room}`);
      setMessages([]);
    } catch (error) {
      console.error('Error clearing chat:', error);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-zinc-800">
      <div className="px-4 py-3 border-b dark:border-zinc-700">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-zinc-800 dark:text-white">
            Chat Room
          </h2>
          <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
            Online
          </div>
        </div>
        <div className="mt-2">
          <select
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            className="p-2 border rounded-lg dark:bg-zinc-700 dark:text-white dark:border-zinc-600 text-sm"
          >
            <option value="maths">Maths</option>
            <option value="physics">Physics</option>
            <option value="chemistry">Chemistry</option>
          </select>
        </div>
      </div>
      <div className="flex-1 p-3 overflow-y-auto flex flex-col space-y-2" id="chatDisplay">
        {messages.map((msg, index) => (
          <div key={index} className={`chat-message ${msg.username === username ? 'self-end bg-blue-500 text-white' : 'self-start bg-zinc-500 text-white'} max-w-xs rounded-lg px-3 py-1.5 text-sm font-bold`}>
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
        <button
          className="mt-3 bg-red-500 hover:bg-red-700 text-white font-bold py-1.5 px-3 rounded-lg transition duration-300 ease-in-out text-sm"
          onClick={clearChat}
        >
          Clear Chat
        </button>
      </div>
    </div>
  );
}
