import mongoose, { Schema, Document } from 'mongoose';

export interface ISavedJobDocument extends Document {
  userId: mongoose.Types.ObjectId;
  jobId: string;
  createdAt: Date;
}

const SavedJobSchema = new Schema<ISavedJobDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    jobId: {
      type: String,
      required: true,
      index: true
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

SavedJobSchema.index({ userId: 1, jobId: 1 }, { unique: true });

export const SavedJobModel = mongoose.model<ISavedJobDocument>('SavedJob', SavedJobSchema);
