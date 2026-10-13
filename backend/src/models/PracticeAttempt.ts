import mongoose, { Schema, model, type Document, type Types } from 'mongoose';

export interface IPracticeAttempt extends Document {
  userId: Types.ObjectId;
  problemId: Types.ObjectId;
  sourceDraftId?: Types.ObjectId;
  designHash?: string;
  submittedToAttemptId?: Types.ObjectId;
  attemptNumber: number;
  status: 'draft' | 'submitted' | 'evaluating' | 'evaluated' | 'failed';
  designSubmission: Record<string, any>;
  submittedAt?: Date;
  evaluationId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

const attemptSchema = new Schema<IPracticeAttempt>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    problemId: { type: Schema.Types.ObjectId, ref: 'Problem', required: true, index: true },
    sourceDraftId: { type: Schema.Types.ObjectId, ref: 'PracticeAttempt' },
    designHash: { type: String },
    submittedToAttemptId: { type: Schema.Types.ObjectId, ref: 'PracticeAttempt' },
    attemptNumber: { type: Number, required: true },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'evaluating', 'evaluated', 'failed'],
      default: 'draft',
    },
    designSubmission: { type: Schema.Types.Mixed, required: true },
    submittedAt: { type: Date },
    evaluationId: { type: Schema.Types.ObjectId, ref: 'Evaluation' },
    version: { type: Number, default: 1 },
  },
  { timestamps: true }
);

attemptSchema.index(
  { userId: 1, sourceDraftId: 1, designHash: 1 },
  {
    unique: true,
    name: 'unique_submission_design_per_draft',
    partialFilterExpression: {
      sourceDraftId: { $exists: true },
      designHash: { $type: 'string' },
    },
  },
);

export const PracticeAttempt = mongoose.models.PracticeAttempt || model<IPracticeAttempt>('PracticeAttempt', attemptSchema);
