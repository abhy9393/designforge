# Design note: DesignForge LLD Practice MVP

## MVP scope and learner flow

The current MVP implements registration and login, a protected application shell, a library of three seeded prompts (Parking Lot, Elevator, and Vending Machine), an editable design workspace, draft saving, submission, deterministic evaluation, attempt history, report review, dashboard, and profile pages.

The learner journey is:

1. Register or log in and select a challenge.
2. Start a user-owned draft and describe classes, responsibilities, attributes, methods, parameters, interfaces, relationships, and notes.
3. Save and reopen the draft to continue editing.
4. Submit a snapshot of the current design. A successful submission creates a separate historical attempt linked to the source draft.
5. Review feedback for that exact submission from its saved report.
6. Return to the preserved draft, make a meaningful change, and submit a new version. A repeated unchanged design for the same draft is rejected.

## Main domain records

- **User** — stored name, normalized email, password hash, and timestamps. Passwords are hashed by the authentication service; routes use authenticated user identity to scope attempts.
- **Problem** — prompt title, slug, description, difficulty, requirements, evaluation criteria, required concepts, and context.
- **PracticeAttempt** — user and problem references, attempt number, status, design payload, optional source-draft/submission links, content hash for duplicate detection, submission time, optional evaluation reference, and timestamps. Drafts and submissions are distinct records.
- **Evaluation** — exact attempt reference, evaluator type, status, summary, score, structured feedback, category scores, and timestamps.
- **Design model** — a design has classes, optional interfaces, relationships, and notes. A class has responsibilities, attributes (including type and optional visibility), and methods (parameters and return type).

## Evaluation approach

Submission uses the rule-based evaluator. It checks for a class model, whether classes have responsibilities or operations, whether declared relationship endpoints resolve, and whether text reflects challenge concepts. It reports only strengths supported by submitted classes, responsibilities, relationships, and interfaces. No relationship is required merely to pass; challenge-concept omissions are warnings because equivalent modeling may be valid. The score is a deterministic heuristic, not expert grading. The optional AI adapter is not called by the submission route and does not currently make a provider request.

Request validation uses Zod before submission. Invalid input returns a field path and validation message. Evaluation and persistence failures return explicit errors; a report is exposed only for an evaluated, user-owned attempt with a report associated with that attempt. If saving the report succeeds but attaching it to the attempt fails, the service compensates by removing that newly saved report and marking the submission failed. If compensation itself fails, the server logs and surfaces a failure rather than returning a successful report response.

## Persistence and reliability

Mongoose persists users, problems, attempts, and evaluations when MongoDB is configured. The application can use an in-memory store when no Mongo URI is configured; this is useful for local API tests and a disposable demo, but records are lost when the process stops. Mongo-backed repeated-submission protection uses a partial unique index over user, source draft, and design hash, in addition to a server-side duplicate check. Routine API tests explicitly select memory. The Mongo integration test requires a separate `DESIGNFORGE_TEST_MONGO_URI` whose database name starts with `designforge_test_`; its guard rejects a target matching the configured application database before connecting.

## Trade-offs and limitations

- The editor is a purpose-built structured form, not a free-form UML canvas or full UML implementation.
- Rule-based feedback is explainable and repeatable but cannot reliably recognize every valid alternative design, evaluate detailed SOLID trade-offs, or replace expert review.
- The sample challenge set is small. The dashboard provides basic counts/activity, not longitudinal mastery analytics.
- Memory mode does not survive restart. MongoDB test-target checks compare URI target details but cannot prove that an operator's DNS, proxy, or hosted-cluster routing is truly disposable.
- The submission/report sequence uses explicit compensating cleanup rather than requiring MongoDB transactions, which are not universally available in local standalone deployments.
