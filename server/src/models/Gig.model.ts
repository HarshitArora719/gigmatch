import mongoose, { Schema, Document } from 'mongoose';

export interface IGigAttachment {
  name: string;
  url: string;
  size?: number;
  type?: string;
}

export interface IGig extends Document {
  client: mongoose.Types.ObjectId;
  title: string;
  description: string;
  category: string;
  tags: string[];
  budget: number;
  deadline?: Date;
  images?: string[];
  attachments?: IGigAttachment[];
  experienceLevel?: string;
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
  attachments: [{
    name: { type: String },
    url: { type: String },
    size: { type: Number },
    type: { type: String }
  }],
  experienceLevel: { type: String, default: 'intermediate' },
  status: { 
    type: String, 
    enum: ['open', 'in-progress', 'completed', 'cancelled'], 
    default: 'open' 
  },
}, { timestamps: true });

// Text index for search
GigSchema.index({ title: 'text', description: 'text', tags: 'text' });
GigSchema.index({ status: 1, createdAt: -1 });
GigSchema.index({ status: 1, category: 1, createdAt: -1 });
GigSchema.index({ status: 1, budget: 1, createdAt: -1 });
GigSchema.index({ client: 1, createdAt: -1 });
GigSchema.index({ client: 1, status: 1, createdAt: -1 });
GigSchema.index({ createdAt: -1 });

export default mongoose.model<IGig>('Gig', GigSchema);