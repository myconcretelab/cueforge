#!/usr/bin/env bash

set -Eeuo pipefail

readonly DEPLOY_BRANCH="main"
readonly WORDPRESS_ACCOUNT="myconcretelab"
readonly WORDPRESS_SSH_HOST="ssh-myconcretelab.alwaysdata.net"
readonly WORDPRESS_ROOT="/home/myconcretelab/www/sonoriva.fr"
readonly WORDPRESS_PLUGIN_ROOT="$WORDPRESS_ROOT/wp-content/plugins/sonoriva-plans"
readonly WORDPRESS_THEME_ROOT="$WORDPRESS_ROOT/wp-content/themes/sonoriva-marketing"
readonly WORDPRESS_SITE_URL="https://sonoriva.fr"
readonly SONORIVA_PLANS_API_URL="https://app.sonoriva.fr/api/public/plans"

fail() {
  printf 'Erreur : %s\n' "$*" >&2
  exit 1
}

for command_name in curl git php rsync ssh; do
  command -v "$command_name" >/dev/null 2>&1 || fail "la commande '$command_name' est requise."
done

repo_root=$(git rev-parse --show-toplevel 2>/dev/null) || fail "ce script doit être lancé depuis le dépôt SonoRiva."
cd "$repo_root"

current_branch=$(git branch --show-current)
[[ "$current_branch" == "$DEPLOY_BRANCH" ]] || fail "seule la branche '$DEPLOY_BRANCH' peut être déployée."
[[ -z "$(git status --porcelain)" ]] || fail "le dépôt local contient des modifications non commitées."
git fetch --quiet origin "$DEPLOY_BRANCH"
[[ "$(git rev-parse HEAD)" == "$(git rev-parse "origin/$DEPLOY_BRANCH")" ]] || fail "HEAD n'est pas identique à origin/$DEPLOY_BRANCH."

local_plugin="$repo_root/wordpress/sonoriva-plans"
local_theme="$repo_root/wordpress/sonoriva-marketing"
while IFS= read -r php_file; do php -l "$php_file" >/dev/null; done < <(find "$local_plugin" "$local_theme" -type f -name '*.php' -print)

ssh "$WORDPRESS_ACCOUNT@$WORDPRESS_SSH_HOST" "
  set -Eeuo pipefail
  backup_dir='/home/myconcretelab/backups/sonoriva-wordpress'
  mkdir -p \"\$backup_dir\" '$WORDPRESS_PLUGIN_ROOT' '$WORDPRESS_THEME_ROOT'
  timestamp=\$(date -u +%Y%m%dT%H%M%SZ)
  tar -czf \"\$backup_dir/sonoriva-wordpress-\$timestamp.tar.gz\" -C '$WORDPRESS_ROOT/wp-content' plugins/sonoriva-plans themes/sonoriva-marketing
"

rsync -az --delete "$local_plugin/" "$WORDPRESS_ACCOUNT@$WORDPRESS_SSH_HOST:$WORDPRESS_PLUGIN_ROOT/"
rsync -az --delete "$local_theme/" "$WORDPRESS_ACCOUNT@$WORDPRESS_SSH_HOST:$WORDPRESS_THEME_ROOT/"

ssh "$WORDPRESS_ACCOUNT@$WORDPRESS_SSH_HOST" "
  set -Eeuo pipefail
  find '$WORDPRESS_PLUGIN_ROOT' '$WORDPRESS_THEME_ROOT' -type f -name '*.php' -exec php -l {} \; >/dev/null
  cd '$WORDPRESS_ROOT'
  php -r \"require 'wp-load.php'; require_once ABSPATH . 'wp-admin/includes/plugin.php'; activate_plugin('sonoriva-plans/sonoriva-plans.php'); switch_theme('sonoriva-marketing'); delete_transient('sonoriva_plans_api_response');\"
"

expected_card_count=$(curl --fail --silent --show-error "$SONORIVA_PLANS_API_URL" | php -r '
  $data = json_decode(stream_get_contents(STDIN), true);
  if (!is_array($data) || !isset($data["plans"]) || !is_array($data["plans"])) exit(1);
  echo count($data["plans"]);
')

wordpress_html=''
for attempt in 1 2 3 4 5; do
  wordpress_html=$(curl --fail --silent --show-error "$WORDPRESS_SITE_URL")
  card_count=$(grep -o 'class="pricing-card[^"]*"' <<< "$wordpress_html" | wc -l | tr -d ' ' || true)
  if [[ "$card_count" -eq "$expected_card_count" ]] \
    && grep --fixed-strings --quiet 'SonoRiva Bridge pour macOS et Windows' <<< "$wordpress_html" \
    && grep --fixed-strings --quiet 'Démarrer maintenant' <<< "$wordpress_html" \
    && grep --fixed-strings --quiet 'Choisir ce forfait' <<< "$wordpress_html" \
    && grep --fixed-strings --quiet 'Essayer maintenant !' <<< "$wordpress_html"; then
    break
  fi
  [[ "$attempt" -eq 5 ]] || sleep 2
done

card_count=$(grep -o 'class="pricing-card[^"]*"' <<< "$wordpress_html" | wc -l | tr -d ' ' || true)
[[ "$card_count" -eq "$expected_card_count" ]] || fail "le site WordPress affiche $card_count forfait(s), alors que l’API en publie $expected_card_count."
grep --fixed-strings --quiet 'SonoRiva Bridge pour macOS et Windows' <<< "$wordpress_html" || fail "le site WordPress n’affiche pas l’information SonoRiva Bridge."
grep --fixed-strings --quiet 'Démarrer maintenant' <<< "$wordpress_html" || fail "le forfait gratuit n’affiche pas son nouveau bouton."
grep --fixed-strings --quiet 'Choisir ce forfait' <<< "$wordpress_html" || fail "les forfaits payants n’affichent pas leur nouveau bouton."
grep --fixed-strings --quiet 'Essayer maintenant !' <<< "$wordpress_html" || fail "le header WordPress ne renvoie pas vers la démonstration."

printf 'Site WordPress SonoRiva déployé : %s\n' "$WORDPRESS_SITE_URL"
