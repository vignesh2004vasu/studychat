const express = require('express');
const mongoose = require('mongoose');
const Pusher = require('pusher');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

const corsOptions = {
  origin: 'https://frontendchat-amber.vercel.app', // Replace with your frontend URL
  methods: ['GET', 'POST', 'DELETE'], // Allow specific HTTP methods
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
};

app.use(cors(corsOptions));


app.use(express.json());

// MongoDB setup
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false, // Optional: To avoid deprecated warnings
});
const db = mongoose.connection;

db.on('error', (error) => {
  console.error('MongoDB connection error:', error);
});
db.once('open', () => {
  console.log('Connected to MongoDB');
  const msgCollection = db.collection('messages');
  const changeStream = msgCollection.watch();

  changeStream.on('change', (change) => {
    if (change.operationType === 'insert') {
      const messageDetails = change.fullDocument;
      pusher.trigger('messages', 'inserted', {
        username: messageDetails.username,
        message: messageDetails.message,
        timestamp: messageDetails.timestamp,
      }, (err, req, res) => {
        if (err) {
          console.error('Error triggering Pusher:', err);
        }
      });
    }
  });
});

// Pusher setup
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

// MongoDB schema and model
const messageSchema = new mongoose.Schema({
  username: String,
  message: String,
  timestamp: String,
});

const Message = mongoose.model('Message', messageSchema);

// Routes
app.get('/api/messages/sync', async (req, res) => {
  try {
    const messages = await Message.find();
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve messages.' });
  }
});

app.post('/api/messages/new', async (req, res) => {
  try {
    const dbMessage = req.body;
    const message = await Message.create(dbMessage);
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create message.' });
  }
});

// Delete all messages
app.delete('/api/messages/delete-all', async (req, res) => {
  try {
    await Message.deleteMany({});
    res.status(200).json({ message: 'All messages deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete messages.' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
