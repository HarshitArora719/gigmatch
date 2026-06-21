import mongoose, { Schema, Document } from 'mongoose';

export interface IProposal extends Document {
  gig: mongoose.Types.ObjectId;
  freelancer: mongoose.Types.ObjectId;
  coverLetter: string;
  proposedPrice: number;
  estimatedDays: number;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  createdAt: Date;
}

const ProposalSchema = new Schema<IProposal>({
  gig: { type: Schema.Types.ObjectId, ref: 'Gig', required: true },
  freelancer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  coverLetter: { type: String, required: true, maxlength: 1000 },
  proposedPrice: { type: Number, required: true, min: 100 },
  estimatedDays: { type: Number, required: true, min: 1 },
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'rejected', 'withdrawn'], 
    default: 'pending' 
  },
}, { timestamps: true });

// Prevent duplicate proposals from same freelancer on same gig
ProposalSchema.index({ gig: 1, freelancer: 1 }, { unique: true });

export default mongoose.model<IProposal>('Proposal', ProposalSchema);