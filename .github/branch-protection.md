# Recommended Branch Rules

Use these settings for the `main` branch in GitHub.

1. Require a pull request before merging.
2. Require status checks to pass before merging.
3. Require these checks:
   - `Frontend build`
   - `Backend tests`
4. Require branches to be up to date before merging.
5. Do not allow force pushes.
6. Do not allow deletions.
7. Keep direct pushes disabled for normal development.

This keeps `main` protected while still allowing deployment to run after a tested merge.
