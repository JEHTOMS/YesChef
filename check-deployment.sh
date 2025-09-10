#!/bin/bash

# YesChef Deployment Status Checker
echo "🚀 YesChef Deployment Status"
echo "=============================="

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Not in a Git repository"
    exit 1
fi

# Get current repository info
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null)
if [ -z "$REPO" ]; then
    echo "❌ Unable to get repository info. Make sure you're logged into GitHub CLI."
    exit 1
fi

echo "📁 Repository: $REPO"
echo

# Check GitHub secrets
echo "🔐 GitHub Secrets Status:"
gh secret list | while read line; do
    if [[ $line == *"NAME"* ]]; then
        continue
    fi
    secret_name=$(echo $line | awk '{print $1}')
    updated=$(echo $line | cut -d' ' -f2-)
    echo "  ✅ $secret_name (Updated: $updated)"
done
echo

# Check GitHub Pages status
echo "📄 GitHub Pages Status:"
pages_info=$(gh api /repos/$REPO/pages 2>/dev/null)
if [ $? -eq 0 ]; then
    status=$(echo $pages_info | jq -r '.status')
    url=$(echo $pages_info | jq -r '.html_url')
    build_type=$(echo $pages_info | jq -r '.build_type')
    echo "  Status: $status"
    echo "  URL: $url"
    echo "  Build Type: $build_type"
else
    echo "  ❌ GitHub Pages not enabled"
fi
echo

# Check latest workflow runs
echo "⚙️  Recent Workflow Runs:"
gh run list --limit 5 --json status,conclusion,workflowName,createdAt --jq '.[] | "  \(.workflowName): \(.status) (\(.conclusion // "running")) - \(.createdAt | fromdateiso8601 | strftime("%Y-%m-%d %H:%M"))"'
echo

# Next steps
echo "🎯 Next Steps:"
echo "  1. Commit and push your changes to trigger deployment"
echo "  2. Check workflow status: gh run list"
echo "  3. View deployment logs: gh run view"
echo "  4. Visit your app: https://jehtoms.github.io/YesChef"
echo
echo "📊 Quick Commands:"
echo "  • Check workflow status: gh run list"
echo "  • View latest run: gh run view"
echo "  • Re-run failed workflow: gh run rerun"
echo "  • View secrets: gh secret list"
