#!/usr/bin/env bash
# Deploy ai-dashboard to the production server (plain file copy, no git on the
# remote). Server credentials are kept out of the repo: copy deploy.conf.example
# to deploy.conf (gitignored) and fill in your values, or export them instead:
#
#   DEPLOY_SSH      SSH target, e.g. user@example.com        (required)
#   DEPLOY_DIR      remote app directory                     (required)
#   DEPLOY_SERVICE  systemd unit name                        (required)
#
# .env and data/ exist only on the server and are excluded from sync.
set -euo pipefail

cd "$(dirname "$0")/.."

# shellcheck disable=SC1091
[[ -f deploy.conf ]] && source deploy.conf

: "${DEPLOY_SSH:?set DEPLOY_SSH (SSH target, user@host)}"
: "${DEPLOY_DIR:?set DEPLOY_DIR (remote app directory)}"
: "${DEPLOY_SERVICE:?set DEPLOY_SERVICE (systemd unit name)}"

echo "==> Syncing files to ${DEPLOY_SSH}:${DEPLOY_DIR}"
rsync -az --delete \
  --exclude '.git' \
  --exclude '.next' \
  --exclude 'node_modules' \
  --exclude '.env' \
  --exclude 'data' \
  --exclude 'deploy.conf' \
  ./ "${DEPLOY_SSH}:${DEPLOY_DIR}/"

echo "==> Installing dependencies and building on server"
ssh "$DEPLOY_SSH" bash -s <<EOF
set -euo pipefail
cd ${DEPLOY_DIR}
npm ci
npm run build
systemctl restart ${DEPLOY_SERVICE}
EOF

echo "==> Verifying service"
ssh "$DEPLOY_SSH" "systemctl is-active ${DEPLOY_SERVICE}"

echo "==> Deploy done"
