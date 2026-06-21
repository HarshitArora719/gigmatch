import mongoose, { Schema, Document } from 'mongoose';

export interface IGig extends Document {
  client: mongoose.Types.ObjectId;
  title: string;
  description: string;
  category: string;
  tags: string[];
  budget: number;
  deadline?: Date;
  images?: string[];
  status: 'open' | 'in-progress' | 'completed' | 'cancelled';
  createdAt: Date;
}

const GigSchema = new Schema<IGig>({
  client: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: { 
    type: String, 
    required: true,
    enum: ['graphic-design', 'video-editing', 'content-writing', 'coding', 'tutoring', 'others']
  },
  tags: [{ type: String, trim: true }],
  budget: { type: Number, required: true, min: 100 },
  deadline: { type: Date },
  images: [{ type: String }],
  status: { 
    type: String, 
    enum: ['open', 'in-progress', 'completed', 'cancelled'], 
    default: 'open' 
  },
}, { timestamps: true });

// Text index for search
GigSchema.index({ title: 'text', description: 'text', tags: 'text' });

export default mongoose.model<IGig>('Gig', GigSchema);