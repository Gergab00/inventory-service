# Git and commit instructions

## Commit messages
Always propose commit messages using Conventional Commits:

<type>(<scope>): <description>

Allowed types:
- feat
- fix
- refactor
- docs
- test
- chore
- build
- ci
- perf
- revert

Preferred scopes for this repository:
- products
- inventory
- warehouses
- fifo
- images
- orchestrator
- integration
- mongo
- api
- config
- ci
- release
- testing
- docs

Rules:
- Use lowercase type and scope.
- Use imperative mood in description.
- Do not end the description with a period.
- Avoid vague messages like "update", "changes", "fix stuff".
- Suggest one commit per logical change.
- Descriptions, notes, and optional body text must always be in Spanish.

## Branch names
Suggest branch names using:

<type>/<scope>/<short-kebab-description>

Examples:
- feature/inventory/add-fifo-pricing
- fix/products/preserve-external-id
- chore/ci/add-commitlint

## Pull requests
When suggesting PR titles, use Conventional Commit style when possible.