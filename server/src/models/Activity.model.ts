import mongoose, { Schema, Document } from 'mongoose';

export type ActivityType =
  | 'order_created'
  | 'milestone_started'
  | 'milestone_submitted'
  | 'milestone_approved'
  | 'milestone_rejected'
  | 'deliverable_uploaded'
  | 'deliverable_approved'
  | 'deliverable_rejected'
  | 'message_sent'
  | 'order_completed'
  | 'revision_requested';

export interface IActivity extends Document {
  order: mongoose.Types.ObjectId;
  user?: mongoose.Types.ObjectId;
  type: ActivityType;
  title: string;
  description: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const ActivitySchema = new Schema<IActivity>({
  order: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  type: {
    type: String,
    enum: [
      'order_created',
      'milestone_started',
      'milestone_submitted',
      'milestone_approved',
      'milestone_rejected',
      'deliverable_uploaded',
      'deliverable_approved',
      'deliverable_rejected',
      'message_sent',
      'order_completed',
      'revision_requested',
    ],
    required: true,
  },
  title: { type: String, required: true },
  description: { type: String, required: true },
  metadata: { type: Schema.Types.Mixed },
}, { timestamps: true });

ActivitySchema.index({ order: 1, createdAt: -1 });

export default mongoose.model<IActivity>('Activity', ActivitySchema);
