import { useState, useEffect } from 'react';
import axios from 'axios';
import '../index.css'; // Example path, adjust as per your project structure

const BACKEND_URL = 'https://backendchat-tau.vercel.app'; // Replace with your backend URL

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/messages/sync`);
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    try {
      await axios.post(`${BACKEND_URL}/api/messages/new`, {
        username: 'Sender Name', // Replace with sender's name or fetch from authentication
        message: messageInput,
        timestamp: new Date().toISOString()
      });
      setMessageInput('');
      fetchMessages(); // Refresh messages after sending
    } catch (error) {
      console.error('Error sending message:', error);
    }
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
            <div key={index} className={`chat-message ${msg.username === 'Sender Name' ? 'self-end bg-blue-500' : 'self-start bg-zinc-500'} text-white max-w-xs rounded-lg px-3 py-1.5 text-sm`}>
              <span className="text-xs text-gray-400">{msg.username}</span><br />
              {msg.message}
            </div>
          ))}
        </div>
        <div className="px-3 py-2 border-t dark:border-zinc-700">
          <div className="flex gap-2">
            <input
              placeholder="Type your message..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              className="flex-1 p-2 border rounded-lg dark:bg-zinc-700 dark:text-white dark:border-zinc-600 text-sm"
              type="text"
            />
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1.5 px-3 rounded-lg transition duration-300 ease-in-out text-sm"
              onClick={sendMessage}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
