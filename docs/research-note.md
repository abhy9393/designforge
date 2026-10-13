# Research note: LLD practice and feedback

## Learner problem

Low-level design practice asks a learner to turn a problem statement into a coherent set of domain types, responsibilities, operations, and relationships. A learner needs more than a diagram: they need to explain why responsibilities belong where they do, check whether references and abstractions make sense, receive feedback, and compare later work with earlier attempts.

This note is a desk-research synthesis for the DesignForge MVP, not a user study. It uses public references for the kinds of learning materials available and compares those approaches with the implementation in this repository. No market-size, learner-outcome, or effectiveness statistics are claimed.

## Existing learning approaches

1. **Notation and modeling standards.** The Object Management Group defines UML as a graphical language for visualizing, specifying, constructing, and documenting software artifacts. A notation standard helps learners communicate structure precisely, but the standard itself is not a guided practice sequence or a personalized progress record. Source: [OMG, UML 2.5.1](https://www.omg.org/spec/UML/2.5.1).
2. **Pattern catalogs.** Refactoring.Guru presents design patterns as reusable solutions, organizes a catalog of 22 classic patterns by intent, and also discusses criticism of patterns. This supports learning vocabulary and candidate approaches, while leaving the learner to decide whether a pattern fits a particular problem. Source: [Refactoring.Guru, Design Patterns](https://refactoring.guru/design-patterns).
3. **Broad system-design roadmaps.** roadmap.sh describes system-design topics including databases, caches, load balancers, queues, scaling, architecture, and security. This is useful as a topic map for broader system design; those infrastructure concerns are not a substitute for modeling classes and their responsibilities in a focused LLD exercise. Source: [roadmap.sh, System Design](https://roadmap.sh/system-design).

These references represent complementary approaches—formal modeling language, reusable design concepts, and broad system topics. They do not provide evidence that learners need one particular product or that a specific feedback mechanism improves outcomes. They do suggest a practical product distinction: an LLD exercise can connect a written prompt to a concrete model, then make the model reviewable rather than stopping at a list of concepts.

## Evidence-based gaps and product direction

The evidence here is intentionally limited to what the cited sources and this code establish:

- UML provides a common modeling language; DesignForge's workspace currently captures a constrained class/interface and relationship model rather than implementing a general UML editor.
- A pattern catalog helps explain available approaches; DesignForge currently supplies prompt-specific structural checks, not pattern recognition or expert semantic review.
- A broad system-design roadmap spans infrastructure topics; DesignForge's three sample challenges focus on object-level design and do not cover that broader curriculum.
- The repository implements drafts, separate submitted records, saved evaluator reports, and attempt history. This supports reviewing work over time, but does not establish that learners improve or that the MVP provides a complete learning analytics experience.

The product direction is therefore a narrow practice loop: choose a challenge, externalize a design as classes/interfaces and relationships, receive traceable deterministic feedback, preserve the attempt, and revise the draft for another submission. History and exact report-to-attempt links matter because the learner needs to distinguish a current draft from each evaluated version. Feedback should cite observed classes, responsibilities, and links and phrase heuristic omissions as review prompts rather than universal design rules.

## Research limitations

This is desk research from three public references and inspection of the current application, not a comparison of competitor products, interviews, or classroom observation. The public sources describe concepts and learning materials; they do not demonstrate measurable learning gaps or outcomes. Validate the product direction with learners and instructors before making claims about usability, effectiveness, or curriculum completeness.
