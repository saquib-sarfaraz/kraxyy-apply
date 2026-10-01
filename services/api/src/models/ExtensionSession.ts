import mongoose, { Schema, Document } from 'mongoose';

export interface IExtensionSessionDocument extends Document {
  userId: mongoose.Types.ObjectId;
  sessionToken: string;
  pairCode?: string;
  pairCodeExpires?: Date;
  expiresAt?: Date;
  browser: string;
  extensionVersion: string;
  lastActive: Date;
  ipAddress?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ExtensionSessionSchema = new Schema<IExtensionSessionDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    sessionToken: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    pairCode: {
      type: String,
      index: true
    },
    pairCodeExpires: {
      type: Date
    },
    expiresAt: {
      type: Date,
      index: true
    },
    browser: {
      type: String,
      default: 'Chrome'
    },
    extensionVersion: {
      type: String,
      default: '1.0.0'
    },
    lastActive: {
      type: Date,
      default: Date.now
    },
    ipAddress: {
      type: String
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

export const ExtensionSessionModel = mongoose.model<IExtensionSessionDocument>(
  'ExtensionSession',
  ExtensionSessionSchema
);
