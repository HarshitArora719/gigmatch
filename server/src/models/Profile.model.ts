import mongoose, { Schema, Document } from 'mongoose';

export interface IPortfolioItem {
  _id?: mongoose.Types.ObjectId;
  title: string;
  url?: string;
  publicId?: string;
  description?: string;
  projectLink?: string;
  githubLink?: string;
  duration?: string;
  roleInProject?: string;
  images?: string[];
  technologies?: string[];
  status?: string;
  freelancersHired?: number;
  createdAt?: Date;
}

export interface ICertification {
  name: string;
  issuer: string;
  issueDate?: string;
  credentialUrl?: string;
}

export interface IProfile extends Document {
  user: mongoose.Types.ObjectId;
  bio?: string;
  roleTitle?: string;
  company?: string;
  website?: string;
  teamSize?: string;
  industry?: string;
  location?: string;
  responseTime?: string;
  avatar?: string;
  avatarColor?: string;
  skills: string[];
  hourlyRate?: number;
  experience: number; // in years
  portfolio: IPortfolioItem[];
  // Freelancer-specific fields
  githubUrl?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  resumeUrl?: string;
  languages?: string[];
  availabilityStatus?: string;
  preferredWorkTypes?: string[];
  certifications?: ICertification[];
  verificationStatus?: {
    emailVerified: boolean;
    phoneVerified: boolean;
    linkedInConnected: boolean;
    githubConnected: boolean;
    identityVerified: boolean;
  };
  profileCompletionPercentage?: number;
  rating: number;
  totalReviews: number;
  completedGigs: number;
  profileCompletion: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProfileSchema = new Schema<IProfile>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  bio: { type: String, maxlength: 1000 },
  roleTitle: { type: String, trim: true },
  company: { type: String, trim: true },
  website: { type: String, trim: true },
  teamSize: { type: String, default: 'Solo Creator / Founder', trim: true },
  industry: { type: String, trim: true },
  location: { type: String, trim: true },
  responseTime: { type: String, default: '< 2 Hours' },
  avatar: { type: String },
  avatarColor: { type: String, default: '#22D3EE' },
  skills: [{ type: String, trim: true }],
  hourlyRate: { type: Number, min: 0 },
  experience: { type: Number, default: 0 },
  portfolio: [{
    title: { type: String, required: true },
    url: { type: String },
    publicId: { type: String },
    description: { type: String },
    projectLink: { type: String },
    githubLink: { type: String },
    duration: { type: String },
    roleInProject: { type: String },
    images: [{ type: String }],
    technologies: [{ type: String, trim: true }],
    status: { type: String, default: 'Completed' },
    freelancersHired: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
  }],
  // Freelancer-specific fields
  githubUrl: { type: String, trim: true },
  linkedinUrl: { type: String, trim: true },
  portfolioUrl: { type: String, trim: true },
  resumeUrl: { type: String, trim: true },
  languages: [{ type: String, trim: true }],
  availabilityStatus: { 
    type: String, 
    enum: ['Available Now', 'Part-Time', 'Full-Time Freelance', 'Unavailable'],
    default: 'Available Now'
  },
  preferredWorkTypes: [{ type: String, trim: true }],
  certifications: [{
    name: { type: String, required: true, trim: true },
    issuer: { type: String, required: true, trim: true },
    issueDate: { type: String, trim: true },
    credentialUrl: { type: String, trim: true },
  }],
  verificationStatus: {
    emailVerified: { type: Boolean, default: true },
    phoneVerified: { type: Boolean, default: false },
    linkedInConnected: { type: Boolean, default: false },
    githubConnected: { type: Boolean, default: false },
    identityVerified: { type: Boolean, default: false },
  },
  profileCompletionPercentage: { type: Number, default: 20 },
  rating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  completedGigs: { type: Number, default: 0 },
  profileCompletion: { type: Number, default: 20 },
}, { timestamps: true });

ProfileSchema.index({ availabilityStatus: 1 });
ProfileSchema.index({ rating: -1 });

export default mongoose.model<IProfile>('Profile', ProfileSchema);  