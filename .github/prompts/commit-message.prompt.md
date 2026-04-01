---
name: commit-message
description: "Analyzes the current git changes and performs the correct commit workflow for the repository, ensuring atomic, reviewable commits with proper Conventional Commit messages."
---
# Analyze changes and commit them correctly

You are responsible for analyzing the current git diff and repository state, deciding the correct commit strategy, and executing it when possible.

Do not only generate a commit message. You must determine whether the changes should be committed as one atomic commit, multiple atomic commits, or split across different branches.

Follow these mandatory rules available in:
- [Git conventions](../instructions/git.instructions.md)

Repository context:
- [Global Copilot instructions](../copilot-instructions.md)

Required workflow:
1. Inspect the repository using git status, git diff, and staged changes.
2. Identify the real intent of each change.
3. Group files only by semantic cohesion, architectural responsibility, and shared delivery objective.
4. If all changes belong together, create a single Conventional Commit.
5. If multiple logical changes are present, split them into separate commits and commit them independently.
6. If unrelated work is mixed together, do not commit it on the same branch without warning. Recommend or create branch separation when appropriate.
7. Use terminal commands to stage and commit the correct files when the environment allows it.
8. Never stop at only suggesting the message if terminal execution is available.
9. After execution, report exactly what was committed and why.
10. If execution is not possible, provide the exact git commands to run.

Output requirements:
- Show the reasoning for commit grouping briefly.
- Show each commit message used.
- Show which files belong to each commit.
- Warn clearly if branch separation is needed.