import mongoose, { Schema, Document } from 'mongoose';
import { UserRole } from '@kraxyy/types';

export interface IUserDocument extends Document {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isVerified: boolean;
  avatarUrl?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  verificationToken?: string;
  lastLoginAt?: Date;
  status: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    role: {
      type: String,
      enum: ['USER', 'ADMIN', 'SUPER_ADMIN'],
      default: 'USER',
      index: true
    },
    isVerified: {
      type: Boolean,
      default: true
    },
    avatarUrl: {
      type: String
    },
    resetPasswordToken: {
      type: String
    },
    resetPasswordExpires: {
      type: Date
    },
    verificationToken: {
      type: String
    },
    lastLoginAt: {
      type: Date
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'SUSPENDED', 'DEACTIVATED'],
      default: 'ACTIVE',
      index: true
    }
  },
  {
    timestamps: true
  }
);

export const UserModel = mongoose.model<IUserDocument>('User', UserSchema);
