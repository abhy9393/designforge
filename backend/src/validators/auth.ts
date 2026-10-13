import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .refine((name) => /\p{L}/u.test(name) && !/\p{N}/u.test(name), 'Name must contain letters and cannot contain numbers'),
  email: z.string().trim().email('Please provide a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const loginSchema = z.object({
  email: z.string().trim().email('Please provide a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const draftAttemptSchema = z.object({
  title: z.string().optional(),
  design: z.object({
    classes: z.array(z.object({
      id: z.string().min(1),
      name: z.string(),
      responsibilities: z.array(z.string()).default([]),
      attributes: z.array(z.object({
        name: z.string(),
        type: z.string(),
        visibility: z.enum(['public', 'private', 'protected']).optional(),
      })).default([]),
      methods: z.array(z.object({
        name: z.string(),
        params: z.array(z.object({
          name: z.string(),
          type: z.string(),
        })).default([]),
        returnType: z.string(),
      })).default([]),
    })).default([]),
    interfaces: z.array(z.object({
      id: z.string().min(1),
      name: z.string(),
      methods: z.array(z.string()).default([]),
    })).default([]),
    relationships: z.array(z.object({
      id: z.string().min(1),
      source: z.string(),
      target: z.string(),
      type: z.enum(['extends', 'implements', 'composes', 'aggregates', 'associates']).default('associates'),
    })).default([]),
    notes: z.array(z.string()).default([]),
  }).default({ classes: [], interfaces: [], relationships: [], notes: [] }),
}).partial();

export const submitAttemptSchema = z.object({
  design: z.object({
    classes: z.array(z.object({
      id: z.string().min(1),
      name: z.string().trim().min(1),
      responsibilities: z.array(z.string().trim().min(1)).default([]),
      attributes: z.array(z.object({
        name: z.string().trim().min(1),
        type: z.string().trim().min(1),
        visibility: z.enum(['public', 'private', 'protected']).optional(),
      })).default([]),
      methods: z.array(z.object({
        name: z.string().trim().min(1),
        params: z.array(z.object({
          name: z.string().trim().min(1),
          type: z.string().trim().min(1),
        })).default([]),
        returnType: z.string().trim().min(1),
      })).default([]),
    })).min(1, 'At least one class is required'),
    interfaces: z.array(z.object({
      id: z.string().min(1),
      name: z.string().trim().min(1),
      methods: z.array(z.string().trim().min(1)).default([]),
    })).default([]),
    relationships: z.array(z.object({
      id: z.string().min(1),
      source: z.string().trim().min(1),
      target: z.string().trim().min(1),
      type: z.enum(['extends', 'implements', 'composes', 'aggregates', 'associates']).default('associates'),
    })).default([]),
    notes: z.array(z.string().trim().min(1)).default([]),
  }),
});
