import mongoose, { Document, Schema } from 'mongoose';

export type ContactCategory =
  | 'Website'
  | 'Chrome Extension'
  | 'Application / Auto-fill'
  | 'Bug / Problem'
  | 'Partnership'
  | 'Other';

export type ContactStatus = 'NEW' | 'REPLIED' | 'CLOSED';

export interface IContactRequest extends Document {
  name: string;
  email: string;
  category: ContactCategory;
  message: string;
  source: string;
  attachmentUrl?: string;
  status: ContactStatus;
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ContactRequestSchema = new Schema<IContactRequest>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Website',
        'Chrome Extension',
        'Application / Auto-fill',
        'Bug / Problem',
        'Partnership',
        'Other'
      ]
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters']
    },
    source: {
      type: String,
      default: 'website',
      trim: true
    },
    attachmentUrl: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ['NEW', 'REPLIED', 'CLOSED'],
      default: 'NEW'
    },
    adminNotes: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

ContactRequestSchema.index({ createdAt: -1 });
ContactRequestSchema.index({ status: 1 });
ContactRequestSchema.index({ email: 1 });

export const ContactRequest = mongoose.model<IContactRequest>(
  'ContactRequest',
  ContactRequestSchema
);
