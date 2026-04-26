# Deploy en IBM AlmaLinux con ngrok

Esta guía publica la app como servidor Node.js con `next start` en `localhost:3000` y expone HTTPS con ngrok.

## 1. Preparar AlmaLinux

```bash
sudo dnf update -y
sudo dnf install -y git curl tar openssl

# Next.js 16 requiere Node.js 20.9 o superior.
sudo dnf module reset nodejs -y
sudo dnf module enable nodejs:20 -y
sudo dnf install -y nodejs npm

node -v
npm -v
```

Si `node -v` queda por debajo de `20.9.0`, instalá Node 22 LTS con tu método preferido y repetí la verificación.

## 2. Subir el proyecto

Opción por Git:

```bash
sudo mkdir -p /var/www
sudo chown -R $USER:$USER /var/www
cd /var/www
git clone <URL_DEL_REPO> miterapia
cd miterapia
```

Opción por `scp` desde tu máquina:

```bash
rsync -av --exclude node_modules --exclude .next ./ usuario@IP_DEL_IBM:/var/www/miterapia/
```

## 3. Variables de entorno

Crear `/var/www/miterapia/.env.production`:

```bash
cd /var/www/miterapia
openssl rand -base64 32
nano .env.production
```

Contenido:

```env
NODE_ENV=production
DATABASE_URL="file:./prod.db"

AUTH_SECRET="PEGAR_SECRET_GENERADO"

# Usar el dominio público de ngrok. Mejor si es estático/reservado.
AUTH_URL="https://TU-DOMINIO.ngrok-free.app"
NEXTAUTH_URL="https://TU-DOMINIO.ngrok-free.app"

GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

En Google Cloud Console, agregar este redirect URI en el OAuth Client:

```text
https://TU-DOMINIO.ngrok-free.app/api/auth/callback/google
```

Si usás ngrok gratis con URL aleatoria, cada reinicio puede cambiar la URL. En ese caso hay que actualizar `AUTH_URL`, `NEXTAUTH_URL` y el redirect URI de Google cada vez. Para evitarlo, usá un dominio estático/reservado de ngrok.

## 4. Instalar, migrar y compilar

```bash
cd /var/www/miterapia
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
```

Prueba manual:

```bash
npm run start
# en otra terminal:
curl -I http://localhost:3000
```

Detener con `Ctrl+C`.

## 5. Servicio systemd para Next.js

Crear `/etc/systemd/system/miterapia.service`:

```bash
sudo nano /etc/systemd/system/miterapia.service
```

Contenido:

```ini
[Unit]
Description=MiTerapia Next.js app
After=network.target

[Service]
Type=simple
User=TU_USUARIO
WorkingDirectory=/var/www/miterapia
EnvironmentFile=/var/www/miterapia/.env.production
Environment=PORT=3000
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Activar:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now miterapia
sudo systemctl status miterapia
journalctl -u miterapia -f
```

## 6. Instalar ngrok

```bash
cd /tmp
wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz
sudo tar xvzf ./ngrok-v3-stable-linux-amd64.tgz -C /usr/local/bin
ngrok version
ngrok config add-authtoken TU_NGROK_AUTHTOKEN
```

Prueba manual:

```bash
ngrok http 3000
```

Abrí la URL HTTPS que te muestra ngrok. Si Google OAuth falla, revisá que esa URL coincida exactamente con `AUTH_URL`, `NEXTAUTH_URL` y el redirect URI autorizado.

## 7. ngrok como servicio

Editar config:

```bash
ngrok config edit
```

Para dominio estático:

```yaml
version: "3"
endpoints:
  - name: miterapia
    url: https://TU-DOMINIO.ngrok-free.app
    upstream:
      url: 3000
```

Para URL aleatoria:

```yaml
version: "3"
endpoints:
  - name: miterapia
    upstream:
      url: 3000
```

Instalar servicio:

```bash
sudo ngrok service install --config $HOME/.config/ngrok/ngrok.yml
sudo ngrok service start
sudo systemctl status ngrok
journalctl -u ngrok -f
```

## 8. Checklist de salud

```bash
systemctl status miterapia
systemctl status ngrok
curl -I http://localhost:3000
```

En navegador:

- `https://TU-DOMINIO.ngrok-free.app`
- Login con Google
- `/patient`
- `/dashboard`

## 9. Deploy de cambios

```bash
cd /var/www/miterapia
git pull
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
sudo systemctl restart miterapia
sudo systemctl status miterapia
```
