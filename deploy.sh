#!/bin/bash

# Deployment script for Google Cloud Platform

set -e

echo "🚀 Starting deployment to Google Cloud..."

# Check if gcloud CLI is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Error: gcloud CLI is not installed. Please install it first."
    echo "Visit: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ Error: Not authenticated with Google Cloud."
    echo "Please run: gcloud auth login"
    exit 1
fi

# Get current project
PROJECT_ID=$(gcloud config get-value project)
if [ -z "$PROJECT_ID" ]; then
    echo "❌ Error: No project set. Please run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo "📋 Project: $PROJECT_ID"

# Check if App Engine is enabled
if ! gcloud services list --enabled --filter="name:appengine.googleapis.com" --format="value(name)" | grep -q .; then
    echo "🔧 Enabling App Engine API..."
    gcloud services enable appengine.googleapis.com
fi

# Check if Cloud Build is enabled
if ! gcloud services list --enabled --filter="name:cloudbuild.googleapis.com" --format="value(name)" | grep -q .; then
    echo "🔧 Enabling Cloud Build API..."
    gcloud services enable cloudbuild.googleapis.com
fi

# Check if App Engine app exists
if ! gcloud app describe &> /dev/null; then
    echo "🏗️  Creating App Engine application..."
    echo "Available regions:"
    gcloud app regions list
    read -p "Enter region (e.g., europe-west1): " REGION
    gcloud app create --region=$REGION
fi

# Set environment variables
echo "🔐 Setting up environment variables..."
echo "Please provide the following environment variables:"

read -p "Database URL (PostgreSQL connection string): " DATABASE_URL
read -p "Session Secret (random string for session encryption): " SESSION_SECRET

# Create .env file for local testing
cat > .env.production << EOF
DATABASE_URL=${DATABASE_URL}
SESSION_SECRET=${SESSION_SECRET}
EOF

echo "✅ Environment variables saved to .env.production"

# Build the application
echo "🏗️  Building application..."
npm run build

# Deploy to App Engine
echo "🚀 Deploying to App Engine..."
gcloud app deploy --quiet \
    --set-env-vars DATABASE_URL="${DATABASE_URL}",SESSION_SECRET="${SESSION_SECRET}"

# Get the deployed URL
URL=$(gcloud app describe --format="value(defaultHostname)")
echo "✅ Deployment completed successfully!"
echo "🌐 Your app is available at: https://$URL"

# Optional: Open the app in browser
read -p "Open app in browser? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    gcloud app browse
fi

echo "🎉 Deployment process completed!"