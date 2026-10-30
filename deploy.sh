#!/usr/bin/env bash
# Build Metric-Chess for production and sync dist/ to $METRICCHESSDEPLOY.
# Usage: ./deploy.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

# Load deploy path from festival env if not already set
if [[ -z "${METRICCHESSDEPLOY:-}" && -f "${HOME}/.festival.env" ]]; then
  # shellcheck disable=SC1091
  source "${HOME}/.festival.env"
fi

if [[ -z "${METRICCHESSDEPLOY:-}" ]]; then
  echo "METRICCHESSDEPLOY is not set (expected in ~/.festival.env)." >&2
  exit 1
fi

if [[ ! -d "$METRICCHESSDEPLOY" ]]; then
  echo "Deploy target does not exist: $METRICCHESSDEPLOY" >&2
  exit 1
fi

echo "Building (npm run build:prod)…"
npm run build:prod

if [[ ! -d "$ROOT/dist" ]]; then
  echo "Build succeeded but dist/ is missing." >&2
  exit 1
fi

echo "Deploying dist/ → $METRICCHESSDEPLOY"
rsync -a --delete --no-perms --no-owner --no-group --info=stats2 \
  "$ROOT/dist/" "$METRICCHESSDEPLOY/"

echo "Done."
