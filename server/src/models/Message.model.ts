import mongoose, { Schema, Document } from 'mongoose';

export interface IMessageAttachment {
  url: string;
  fileName: string;
  fileSize: number;
  fileType: string;
}

export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  senderRole: 'client' | 'freelancer';
  receiverRole: 'client' | 'freelancer';
  content: string;
  messageType: 'text' | 'image' | 'file' | 'system';
  attachments: IMessageAttachment[];
  read: boolean;
  delivered: boolean;
  order?: mongoose.Types.ObjectId;
  gigId?: mongoose.Types.ObjectId;
  // Aliases/compatibility
  sender?: mongoose.Types.ObjectId;
  receiver?: mongoose.Types.ObjectId;
  isRead?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  conversationId: {
    type: Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true,
  },
  senderId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  receiverId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  senderRole: {
    type: String,
    enum: ['client', 'freelancer'],
    required: true,
  },
  receiverRole: {
    type: String,
    enum: ['client', 'freelancer'],
    required: true,
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000,
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'system'],
    default: 'text',
  },
  attachments: [{
    url: { type: String, required: true },
    fileName: { type: String, required: true },
    fileSize: { type: Number, default: 0 },
    fileType: { type: String, default: '' },
  }],
  read: {
    type: Boolean,
    default: false,
  },
  delivered: {
    type: Boolean,
    default: true,
  },
  // Backward compatibility fields for legacy order chats
  order: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
  },
  gigId: {
    type: Schema.Types.ObjectId,
    ref: 'Gig',
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  receiver: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  isRead: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

// Pre-save hook to keep compatibility fields synced
MessageSchema.pre('save', function () {
  if (!this.sender && this.senderId) this.sender = this.senderId;
  if (!this.receiver && this.receiverId) this.receiver = this.receiverId;
  this.isRead = this.read;
});

MessageSchema.index({ conversationId: 1, createdAt: 1 });
MessageSchema.index({ conversationId: 1, receiverId: 1, read: 1 });
MessageSchema.index({ receiverId: 1, read: 1 });
MessageSchema.index({ order: 1, createdAt: 1 });

export default mongoose.model<IMessage>('Message', MessageSchema);