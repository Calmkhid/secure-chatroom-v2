#!/bin/bash

echo "🚀 Secure Chatroom Deployment Script"
echo "====================================="

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📁 Initializing Git repository..."
    git init
fi

# Add all files
echo "📦 Adding files to Git..."
git add .

# Commit changes
echo "💾 Committing changes..."
git commit -m "Deploy secure chatroom application"

# Check if remote exists
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "⚠️  No remote repository configured."
    echo "Please run these commands manually:"
    echo "1. Create a repository on GitHub"
    echo "2. Run: git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git"
    echo "3. Run: git push -u origin main"
else
    echo "🚀 Pushing to GitHub..."
    git push origin main
fi

echo ""
echo "✅ Local deployment complete!"
echo ""
echo "📋 Next steps for Render deployment:"
echo "1. Go to https://render.com"
echo "2. Sign up/Login with GitHub"
echo "3. Click 'New +' → 'Web Service'"
echo "4. Connect your GitHub repository"
echo "5. Set environment variables:"
echo "   - NODE_ENV=production"
echo "   - SESSION_SECRET=your-secret-key"
echo "   - MONGO_URI=your-mongodb-connection-string"
echo ""
echo "📖 See DEPLOYMENT.md for detailed instructions" 