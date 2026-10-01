import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLogDocument extends Document {
  userId?: mongoose.Types.ObjectId;
  userEmail?: string;
  action: string;
  category: 'AUTH' | 'SECURITY' | 'PROFILE' | 'ADMIN' | 'EXTENSION';
  ipAddress: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLogDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    userEmail: {
      type: String,
      index: true
    },
    action: {
      type: String,
      required: true,
      index: true
    },
    category: {
      type: String,
      enum: ['AUTH', 'SECURITY', 'PROFILE', 'ADMIN', 'EXTENSION'],
      required: true,
      index: true
    },
    ipAddress: {
      type: String,
      required: true
    },
    userAgent: {
      type: String
    },
    metadata: {
      type: Schema.Types.Mixed
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

// TTL index to automatically purge logs older than 90 days
AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const AuditLogModel = mongoose.model<IAuditLogDocument>('AuditLog', AuditLogSchema);
