export type ProblemDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';
export type AttemptStatus = 'draft' | 'submitted' | 'evaluating' | 'evaluated' | 'failed';
export type EvaluationStatus = 'pending' | 'completed' | 'failed';

export interface DesignClassAttribute {
  name: string;
  type: string;
  visibility?: 'public' | 'private' | 'protected';
}

export interface DesignClassMethodParam {
  name: string;
  type: string;
}

export interface DesignClassMethod {
  name: string;
  params: DesignClassMethodParam[];
  returnType: string;
}

export interface DesignClass {
  id: string;
  name: string;
  responsibilities: string[];
  attributes: DesignClassAttribute[];
  methods: DesignClassMethod[];
}

export interface DesignInterface {
  id: string;
  name: string;
  methods: string[];
}

export interface DesignRelationship {
  id: string;
  source: string;
  target: string;
  type: 'extends' | 'implements' | 'composes' | 'aggregates' | 'associates';
}

export interface DesignSubmission {
  classes: DesignClass[];
  interfaces: DesignInterface[];
  relationships: DesignRelationship[];
  notes: string[];
}

export interface ProblemSeed {
  title: string;
  slug: string;
  description: string;
  difficulty: ProblemDifficulty;
  requirements: string[];
  evaluationCriteria: string[];
  requiredConcepts: string[];
  domainTerms: string[];
  context: string;
}

export interface EvaluationCriterion {
  name: string;
  status: 'pass' | 'warning' | 'fail';
  severity: 'low' | 'medium' | 'high';
  explanation: string;
  evidence: string[];
  suggestion: string;
}

export interface EvaluationResult {
  summary: string;
  overall: number;
  criteria: EvaluationCriterion[];
  strengths: string[];
  recommendations: string[];
  status: 'pass' | 'needs-improvement' | 'fail';
  categoryScores?: Record<string, number>;
}
