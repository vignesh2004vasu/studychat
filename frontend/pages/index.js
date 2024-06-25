import { useState, useEffect } from 'react';
import Pusher from 'pusher-js';
import axios from 'axios';

const BACKEND_URL = 'https://backchat-pi.vercel.app';

export default function Home() {
  // State variables for managing user information, messages, room selection, and login status
  const [username, setUsername] = useState('');
  const [inputName, setInputName] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [room, setRoom] = useState('maths'); // Default room
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(true); // Theme state

  // Function to fetch messages from the server based on the selected room
  const fetchMessages = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/messages/sync/${room}`);
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Effect hook to manage real-time message updates using Pusher
  useEffect(() => {
    if (isLoggedIn) {
      fetchMessages(); // Initial fetch

      // Set up interval to fetch messages periodically
      const intervalId = setInterval(fetchMessages, 2000); // Fetch messages every 2 seconds

      // Initialize Pusher with credentials from environment variables
      const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
      });

      // Subscribe to channel specific to the selected room
      const channel = pusher.subscribe(`messages-${room}`);
      
      // Bind to 'inserted' event to update messages when a new message is received
      channel.bind('inserted', (newMessage) => {
        setMessages((prevMessages) => [...prevMessages, newMessage]);
      });

      // Cleanup function to clear interval and unsubscribe from Pusher channel
      return () => {
        clearInterval(intervalId);
        channel.unbind_all();
        channel.unsubscribe();
      };
    }
  }, [room, isLoggedIn]); // Re-run effect when room or login state changes

  // Function to send a new message
  const sendMessage = async (e) => {
    e.preventDefault();

    try {
      await axios.post(`${BACKEND_URL}/api/messages/new`, {
        username,
        message,
        timestamp: new Date().toISOString(),
        room,
      });
      setMessage(''); // Clear message input after sending
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Function to clear the entire chat history for the selected room
  const clearChat = async () => {
    try {
      await axios.delete(`${BACKEND_URL}/api/messages/delete-all/${room}`);
      setMessages([]); // Clear messages locally after deletion
    } catch (error) {
      console.error('Error clearing chat:', error);
    }
  };

  // Function to handle joining a room with the entered username
  const joinRoom = () => {
    if (inputName.trim()) {
      setUsername(inputName.trim());
      setIsLoggedIn(true); // Set logged-in state to true after joining
    }
  };

  // Function to switch to a different chat room
  const switchRoom = (newRoom) => {
    setRoom(newRoom); // Update selected room state
    fetchMessages(); // Fetch messages for the new room
  };

  // Function to toggle between dark and light themes
  const toggleTheme = () => {
    setIsDarkTheme((prevTheme) => !prevTheme); // Invert theme state
  };

  // Conditional rendering based on login status
  if (!isLoggedIn) {
    // Render login form if not logged in
    return (
      <div className="h-screen flex items-center justify-center bg-white dark:bg-zinc-800">
        <div className="w-80 p-4 bg-white dark:bg-zinc-700 rounded-lg shadow-lg">
          <h2 className="text-lg font-semibold text-zinc-800 dark:text-white mb-4">Join Chat Room</h2>
          <input
            type="text"
            placeholder="Enter your name"
            className="w-full p-2 mb-4 border rounded-lg dark:bg-zinc-700 dark:text-white dark:border-zinc-600 text-sm"
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
          />
          <select
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            className="w-full p-2 mb-4 border rounded-lg dark:bg-zinc-700 dark:text-white dark:border-zinc-600 text-sm"
          >
            <option value="maths">Maths</option>
            <option value="physics">Physics</option>
            <option value="chemistry">Chemistry</option>
          </select>
          <button
            className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-1.5 px-3 rounded-lg transition duration-300 ease-in-out text-sm"
            onClick={joinRoom}
          >
            Join Room
          </button>
        </div>
      </div>
    );
  }

  // Render chat interface if logged in
  return (
    <div className={`h-screen flex flex-col ${isDarkTheme ? 'bg-zinc-800' : 'bg-white'}`}>
      <div className="px-4 py-3 border-b dark:border-zinc-700">
        <div className="flex justify-between items-center">
          <h2 className={`text-lg font-semibold ${isDarkTheme ? 'text-white' : 'text-zinc-800'}`}>
            {room.charAt(0).toUpperCase() + room.slice(1)} Chat Room
          </h2>
          <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
            Online
          </div>
          {/* Toggle switch for theme */}
          <label className="switch ml-4">
            <input type="checkbox" onChange={toggleTheme} checked={!isDarkTheme} />
            <span className="slider"></span>
          </label>
        </div>
        <div className="mt-2">
          {/* Room selection dropdown */}
          <select
            value={room}
            onChange={(e) => switchRoom(e.target.value)}
            className={`p-2 border rounded-lg ${isDarkTheme ? 'dark:bg-zinc-700 dark:text-white dark:border-zinc-600' : 'bg-white text-black border-gray-300'} text-sm`}
          >
            <option value="maths">Maths</option>
            <option value="physics">Physics</option>
            <option value="chemistry">Chemistry</option>
          </select>
        </div>
      </div>
      <div className="flex-1 p-3 overflow-y-auto flex flex-col space-y-2" id="chatDisplay">
        {/* Render messages dynamically based on user and theme */}
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`chat-message ${
              msg.username === username ? 'self-end bg-blue-500 text-white' : `self-start ${isDarkTheme ? 'bg-gray-700 text-white' : 'bg-gray-300 text-black'}`
            } max-w-xs rounded-lg px-3 py-1.5 text-sm`}
          >
            <p className="font-bold">{msg.username}</p>
            <p>{msg.message}</p>
            <em className="text-xs">
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </em>
          </div>
        ))}
      </div>
      <div className={`px-3 py-2 border-t ${isDarkTheme ? 'dark:border-zinc-700' : 'border-gray-300'}`}>
        {/* Form to send messages and clear chat button */}
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            placeholder="Type your message..."
            className={`flex-1 p-2 border rounded-lg ${isDarkTheme ? 'dark:bg-zinc-700 dark:text-white dark:border-zinc-600' : 'bg-white text-black border-gray-300'} text-sm`}
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
