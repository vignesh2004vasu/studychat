import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  username: String,
  message: String,
  timestamp: String
});

module.exports = mongoose.models.Message || mongoose.model('Message', messageSchema);
