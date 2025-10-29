# Git Workflow & Deployment Guide

## Branch Strategy

### Main Branches
- **`main`**: Production-ready code, automatically deployed to Vercel production
- **`dev`**: Development branch, automatically deployed to Vercel preview

### Feature Development
1. Create feature branches from `dev`: `feature/your-feature-name`
2. Work on your feature with regular commits
3. Create PR to merge into `dev`
4. After review and tests pass, merge to `dev`
5. When ready for production, create PR from `dev` to `main`

## Workflow Commands

### Development
```bash
# Start development server
npm run dev

# Run tests in watch mode
npm run test:watch

# Run linting
npm run lint

# Run type checking
npx tsc --noEmit
```

### Testing
```bash
# Run all tests once
npm run test

# Run tests with coverage
npm run test:coverage

# View coverage report
open coverage/index.html
```

### Deployment
- **Dev branch**: Automatically deploys to Vercel preview on push
- **Main branch**: Automatically deploys to Vercel production on push
- **Tags**: Create releases with `git tag v1.0.0 && git push origin v1.0.0`

## Required Vercel Secrets

Add these secrets to your GitHub repository settings:

1. `VERCEL_TOKEN`: Your Vercel API token
2. `VERCEL_ORG_ID`: Your Vercel organization ID
3. `VERCEL_PROJECT_ID`: Your Vercel project ID

### Getting Vercel Credentials

```bash
# Install Vercel CLI
npm i -g vercel

# Login and link project
vercel login
vercel link

# Get org and project IDs
vercel env ls
```

## Branch Protection Rules

Recommended settings for `main` and `dev` branches:

- ✅ Require pull request reviews before merging
- ✅ Require status checks to pass before merging
  - ✅ Run Tests
  - ✅ Build check
- ✅ Require branches to be up to date before merging
- ✅ Require linear history
- ✅ Do not allow bypassing the above settings

## CI/CD Pipeline

### On Pull Requests
1. Install dependencies
2. Run linting
3. Run type checking
4. Run unit tests with coverage
5. Build application
6. Comment coverage report on PR

### On Push to Dev
1. Run full test suite
2. Build application
3. Deploy to Vercel preview

### On Push to Main
1. Run full test suite
2. Build application
3. Deploy to Vercel production

### On Release Tags
1. Run full test suite
2. Build application
3. Create GitHub release
4. Deploy to production

## Coverage Requirements

- Lines: 80%
- Functions: 80%
- Branches: 70%
- Statements: 80%

## Best Practices

1. **Always create PRs** - Never push directly to `main` or `dev`
2. **Write tests** - Maintain coverage thresholds
3. **Use conventional commits** - Follow semantic commit messages
4. **Keep PRs small** - Easier to review and test
5. **Update documentation** - Keep README and docs current
6. **Test locally first** - Run `npm run test` and `npm run build` before pushing