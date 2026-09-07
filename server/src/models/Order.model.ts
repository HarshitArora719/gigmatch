import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
  gig: mongoose.Types.ObjectId;
  client: mongoose.Types.ObjectId;
  freelancer: mongoose.Types.ObjectId;
  proposal: mongoose.Types.ObjectId;
  totalAmount: number;
  status: 'active' | 'in_review' | 'completed' | 'cancelled' | 'disputed';
  milestones: Array<{
    title: string;
    description?: string;
    amount: number;
    dueDate?: Date;
    status: 'pending' | 'in_progress' | 'submitted' | 'approved' | 'rejected';
    paidAt?: Date;
  }>;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>({
  gig: { type: Schema.Types.ObjectId, ref: 'Gig', required: true },
  client: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  freelancer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  proposal: { type: Schema.Types.ObjectId, ref: 'Proposal', required: true },
  totalAmount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['active', 'in_review', 'completed', 'cancelled', 'disputed'], 
    default: 'active' 
  },
  milestones: [{
    title: { type: String, required: true },
    description: { type: String },
    amount: { type: Number, required: true },
    dueDate: { type: Date },
    status: { 
      type: String, 
      enum: ['pending', 'in_progress', 'submitted', 'approved', 'rejected'], 
      default: 'pending' 
    },
    paidAt: { type: Date },
  }],
  completedAt: { type: Date },
}, { timestamps: true });

OrderSchema.index({ client: 1, status: 1 });
OrderSchema.index({ freelancer: 1, status: 1 });
OrderSchema.index({ gig: 1 });
OrderSchema.index({ createdAt: -1 });

export default mongoose.model<IOrder>('Order', OrderSchema);