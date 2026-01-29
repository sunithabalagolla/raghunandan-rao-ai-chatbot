import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from '../types/user.types';

export interface IUserDocument extends Omit<IUser, '_id'>, Document { }

const UserSchema = new Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      minlength: [2, 'First name must be at least 2 characters'],
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      minlength: [2, 'Last name must be at least 2 characters'],
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    phoneNumber: {
      type: String,
      trim: true,
      sparse: true,
    },
    passwordHash: {
      type: String,
      select: false, // Don't include password in queries by default
    },
    authProvider: {
      type: String,
      enum: ['email', 'google', 'facebook'],
      required: [true, 'Auth provider is required'],
    },
    googleId: {
      type: String,
      sparse: true,
    },
    facebookId: {
      type: String,
      sparse: true,
    },
    lastLoginAt: {
      type: Date,
    },
    // Chatbot-specific fields
    preferredLanguage: {
      type: String,
      enum: ['en', 'te', 'hi'],
      default: 'en',
    },
    role: {
      type: String,
      enum: ['user', 'agent', 'supervisor', 'admin'],
      default: 'user',
    },
    agentStatus: {
      type: String,
      enum: ['available', 'busy', 'offline'],
      default: 'offline',
    },
    agentProfile: {
      department: {
        type: String,
        enum: ['Legal', 'RTI', 'Emergency'],
      },
      skills: [{
        type: String,
      }],
      languages: [{
        type: String,
        enum: ['en', 'hi', 'te', 'all'],
        default: ['en']
      }],
      maxConcurrentChats: {
        type: Number,
        default: 5,
      },
      activeChats: {
        type: Number,
        default: 0,
      },
      status: {
        type: String,
        enum: ['available', 'busy', 'away', 'offline'],
        default: 'offline',
      },
      performanceMetrics: {
        totalChatsHandled: {
          type: Number,
          default: 0,
        },
        avgResponseTime: {
          type: Number,
          default: 0,
        },
        avgRating: {
          type: Number,
          default: 0,
        },
      },
      preferences: {
        browserNotifications: {
          type: Boolean,
          default: true,
        },
        soundAlerts: {
          type: Boolean,
          default: true,
        },
      },
    },

  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Indexes for fast lookups
UserSchema.index({ email: 1 });
UserSchema.index({ email: 1, authProvider: 1 });
UserSchema.index({ googleId: 1 }, { sparse: true });
UserSchema.index({ facebookId: 1 }, { sparse: true });
UserSchema.index({role:1});
UserSchema.index({role:1,agentStatus:1});
UserSchema.index({ 'agentProfile.department': 1 });
UserSchema.index({ role: 1, 'agentProfile.department': 1, agentStatus: 1 });



const User = mongoose.model<IUserDocument>('User', UserSchema);

export default User;
