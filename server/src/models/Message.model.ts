import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  order: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  receiver: mongoose.Types.ObjectId;
  content: string;
  isRead: boolean;
}

const MessageSchema = new Schema<IMessage>({
  order: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, maxlength: 2000 },
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

MessageSchema.index({ order: 1, createdAt: 1 });

export default mongoose.model<IMessage>('Message', MessageSchema);