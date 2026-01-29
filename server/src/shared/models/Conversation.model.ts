import mongoose, { Schema, Document } from 'mongoose';

/**
 * Message Schema
 * Represents a single message in a conversation
 */
export interface IMessage {
  _id: string;
  role: 'user' | 'ai' | 'agent';
  content: string;
  timestamp: Date;
  agentId?: mongoose.Types.ObjectId;
}

const MessageSchema = new Schema<IMessage>({
  role: {
    type: String,
    enum: ['user', 'ai', 'agent'],
    required: [true, 'Message role is required'],
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true,
    maxlength: [5000, 'Message cannot exceed 5000 characters'],
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  agentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
});

/**
 * Conversation Schema
 * Represents a conversation between a user and the AI/agent
 */
export interface IConversation extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  messages: IMessage[];
  status: 'active' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    title: {
      type: String,
      default: 'New Conversation',
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    messages: {
      type: [MessageSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Indexes for fast lookups
ConversationSchema.index({ userId: 1, createdAt: -1 });
ConversationSchema.index({ userId: 1, status: 1 });
ConversationSchema.index({ 'messages.timestamp': -1 });

// Full-text search index for messages
ConversationSchema.index(
  { 'messages.content': 'text', title: 'text' },
  {
    weights: {
      title: 10,
      'messages.content': 5,
    },
    name: 'conversation_search_index',
  }
);

const Conversation = mongoose.model<IConversation>('Conversation', ConversationSchema);

export default Conversation;
