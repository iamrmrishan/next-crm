# Next.js CRM

[![CI/CD Pipeline](https://github.com/iamrmrishan/next-crm/actions/workflows/ci.yml/badge.svg)](https://github.com/iamrmrishan/next-crm/actions/workflows/ci.yml)
[![Pull Request Checks](https://github.com/iamrmrishan/next-crm/actions/workflows/pr-checks.yml/badge.svg)](https://github.com/iamrmrishan/next-crm/actions/workflows/pr-checks.yml)

A modern Customer Relationship Management (CRM) system built with Next.js 15, TypeScript, and Supabase. Features include order management, data analytics, and a robust migration system for moving from local file storage to cloud database.

## 🚀 Features

- **Modern Stack**: Built with Next.js 15, React, TypeScript, and Supabase
- **Order Management**: Track customer orders with rich filtering and search capabilities
- **Data Migration**: Seamless migration from local files to Supabase with validation
- **Security First**: Row Level Security (RLS) policies for data protection
- **Optimized Performance**: Indexed database queries for fast data retrieval
- **CI/CD Pipeline**: Automated testing and deployment workflows
- **Branch Strategy**: Structured development workflow with automatic deployments

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Environment Setup](#environment-setup)
- [Database Migration](#database-migration)
- [Git Workflow](#git-workflow)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Project Structure](#project-structure)

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm, yarn, pnpm, or bun
- A Supabase account ([Sign up for free](https://supabase.com))
- A Vercel account for deployment (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/iamrmrishan/next-crm.git
   cd next-crm
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # Optional: For admin operations
   ```

   > **Where to find these values:**
   > - Go to your [Supabase Dashboard](https://supabase.com/dashboard)
   > - Select your project
   > - Navigate to Settings → API
   > - Copy the URL and anon key

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Environment Setup

### Required Environment Variables

| Variable | Description | Required | Where to Find |
|----------|-------------|----------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anonymous key | Yes | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (admin) | No* | Supabase Dashboard → Settings → API |

*Required only for data migration scripts

## Database Migration

### Overview

The migration system provides a safe and reliable way to move order data from local files to Supabase with:

- ✅ Optimized database schema with proper indexing
- ✅ Row Level Security (RLS) policies
- ✅ Batch processing for large datasets
- ✅ Data validation and error handling
- ✅ Rollback capabilities
- ✅ Verification tools

### Files Structure

```
supabase/
├── migrations/
│   └── 001_create_orders_table.sql    # Database schema and RLS policies
└── README.md                          # Migration documentation

scripts/
├── migrate-data.ts                    # Main migration script
├── rollback-migration.ts              # Rollback utilities
└── verify-migration.ts                # Data integrity verification
```

### Database Schema

**Orders Table Structure:**

The `orders` table includes:

#### Columns
- `id` (TEXT, PRIMARY KEY) - Unique order identifier
- `customer` (TEXT, NOT NULL) - Customer name
- `category` (TEXT, NOT NULL) - Product category
- `date` (DATE, NOT NULL) - Order date
- `source` (TEXT, NOT NULL) - Order source (Online, In-Store, App, Phone)
- `geo` (TEXT, NOT NULL) - Geographic location
- `created_at` (TIMESTAMP WITH TIME ZONE) - Record creation timestamp
- `updated_at` (TIMESTAMP WITH TIME ZONE) - Record last update timestamp

#### Indexes
- `idx_orders_date` - Single column index on date
- `idx_orders_category` - Single column index on category
- `idx_orders_source` - Single column index on source
- `idx_orders_geo` - Single column index on geo
- `idx_orders_composite` - Composite index on (date, category, source)
- `idx_orders_date_desc` - Descending index on date for recent orders

#### Row Level Security (RLS)
- Authenticated users: Full access (SELECT, INSERT, UPDATE, DELETE)
- Anonymous users: Read-only access (SELECT)

### Migration Process

#### Step 1: Apply Database Schema

1. **Manual Application** (Recommended):
   - Copy the contents of `supabase/migrations/001_create_orders_table.sql`
   - Paste and execute in your Supabase SQL Editor
   - Verify the table and indexes are created successfully

2. **Using Supabase CLI** (Alternative):
   ```bash
   supabase db push
   ```

#### Step 2: Run Data Migration

Execute the migration script to transfer data from local files:

```bash
npx tsx scripts/migrate-data.ts
```

The script will:
- Validate all order data before migration
- Process data in batches to avoid overwhelming the database
- Provide detailed progress and error reporting
- Verify data integrity after migration

#### Step 3: Verify Migration

Run the verification script to ensure data integrity:

```bash
npx tsx scripts/verify-migration.ts
```

## Git Workflow

### Branch Strategy

#### Main Branches
- **`main`**: Production-ready code, automatically deployed to Vercel production
- **`dev`**: Development branch, automatically deployed to Vercel preview

#### Feature Development Workflow

1. Create feature branches from `dev`:
   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b feature/your-feature-name
   ```

2. Work on your feature with regular commits:
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

3. Push your feature branch:
   ```bash
   git push origin feature/your-feature-name
   ```

4. Create PR to merge into `dev`

5. After review and tests pass, merge to `dev`

6. When ready for production, create PR from `dev` to `main`

### Conventional Commits

Use semantic commit messages:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

### Branch Protection Rules

Recommended settings for `main` and `dev` branches:

- ✅ Require pull request reviews before merging
- ✅ Require status checks to pass before merging
  - ✅ Run Tests
  - ✅ Build check
- ✅ Require branches to be up to date before merging
- ✅ Require linear history
- ✅ Do not allow bypassing the above settings

## Development

### Development Commands

```bash
# Start development server
npm run dev

# Run tests in watch mode
npm run test:watch

# Run linting
npm run lint

# Run type checking
npx tsc --noEmit

# Format code
npm run format  # if available
```

### Best Practices

1. **Always create PRs** - Never push directly to `main` or `dev`
2. **Write tests** - Maintain coverage thresholds
3. **Use conventional commits** - Follow semantic commit messages
4. **Keep PRs small** - Easier to review and test
5. **Update documentation** - Keep README and docs current
6. **Test locally first** - Run `npm run test` and `npm run build` before pushing

## Testing

### Testing Commands

```bash
# Run all tests once
npm run test

# Run tests with coverage
npm run test:coverage

# View coverage report
open coverage/index.html  # macOS
xdg-open coverage/index.html  # Linux
start coverage/index.html  # Windows
```

### Coverage Requirements

- Lines: 80%
- Functions: 80%
- Branches: 70%
- Statements: 80%

## Deployment

### Automatic Deployments

- **Dev branch**: Automatically deploys to Vercel preview on push
- **Main branch**: Automatically deploys to Vercel production on push
- **Tags**: Create releases with `git tag v1.0.0 && git push origin v1.0.0`

### Manual Deployment

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

### Required Vercel Secrets

Add these secrets to your GitHub repository settings (Settings → Secrets and variables → Actions):

1. `VERCEL_TOKEN`: Your Vercel API token
2. `VERCEL_ORG_ID`: Your Vercel organization ID
3. `VERCEL_PROJECT_ID`: Your Vercel project ID

#### Getting Vercel Credentials

```bash
# Install Vercel CLI
npm i -g vercel

# Login and link project
vercel login
vercel link

# Get org and project IDs from .vercel/project.json
cat .vercel/project.json
```

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

## Project Structure

```
next-crm/
├── app/                    # Next.js app directory
│   └── page.tsx           # Main page component
├── scripts/               # Migration and utility scripts
│   ├── migrate-data.ts
│   ├── rollback-migration.ts
│   └── verify-migration.ts
├── supabase/              # Supabase configuration
│   └── migrations/        # Database migrations
├── .github/               # GitHub Actions workflows
│   └── workflows/
├── public/                # Static assets
├── .env.local            # Environment variables (not in git)
├── package.json          # Project dependencies
└── README.md             # This file
```

## Learn More

To learn more about the technologies used in this project:

- [Next.js Documentation](https://nextjs.org/docs) - Learn about Next.js features and API
- [Learn Next.js](https://nextjs.org/learn) - Interactive Next.js tutorial
- [Supabase Documentation](https://supabase.com/docs) - Learn about Supabase
- [Vercel Platform](https://vercel.com/docs) - Deployment platform documentation

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch from `dev`
3. Make your changes
4. Write or update tests
5. Ensure all tests pass
6. Submit a pull request

### Pull Request Guidelines

When submitting a pull request, please use the following template:

#### Description
Brief description of the changes made.

#### Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Code refactoring

#### Testing
- [ ] Tests pass locally with `npm run test`
- [ ] Linting passes with `npm run lint`
- [ ] Build succeeds with `npm run build`
- [ ] Manual testing completed

#### Checklist
- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes

#### Screenshots (if applicable)
Add screenshots to help explain your changes.

#### Additional Notes
Any additional information or context about the PR.

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

If you encounter any issues or have questions:

- Check the [Next.js GitHub repository](https://github.com/vercel/next.js)
- Review [Supabase documentation](https://supabase.com/docs)
- Open an issue in this repository

---