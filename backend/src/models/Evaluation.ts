import mongoose, { Schema, model, type Document, type Types } from 'mongoose';

export interface IEvaluation extends Document {
  attemptId: Types.ObjectId;
  evaluatorType: 'rule-based' | 'ai';
  status: 'pending' | 'completed' | 'failed';
  summary: string;
  overallScore: number;
  feedback: Record<string, any>;
  categoryScores?: Record<string, number>;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

const evaluationSchema = new Schema<IEvaluation>(
  {
    attemptId: { type: Schema.Types.ObjectId, ref: 'PracticeAttempt', required: true, index: true },
    evaluatorType: { type: String, enum: ['rule-based', 'ai'], required: true },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    summary: { type: String, default: '' },
    overallScore: { type: Number, default: 0 },
    feedback: { type: Schema.Types.Mixed, default: {} },
    categoryScores: { type: Schema.Types.Mixed, default: {} },
    error: { type: String },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

export const Evaluation = mongoose.models.Evaluation || model<IEvaluation>('Evaluation', evaluationSchema);
