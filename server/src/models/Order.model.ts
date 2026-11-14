import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderDeliverable {
  milestoneIndex?: number;
  version?: number;
  status?: 'pending' | 'revision_requested' | 'approved';
  reviewNotes?: string;
  message: string;
  githubUrl?: string;
  liveUrl?: string;
  attachments: string[];
  submittedAt: Date;
  submittedBy: mongoose.Types.ObjectId;
}

export interface IRevisionRequest {
  milestoneIndex?: number;
  deliveryVersion?: number;
  message: string;
  requestedBy: mongoose.Types.ObjectId;
  requestedAt: Date;
}

export interface IOrder extends Document {
  gig: mongoose.Types.ObjectId;
  client: mongoose.Types.ObjectId;
  freelancer: mongoose.Types.ObjectId;
  proposal: mongoose.Types.ObjectId;
  conversation?: mongoose.Types.ObjectId;
  totalAmount: number;
  // New workflow statuses + legacy statuses for backward compatibility
  status: 'active' | 'delivered' | 'revision_requested' | 'completed' | 'cancelled' | 'in_review' | 'disputed';
  escrowStatus: 'pending' | 'held' | 'released';
  milestones: Array<{
    title: string;
    description?: string;
    amount: number;
    dueDate?: Date;
    status: 'pending' | 'in_progress' | 'submitted' | 'approved' | 'rejected';
    paidAt?: Date;
  }>;
  deliverables: IOrderDeliverable[];
  revisionRequests: IRevisionRequest[];
  completedAt?: Date;
  paymentReleasedAt?: Date;
  platformCommission?: number;
  freelancerEarnings?: number;
  paymentMethod?: 'razorpay' | 'demo';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
  payment?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const OrderDeliverableSchema = new Schema<IOrderDeliverable>({
  milestoneIndex: { type: Number },
  version: { type: Number, default: 1 },
  status: { 
    type: String, 
    enum: ['pending', 'revision_requested', 'approved'], 
    default: 'pending' 
  },
  reviewNotes: { type: String, maxlength: 5000 },
  message: { type: String, required: true, maxlength: 5000 },
  githubUrl: { type: String },
  liveUrl: { type: String },
  attachments: [{ type: String }],
  submittedAt: { type: Date, default: Date.now },
  submittedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { _id: true });

const RevisionRequestSchema = new Schema<IRevisionRequest>({
  milestoneIndex: { type: Number },
  deliveryVersion: { type: Number },
  message: { type: String, required: true, maxlength: 5000 },
  requestedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  requestedAt: { type: Date, default: Date.now },
}, { _id: true });

const OrderSchema = new Schema<IOrder>({
  gig: { type: Schema.Types.ObjectId, ref: 'Gig', required: true },
  client: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  freelancer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  proposal: { type: Schema.Types.ObjectId, ref: 'Proposal', required: true },
  conversation: { type: Schema.Types.ObjectId, ref: 'Conversation' },
  totalAmount: { type: Number, required: true },
  status: { 
    type: String, 
    // Includes legacy statuses (in_review, disputed) for backward compatibility with existing DB records
    enum: ['active', 'delivered', 'revision_requested', 'completed', 'cancelled', 'in_review', 'disputed'], 
    default: 'active' 
  },
  escrowStatus: {
    type: String,
    enum: ['pending', 'held', 'released'],
    default: 'held',
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
  deliverables: [OrderDeliverableSchema],
  revisionRequests: [RevisionRequestSchema],
  completedAt: { type: Date },
  paymentReleasedAt: { type: Date },
  platformCommission: { type: Number, default: 0 },
  freelancerEarnings: { type: Number, default: 0 },
  paymentMethod: { type: String, enum: ['razorpay', 'demo'], default: 'demo' },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'paid' },
  payment: { type: Schema.Types.ObjectId, ref: 'Payment' },
}, { timestamps: true });

OrderSchema.index({ client: 1, status: 1 });
OrderSchema.index({ freelancer: 1, status: 1 });
OrderSchema.index({ client: 1, createdAt: -1 });
OrderSchema.index({ freelancer: 1, createdAt: -1 });
OrderSchema.index({ client: 1, freelancer: 1, createdAt: -1 });
OrderSchema.index({ client: 1, freelancer: 1 });
OrderSchema.index({ gig: 1 });
OrderSchema.index({ createdAt: -1 });

export default mongoose.model<IOrder>('Order', OrderSchema);