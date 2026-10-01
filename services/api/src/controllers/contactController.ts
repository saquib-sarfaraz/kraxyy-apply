import { Request, Response, NextFunction } from 'express';
import { ContactRequest, ContactCategory, ContactStatus } from '../models/ContactRequest';
import { emailService } from '../services/email';
import { ApiError } from '../utils/apiError';
import { logger } from '../utils/logger';

const VALID_CATEGORIES: ContactCategory[] = [
  'Website',
  'Chrome Extension',
  'Application / Auto-fill',
  'Bug / Problem',
  'Partnership',
  'Other'
];

import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

interface InMemoryContact {
  _id: string;
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

const inMemoryContacts: InMemoryContact[] = [];

export class ContactController {
  /**
   * Submit a new contact message (Public endpoint with rate limiting)
   */
  async submitContact(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, category, message, source = 'website', attachmentUrl } = req.body;

      // Basic validation
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        throw ApiError.badRequest('Please provide your name');
      }

      if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email.trim())) {
        throw ApiError.badRequest('Please provide a valid email address');
      }

      if (!category || !VALID_CATEGORIES.includes(category as ContactCategory)) {
        throw ApiError.badRequest('Please select a valid category');
      }

      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        throw ApiError.badRequest('Please enter a message');
      }

      if (message.trim().length > 2000) {
        throw ApiError.badRequest('Message cannot exceed 2000 characters');
      }

      // Sanitize inputs
      const sanitizedName = name.trim().slice(0, 100);
      const sanitizedEmail = email.trim().toLowerCase().slice(0, 150);
      const sanitizedMessage = message.trim().slice(0, 2000);
      const sanitizedSource = (source && typeof source === 'string') ? source.trim().slice(0, 50) : 'website';

      let submissionId: string;

      // Save to database if connected, or fallback to in-memory store in dev
      if (mongoose.connection.readyState === 1) {
        const contactEntry = await ContactRequest.create({
          name: sanitizedName,
          email: sanitizedEmail,
          category,
          message: sanitizedMessage,
          source: sanitizedSource,
          attachmentUrl: typeof attachmentUrl === 'string' ? attachmentUrl.trim() : undefined,
          status: 'NEW'
        });
        submissionId = contactEntry._id.toString();
      } else {
        submissionId = uuidv4();
        inMemoryContacts.unshift({
          _id: submissionId,
          name: sanitizedName,
          email: sanitizedEmail,
          category: category as ContactCategory,
          message: sanitizedMessage,
          source: sanitizedSource,
          attachmentUrl: typeof attachmentUrl === 'string' ? attachmentUrl.trim() : undefined,
          status: 'NEW',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      logger.info(`[CONTACT] New submission #${submissionId} from ${sanitizedEmail} (${category}) via ${sanitizedSource}`);

      // Notify team via email service asynchronously
      emailService
        .sendContactNotification({
          name: sanitizedName,
          email: sanitizedEmail,
          category,
          message: sanitizedMessage,
          source: sanitizedSource
        })
        .catch((err) => {
          logger.warn(`Failed to send contact notification email: ${err.message}`);
        });

      return res.status(201).json({
        success: true,
        message: 'Message sent successfully.'
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * List contact requests (Admin endpoint)
   */
  async listContactRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, category, search, page = 1, limit = 20 } = req.query;
      const query: Record<string, any> = {};

      if (status && typeof status === 'string') {
        query.status = status;
      }

      if (category && typeof category === 'string') {
        query.category = category;
      }

      if (search && typeof search === 'string') {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { message: { $regex: search, $options: 'i' } }
        ];
      }

      const pageNum = Math.max(1, Number(page));
      const limitNum = Math.min(100, Math.max(1, Number(limit)));
      const skip = (pageNum - 1) * limitNum;

      if (mongoose.connection.readyState === 1) {
        const [items, total] = await Promise.all([
          ContactRequest.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .lean(),
          ContactRequest.countDocuments(query)
        ]);

        return res.json({
          success: true,
          data: items,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum)
          }
        });
      }

      // In-memory fallback for local dev when MongoDB is offline
      let filtered = [...inMemoryContacts];
      if (status && typeof status === 'string') {
        filtered = filtered.filter((c) => c.status === status);
      }
      if (category && typeof category === 'string') {
        filtered = filtered.filter((c) => c.category === category);
      }
      if (search && typeof search === 'string') {
        const s = search.toLowerCase();
        filtered = filtered.filter(
          (c) =>
            c.name.toLowerCase().includes(s) ||
            c.email.toLowerCase().includes(s) ||
            c.message.toLowerCase().includes(s)
        );
      }

      const total = filtered.length;
      const items = filtered.slice(skip, skip + limitNum);

      return res.json({
        success: true,
        data: items,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update contact request status (Admin endpoint)
   */
  async updateContactStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status, adminNotes } = req.body;

      if (!status || !['NEW', 'REPLIED', 'CLOSED'].includes(status)) {
        throw ApiError.badRequest('Invalid status. Must be NEW, REPLIED, or CLOSED');
      }

      const updateData: Record<string, any> = { status };
      if (adminNotes !== undefined) {
        updateData.adminNotes = adminNotes;
      }

      if (mongoose.connection.readyState === 1) {
        const updated = await ContactRequest.findByIdAndUpdate(
          id,
          { $set: updateData },
          { new: true }
        );

        if (!updated) {
          throw ApiError.notFound('Contact request not found');
        }

        return res.json({
          success: true,
          data: updated,
          message: `Status updated to ${status}`
        });
      }

      const item = inMemoryContacts.find((c) => c._id === id);
      if (!item) {
        throw ApiError.notFound('Contact request not found');
      }

      item.status = status as ContactStatus;
      if (adminNotes !== undefined) {
        item.adminNotes = adminNotes;
      }
      item.updatedAt = new Date();

      return res.json({
        success: true,
        data: item,
        message: `Status updated to ${status}`
      });
    } catch (err) {
      next(err);
    }
  }
}

export const contactController = new ContactController();
