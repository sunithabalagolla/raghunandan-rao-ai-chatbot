import mongoose, { Schema, Document } from 'mongoose';

/**
 * AgentSession Schema
 * Represents an agent's work session for performance tracking
 */
export interface IAgentSession extends Document {
  agentId: mongoose.Types.ObjectId;
  sessionStart: Date;
  sessionEnd?: Date;
  status: 'active' | 'break' | 'ended';
  totalChatsHandled: number;
  totalResponseTime: number;
  averageResponseTime: number;
  customerSatisfactionRatings: number[];
  averageRating: number;
  ticketsResolved: number;
  ticketsTransferred: number;
  breakDuration: number;
  activeDuration: number;
  peakConcurrentChats: number;
  slaViolations: number;
  emergencyTicketsHandled: number;
  templatesUsed: number;
  sessionNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AgentSessionSchema = new Schema<IAgentSession>(
  {
    agentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Agent ID is required'],
      index: true,
    },
    sessionStart: {
      type: Date,
      required: [true, 'Session start time is required'],
      index: true,
    },
    sessionEnd: {
      type: Date,
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'break', 'ended'],
      default: 'active',
      index: true,
    },
    totalChatsHandled: {
      type: Number,
      default: 0,
      min: [0, 'Total chats cannot be negative'],
    },
    totalResponseTime: {
      type: Number,
      default: 0,
      min: [0, 'Total response time cannot be negative'],
    },
    averageResponseTime: {
      type: Number,
      default: 0,
      min: [0, 'Average response time cannot be negative'],
    },
    customerSatisfactionRatings: {
      type: [Number],
      default: [],
      validate: {
        validator: function(ratings: number[]) {
          return ratings.every(rating => rating >= 1 && rating <= 5);
        },
        message: 'All ratings must be between 1 and 5'
      }
    },
    averageRating: {
      type: Number,
      default: 0,
      min: [0, 'Average rating cannot be negative'],
      max: [5, 'Average rating cannot exceed 5'],
    },
    ticketsResolved: {
      type: Number,
      default: 0,
      min: [0, 'Tickets resolved cannot be negative'],
    },
    ticketsTransferred: {
      type: Number,
      default: 0,
      min: [0, 'Tickets transferred cannot be negative'],
    },
    breakDuration: {
      type: Number,
      default: 0,
      min: [0, 'Break duration cannot be negative'],
    },
    activeDuration: {
      type: Number,
      default: 0,
      min: [0, 'Active duration cannot be negative'],
    },
    peakConcurrentChats: {
      type: Number,
      default: 0,
      min: [0, 'Peak concurrent chats cannot be negative'],
    },
    slaViolations: {
      type: Number,
      default: 0,
      min: [0, 'SLA violations cannot be negative'],
    },
    emergencyTicketsHandled: {
      type: Number,
      default: 0,
      min: [0, 'Emergency tickets cannot be negative'],
    },
    templatesUsed: {
      type: Number,
      default: 0,
      min: [0, 'Templates used cannot be negative'],
    },
    sessionNotes: {
      type: String,
      trim: true,
      maxlength: [500, 'Session notes cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
AgentSessionSchema.index({ agentId: 1, sessionStart: -1 });
AgentSessionSchema.index({ agentId: 1, status: 1 });
AgentSessionSchema.index({ sessionStart: 1, sessionEnd: 1 });
AgentSessionSchema.index({ status: 1, sessionStart: -1 });
AgentSessionSchema.index({ agentId: 1, createdAt: -1 });

// Compound indexes for analytics
AgentSessionSchema.index({ 
  agentId: 1, 
  sessionStart: -1, 
  status: 1 
});

const AgentSession = mongoose.model<IAgentSession>('AgentSession', AgentSessionSchema);

export default AgentSession;