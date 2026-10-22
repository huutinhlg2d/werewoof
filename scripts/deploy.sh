#!/usr/bin/env bash
set -euo pipefail

# Pages must build from Actions; the token may lack admin rights, so a failure here is only a hint.
if ! gh api 'repos/{owner}/{repo}/pages' --silent 2>/dev/null; then
  gh api -X POST 'repos/{owner}/{repo}/pages' -f build_type=workflow --silent ||
    echo "Could not enable Pages: set Settings > Pages > Source to 'GitHub Actions' and re-run." >&2
fi

branch=$(git rev-parse --abbrev-ref HEAD)
if [[ "$branch" != "main" ]]; then
  echo "Deploys run from main; you are on '$branch'." >&2
  exit 1
fi

git fetch --quiet origin main
if [[ "$(git rev-parse HEAD)" != "$(git rev-parse origin/main)" ]]; then
  git push origin main # the push triggers the workflow
else
  gh workflow run deploy.yml --ref main
fi

# The run takes a moment to appear after the trigger.
sleep 5
run_id=$(gh run list --workflow deploy.yml --limit 1 --json databaseId --jq '.[0].databaseId')
gh run watch "$run_id" --exit-status

echo "Deployed: $(gh api 'repos/{owner}/{repo}/pages' --jq .html_url)"
