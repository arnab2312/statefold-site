# Statefold repository instructions

## Required context

- Before planning, editing, reviewing, or deploying this project, read `PROJECT_MEMORY.md` in full.
- Treat `PROJECT_MEMORY.md` as the canonical durable product, design, technical, and deployment context for Statefold.
- For product claims, architecture, terminology, or messaging work, inspect the current `main` branch of the private product repository `https://github.com/arnab2312/EP-Agent-AI`, beginning with `README.md` and `CLAUDE.md`. Current product code and those two files override stale historical charters or positioning documents.
- The latest explicit user request overrides older memory when they conflict.

## Memory maintenance

- After any task that creates a durable decision, constraint, asset choice, architecture change, or deployment rule, update `PROJECT_MEMORY.md` in the same commit.
- Record settled facts and guardrails, not conversation history, experiments, temporary diagnostics, or rejected ideas.
- Keep the memory compact, non-repetitive, and useful as a prompt-cache-friendly prefix.
- Do not rewrite stable sections unless the underlying decision changed.

## Working agreement

- Preserve the static GitHub Pages architecture unless the user explicitly authorizes a migration.
- Do not edit or push the private `EP-Agent-AI` product repository unless the user explicitly asks; it is an authoritative read-only source during website work.
- Validate relevant files before publishing, then commit and push completed website changes to `main`.
- Use versioned asset URLs for changed production assets and verify the live custom domain after deployment.
- Keep user-facing updates and final responses concise.
