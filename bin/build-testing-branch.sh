#!/usr/bin/env bash
set -euo pipefail

# Build a testing branch by squash-merging all open/draft PRs onto develop.
# Creates: testing/YYYYMMDD (or testing/YYYYMMDD-N if one already exists)
# Usage: bin/build-testing-branch.sh [--dry-run]

DRY_RUN=false
[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=true

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

DATE=$(date +%Y%m%d)
BASE_BRANCH="develop"

# --- Helpers ---

log()  { echo "→ $*"; }
warn() { echo "⚠ $*" >&2; }
fail() { echo "✘ $*" >&2; exit 1; }

switch_back() {
  git checkout "$original_branch" --quiet 2>/dev/null || true
}

# --- Preflight ---

command -v gh >/dev/null || fail "gh CLI is required (brew install gh)"
git diff --quiet && git diff --cached --quiet || fail "Working tree is dirty. Commit or stash first."

original_branch=$(git rev-parse --abbrev-ref HEAD)

log "Fetching latest from origin..."
git fetch origin --prune --quiet

# --- Determine testing branch name ---

testing_branch="testing/${DATE}"
suffix=0
while git rev-parse --verify "origin/${testing_branch}" &>/dev/null; do
  suffix=$((suffix + 1))
  testing_branch="testing/${DATE}-${suffix}"
done

# --- Collect open + draft PRs (sorted by number) ---

pr_json=$(gh pr list --state open --json number,headRefName,title,isDraft \
  --jq 'sort_by(.number) | .[]| "\(.number)\t\(.headRefName)\t\(.title)"')

if [[ -z "$pr_json" ]]; then
  warn "No open PRs found. Nothing to do."
  exit 0
fi

log "PRs to merge (in order):"
echo "$pr_json" | while IFS=$'\t' read -r num branch title; do
  echo "   #${num} ${branch} — ${title}"
done
echo ""

if $DRY_RUN; then
  log "[dry-run] Would create ${testing_branch} from origin/${BASE_BRANCH} and squash-merge the above PRs."
  exit 0
fi

# --- Create testing branch from develop ---

log "Creating ${testing_branch} from origin/${BASE_BRANCH}..."
git checkout -b "$testing_branch" "origin/${BASE_BRANCH}" --quiet

# --- Squash-merge each PR ---

merged=()
skipped=()

while IFS=$'\t' read -r num branch title; do
  log "Squash-merging #${num} (${branch})..."

  # Make sure we have the branch ref
  if ! git rev-parse --verify "origin/${branch}" &>/dev/null; then
    warn "  Branch origin/${branch} not found — skipping #${num}"
    skipped+=("#${num} ${title} (branch not found)")
    continue
  fi

  if git merge --squash "origin/${branch}" --quiet 2>/dev/null; then
    git commit --no-edit -m "PR #${num}: ${title}" --quiet
    merged+=("#${num} ${title}")
    log "  ✔ Merged"
  else
    warn "  ✘ Conflict — skipping #${num}"
    git merge --abort 2>/dev/null || git reset --hard HEAD --quiet
    skipped+=("#${num} ${title} (merge conflict)")
  fi
done <<< "$pr_json"

# --- Push ---

log "Pushing ${testing_branch} to origin..."
git push -u origin "$testing_branch" --quiet

# --- Summary ---

echo ""
echo "═══════════════════════════════════════════"
echo "Testing branch: ${testing_branch}"
echo "═══════════════════════════════════════════"

if [[ ${#merged[@]} -gt 0 ]]; then
  echo ""
  echo "Merged (${#merged[@]}):"
  printf "  ✔ %s\n" "${merged[@]}"
fi

if [[ ${#skipped[@]} -gt 0 ]]; then
  echo ""
  echo "Skipped (${#skipped[@]}):"
  printf "  ✘ %s\n" "${skipped[@]}"
fi

echo ""
read -rp "Deploy ${testing_branch} to dev now? [y/N] " deploy_answer
if [[ "${deploy_answer,,}" == "y" ]]; then
  log "Deploying ${testing_branch}..."
  bin/deploy-dev.sh
  log "Switching back to ${original_branch}..."
  switch_back
else
  log "Switching back to ${original_branch}..."
  switch_back
  echo "To deploy later: git checkout ${testing_branch} && bin/deploy-dev.sh"
fi
