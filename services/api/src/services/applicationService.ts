import mongoose from 'mongoose';
import { ApplicationModel, IApplicationDocument } from '../models/Application';
import { ApiError } from '../utils/apiError';
import { IApplication, ApplicationStatus } from '@kraxyy/types';
import { v4 as uuidv4 } from 'uuid';

export class ApplicationService {
  async listApplications(
    userId: string,
    query: { status?: string; page?: number; limit?: number }
  ) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = { userId: new mongoose.Types.ObjectId(userId) };
    if (query.status && query.status !== 'ALL') {
      filter.status = query.status;
    }

    const [items, total] = await Promise.all([
      ApplicationModel.find(filter)
        .sort({ appliedDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('resumeUsedId', 'filename originalName fileUrl'),
      ApplicationModel.countDocuments(filter)
    ]);

    return {
      items: items.map(this.formatApplication),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getApplicationById(id: string, userId: string): Promise<IApplication> {
    const app = await ApplicationModel.findOne({ _id: id, userId });
    if (!app) {
      throw ApiError.notFound('Application not found');
    }
    return this.formatApplication(app);
  }

  async createApplication(userId: string, data: Partial<IApplication>): Promise<IApplication> {
    const timeline = [
      {
        id: uuidv4(),
        status: data.status || 'APPLIED',
        date: new Date(),
        note: 'Application logged'
      }
    ];

    const app = await ApplicationModel.create({
      ...data,
      userId: new mongoose.Types.ObjectId(userId),
      appliedDate: data.appliedDate ? new Date(data.appliedDate) : new Date(),
      timeline
    });

    return this.formatApplication(app);
  }

  async updateApplication(id: string, userId: string, data: Partial<IApplication>): Promise<IApplication> {
    const app = await ApplicationModel.findOne({ _id: id, userId });
    if (!app) {
      throw ApiError.notFound('Application not found');
    }

    if (data.status && data.status !== app.status) {
      app.timeline.push({
        id: uuidv4(),
        status: data.status as ApplicationStatus,
        date: new Date(),
        note: `Status updated to ${data.status}`
      });
      app.status = data.status as ApplicationStatus;
    }

    if (data.jobTitle) app.jobTitle = data.jobTitle;
    if (data.company) app.company = data.company;
    if (data.jobUrl !== undefined) app.jobUrl = data.jobUrl;
    if (data.location !== undefined) app.location = data.location;
    if (data.salary !== undefined) app.salary = data.salary;
    if (data.notes !== undefined) app.notes = data.notes;
    if (data.coverLetter !== undefined) app.coverLetter = data.coverLetter;

    await app.save();
    return this.formatApplication(app);
  }

  async deleteApplication(id: string, userId: string): Promise<boolean> {
    const result = await ApplicationModel.deleteOne({ _id: id, userId });
    if (result.deletedCount === 0) {
      throw ApiError.notFound('Application not found');
    }
    return true;
  }

  async getDashboardMetrics(userId: string) {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [total, thisMonth, inProgress, interviews, offers] = await Promise.all([
      ApplicationModel.countDocuments({ userId: userObjectId }),
      ApplicationModel.countDocuments({ userId: userObjectId, appliedDate: { $gte: startOfMonth } }),
      ApplicationModel.countDocuments({
        userId: userObjectId,
        status: { $in: ['APPLIED', 'SCREENING', 'INTERVIEW'] }
      }),
      ApplicationModel.countDocuments({ userId: userObjectId, status: 'INTERVIEW' }),
      ApplicationModel.countDocuments({ userId: userObjectId, status: 'OFFER' })
    ]);

    const recentApplications = await ApplicationModel.find({ userId: userObjectId })
      .sort({ appliedDate: -1 })
      .limit(5);

    return {
      total,
      thisMonth,
      inProgress,
      interviews,
      offers,
      recentApplications: recentApplications.map(this.formatApplication)
    };
  }

  formatApplication(app: IApplicationDocument): IApplication {
    return {
      id: app._id.toString(),
      userId: app.userId.toString(),
      jobTitle: app.jobTitle,
      company: app.company,
      jobUrl: app.jobUrl,
      source: app.source,
      location: app.location,
      salary: app.salary,
      appliedDate: app.appliedDate.toISOString(),
      status: app.status,
      notes: app.notes,
      resumeUsedId: app.resumeUsedId?.toString(),
      coverLetter: app.coverLetter,
      timeline: app.timeline.map((t) => ({
        id: t.id,
        status: t.status,
        date: t.date.toISOString(),
        note: t.note
      })),
      createdAt: app.createdAt.toISOString(),
      updatedAt: app.updatedAt.toISOString()
    };
  }
}

export const applicationService = new ApplicationService();
