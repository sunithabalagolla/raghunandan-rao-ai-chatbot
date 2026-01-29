import { Document } from 'mongoose';

export interface IOTPRecord extends Document {
  email: string;
  otp: string;
  expiresAt: Date;
  attempts: number;
  createdAt: Date;
  lastAttemptAt?: Date;
}
