# Admin Setup Guide

## Quick Access
Visit `/admin` route in your browser to access the admin panel.

## First-Time Setup (Root Admin)

Since you're setting up the admin system for the first time, you have two options:

### Option 1: Manual Setup via Admin Panel
1. Navigate to `/admin` in your browser
2. The system will generate a device fingerprint automatically
3. If your device isn't authorized yet, you'll see an "Unauthorized device" message
4. You can manually add your fingerprint and email through the database or use Option 2

### Option 2: Environment Variables (Recommended)
Set these environment variables in your Replit secrets:

```
ROOT_ADMIN_FINGERPRINT=your-device-fingerprint
ROOT_ADMIN_EMAIL=your-admin-email@example.com
```

The system will automatically create the root admin on startup.

### Option 3: Direct Database Setup
You can also manually insert your admin credentials directly into the storage system.

## How It Works

The admin system uses two-step verification:

1. **Device Fingerprint Check**: Verifies your device is authorized
2. **Email Verification**: Confirms your admin credentials

## Admin Roles

- **Root Host**: Can add/remove other admins, full system control
- **Admin**: Can bypass posting restrictions but cannot manage other admins

## Admin Benefits

- Bypass all spam detection and posting cooldowns
- Access to admin management panel (root host only)
- Future admin-only features