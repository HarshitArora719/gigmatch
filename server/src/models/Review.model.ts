import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
  order: mongoose.Types.ObjectId;
  from: mongoose.Types.ObjectId;      // who is giving review
  to: mongoose.Types.ObjectId;        // who is receiving review
  rating: number;                     // 1 to 5
  comment: string;
  role: 'client' | 'freelancer';      // reviewer role
}

const ReviewSchema = new Schema<IReview>({
  order: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
  from: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  to: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, maxlength: 500 },
  role: { type: String, enum: ['client', 'freelancer'], required: true },
}, { timestamps: true });

export default mongoose.model<IReview>('Review', ReviewSchema);