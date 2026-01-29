import mongoose, { Schema, Document } from 'mongoose';
import { IMessage } from './Conversation.model';

/**
 * HandoffTicket Schema
 * Represents a request for human agent assistance
 */
export interface IHandoffTicket extends Document {
  userId: mongoose.Types.ObjectId;
  conversationId: mongoose.Types.ObjectId;
  status: 'waiting' | 'assigned' | 'resolved' | 'cancelled';
  priority: number;
  reason: string;
  customerLanguage?: 'en' | 'hi' | 'te';
  conversationContext: IMessage[];
  createdAt: Date;
  assignedAgentId?: mongoose.Types.ObjectId;
  assignedAt?: Date;
  resolvedAt?: Date;
  resolutionNotes?: string;
  userFeedback?: {
    rating: number;
    comment: string;
  };
  priorityLevel: 'Low' | 'Medium' | 'High' | 'Emergency';
  slaData: {
    responseDeadline: Date;
    resolutionDeadline: Date;
    escalationLevel: number;
    isOverdue: boolean;
  };
  assignmentHistory: Array<{
    agentId: mongoose.Types.ObjectId;
    assignedAt: Date;
    unassignedAt?: Date;
    reason?: string;
  }>;
  autoAssignmentData: {
    departmentScore: number;
    languageScore: number;
    workloadScore: number;
    totalScore: number;
    assignmentMethod: 'manual' | 'auto' | 'emergency';
  };
}

const HandoffTicketSchema = new Schema<IHandoffTicket>(
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
      required: [true, 'Conversation ID is required'],
    },
    status: {
      type: String,
      enum: ['waiting', 'assigned', 'resolved', 'cancelled'],
      default: 'waiting',
      index: true,
    },
    priority: {
      type: Number,
      default: 1,
      min: [1, 'Priority must be at least 1'],
      max: [5, 'Priority cannot exceed 5'],
    },
    reason: {
      type: String,
      required: [true, 'Reason for handoff is required'],
      trim: true,
      maxlength: [500, 'Reason cannot exceed 500 characters'],
    },
    customerLanguage: {
      type: String,
      enum: ['en', 'hi', 'te'],
      default: 'en',
    },
    conversationContext: {
      type: [{
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
      }],
      default: [],
    },
    assignedAgentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    assignedAt: {
      type: Date,
    },
    resolvedAt: {
      type: Date,
    },
    resolutionNotes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Resolution notes cannot exceed 1000 characters'],
    },
    userFeedback: {
      rating: {
        type: Number,
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating cannot exceed 5'],
      },
      comment: {
        type: String,
        trim: true,
        maxlength: [500, 'Feedback comment cannot exceed 500 characters'],
      },
    },
    priorityLevel: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Emergency'],
      default: 'Medium',
    },
    slaData: {
      responseDeadline: {
        type: Date,
        required: true,
      },
      resolutionDeadline: {
        type: Date,
        required: true,
      },
      escalationLevel: {
        type: Number,
        default: 0,
      },
      isOverdue: {
        type: Boolean,
        default: false,
      },
    },
    assignmentHistory: [{
      agentId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      assignedAt: {
        type: Date,
        required: true,
      },
      unassignedAt: {
        type: Date,
      },
      reason: {
        type: String,
        trim: true,
      },
    }],
    autoAssignmentData: {
      departmentScore: {
        type: Number,
        default: 0,
      },
      languageScore: {
        type: Number,
        default: 0,
      },
      workloadScore: {
        type: Number,
        default: 0,
      },
      totalScore: {
        type: Number,
        default: 0,
      },
      assignmentMethod: {
        type: String,
        enum: ['manual', 'auto', 'emergency'],
        default: 'manual',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
HandoffTicketSchema.index({ status: 1, priority: -1, createdAt: 1 });
HandoffTicketSchema.index({ userId: 1, status: 1 });
HandoffTicketSchema.index({ assignedAgentId: 1, status: 1 });

// Agent dashboard specific indexes
HandoffTicketSchema.index({ priorityLevel: 1, status: 1 });
HandoffTicketSchema.index({ status: 1, priorityLevel: 1, createdAt: 1 });
HandoffTicketSchema.index({ 'slaData.isOverdue': 1, status: 1 });
HandoffTicketSchema.index({ 'autoAssignmentData.assignmentMethod': 1 });

const HandoffTicket = mongoose.model<IHandoffTicket>('HandoffTicket', HandoffTicketSchema);

export default HandoffTicket;
