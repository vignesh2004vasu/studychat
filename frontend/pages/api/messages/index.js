import mongoose from 'mongoose';
import Message from '../../../models/Message';

const handler = async (req, res) => {
  if (req.method === 'POST') {
    const { username, message, timestamp } = req.body;

    try {
      const newMessage = await Message.create({ username, message, timestamp });
      res.status(201).json(newMessage);
    } catch (error) {
      res.status(500).json({ error: 'Failed to save message' });
    }
  }
};

export default handler;
