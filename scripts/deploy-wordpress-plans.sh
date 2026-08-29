#!/usr/bin/env bash

set -Eeuo pipefail

readonly DEPLOY_BRANCH="main"
readonly WORDPRESS_ACCOUNT="myconcretelab"
readonly WORDPRESS_SSH_HOST="ssh-myconcretelab.alwaysdata.net"
readonly WORDPRESS_ROOT="/home/myconcretelab/www/cueforge.fr"
readonly WORDPRESS_PLUGIN_FILE="$WORDPRESS_ROOT/wp-content/plugins/cueforge-plans/cueforge-plans.php"
readonly WORDPRESS_PLUGIN_STYLE="$WORDPRESS_ROOT/wp-content/plugins/cueforge-plans/style.css"
readonly WORDPRESS_THEME_HEADER="$WORDPRESS_ROOT/wp-content/themes/cueforge-marketing/header.php"
readonly WORDPRESS_SITE_URL="https://cueforge.fr"
readonly CUEFORGE_PLANS_API_URL="https://app.cueforge.fr/api/public/plans"

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
local_style="$repo_root/wordpress/cueforge-plans/style.css"
local_header="$repo_root/wordpress/cueforge-marketing/header.php"
php -l "$local_plugin" >/dev/null
php -l "$local_header" >/dev/null

remote_candidate="$WORDPRESS_PLUGIN_FILE.next"
remote_style_candidate="$WORDPRESS_PLUGIN_STYLE.next"
remote_header_candidate="$WORDPRESS_THEME_HEADER.next"
scp -q "$local_plugin" "$WORDPRESS_ACCOUNT@$WORDPRESS_SSH_HOST:$remote_candidate"
scp -q "$local_style" "$WORDPRESS_ACCOUNT@$WORDPRESS_SSH_HOST:$remote_style_candidate"
scp -q "$local_header" "$WORDPRESS_ACCOUNT@$WORDPRESS_SSH_HOST:$remote_header_candidate"
ssh "$WORDPRESS_ACCOUNT@$WORDPRESS_SSH_HOST" "
  set -Eeuo pipefail
  php -l '$remote_candidate' >/dev/null
  php -l '$remote_header_candidate' >/dev/null
  backup_dir='/home/myconcretelab/backups/cueforge-wordpress'
  mkdir -p \"\$backup_dir\"
  cp '$WORDPRESS_PLUGIN_FILE' \"\$backup_dir/cueforge-plans-\$(date -u +%Y%m%dT%H%M%SZ).php\"
  cp '$WORDPRESS_PLUGIN_STYLE' \"\$backup_dir/cueforge-plans-style-\$(date -u +%Y%m%dT%H%M%SZ).css\"
  cp '$WORDPRESS_THEME_HEADER' \"\$backup_dir/cueforge-header-\$(date -u +%Y%m%dT%H%M%SZ).php\"
  mv '$remote_candidate' '$WORDPRESS_PLUGIN_FILE'
  mv '$remote_style_candidate' '$WORDPRESS_PLUGIN_STYLE'
  mv '$remote_header_candidate' '$WORDPRESS_THEME_HEADER'
  cd '$WORDPRESS_ROOT'
  php -r \"require 'wp-load.php'; delete_transient('cueforge_plans_api_response');\"
"

expected_card_count=$(curl --fail --silent --show-error "$CUEFORGE_PLANS_API_URL" | php -r '
  $data = json_decode(stream_get_contents(STDIN), true);
  if (!is_array($data) || !isset($data["plans"]) || !is_array($data["plans"])) exit(1);
  echo count($data["plans"]);
')

wordpress_html=''
for attempt in 1 2 3 4 5; do
  wordpress_html=$(curl --fail --silent --show-error "$WORDPRESS_SITE_URL")
  card_count=$(grep -o 'class="pricing-card[^"]*"' <<< "$wordpress_html" | wc -l | tr -d ' ' || true)
  if [[ "$card_count" -eq "$expected_card_count" ]] \
    && grep --fixed-strings --quiet 'CueForge Bridge pour macOS et Windows' <<< "$wordpress_html" \
    && grep --fixed-strings --quiet 'Démarrer maintenant' <<< "$wordpress_html" \
    && grep --fixed-strings --quiet 'Choisir ce forfait' <<< "$wordpress_html" \
    && grep --fixed-strings --quiet 'Essayer maintenant !' <<< "$wordpress_html"; then
    break
  fi
  [[ "$attempt" -eq 5 ]] || sleep 2
done

card_count=$(grep -o 'class="pricing-card[^"]*"' <<< "$wordpress_html" | wc -l | tr -d ' ' || true)
[[ "$card_count" -eq "$expected_card_count" ]] || fail "le site WordPress affiche $card_count forfait(s), alors que l’API en publie $expected_card_count."
if ! grep --fixed-strings --quiet 'CueForge Bridge pour macOS et Windows' <<< "$wordpress_html"; then
  fail "le site WordPress n’affiche pas l’information CueForge Bridge."
fi
if ! grep --fixed-strings --quiet 'Démarrer maintenant' <<< "$wordpress_html"; then
  fail "le forfait gratuit n’affiche pas son nouveau bouton."
fi
if ! grep --fixed-strings --quiet 'Choisir ce forfait' <<< "$wordpress_html"; then
  fail "les forfaits payants n’affichent pas leur nouveau bouton."
fi
if ! grep --fixed-strings --quiet 'Essayer maintenant !' <<< "$wordpress_html"; then
  fail "le header WordPress ne renvoie pas vers la démonstration."
fi

printf 'Forfaits et header WordPress déployés : %s\n' "$WORDPRESS_SITE_URL"
