import { isMemoryMode, memoryStore } from '../config/db.js';
import { Problem } from '../models/Problem.js';
import type { ProblemSeed } from '../types/domain.js';

const sampleProblems: ProblemSeed[] = [
  {
    title: 'Parking Lot System',
    slug: 'parking-lot-system',
    description: 'Design a parking lot that manages parking spots, vehicles, billing, and ticketing without losing track of occupancy.',
    difficulty: 'Intermediate',
    requirements: [
      'Track different parking spot types and occupancy.',
      'Assign or release a spot for a vehicle efficiently.',
      'Support a ticketing and billing flow with vehicle entry and exit.',
      'Support multiple vehicle types and slot restrictions.'
    ],
    evaluationCriteria: [
      'Parking lot should manage vehicle and slot state.',
      'The design should separate responsibility between parking, billing, and vehicle management.',
      'The API surface should be clear and extensible.'
    ],
    requiredConcepts: ['Vehicle', 'ParkingSpot', 'Ticket', 'ParkingLot'],
    domainTerms: ['vehicle', 'slot', 'ticket', 'fee'],
    context: 'A multi-level parking facility that serves both small and large vehicles and supports hourly billing.',
  },
  {
    title: 'Elevator System',
    slug: 'elevator-system',
    description: 'Build the control logic for a building elevator that responds to internal and external requests safely and efficiently.',
    difficulty: 'Advanced',
    requirements: [
      'Model floors, elevator cars, and request handling.',
      'Process pickup requests from both passengers and floors.',
      'Prevent unsafe movement and handle idle state.'
    ],
    evaluationCriteria: [
      'Design should show elevator control and movement behavior.',
      'The model should support elevators, floors, and dispatch logic.',
      'Concurrency or sequencing concerns should be considered.'
    ],
    requiredConcepts: ['Elevator', 'Floor', 'Request', 'Controller'],
    domainTerms: ['floor', 'request', 'direction', 'queue'],
    context: 'A high-rise building with several elevators and mixed traffic patterns across multiple floors.',
  },
  {
    title: 'Vending Machine System',
    slug: 'vending-machine-system',
    description: 'Design a vending machine that handles multiple products, payments, inventory, and service states reliably.',
    difficulty: 'Beginner',
    requirements: [
      'Track available inventory and product selection.',
      'Accept money and return change.',
      'Enforce stock and transaction state transitions.'
    ],
    evaluationCriteria: [
      'The design should define product, payment, inventory, and machine state.',
      'The machine should support invalid purchases and change calculation.',
      'The design should separate user interaction from core inventory logic.'
    ],
    requiredConcepts: ['VendingMachine', 'Product', 'Inventory', 'Payment'],
    domainTerms: ['inventory', 'coin', 'product', 'change'],
    context: 'A snack and beverage machine serving multiple SKUs with cash and card-like payment paths.',
  },
];

export async function fetchProblems() {
  if (isMemoryMode()) {
    const problems = memoryStore.problems as any[];
    if (problems.length === 0) {
      problems.push(...sampleProblems.map((p, index) => ({
        _id: `problem_${index + 1}`,
        ...p,
        published: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })));
    }
    return problems.map((p) => ({
      id: p._id,
      title: p.title,
      slug: p.slug,
      description: p.description,
      difficulty: p.difficulty,
      requirements: p.requirements,
      evaluationCriteria: p.evaluationCriteria,
      requiredConcepts: p.requiredConcepts,
      domainTerms: p.domainTerms,
      context: p.context,
      published: p.published,
    }));
  }

  const problems = await Problem.find({ published: true }).lean();
  if (problems.length === 0) {
    const seed = await Problem.insertMany(sampleProblems.map((p) => ({ ...p, published: true })));
    return seed.map((p: any) => ({ id: p._id.toString(), ...p }));
  }
  return problems.map((p: any) => ({ id: p._id.toString(), ...p }));
}

export async function fetchProblemBySlug(slug: string) {
  if (isMemoryMode()) {
    const problems = memoryStore.problems as any[];
    const problem = problems.find((p: any) => p.slug === slug);
    if (!problem) return null;
    const record = problem as any;
    return { id: record._id, ...record };
  }
  const problem = await Problem.findOne({ slug, published: true }).lean();
  if (!problem) return null;
  const record = problem as any;
  return { id: String(record._id), ...record };
}

export async function ensureSeededProblems() {
  if (isMemoryMode()) {
    const problems = memoryStore.problems as any[];
    if (problems.length === 0) {
      problems.push(...sampleProblems.map((p, index) => ({
        _id: `problem_${index + 1}`,
        ...p,
        published: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })));
    }
    return problems;
  }

  const count = await Problem.countDocuments({});
  if (count === 0) {
    await Problem.insertMany(sampleProblems.map((p) => ({ ...p, published: true })));
  }
  return Problem.find({ published: true }).lean();
}
