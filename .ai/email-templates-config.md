# Email Templates Configuration for 10xCards

This document describes the email templates configuration needed for Supabase Auth to support authentication flows in 10xCards application.

## Prerequisites

- Supabase project created
- Access to Supabase Dashboard
- `site_url` configured in Supabase Auth settings

## Configuration Location

Navigate to: **Supabase Dashboard → Authentication → Email Templates**

## Required Templates

### 1. Confirm Signup (Email Confirmation)

**When it's sent**: After user registration, to verify email address ownership.

**Template Name**: Confirm signup

**Subject Line**:
```
Confirm your email address - 10xCards
```

**Email Body** (HTML):
```html
<h2>Welcome to 10xCards!</h2>

<p>Thanks for signing up! Please confirm your email address by clicking the button below:</p>

<p>
  <a href="{{ .SiteURL }}/auth/confirm-email?token_hash={{ .TokenHash }}&type=signup" 
     style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">
    Confirm Email Address
  </a>
</p>

<p>Or copy and paste this URL into your browser:</p>
<p>{{ .SiteURL }}/auth/confirm-email?token_hash={{ .TokenHash }}&type=signup</p>

<p>This link will expire in 24 hours.</p>

<p>If you didn't create an account with 10xCards, you can safely ignore this email.</p>

<hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;">

<p style="color: #6b7280; font-size: 14px;">
  10xCards - Learn effectively with AI-powered flashcards
</p>
```

**Redirect URL**: 
```
{{ .SiteURL }}/auth/confirm-email?token_hash={{ .TokenHash }}&type=signup
```

---

### 2. Reset Password (Password Recovery)

**When it's sent**: When user requests password reset via "Forgot password" flow.

**Template Name**: Reset password

**Subject Line**:
```
Reset your password - 10xCards
```

**Email Body** (HTML):
```html
<h2>Reset Your Password</h2>

<p>We received a request to reset your password for your 10xCards account.</p>

<p>Click the button below to set a new password:</p>

<p>
  <a href="{{ .SiteURL }}/auth/reset-password?token_hash={{ .TokenHash }}&type=recovery" 
     style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">
    Reset Password
  </a>
</p>

<p>Or copy and paste this URL into your browser:</p>
<p>{{ .SiteURL }}/auth/reset-password?token_hash={{ .TokenHash }}&type=recovery</p>

<p>This link will expire in 1 hour.</p>

<p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>

<hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;">

<p style="color: #6b7280; font-size: 14px;">
  10xCards - Learn effectively with AI-powered flashcards
</p>
```

**Redirect URL**: 
```
{{ .SiteURL }}/auth/reset-password?token_hash={{ .TokenHash }}&type=recovery
```

---

### 3. Magic Link (Optional - for passwordless auth in future)

**When it's sent**: For passwordless authentication (not implemented in MVP).

**Template Name**: Magic Link

**Note**: This template is not used in the current implementation but can be configured for future use.

---

## Configuration Steps

### Step 1: Configure Site URL

1. Navigate to: **Supabase Dashboard → Authentication → URL Configuration**
2. Set **Site URL** to:
   - **Development**: `http://127.0.0.1:3000` or `http://localhost:3000`
   - **Production**: Your production domain (e.g., `https://10xcards.com`)

### Step 2: Configure Redirect URLs

1. Navigate to: **Supabase Dashboard → Authentication → URL Configuration**
2. Add **Redirect URLs**:
   - Development: `http://127.0.0.1:3000/auth/**`
   - Production: `https://yourdomain.com/auth/**`

### Step 3: Apply Email Templates

For each template listed above:

1. Navigate to: **Supabase Dashboard → Authentication → Email Templates**
2. Select the template to edit
3. Copy the **Subject Line** and **Email Body** from above
4. Set the **Redirect URL** as specified
5. Click **Save**

### Step 4: Test Email Delivery

**For Development (Local Testing)**:

Supabase provides built-in email testing via "Inbucket" - a local SMTP server.

1. When running local Supabase: `supabase start`
2. Access Inbucket at: `http://localhost:54324`
3. All emails sent during development will appear here
4. You can click links directly from Inbucket

**For Production**:

1. Configure SMTP settings in Supabase Dashboard
2. Or use Supabase's built-in email service (limited free tier)
3. Recommended: Integrate with SendGrid, AWS SES, or similar for production

---

## Testing the Authentication Flow

### Test Registration Flow

1. Register a new user at `/auth/register` (when implemented)
2. Check email inbox (or Inbucket for local)
3. Click confirmation link
4. Verify redirect to `/auth/confirm-email`
5. Verify user can now log in at `/auth/login`

### Test Login Flow (Current Implementation)

1. Create a user manually in Supabase Dashboard with confirmed email
2. Navigate to `/auth/login`
3. Enter credentials
4. Verify redirect to home page
5. Verify user session is maintained

### Test Password Recovery Flow (Future)

1. Navigate to `/auth/recover-password` (when implemented)
2. Enter email address
3. Check email inbox (or Inbucket)
4. Click reset link
5. Verify redirect to `/auth/reset-password`
6. Set new password
7. Verify redirect to login page
8. Test login with new password

---

## Token Expiry Configuration

Configure token expiry times in: **Supabase Dashboard → Authentication → Auth Providers → Email**

**Recommended Settings**:

- **Email Confirmation Token**: 24 hours (86400 seconds)
- **Password Recovery Token**: 1 hour (3600 seconds)
- **Refresh Token Lifetime**: 7 days (604800 seconds)
- **JWT Expiry**: 1 hour (3600 seconds)

---

## Rate Limiting

Supabase automatically applies rate limiting to prevent abuse:

- **Email sending**: 2-4 emails per hour per user
- **Authentication attempts**: Limited per IP address
- **Token verification**: Limited per token

These settings can be adjusted in Supabase Dashboard if needed.

---

## Troubleshooting

### Emails not being received

1. **Local Development**: Check Inbucket at `http://localhost:54324`
2. **Production**: 
   - Verify SMTP settings
   - Check spam folder
   - Verify email provider quota
   - Check Supabase logs

### Confirmation link not working

1. Verify `site_url` is correct in Supabase config
2. Verify redirect URLs include the auth routes
3. Check browser console for errors
4. Verify token hasn't expired

### User not created in public.users table

1. Verify database trigger is applied (run migration)
2. Check Supabase logs for errors
3. Verify email is confirmed in auth.users table
4. Check roles table has 'user' role

---

## Security Considerations

1. **Token Security**: Tokens are single-use and expire after configured time
2. **HTTPS Required**: In production, ensure all URLs use HTTPS
3. **CORS Configuration**: Verify allowed origins in Supabase settings
4. **Email Provider**: Use reputable email provider in production
5. **Rate Limiting**: Keep default rate limits to prevent abuse

---

## Future Enhancements

- Custom email designs matching 10xCards branding
- Localization support (multiple languages)
- Email preferences for users
- Welcome email sequence
- Activity notifications

---

**Last Updated**: 2025-10-28  
**Version**: 1.0  
**Related Files**: 
- `/src/pages/auth/confirm-email.astro` (to be implemented)
- `/src/pages/auth/reset-password.astro` (to be implemented)
- `/supabase/migrations/20251028120000_auth_user_trigger.sql`

