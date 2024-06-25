const express = require('express');
const mongoose = require('mongoose');
const Pusher = require('pusher');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB setup
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
  const msgCollection = db.collection('messages');
  const changeStream = msgCollection.watch();

  // Pusher setup
  const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_KEY,
    secret: process.env.PUSHER_SECRET,
    cluster: process.env.PUSHER_CLUSTER,
    useTLS: true,
  });

  // Watch MongoDB change stream and trigger Pusher event on new insertions
  changeStream.on('change', (change) => {
    if (change.operationType === 'insert') {
      const messageDetails = change.fullDocument;
      pusher.trigger(`messages-${messageDetails.room}`, 'inserted', {
        username: messageDetails.username,
        message: messageDetails.message,
        timestamp: messageDetails.timestamp,
      });
    }
  });
});

// MongoDB schema and model
const messageSchema = new mongoose.Schema({
  username: String,
  message: String,
  timestamp: String,
  room: String,
});
const Message = mongoose.model('Message', messageSchema);

// Routes
app.get('/api/messages/sync/:room', async (req, res) => {
  const { room } = req.params;
  try {
    const messages = await Message.find({ room });
    res.status(200).json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.post('/api/messages/new', async (req, res) => {
  const { username, message, timestamp, room } = req.body;
  const newMessage = new Message({ username, message, timestamp, room });

  try {
    const savedMessage = await newMessage.save();
    res.status(201).json(savedMessage);
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({ error: 'Failed to save message' });
  }
});

app.delete('/api/messages/delete-all/:room', async (req, res) => {
  const { room } = req.params;
  try {
    await Message.deleteMany({ room });
    res.status(200).json({ message: 'Chat cleared successfully' });
  } catch (error) {
    console.error('Error clearing chat:', error);
    res.status(500).json({ error: 'Failed to clear chat' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
