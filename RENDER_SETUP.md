# Render Deployment Fix

## Current Issue
Your app is deployed but can't connect to MongoDB. Here's how to fix it:

## Quick Fix Steps

### 1. Create MongoDB Database on Render

1. Go to [render.com](https://render.com) and login
2. Click "New +" → "Redis & MongoDB"
3. Select "MongoDB"
4. Name: `secure-chatroom-db`
5. Plan: Free
6. Click "Create Database"

### 2. Get Connection String

1. Click on your new MongoDB service
2. Copy the "Internal Database URL"
3. It looks like: `mongodb://username:password@host:port/database`

### 3. Update Web Service Environment Variables

1. Go to your web service (`secure-chatroom`)
2. Click "Environment" tab
3. Add/update these variables:

```
NODE_ENV=production
SESSION_SECRET=your-super-secret-key-here
MONGO_URI=mongodb://username:password@host:port/database
```

Replace the MONGO_URI with the connection string from step 2.

### 4. Redeploy

1. Go to your web service
2. Click "Manual Deploy" → "Deploy latest commit"
3. Wait for deployment to complete

### 5. Test Your App

Visit: `https://secure-chatroom.onrender.com`

## Alternative: Use MongoDB Atlas

If you prefer Atlas:

1. Go to MongoDB Atlas dashboard
2. Go to "Network Access"
3. Click "Add IP Address"
4. Add `0.0.0.0/0` (allows all IPs)
5. Update MONGO_URI in Render with your Atlas connection string

## Environment Variables Reference

```
NODE_ENV=production
SESSION_SECRET=your-secret-key-here
MONGO_URI=your-mongodb-connection-string
```

## Test Your App

Once deployed, your app should be available at:
`https://secure-chatroom.onrender.com`

Features that will work:
- ✅ User registration/login
- ✅ Real-time messaging
- ✅ User search
- ✅ Message history
- ✅ Online status
- ✅ Beautiful UI 