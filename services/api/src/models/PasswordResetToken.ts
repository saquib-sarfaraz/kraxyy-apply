import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPasswordResetTokenDocument extends Document {
  userId: Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  used: boolean;
  usedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PasswordResetTokenSchema = new Schema<IPasswordResetTokenDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 } // TTL index in MongoDB: cleans up document once expiresAt is reached
    },
    used: {
      type: Boolean,
      default: false,
      index: true
    },
    usedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

export const PasswordResetTokenModel = mongoose.model<IPasswordResetTokenDocument>(
  'PasswordResetToken',
  PasswordResetTokenSchema
);
