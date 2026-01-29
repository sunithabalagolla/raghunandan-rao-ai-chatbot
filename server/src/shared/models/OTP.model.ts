import mongoose, { Schema } from 'mongoose';
import { IOTPRecord } from '../types/otp.types';

const OTPSchema = new Schema<IOTPRecord>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    otp: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    attempts: {
      type: Number,
      default: 0,
      required: true,
    },
    lastAttemptAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index - automatically delete documents after they expire (5 minutes)
OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Index on email for fast lookups
OTPSchema.index({ email: 1 });

const OTPModel = mongoose.model<IOTPRecord>('OTP', OTPSchema);

export default OTPModel;
