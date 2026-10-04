# Git workflow

1. Pull latest `development`: `git checkout development && git pull origin development`
2. Create your branch: `git checkout -b feature/<name>-<topic>`
3. Commit often with clear messages.
4. Open a PR **into `development`** (not `main`).
5. At least one teammate review before merge.
6. Release to `main` is done by the team lead when milestones are stable.

## PR checklist

- [ ] Code lives in the correct module folder (see `PROJECT_STRUCTURE.md`).
- [ ] Shared types updated in `shared/types` if contracts change.
- [ ] Manual test steps listed in the PR description.
- [ ] No secrets committed (use `.env.example` only).
