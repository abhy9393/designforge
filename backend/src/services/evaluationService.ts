import { env } from '../config/env.js';
import { isMemoryMode, memoryStore } from '../config/db.js';
import { Evaluation } from '../models/Evaluation.js';
import { PracticeAttempt } from '../models/PracticeAttempt.js';
import type { EvaluationResult } from '../types/domain.js';

export interface IEvaluator {
  evaluate(design: any, problem: any): Promise<EvaluationResult>;
}

export class RuleBasedEvaluator implements IEvaluator {
  async evaluate(design: any, problem: any): Promise<EvaluationResult> {
    const classes = design?.classes ?? [];
    const interfaces = design?.interfaces ?? [];
    const classNames = classes.map((cls: any) => cls.name).filter((name: string | undefined) => Boolean(name));
    const classMap = new Map(classes.map((cls: any) => [cls.name, cls]));
    const interfaceNames = new Set(interfaces.map((item: any) => item.name));
    const declaredTypes = new Set([...classNames, ...interfaceNames]);
    const relationships = design?.relationships ?? [];
    const brokenRelationships = relationships.filter((relationship: any) =>
      !declaredTypes.has(relationship.source) || !declaredTypes.has(relationship.target),
    );
    const classesWithBehavior = classes.filter((cls: any) =>
      (cls.responsibilities ?? []).some((item: string) => item.trim())
      || (cls.methods ?? []).length > 0,
    );
    const designText = [
      ...classes.flatMap((cls: any) => [
        cls.name,
        ...(cls.responsibilities ?? []),
        ...(cls.attributes ?? []).flatMap((attribute: any) => [attribute.name, attribute.type]),
        ...(cls.methods ?? []).flatMap((method: any) => [
          method.name,
          method.returnType,
          ...(method.params ?? []).flatMap((param: any) => [param.name, param.type]),
        ]),
      ]),
      ...interfaces.flatMap((item: any) => [item.name, ...(item.methods ?? [])]),
    ].join(' ').toLowerCase();
    const requiredConcepts = problem?.requiredConcepts ?? [];
    const missingConcepts = requiredConcepts.filter((concept: string) =>
      !designText.includes(concept.toLowerCase()),
    );

    const criteria = [
      this.makeCriterion(
        'Structure',
        classNames.length > 0 ? 'pass' : 'fail',
        'medium',
        classNames.length > 0 ? 'The design defines domain classes.' : 'The design has no domain classes.',
        classNames.length > 0 ? [`Found classes: ${classNames.join(', ')}`] : ['No classes were supplied.'],
        'Add a domain class only if the problem has a distinct concept that needs its own state or behavior.',
      ),
      ...(relationships.length ? [this.makeCriterion(
        'Relationships',
        brokenRelationships.length ? 'fail' : 'pass',
        'high',
        brokenRelationships.length
          ? 'Some relationship endpoints do not refer to a declared class or interface.'
          : 'Every relationship connects declared design types.',
        brokenRelationships.map((relationship: any) =>
          `Unresolved reference: ${relationship.source} -> ${relationship.target}`,
        ),
        'Check relationship endpoints against the declared class and interface names.',
      )] : []),
      ...(requiredConcepts.length ? [this.makeCriterion(
        'Problem concepts',
        missingConcepts.length ? 'warning' : 'pass',
        'medium',
        missingConcepts.length
          ? 'Some problem concepts were not found in the design text; equivalent domain modeling may still be valid.'
          : 'Problem concepts are represented in the design.',
        missingConcepts.map((concept: string) => `Consider how “${concept}” is represented, including any equivalent abstraction.`),
        'Review the omitted concepts and add a class, responsibility, attribute, operation, or interface only where it fits your design.',
      )] : []),
      ...(classes.length ? [this.makeCriterion(
        'Responsibilities',
        classesWithBehavior.length === classes.length ? 'pass' : 'warning',
        'medium',
        'Responsibilities and operations make class roles understandable.',
        classes
          .filter((cls: any) =>
            !(cls.responsibilities ?? []).some((item: string) => item.trim())
            && !(cls.methods ?? []).length,
          )
          .map((cls: any) => `${cls.name} has no responsibility or operation yet.`),
        'Describe the class role or add an operation when behavior belongs to that class.',
      )] : []),
    ];

    const failed = criteria.filter((criterion) => criterion.status === 'fail').length;
    const warnings = criteria.filter((criterion) => criterion.status === 'warning').length;
    const scoreBase = 100 - failed * 24 - warnings * 5;
    const overall = Math.max(0, Math.min(100, scoreBase));

    const strengths = [
      ...(classNames.length ? [`The design separates ${classNames.length} domain class${classNames.length === 1 ? '' : 'es'}: ${classNames.join(', ')}.`] : []),
      ...(classesWithBehavior.length ? [`${classesWithBehavior.length} of ${classes.length} classes have a stated responsibility or operation.`] : []),
      ...(relationships.length && !brokenRelationships.length
        ? [`${relationships.length} relationship${relationships.length === 1 ? '' : 's'} connect declared design types.`]
        : []),
      ...(interfaces.length ? [`The design declares ${interfaces.length} interface abstraction${interfaces.length === 1 ? '' : 's'} for shared behavior or extension points.`] : []),
    ];

    const recommendations = criteria
      .filter((criterion) => criterion.status !== 'pass')
      .map((criterion) => criterion.suggestion);

    return {
      summary: failed
        ? 'The design has structural issues to review before it is submission-ready.'
        : warnings
          ? 'The design has a sound base with a few areas worth reviewing.'
          : 'The submitted design passed the structural checks performed.',
      overall,
      criteria,
      strengths,
      recommendations,
      status: failed ? 'fail' : warnings ? 'needs-improvement' : 'pass',
      categoryScores: {
        structure: Math.max(0, 100 - failed * 24),
        relationships: brokenRelationships.length ? 70 : 100,
        domainCoverage: Math.max(0, 100 - warnings * 12),
      },
    };
  }

  private makeCriterion(name: string, status: 'pass' | 'warning' | 'fail', severity: 'low' | 'medium' | 'high', explanation: string, evidence: string[], suggestion: string) {
    return { name, status, severity, explanation, evidence, suggestion };
  }
}

export class AIEvaluator implements IEvaluator {
  async evaluate(design: any, problem: any): Promise<EvaluationResult> {
    if (!env.AI_API_KEY) {
      return {
        summary: 'AI evaluation is not configured, so deterministic feedback was used.',
        overall: 82,
        criteria: [{
          name: 'AI status',
          status: 'warning',
          severity: 'low',
          explanation: 'No AI provider was configured, so only local deterministic evaluation ran.',
          evidence: ['AI_API_KEY is empty.'],
          suggestion: 'Set AI_API_KEY to enable provider-based semantic review.'
        }],
        strengths: ['Deterministic evaluation is active.'],
        recommendations: ['Configure an AI provider for semantic feedback.'],
        status: 'needs-improvement',
      };
    }

    return {
      summary: 'AI-backed feedback is configured but not executed in this local MVP.',
      overall: 84,
      criteria: [{
        name: 'AI preview',
        status: 'warning',
        severity: 'low',
        explanation: 'The backend is ready for AI evaluation when a valid API key and provider are configured.',
        evidence: ['AI provider configuration found.'],
        suggestion: 'Add a real provider call to produce higher-level design commentary.'
      }],
      strengths: ['The architecture includes an adapter for future provider-backed review.'],
      recommendations: ['Connect to OpenAI or another provider to do semantic feedback.'],
      status: 'needs-improvement',
    };
  }
}

export class EvaluationService {
  constructor(private readonly evaluator: IEvaluator = new RuleBasedEvaluator()) {}

  async evaluateAttempt(attempt: any, problem: any): Promise<any> {
    const result = await this.evaluator.evaluate(attempt.designSubmission || attempt.design || {}, problem);
    const evaluationRecord = {
      attemptId: attempt._id || attempt.id,
      evaluatorType: this.evaluator instanceof AIEvaluator ? 'ai' : 'rule-based',
      status: 'completed',
      summary: result.summary,
      overallScore: result.overall,
      feedback: result,
      categoryScores: result.categoryScores || {},
      createdAt: new Date(),
      completedAt: new Date(),
    };

    if (isMemoryMode()) {
      const memoryEvaluation = { _id: generationId(), ...evaluationRecord };
      memoryStore.evaluations.push(memoryEvaluation);
      return memoryEvaluation;
    }

    const created = await Evaluation.create(evaluationRecord);
    return created.toObject();
  }
}

function generationId() {
  return `evaluation_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
