# GitHub Repository Setup

Instructions to push this backend code to a new GitHub repository.

## Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `agenticSDLC-backend`
3. Description: `Backend API server for AgenticSDLC workflow orchestration platform`
4. Visibility: Choose Public or Private
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click "Create repository"

## Step 2: Configure Git Remote

GitHub will show you commands. Use these:

```bash
cd agenticSDLC-backend
git remote add origin https://github.com/YOUR_USERNAME/agenticSDLC-backend.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

## Step 3: Verify

1. Go to your GitHub repository page
2. You should see all files including:
   - README.md
   - SETUP.md
   - API.md
   - config/, db/, models/, routes/ folders
   - server.js, package.json

## Step 4: Update Frontend Reference

In your frontend repository (`agenticSDLC-UI-Code`):

Update README.md to reference the backend repo:
```markdown
## Related Repositories

- **Backend**: https://github.com/YOUR_USERNAME/agenticSDLC-backend
- **Agents**: https://github.com/YOUR_USERNAME/agenticsdlc-agents
```

## Step 5: Add Topics (Optional)

On GitHub repository page:
1. Click "⚙️ Settings"
2. Under "Topics", add:
   - `nodejs`
   - `express`
   - `postgresql`
   - `rest-api`
   - `workflow`
   - `orchestration`

## Example Remote URLs

### HTTPS (recommended)
```bash
git remote add origin https://github.com/YOUR_USERNAME/agenticSDLC-backend.git
```

### SSH (if you have SSH keys set up)
```bash
git remote add origin git@github.com:YOUR_USERNAME/agenticSDLC-backend.git
```

## Verify Remote

```bash
git remote -v
```

Should show:
```
origin  https://github.com/YOUR_USERNAME/agenticSDLC-backend.git (fetch)
origin  https://github.com/YOUR_USERNAME/agenticSDLC-backend.git (push)
```

## Clone Instructions for Others

After pushing, others can clone with:
```bash
git clone https://github.com/YOUR_USERNAME/agenticSDLC-backend.git
cd agenticSDLC-backend
npm install
cp .env.example .env
# Edit .env with database credentials
npm run setup-db
npm run dev
```

## Repository Settings Recommendations

### Branch Protection
1. Go to Settings → Branches
2. Add rule for `main` branch
3. Enable:
   - ✅ Require pull request reviews before merging
   - ✅ Require status checks to pass before merging

### Secrets (for CI/CD)
If you add GitHub Actions later:
1. Settings → Secrets and variables → Actions
2. Add secrets like:
   - `DB_PASSWORD`
   - `DATABASE_URL`

## Next Steps

After pushing to GitHub:
1. ✅ Repository is now backed up
2. ✅ Others can collaborate
3. ✅ Can set up CI/CD pipelines
4. ✅ Can deploy to cloud services

## Integration with Frontend

The frontend repository should reference this backend:

**In frontend `.env`:**
```env
# Development
VITE_API_BASE_URL=http://localhost:3001

# Production
VITE_API_BASE_URL=https://api.your-domain.com
```

**In frontend README:**
```markdown
## Backend Repository

This frontend connects to the AgenticSDLC Backend API.

Repository: https://github.com/YOUR_USERNAME/agenticSDLC-backend

See backend README for setup instructions.
```

## Common Issues

### Push rejected
```bash
git pull origin main --rebase
git push -u origin main
```

### Authentication failed
Use a Personal Access Token instead of password:
1. GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token with `repo` scope
3. Use token as password when pushing

### Wrong remote URL
```bash
git remote remove origin
git remote add origin <correct-url>
```

## Done!

Your backend is now on GitHub and ready for collaboration! 🎉
