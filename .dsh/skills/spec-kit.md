---
name: spec-kit
description: "Use this when a feature or application must be specified before code: a written spec, a plan, and an ordered task list, kept in the repository as the source of truth."
---

# Build from a specification

Use this when the request is larger than one edit: a new feature, a migration, or an application the user describes in prose. The specification is a repository file, not a chat message.

The workflow is GitHub Spec Kit's, adapted to this harness. Upstream ships slash commands (`/speckit.*`) for agents that have them; here each phase is a step you run with the normal tools, so it works in every session.

1. **Constitution.** Read `AGENTS.md`, the package `AGENTS.md`, and `.specify/constitution.md` when the repository has one. These rules override anything the user asks that would break them; say so before planning.
2. **Specify.** Run `pwsh tools/specify.ps1 -Feature "<name>"`. It creates `specs/NNN-<slug>/` with `spec.md`, `plan.md`, `tasks.md`, `research.md`. Fill `spec.md` with prioritized user stories (P1…), `Given/When/Then` acceptance scenarios, requirements (`FR-*`), and measurable success criteria (`SC-*`). Write what the user needs, never how to implement it.
3. **Clarify.** Ask the user only the questions that change the spec's content, one batch of `ask_user_question`, then edit the file. Do not fill a gap with a guess that later becomes a requirement.
4. **Plan.** Fill `plan.md`: runtime and language, dependencies, storage, the tests that will own the behavior, files touched, data flow, failure modes, and risks. Record a constitution check that names every rule this feature touches.
5. **Tasks.** Fill `tasks.md` as ordered, independently checkable items (`T001`…), one file or one command each, with a verification phase last. A task that cannot be marked done by a command or a test is not a task.
6. **Implement.** Work the list with `todo_write`, one task at a time, ticking items in `tasks.md`. Keep the spec and plan current: when implementation proves a requirement wrong, edit the spec first, then the code.
7. **Converge.** Before reporting, compare spec, plan, tasks, and code: every `FR-*` has an implementation and a check, every task is ticked or explicitly dropped with a reason. Report the feature directory and the checks that ran.

Constraints: never delete or rewrite an existing `specs/` directory to fit a new idea — add a new number. Keep the documents short enough to review; a spec nobody reads is not a specification.
