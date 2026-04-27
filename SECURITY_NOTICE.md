# 🔒 SECURITY NOTICE

## IMMEDIATE ACTION REQUIRED

### 1. Rotate All API Keys
The following keys were found in the codebase and MUST be rotated immediately:
- ✅ OpenAI API Key
- ✅ Groq API Key
- ✅ Supabase Keys (if exposed in git history)

### 2. Check Git History
```bash
# Check if .env was ever committed
git log --all --full-history -- .env

# If found, clean history (BACKUP FIRST!)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all
```

### 3. Move API Keys to Supabase Edge Functions
All AI API calls have been moved to server-side Edge Functions.
See `supabase/functions/ai-operations/` for implementation.

### 4. Environment Variables
- Production keys should be set in Supabase Dashboard → Settings → Edge Functions
- Never commit `.env` file
- Use `.env.example` as template

## Security Improvements Implemented
- ✅ API keys moved to server-side
- ✅ Rate limiting added
- ✅ Input validation
- ✅ CSRF protection
- ✅ Content Security Policy
- ✅ SQL injection prevention
- ✅ Race condition fixes
