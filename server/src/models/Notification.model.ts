import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  recipientId: mongoose.Types.ObjectId;
  type: string;
  title: string;
  message: string;
  read: boolean;
  conversationId?: mongoose.Types.ObjectId;
  senderId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  recipientId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: [
      'message',
      'order',
      'proposal',
      'system',
      'deliverable_submitted',
      'revision_requested',
      'payment_released',
      'delivery_approved',
      'milestone_completed',
      'milestone_approved',
      'order_completed',
      'escrow_released',
    ],
    default: 'message',
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  read: {
    type: Boolean,
    default: false,
    index: true,
  },
  conversationId: {
    type: Schema.Types.ObjectId,
    ref: 'Conversation',
  },
  senderId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
}, { timestamps: true });

NotificationSchema.index({ recipientId: 1, read: 1, createdAt: -1 });

export default mongoose.model<INotification>('Notification', NotificationSchema);
