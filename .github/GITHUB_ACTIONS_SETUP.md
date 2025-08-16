# GitHub Actions Secrets Configuration Guide

This document outlines the required secrets and environment configuration for the GitHub Actions CI/CD pipeline.

## Required Repository Secrets

Configure these secrets in your GitHub repository settings (`Settings > Secrets and variables > Actions`):

### Production Environment Secrets
```
SUPABASE_URL_PROD=https://[your-project-ref].supabase.co
SUPABASE_ANON_KEY_PROD=[your-production-anon-key]
SUPABASE_SERVICE_ROLE_KEY_PROD=[your-production-service-role-key]
DATABASE_URL_PROD=[your-production-database-url]
OPENAI_API_KEY_PROD=[your-production-openai-api-key]
```

### Local/Development Environment Secrets
```
SUPABASE_URL_LOCAL=http://127.0.0.1:54321
SUPABASE_ANON_KEY_LOCAL=[your-local-anon-key]
SUPABASE_SERVICE_ROLE_KEY_LOCAL=[your-local-service-role-key]
```

### Shared Secrets
```
OPENAI_API_KEY=[your-openai-api-key]
ANTHROPIC_API_KEY=[your-anthropic-api-key]
CODECOV_TOKEN=[your-codecov-token] (optional)
```

## GitHub Environments Setup

### 1. Create Production Environment

1. Go to repository `Settings > Environments`
2. Click "New environment"
3. Name: `production`
4. Configure protection rules:
   - ✅ Required reviewers (recommended: 1-2 team members)
   - ✅ Wait timer: 5 minutes (optional)
   - ✅ Deployment branches: `main` only

### 2. Environment Variables

Add these to the `production` environment:
```
DEPLOYMENT_ENV=production
NODE_ENV=production
```

## Branch Protection Rules

Configure branch protection for each branch:

### Main Branch Protection
```yaml
Branch: main
Rules:
  ✅ Require a pull request before merging
  ✅ Require status checks to pass before merging
  ✅ Require branches to be up to date before merging
  ✅ Require deployments to succeed before merging
  ✅ Restrict pushes that create files larger than 100MB
  ✅ Do not allow bypassing the above settings
```

### Config/Remote Branch Protection
```yaml
Branch: config/remote
Rules:
  ✅ Require a pull request before merging
  ✅ Require status checks to pass before merging
  ✅ Require branches to be up to date before merging
  ✅ Restrict pushes that create files larger than 100MB
```

### Config/Local Branch Protection
```yaml
Branch: config/local
Rules:
  ✅ Require status checks to pass before merging
  ✅ Require branches to be up to date before merging
```

## Required Status Checks

Add these status checks to branch protection rules:

### For config/local
- `TDD Environment Validation`
- `Unit Tests (Vitest)`
- `Local Build Validation`
- `Code Quality & Linting`
- `TDD Compliance Verification`

### For config/remote
- `Production Environment Validation`
- `Production Database Validation`
- `Production Build Validation`
- `E2E Tests (Production Config) - MANDATORY`
- `AI Services Integration Test`
- `Security & Performance Validation`

### For main
- `Pre-Deployment Validation`
- `Production Database Health Check`
- `Production Deployment Build`
- `Post-Deployment Health Verification`

## Webhook Configuration (Optional)

For external integrations, configure webhooks:

1. Go to `Settings > Webhooks`
2. Add webhook URL
3. Select events:
   - ✅ Push
   - ✅ Pull requests
   - ✅ Deployment status
   - ✅ Check runs

## Security Best Practices

### Secret Management
- ✅ Never commit secrets to code
- ✅ Use environment-specific secrets
- ✅ Rotate secrets regularly
- ✅ Limit secret access to necessary workflows only

### Access Control
- ✅ Enable 2FA for all collaborators
- ✅ Use least privilege principle
- ✅ Review permissions regularly
- ✅ Enable security advisories

### Monitoring
- ✅ Enable workflow notifications
- ✅ Monitor failed deployments
- ✅ Review security alerts
- ✅ Track secret usage

## Troubleshooting

### Common Issues

**Workflow fails with "Secret not found"**
```
Solution: Verify secret name matches exactly in workflow and settings
Check: Repository > Settings > Secrets and variables > Actions
```

**Environment validation fails**
```
Solution: Ensure all required secrets are configured
Check: Database URLs, API keys, environment-specific values
```

**Branch protection blocks merge**
```
Solution: Ensure all required status checks pass
Check: Workflow logs for specific failures
```

**Deployment fails**
```
Solution: Check Vercel deployment logs
Check: Environment variables in Vercel dashboard
```

## Workflow Monitoring

### Dashboard Links
- **GitHub Actions**: `https://github.com/[username]/[repo]/actions`
- **Vercel Deployments**: `https://vercel.com/dashboard`
- **Supabase Dashboard**: `https://app.supabase.com/projects`

### Key Metrics to Monitor
- ✅ Workflow success rate
- ✅ Deployment frequency
- ✅ Lead time for changes
- ✅ Mean time to recovery
- ✅ Test coverage trends

## Support

For issues with GitHub Actions configuration:
1. Check workflow logs for specific errors
2. Verify secrets configuration
3. Review branch protection rules
4. Test environment validation locally
5. Contact team lead for access issues

