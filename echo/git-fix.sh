#!/bin/bash

# Check if an argument is provided
if [ $# -eq 0 ]; then
    echo "Error: Please provide a fix description as an argument."
    echo "Usage: $0 <fix description>"
    exit 1
fi

# Use the first argument as the fix description
fix_description="$1"

# Checkout main branch and pull
git checkout main
git pull

# Check if there were any errors during pull
if [ $? -ne 0 ]; then
    echo "Error occurred while pulling from main. Aborting."
    exit 1
fi

# Process fix description for branch name (remove spaces, convert to lowercase, replace spaces with /)
fix_branch="fix/$(echo "$fix_description" | tr '[:upper:]' '[:lower:]' | tr ' ' '/' | sed 's/[^a-z0-9\/]/-/g')"

# Create and checkout the new branch
git checkout -b "$fix_branch"

# Add all files
git add .

# Commit changes using the original fix description as the commit message
git commit -m "fix $fix_description"

# Push and set upstream
git push -u origin "$fix_branch"

echo "Fix branch '$fix_branch' created and pushed to remote."
echo "Commit message: $fix_description"
