import mongoose from 'mongoose';
import Message from '../../../models/Message';

const handler = async (req, res) => {
  if (req.method === 'GET') {
    try {
      const messages = await Message.find().limit(10).sort({ timestamp: -1 });
      res.status(200).json(messages);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve messages' });
    }
  }
};

export default handler;
