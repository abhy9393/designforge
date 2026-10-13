import { describe, expect, it } from 'vitest';
import { RuleBasedEvaluator } from '../services/evaluationService.js';

describe('rule-based evaluation feedback', () => {
  it('reports strengths supported by the submitted classes, responsibilities, abstractions, and links', async () => {
    const result = await new RuleBasedEvaluator().evaluate({
      classes: [
        {
          name: 'ParkingLot',
          responsibilities: ['Assign available spaces'],
          attributes: [{ name: 'spots', type: 'ParkingSpot[]' }],
          methods: [{ name: 'assignSpot', returnType: 'ParkingSpot', params: [] }],
        },
        {
          name: 'ParkingSpot',
          responsibilities: ['Track occupancy'],
          attributes: [],
          methods: [],
        },
      ],
      interfaces: [{ name: 'SpotAllocator', methods: ['assignSpot'] }],
      relationships: [{ source: 'ParkingLot', target: 'ParkingSpot', type: 'composes' }],
    }, { requiredConcepts: ['ParkingLot', 'ParkingSpot'] });

    expect(result.strengths).toEqual(expect.arrayContaining([
      expect.stringContaining('ParkingLot, ParkingSpot'),
      expect.stringContaining('2 of 2 classes'),
      expect.stringContaining('1 relationship'),
      expect.stringContaining('1 interface abstraction'),
    ]));
    expect(result.status).toBe('pass');
    expect(result.recommendations).toEqual([]);
  });

  it('does not invent relationship strengths or reject a valid independent class design', async () => {
    const result = await new RuleBasedEvaluator().evaluate({
      classes: [{
        name: 'Calculator',
        responsibilities: ['Compute a quote'],
        attributes: [],
        methods: [{ name: 'calculate', returnType: 'number', params: [] }],
      }],
      interfaces: [],
      relationships: [],
    }, { requiredConcepts: [] });

    expect(result.status).toBe('pass');
    expect(result.strengths).toHaveLength(2);
    expect(result.strengths.some((strength) => strength.includes('relationship'))).toBe(false);
    expect(result.criteria.some((criterion) => criterion.name === 'Relationships')).toBe(false);
  });

  it('reports broken relationship references without inventing positive feedback', async () => {
    const result = await new RuleBasedEvaluator().evaluate({
      classes: [{
        name: 'ParkingLot',
        responsibilities: ['Assign spaces'],
        attributes: [],
        methods: [],
      }],
      interfaces: [],
      relationships: [{ source: 'ParkingLot', target: 'MissingType', type: 'associates' }],
    }, { requiredConcepts: [] });

    expect(result.status).toBe('fail');
    expect(result.strengths).toEqual([
      expect.stringContaining('ParkingLot'),
      expect.stringContaining('1 of 1 classes'),
    ]);
    expect(result.criteria.find((criterion) => criterion.name === 'Relationships')?.evidence)
      .toContain('Unresolved reference: ParkingLot -> MissingType');
  });
});
