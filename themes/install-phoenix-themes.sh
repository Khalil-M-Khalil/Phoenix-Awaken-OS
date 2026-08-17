#!/usr/bin/env bash
set -euo pipefail

# Phoenix Awaken OS visual identity: install four named KDE schemes and wallpapers.
# The script is idempotent and does not change user files unless explicitly asked.

prefix="${1:-/}"
share="${prefix%/}/usr/share/phoenix-awaken/themes"
colors="${prefix%/}/usr/share/color-schemes"
xdg="${prefix%/}/etc/xdg"

mkdir -p "$share/assets" "$colors" "$xdg"
install -m 0644 themes/assets/*.svg "$share/assets/"
install -m 0644 themes/phoenix-ember/PhoenixEmber.colors "$colors/"
install -m 0644 themes/phoenix-ash/PhoenixAsh.colors "$colors/"
install -m 0644 themes/phoenix-dawn/PhoenixDawn.colors "$colors/"
install -m 0644 themes/phoenix-evidence/PhoenixEvidence.colors "$colors/"
install -m 0644 themes/kdeglobals "$xdg/kdeglobals"

cat > "$share/theme-index.json" <<'EOF'
{
  "default": "Phoenix Ember",
  "themes": [
    {"id":"ember","name":"Phoenix Ember","colorScheme":"PhoenixEmber","wallpaper":"phoenix-ember-wallpaper.svg","mode":"dark"},
    {"id":"ash","name":"Phoenix Ash","colorScheme":"PhoenixAsh","wallpaper":"phoenix-ash-wallpaper.svg","mode":"light"},
    {"id":"dawn","name":"Phoenix Dawn","colorScheme":"PhoenixDawn","wallpaper":"phoenix-dawn-wallpaper.svg","mode":"light"},
    {"id":"evidence","name":"Phoenix Evidence","colorScheme":"PhoenixEvidence","wallpaper":"phoenix-evidence-wallpaper.svg","mode":"dark"}
  ]
}
EOF

printf 'Phoenix themes installed under %s\n' "$share"
