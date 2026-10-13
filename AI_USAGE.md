# AI usage

This file records AI-assisted implementation decisions visible in the current repository and this final maintenance session. It is not a complete historical activity log: earlier prompts, author decisions, and independent contributions cannot be verified from the code alone. The project author should confirm the entries marked below before treating them as a complete record.

| Decision / suggestion | Disposition reflected in code | Rationale supported by implementation | Confirmation |
|---|---|---|---|
| Use a deterministic rule-based evaluator for the MVP rather than inventing an LLM integration. | Implemented in `backend/src/services/evaluationService.ts`; no external evaluator call is made by submission. | Works without provider credentials and provides repeatable structural criteria and feedback. | Author confirmation required for the original product decision. |
| Keep saved drafts separate from submitted attempts and retain each report by submission ID. | Implemented across the attempt service, API routes, and History/report pages. | Preserves the editable draft and makes earlier submissions independently reviewable. | Author confirmation required for the original product decision. |
| Enforce unchanged-submission prevention on the server and database, not only by disabling the submit button. | Implemented using a content hash, MongoDB unique index, and frontend in-flight lock. | The frontend lock handles repeated clicks; the database constraint covers concurrent requests. | Verify deployment/index migration behavior for the target MongoDB environment. |
| Keep routine API tests on memory and require an explicitly named isolated target for Mongo integration tests. | Implemented in test setup and `backend/src/config/mongoTestSafety.ts`. | Prevents ordinary tests from using the application URI and rejects missing or colliding Mongo targets before connection. | Author should confirm the chosen disposable database policy. |

## Current AI-related runtime behavior

`AI_API_KEY`, `AI_PROVIDER`, and `AI_MODEL` exist in configuration, and an `AIEvaluator` adapter is present, but the submit route currently chooses `RuleBasedEvaluator`. The adapter does not perform an external provider call. The configuration should not be represented as evidence that AI evaluation is active.

## Review policy

Treat this as a draft disclosure. Confirm or amend the rationale and decisions based on the development history before submission. Do not add credentials, prompts containing personal data, or private provider responses to this file.
