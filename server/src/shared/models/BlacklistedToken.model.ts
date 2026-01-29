import mongoose, { Schema } from 'mongoose';
import { IBlacklistedToken } from '../types/token.types';

const BlacklistedTokenSchema = new Schema<IBlacklistedToken>(
  {
    token: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
    },
    blacklistedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

// TTL index - automatically delete documents after they expire
BlacklistedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Index on token for fast lookups when checking if token is blacklisted
BlacklistedTokenSchema.index({ token: 1 });

const BlacklistedTokenModel = mongoose.model<IBlacklistedToken>(
  'BlacklistedToken',
  BlacklistedTokenSchema
);

export default BlacklistedTokenModel;
