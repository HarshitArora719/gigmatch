import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  order?: mongoose.Types.ObjectId;
  proposal?: mongoose.Types.ObjectId;
  gig?: mongoose.Types.ObjectId;
  client: mongoose.Types.ObjectId;
  freelancer: mongoose.Types.ObjectId;
  amount: number; // in INR
  currency: string;
  platformCommission: number; // 25% platform fee
  freelancerEarnings: number; // 75% net amount for freelancer
  paymentGateway: 'razorpay' | 'demo';
  status: 'created' | 'captured' | 'failed' | 'refunded';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  failureReason?: string;
  type: 'escrow_deposit' | 'escrow_release' | 'milestone_payment';
  notes?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    order: { type: Schema.Types.ObjectId, ref: 'Order' },
    proposal: { type: Schema.Types.ObjectId, ref: 'Proposal' },
    gig: { type: Schema.Types.ObjectId, ref: 'Gig' },
    client: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    freelancer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    platformCommission: { type: Number, required: true },
    freelancerEarnings: { type: Number, required: true },
    paymentGateway: { type: String, enum: ['razorpay', 'demo'], required: true },
    status: {
      type: String,
      enum: ['created', 'captured', 'failed', 'refunded'],
      default: 'created',
      index: true,
    },
    razorpayOrderId: { type: String, index: true },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    failureReason: { type: String },
    type: {
      type: String,
      enum: ['escrow_deposit', 'escrow_release', 'milestone_payment'],
      default: 'escrow_deposit',
    },
    notes: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

PaymentSchema.index({ client: 1, createdAt: -1 });
PaymentSchema.index({ freelancer: 1, createdAt: -1 });
PaymentSchema.index({ order: 1 });
PaymentSchema.index({ proposal: 1 });

export default mongoose.model<IPayment>('Payment', PaymentSchema);
