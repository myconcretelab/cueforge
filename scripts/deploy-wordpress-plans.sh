#!/usr/bin/env bash

set -Eeuo pipefail

readonly DEPLOY_BRANCH="main"
readonly WORDPRESS_ACCOUNT="myconcretelab"
readonly WORDPRESS_SSH_HOST="ssh-myconcretelab.alwaysdata.net"
readonly WORDPRESS_ROOT="/home/myconcretelab/www/cueforge.fr"
readonly WORDPRESS_PLUGIN_FILE="$WORDPRESS_ROOT/wp-content/plugins/cueforge-plans/cueforge-plans.php"
readonly WORDPRESS_SITE_URL="https://cueforge.fr"

fail() {
  printf 'Erreur : %s\n' "$*" >&2
  exit 1
}

for command_name in curl git php scp ssh; do
  command -v "$command_name" >/dev/null 2>&1 || fail "la commande '$command_name' est requise."
done

repo_root=$(git rev-parse --show-toplevel 2>/dev/null) || fail "ce script doit être lancé depuis le dépôt CueForge."
cd "$repo_root"

current_branch=$(git branch --show-current)
[[ "$current_branch" == "$DEPLOY_BRANCH" ]] || fail "seule la branche '$DEPLOY_BRANCH' peut être déployée."
[[ -z "$(git status --porcelain)" ]] || fail "le dépôt local contient des modifications non commitées."
git fetch --quiet origin "$DEPLOY_BRANCH"
[[ "$(git rev-parse HEAD)" == "$(git rev-parse "origin/$DEPLOY_BRANCH")" ]] || fail "HEAD n'est pas identique à origin/$DEPLOY_BRANCH."

local_plugin="$repo_root/wordpress/cueforge-plans/cueforge-plans.php"
php -l "$local_plugin" >/dev/null

remote_candidate="$WORDPRESS_PLUGIN_FILE.next"
scp -q "$local_plugin" "$WORDPRESS_ACCOUNT@$WORDPRESS_SSH_HOST:$remote_candidate"
ssh "$WORDPRESS_ACCOUNT@$WORDPRESS_SSH_HOST" "
  set -Eeuo pipefail
  php -l '$remote_candidate' >/dev/null
  backup_dir='/home/myconcretelab/backups/cueforge-wordpress'
  mkdir -p \"\$backup_dir\"
  cp '$WORDPRESS_PLUGIN_FILE' \"\$backup_dir/cueforge-plans-\$(date -u +%Y%m%dT%H%M%SZ).php\"
  mv '$remote_candidate' '$WORDPRESS_PLUGIN_FILE'
  cd '$WORDPRESS_ROOT'
  php -r \"require 'wp-load.php'; delete_transient('cueforge_plans_api_response');\"
"

wordpress_html=$(curl --fail --silent --show-error "$WORDPRESS_SITE_URL")
if ! grep --fixed-strings --quiet 'CueForge Bridge pour macOS et Windows' <<< "$wordpress_html"; then
  fail "le site WordPress n’affiche pas l’information CueForge Bridge."
fi

printf 'Bloc des forfaits déployé : %s\n' "$WORDPRESS_SITE_URL"
