import mongoose, { Schema, model, type Document } from 'mongoose';

export interface IProblem extends Document {
  title: string;
  slug: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  requirements: string[];
  evaluationCriteria: string[];
  requiredConcepts: string[];
  domainTerms: string[];
  context: string;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const problemSchema = new Schema<IProblem>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, required: true },
    difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], required: true },
    requirements: { type: [String], default: [] },
    evaluationCriteria: { type: [String], default: [] },
    requiredConcepts: { type: [String], default: [] },
    domainTerms: { type: [String], default: [] },
    context: { type: String, default: '' },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Problem = mongoose.models.Problem || model<IProblem>('Problem', problemSchema);
