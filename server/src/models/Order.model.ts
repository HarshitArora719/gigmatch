import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
  gig: mongoose.Types.ObjectId;
  client: mongoose.Types.ObjectId;
  freelancer: mongoose.Types.ObjectId;
  proposal: mongoose.Types.ObjectId;
  totalAmount: number;
  status: 'active' | 'completed' | 'cancelled' | 'disputed';
  milestones: Array<{
    title: string;
    amount: number;
    dueDate?: Date;
    status: 'pending' | 'paid' | 'approved' | 'rejected';
    paidAt?: Date;
  }>;
  completedAt?: Date;
}

const OrderSchema = new Schema<IOrder>({
  gig: { type: Schema.Types.ObjectId, ref: 'Gig', required: true },
  client: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  freelancer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  proposal: { type: Schema.Types.ObjectId, ref: 'Proposal', required: true },
  totalAmount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['active', 'completed', 'cancelled', 'disputed'], 
    default: 'active' 
  },
  milestones: [{
    title: { type: String, required: true },
    amount: { type: Number, required: true },
    dueDate: { type: Date },
    status: { 
      type: String, 
      enum: ['pending', 'paid', 'approved', 'rejected'], 
      default: 'pending' 
    },
    paidAt: { type: Date },
  }],
  completedAt: { type: Date },
}, { timestamps: true });

export default mongoose.model<IOrder>('Order', OrderSchema);