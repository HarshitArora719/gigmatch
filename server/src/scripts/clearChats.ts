import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.join(__dirname, '../../.env') });

import Message from '../models/Message.model';
import Conversation from '../models/Conversation.model';
import Notification from '../models/Notification.model';

async function clearChatHistory() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('MONGO_URI is not set');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Delete all messages
    const messageRes = await Message.deleteMany({});
    console.log(`Deleted ${messageRes.deletedCount} messages.`);

    // Delete all conversations
    const convRes = await Conversation.deleteMany({});
    console.log(`Deleted ${convRes.deletedCount} conversations.`);

    // Delete chat-related notifications
    const notifRes = await Notification.deleteMany({
      $or: [
        { type: 'message' },
        { conversationId: { $exists: true, $ne: null } }
      ]
    });
    console.log(`Deleted ${notifRes.deletedCount} chat notifications.`);

    console.log('Successfully cleared all previous chat history!');
  } catch (error) {
    console.error('Error clearing chat history:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

clearChatHistory();
