#!/usr/bin/env bash
# Instala o actualiza PsicoLink en el servidor. Se corre desde la raíz del repo:
#
#   bash deploy/setup.sh
#
# Se puede correr las veces que haga falta: la primera instala, las siguientes
# actualizan (sirve también después de cada git pull).
set -euo pipefail

cd "$(dirname "$0")/.."
APP_DIR="$(pwd)"
ENV_FILE="$APP_DIR/.env.production"
SERVICE=psicolink

step() { printf '\n\033[1;32m==> %s\033[0m\n' "$1"; }
fail() { printf '\n\033[1;31mERROR: %s\033[0m\n' "$1" >&2; exit 1; }

step "Node.js"
command -v node >/dev/null || fail "No está instalado Node.js (hace falta 20.9 o más nuevo)."
node -e 'const [a,b]=process.versions.node.split(".").map(Number); process.exit(a>20||(a===20&&b>=9)?0:1)' \
  || fail "Node $(node -v) es viejo: Next.js 16 pide 20.9 o más nuevo."
echo "Node $(node -v)"

step "Dependencias"
npm ci --no-audit --no-fund

step "Variables de producción"
[ -f "$ENV_FILE" ] || fail "Falta $ENV_FILE. Copiar .env.example y completarlo (ver docs/deploy/malbecmotion.md, paso 4)."
node scripts/check-env.mjs "$ENV_FILE"

# Prisma solo lee .env por su cuenta, no .env.production: se le pasa a mano.
DATABASE_URL="$(node -e 'process.stdout.write(require("dotenv").parse(require("fs").readFileSync(process.argv[1])).DATABASE_URL)' "$ENV_FILE")"
export DATABASE_URL

step "Base de datos"
if [ -f prisma/prod.db ]; then
  cp prisma/prod.db "prisma/prod.db.antes-de-migrar-$(date +%Y%m%d-%H%M%S)"
  echo "Copia de seguridad hecha antes de migrar."
fi
npx prisma generate
npx prisma migrate deploy

step "Build"
npm run build

step "Servicio systemd"
UNIT=/etc/systemd/system/$SERVICE.service
sed -e "s|^User=.*|User=$(id -un)|" \
    -e "s|/var/www/psicolink|$APP_DIR|g" \
    -e "s|/usr/bin/npx|$(command -v npx)|" \
    deploy/psicolink.service | sudo tee "$UNIT" >/dev/null
sudo systemctl daemon-reload
sudo systemctl enable "$SERVICE" >/dev/null 2>&1
sudo systemctl restart "$SERVICE"

step "Comprobación"
for _ in $(seq 1 30); do
  code="$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000 || true)"
  [ "$code" != "000" ] && break
  sleep 1
done
[ "$code" = "000" ] && fail "La app no responde en 127.0.0.1:3000. Ver: journalctl -u $SERVICE -n 50"
echo "La app responde en 127.0.0.1:3000 (HTTP $code)."
echo "Logs: journalctl -u $SERVICE -f"
