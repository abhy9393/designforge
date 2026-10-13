export type User = {
  id: string;
  name: string;
  email: string;
};

export type Problem = {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: string;
  requirements: string[];
  evaluationCriteria: string[];
  requiredConcepts: string[];
  context: string;
};

export type DesignClass = {
  id: string;
  name: string;
  responsibilities: string[];
  attributes: { name: string; type: string; visibility?: 'public' | 'private' | 'protected' }[];
  methods: { name: string; params: { name: string; type: string }[]; returnType: string }[];
};

export type DesignRelationship = {
  id: string;
  source: string;
  target: string;
  type: 'extends' | 'implements' | 'composes' | 'aggregates' | 'associates';
};

export type PracticeAttempt = {
  id: string;
  problemId: string;
  attemptNumber: number;
  status: 'draft' | 'submitted' | 'evaluating' | 'evaluated' | 'failed';
  designSubmission: {
    classes: DesignClass[];
    interfaces: { id: string; name: string; methods: string[] }[];
    relationships: DesignRelationship[];
    notes: string[];
  };
  submittedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};
