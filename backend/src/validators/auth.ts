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

const designSubmissionSchema = z.object({
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
});

const draftOptionalPairSchema = z.object({
  name: z.string(),
  type: z.string(),
}).superRefine((pair, context) => {
  const nameIsSet = pair.name.trim().length > 0;
  const typeIsSet = pair.type.trim().length > 0;
  if (nameIsSet === typeIsSet) return;
  context.addIssue({
    code: 'custom',
    path: [nameIsSet ? 'type' : 'name'],
    message: 'Both fields are required when either field is provided.',
  });
});

const draftDesignSchema = z.object({
  classes: z.array(z.object({
    id: z.string().min(1),
    name: z.string().trim().min(1),
    responsibilities: z.array(z.string()).default([]),
    attributes: z.array(z.object({
      name: z.string(),
      type: z.string(),
      visibility: z.enum(['public', 'private', 'protected']).optional(),
    }).superRefine((attribute, context) => {
      const nameIsSet = attribute.name.trim().length > 0;
      const typeIsSet = attribute.type.trim().length > 0;
      if (nameIsSet === typeIsSet) return;
      context.addIssue({
        code: 'custom',
        path: [nameIsSet ? 'type' : 'name'],
        message: 'Both fields are required when either field is provided.',
      });
    })).default([]),
    methods: z.array(z.object({
      name: z.string(),
      params: z.array(draftOptionalPairSchema).default([]),
      returnType: z.string(),
    }).superRefine((method, context) => {
      const nameIsSet = method.name.trim().length > 0;
      const returnTypeIsSet = method.returnType.trim().length > 0;
      const hasParameter = method.params.some((param) =>
        param.name.trim().length > 0 || param.type.trim().length > 0,
      );
      if (nameIsSet !== returnTypeIsSet) {
        context.addIssue({
          code: 'custom',
          path: [nameIsSet ? 'returnType' : 'name'],
          message: 'Method name and return type are both required.',
        });
      } else if (hasParameter && !nameIsSet) {
        context.addIssue({
          code: 'custom',
          path: ['name'],
          message: 'Method name and return type are required when parameters are provided.',
        });
      }
    })).default([]),
  })).min(1, 'At least one class is required'),
  interfaces: z.array(z.object({
    id: z.string().min(1),
    name: z.string().trim().min(1),
    methods: z.array(z.string().trim().min(1)).default([]),
  })).default([]),
  relationships: z.array(z.object({
    id: z.string().min(1),
    source: z.string(),
    target: z.string(),
    type: z.enum(['extends', 'implements', 'composes', 'aggregates', 'associates']).default('associates'),
  }).superRefine((relationship, context) => {
    const sourceIsSet = relationship.source.trim().length > 0;
    const targetIsSet = relationship.target.trim().length > 0;
    if (sourceIsSet === targetIsSet) return;
    context.addIssue({
      code: 'custom',
      path: [sourceIsSet ? 'target' : 'source'],
      message: 'Both relationship endpoints are required.',
    });
  })).default([]),
  notes: z.array(z.string()).default([]),
});

export const draftAttemptSchema = z.object({
  title: z.string().optional(),
  design: draftDesignSchema,
});

export const submitAttemptSchema = z.object({
  design: designSubmissionSchema,
});
