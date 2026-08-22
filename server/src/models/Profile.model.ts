import mongoose, { Schema, Document } from 'mongoose';

export interface IProfile extends Document {
  user: mongoose.Types.ObjectId;
  bio?: string;
  skills: string[];
  hourlyRate?: number;
  experience: number; // in years
  location?: string;
  portfolio: Array<{
    title: string;
    url: string;
    publicId: string;
    description?: string;
  }>;
  rating: number;
  totalReviews: number;
  completedGigs: number;
}

const ProfileSchema = new Schema<IProfile>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  bio: { type: String, maxlength: 500 },
  skills: [{ type: String, trim: true }],
  hourlyRate: { type: Number, min: 0 },
  experience: { type: Number, default: 0 },
  location: { type: String },
  portfolio: [{
    title: String,
    url: String,
    publicId: String,
    description: String,
  }],
  rating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  completedGigs: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model<IProfile>('Profile', ProfileSchema);  