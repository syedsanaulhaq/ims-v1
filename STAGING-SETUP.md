# 🎯 Staging Environment Setup Guide

This guide explains how to set up and use the staging environment for presentations and demos.

## 🏗️ Environment Structure

```
📁 Project
├── 🌐 Production (main branch)    - Stable, live system
├── 🎭 Staging (staging branch)    - Demo/presentation ready
└── 🔧 Development (dev branch)    - Active development
```

## 📂 Environment Configuration

### Database Separation
- **Production**: `InventoryManagementDB_PROD` (port 3001)
- **Staging**: `InventoryManagementDB_STAGING` (port 3002)  
- **Development**: `InventoryManagementDB_DEV` (port 3003)

### Configuration Files
- `.env.production` - Production settings
- `.env.staging` - Staging/demo settings
- `.env.development` - Development settings

## 🚀 Quick Start

### 1. Switch to Staging Branch
```bash
git checkout staging
```

### 2. Install Dependencies
```bash
npm install
cd scripts && npm install
```

### 3. Create Staging Database
```sql
-- Run in SQL Server Management Studio
CREATE DATABASE InventoryManagementDB_STAGING;
-- Run your schema scripts on this database
```

### 4. Start Staging Environment
```bash
# Method 1: Using environment scripts
npm run start:staging

# Method 2: Using environment switcher
node scripts/switch-environment.js staging
npm start
```

### 5. Prepare Demo Data
```bash
# Reset with clean demo data
npm run demo:reset
```

## 🎬 For Presentations

### Before Your Presentation

1. **Switch to staging environment**:
   ```bash
   git checkout staging
   npm run demo:prepare
   ```

2. **Reset demo data** (clean, realistic data):
   ```bash
   npm run demo:reset
   ```

3. **Start the system**:
   ```bash
   npm run start:staging    # Backend (port 3002)
   npm run dev:staging      # Frontend 
   ```

4. **Verify everything works**:
   - Navigate to `http://localhost:8080`
   - Check Dashboard → Stock Acquisition 
   - Verify TransactionManager shows proper item names
   - Test the workflow from dashboard to transaction manager

### During Presentations

- ✅ **Safe environment** - No risk of breaking production
- ✅ **Clean data** - No "Unknown Item" or debugging artifacts
- ✅ **Stable branch** - Code is tested and working
- ✅ **Isolated database** - Separate from development work

### After Presentations

```bash
# Return to development
git checkout main
npm run start:development
```

## 🔧 Available Commands

### Environment Management
```bash
# Switch environments
node scripts/switch-environment.js production
node scripts/switch-environment.js staging  
node scripts/switch-environment.js development

# Start specific environments
npm run start:production     # Port 3001
npm run start:staging       # Port 3002
npm run start:development   # Port 3003
```

### Database Management
```bash
# Run migrations on specific environment
npm run db:migrate:production
npm run db:migrate:staging
npm run db:migrate:development
```

### Demo Preparation
```bash
# Prepare staging for demo
npm run demo:prepare

# Reset demo data (clean slate)
npm run demo:reset
```

## 🛡️ Safety Features

### Branch Protection
- `main` branch: Production-ready code
- `staging` branch: Presentation-ready, stable
- `development` branch: Active work, may be unstable

### Database Isolation
- Each environment has its own database
- No risk of corrupting production data during demos
- Clean, predictable data for presentations

### Port Separation
- Production: 3001
- Staging: 3002  
- Development: 3003

## 🔍 Troubleshooting

### "Unknown Item" Issues
```bash
# Reset demo data with proper relationships
npm run demo:reset
```

### Database Connection Issues
```bash
# Check environment configuration
node scripts/switch-environment.js staging
```

### Port Conflicts
```bash
# Kill existing processes
npx kill-port 3001 3002 3003
```

## 📋 Pre-Presentation Checklist

- [ ] Switched to staging branch
- [ ] Staging database created and populated
- [ ] Demo data reset (clean, realistic)
- [ ] Backend running on port 3002
- [ ] Frontend running and connected
- [ ] Dashboard → TransactionManager workflow tested
- [ ] Item names displaying correctly (no "Unknown Item")
- [ ] All major features working

## 🎯 Best Practices

1. **Always use staging for demos** - Never present from development
2. **Reset demo data before important presentations**
3. **Test the full workflow** before going live
4. **Keep staging branch stable** - Only merge tested features
5. **Use environment switcher** for easy management

## 🆘 Emergency Backup

If something goes wrong during a presentation:

```bash
# Quick fix: Restart staging with fresh data
npm run demo:reset
npm run start:staging
```

This will give you a clean, working system in under 30 seconds.

---

**Remember**: The staging environment is your safety net for presentations. Use it to ensure a smooth, professional demo every time! 🎭✨
