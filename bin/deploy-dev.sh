#!/usr/bin/env bash
set -euo pipefail

REMOTE_HOST="dev.elevator.umn.edu"
REMOTE_DIR="/var/www/elevator/current/assets/elevator-ui"

branch=$(git rev-parse --abbrev-ref HEAD)

echo "Deploying branch: $branch to $REMOTE_HOST"
echo "Make sure you are connected to the VPN."
echo ""

ssh "$REMOTE_HOST" bash -s "$branch" "$REMOTE_DIR" <<'REMOTE_SCRIPT'
set -euo pipefail

BRANCH="$1"
DIR="$2"

cd "$DIR"
echo "→ Fetching latest branches..."
git fetch --all --prune

echo "→ Checking out $BRANCH..."
git checkout "$BRANCH"
git pull origin "$BRANCH"

echo "→ Installing dependencies..."
yarn

echo "→ Building (remotedev)..."
yarn build:remotedev

echo ""
echo "✔ Deploy complete: $BRANCH on $(hostname)"
REMOTE_SCRIPT

echo ""
echo "🔗 https://dev.elevator.umn.edu/defaultinstance"
