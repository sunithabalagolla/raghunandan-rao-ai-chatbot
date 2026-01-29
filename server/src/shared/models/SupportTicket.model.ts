import mongoose, { Schema, Document } from 'mongoose';
import { IMessage } from './Conversation.model';

/**
 * SupportTicket Schema
 * Represents an offline support ticket when no agents are available
 */
export interface ISupportTicket extends Document {
  userId: mongoose.Types.ObjectId;
  conversationId?: mongoose.Types.ObjectId;
  contactEmail: string;
  contactPhone?: string;
  issueDescription: string;
  conversationContext: IMessage[];
  status: 'open' | 'in-progress' | 'resolved';
  createdAt: Date;
  assignedAgentId?: mongoose.Types.ObjectId;
  followUpNotes?: string;
}

const SupportTicketSchema = new Schema<ISupportTicket>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
    },
    contactEmail: {
      type: String,
      required: [true, 'Contact email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    contactPhone: {
      type: String,
      trim: true,
    },
    issueDescription: {
      type: String,
      required: [true, 'Issue description is required'],
      trim: true,
      maxlength: [1000, 'Issue description cannot exceed 1000 characters'],
    },
    conversationContext: {
      type: [
        {
          role: {
            type: String,
            enum: ['user', 'ai', 'agent'],
            required: true,
          },
          content: {
            type: String,
            required: true,
          },
          timestamp: {
            type: Date,
            default: Date.now,
          },
          agentId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
          },
        },
      ],
      default: [],
    },
    status: {
      type: String,
      enum: ['open', 'in-progress', 'resolved'],
      default: 'open',
      index: true,
    },
    assignedAgentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    followUpNotes: {
      type: String,
      trim: true,
      maxlength: [2000, 'Follow-up notes cannot exceed 2000 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
SupportTicketSchema.index({ status: 1, createdAt: -1 });
SupportTicketSchema.index({ assignedAgentId: 1, status: 1 });
SupportTicketSchema.index({ contactEmail: 1 });

const SupportTicket = mongoose.model<ISupportTicket>('SupportTicket', SupportTicketSchema);

export default SupportTicket;
