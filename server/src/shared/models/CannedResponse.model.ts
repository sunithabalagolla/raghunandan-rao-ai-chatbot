import mongoose, { Schema, Document } from 'mongoose';

/**
 * CannedResponse Schema
 * Represents pre-written message templates for agents
 */
export interface ICannedResponse extends Document {
  title: string;
  content: string;
  category: 'Greeting' | 'Legal' | 'RTI' | 'Emergency' | 'Closing' | 'General';
  language: 'en' | 'te' | 'hi';
  isShared: boolean;
  createdBy: mongoose.Types.ObjectId;
  usageCount: number;
  lastUsedAt?: Date;
  tags: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CannedResponseSchema = new Schema<ICannedResponse>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      trim: true,
      maxlength: [1000, 'Content cannot exceed 1000 characters'],
    },
    category: {
      type: String,
      enum: ['Greeting', 'Legal', 'RTI', 'Emergency', 'Closing', 'General'],
      required: [true, 'Category is required'],
      index: true,
    },
    language: {
      type: String,
      enum: ['en', 'te', 'hi'],
      default: 'en',
      index: true,
    },
    isShared: {
      type: Boolean,
      default: false,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator is required'],
      index: true,
    },
    usageCount: {
      type: Number,
      default: 0,
      min: [0, 'Usage count cannot be negative'],
    },
    lastUsedAt: {
      type: Date,
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: function(tags: string[]) {
          return tags.length <= 10;
        },
        message: 'Cannot have more than 10 tags'
      }
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
CannedResponseSchema.index({ title: 'text', content: 'text', tags: 'text' });
CannedResponseSchema.index({ category: 1, language: 1, isActive: 1 });
CannedResponseSchema.index({ createdBy: 1, isActive: 1 });
CannedResponseSchema.index({ isShared: 1, isActive: 1, category: 1 });
CannedResponseSchema.index({ usageCount: -1, isActive: 1 });

const CannedResponse = mongoose.model<ICannedResponse>('CannedResponse', CannedResponseSchema);

export default CannedResponse;