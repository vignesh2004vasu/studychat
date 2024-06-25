// pages/api/messages/index.js

import mongoose from 'mongoose';
import Message from '../../../models/Message'; // Ensure correct path to your Message model

const handler = async (req, res) => {
  if (req.method === 'POST') {
    const { username, message, timestamp } = req.body;

    try {
      const newMessage = await Message.create({ username, message, timestamp });
      res.status(201).json(newMessage);
    } catch (error) {
      res.status(500).json({ error: 'Failed to save message' });
    }
  } else if (req.method === 'DELETE') {
    try {
      await Message.deleteMany({});
      res.status(200).json({ message: 'Chat cleared successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to clear chat' });
    }
  }
};

export default handler;
