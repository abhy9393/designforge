# Research and implementation notes

## Why a local fallback matters

Many LLD practice apps assume a live database is always available. This project instead supports a graceful fallback mode so teams can run demos, prototypes, and local experiments without external infrastructure.

## Why rule-based evaluation is useful

A deterministic evaluator is easier to test, easier to explain, and more stable than a generic LLM response. It gives a reliable baseline while preserving optional AI augmentation in future work.

## Why a monorepo structure

Separating frontend and backend code in one root workspace keeps local setup simple, makes shared dependency management easier, and mirrors how real product teams split client/server responsibilities.

## Product trade-offs

- The system favors clarity and local availability over full production complexity
- The evaluator prioritizes explainability over deep semantic inference
- The UI is designed to be realistic and visually polished without requiring a complex canvas engine
