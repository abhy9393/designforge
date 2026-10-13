# Design notes

## Design goals

DesignForge is meant to feel like a realistic LLD training board. The interface is a mix of challenge browsing, design editing, and evaluation feedback.

## Core product flow

1. User signs up or logs in
2. User opens a challenge and starts an attempt
3. User drafts a class diagram with responsibilities, attributes, methods, and relationships
4. User saves or submits the attempt
5. Rule-based evaluator scores the design and returns structured feedback
6. User reviews history and dashboard progress

## Domain model

- User: account and identity information
- Problem: challenge metadata plus requirements, context, and required domain concepts
- PracticeAttempt: user-specific challenge attempt and saved design payload
- Evaluation: result record linking an attempt to a scored design feedback summary

## Frontend architecture

- routes are protected through auth-aware gate components
- API calls are centralized through a reusable axios instance
- state is held in context for login/session refresh
- pages use a consistent dark design language consistent with the product brand

## Backend architecture

- Express app wires middleware, CORS, auth, and versioned API routes
- validation happens with Zod for request safety
- service layer separates domain logic from request layers
- memory fallback keeps the product working in local dev while preserving MongoDB integration
