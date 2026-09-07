import mongoose, { Schema, Document } from 'mongoose';

export interface IDeliverable extends Document {
  order: mongoose.Types.ObjectId;
  milestoneIndex: number;
  uploadedBy: mongoose.Types.ObjectId;
  fileName: string;
  fileUrl: string;
  filePublicId: string;
  fileSize: number;
  fileType: string;
  notes?: string;
  version: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  rejectionNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DeliverableSchema = new Schema<IDeliverable>({
  order: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
  milestoneIndex: { type: Number, required: true },
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  fileName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  filePublicId: { type: String, required: true },
  fileSize: { type: Number, required: true },
  fileType: { type: String, required: true },
  notes: { type: String, maxlength: 1000 },
  version: { type: String, default: 'v1.0' },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
  rejectionNotes: { type: String, maxlength: 1000 },
}, { timestamps: true });

DeliverableSchema.index({ order: 1, milestoneIndex: 1 });

export default mongoose.model<IDeliverable>('Deliverable', DeliverableSchema);
