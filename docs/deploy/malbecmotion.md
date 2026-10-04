# Publicar PsicoLink en malbecmotion.com

Esta guía reemplaza a ngrok por el dominio propio. La app sigue corriendo igual
(`next start` en el puerto 3000, base SQLite en el disco); lo que cambia es qué
se pone delante para atender `https://malbecmotion.com`:

- **Camino A — Cloudflare Tunnel (recomendado para este servidor).** El servidor
  tiene IP privada (`192.168.220.66`), así que no se lo puede alcanzar
  directamente desde internet. El túnel sale desde el servidor hacia Cloudflare,
  como hacía ngrok: no hay que abrir puertos en el router y funciona aunque el
  proveedor use CGNAT o la IP pública cambie. Pasos: 3, 4, 5, **6A**, 7–11.
- **Camino B — Caddy + redirección de puertos.** Solo si el router reenvía 80 y
  443 a `192.168.220.66` y la IP pública es fija y no compartida (sin CGNAT).
  Pasos: 1, 2, 3, 4, 5, **6B**, 7–11.

Para saber qué IP pública ve internet, en el servidor: `curl -4 ifconfig.me`.

> **Por qué un servidor y no Vercel:** la base es SQLite (`DATABASE_URL="file:..."`).
> En una plataforma serverless el disco no persiste entre despliegues, así que
> los datos se perderían. Para usar Vercel habría que migrar antes a Postgres.

Archivos de referencia en el repo:

- `deploy/cloudflared-config.yml` — configuración del túnel (camino A).
- `deploy/Caddyfile` — proxy HTTPS para `malbecmotion.com` y redirección de `www` (camino B).
- `deploy/psicolink.service` — servicio systemd de la app.
- `.env.example` — todas las variables, con los valores de producción comentados.

---

## 1. DNS (solo camino B)

El servidor necesita una **IP pública** y los puertos **80 y 443** abiertos.

| Tipo | Nombre | Valor                    |
|------|--------|--------------------------|
| A    | `@`    | IP pública del servidor  |
| A    | `www`  | IP pública del servidor  |

(Si el servidor tiene IPv6, agregar también los registros `AAAA`.)

Comprobar que ya propagó antes de seguir:

```bash
dig +short malbecmotion.com
dig +short www.malbecmotion.com
```

En el camino A los registros DNS los crea `cloudflared` (paso 6A).

## 2. Firewall (solo camino B)

```bash
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

En IBM Cloud también hay que permitir 80 y 443 en el security group / ACL de la
instancia.

## 3. Instalar la app

Node.js ≥ 20.9 (ver `ibm-almalinux-ngrok.md`, paso 1).

```bash
sudo mkdir -p /var/www && sudo chown -R $USER:$USER /var/www
cd /var/www
git clone https://github.com/TiagoBe0/GoogleOpenApp.git psicolink
cd psicolink
```

## 4. Variables de producción

```bash
cp .env.example .env.production
openssl rand -base64 32        # → AUTH_SECRET
npx web-push generate-vapid-keys   # → VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY
nano .env.production
```

Valores que cambian respecto de desarrollo:

```env
NODE_ENV=production
DATABASE_URL="file:./prod.db"

AUTH_SECRET="EL_GENERADO"
AUTH_URL="https://malbecmotion.com"
NEXTAUTH_URL="https://malbecmotion.com"
AUTH_TRUST_HOST="true"

GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# Credenciales de PRODUCCIÓN (no TEST)
MP_ACCESS_TOKEN="APP_USR-..."
MP_PUBLIC_KEY="APP_USR-..."
MP_WEBHOOK_SECRET="..."

SMTP_FROM="PsicoLink <turnos@malbecmotion.com>"
VAPID_SUBJECT="mailto:contacto@malbecmotion.com"
```

`AUTH_URL` es la variable importante: de ahí salen los links de los mails, las
URLs de vuelta de MercadoPago y la URL del webhook (`src/lib/app-url.ts`).
Va **sin barra final** y **con https**.

`.env.production` está en `.gitignore`: nunca se sube al repo.

## 5. Compilar y levantar la app

```bash
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build

sudo cp deploy/psicolink.service /etc/systemd/system/psicolink.service
sudo nano /etc/systemd/system/psicolink.service   # poner tu usuario en User=
sudo systemctl daemon-reload
sudo systemctl enable --now psicolink
curl -I http://127.0.0.1:3000
```

Si venías usando el servicio `miterapia` + ngrok, apagarlos para que no compitan
por el puerto:

```bash
sudo systemctl disable --now miterapia ngrok
```

## 6A. Cloudflare Tunnel

**a) Pasar el dominio a Cloudflare.** Crear una cuenta gratis en Cloudflare,
"Add a site" → `malbecmotion.com`, plan Free. Cloudflare indica dos
*nameservers*: cargarlos en el panel donde compraste el dominio (si es `.com`,
el registrador; reemplazan a los que haya). La propagación puede tardar desde
minutos hasta un día; Cloudflare avisa por mail cuando el dominio queda activo.

**b) Instalar `cloudflared` en el servidor.**

```bash
curl -fsSL https://pkg.cloudflare.com/cloudflared.repo | sudo tee /etc/yum.repos.d/cloudflared.repo
sudo dnf install -y cloudflared
cloudflared --version
```

(Si el repo cambió, seguir la instalación para RHEL de la documentación oficial
de Cloudflare.)

**c) Crear el túnel y los registros DNS.**

```bash
cloudflared tunnel login                 # abre un link: autorizar malbecmotion.com
cloudflared tunnel create psicolink      # imprime el TUNNEL_ID y crea ~/.cloudflared/<ID>.json
cloudflared tunnel route dns psicolink malbecmotion.com
cloudflared tunnel route dns psicolink www.malbecmotion.com
```

**d) Configurar y dejarlo como servicio.**

```bash
sudo mkdir -p /etc/cloudflared
sudo cp ~/.cloudflared/<TUNNEL_ID>.json /etc/cloudflared/
sudo cp deploy/cloudflared-config.yml /etc/cloudflared/config.yml
sudo nano /etc/cloudflared/config.yml    # reemplazar TUNNEL_ID (2 lugares)

cloudflared tunnel --config /etc/cloudflared/config.yml ingress validate
sudo cloudflared service install
sudo systemctl enable --now cloudflared
journalctl -u cloudflared -f
```

**e) HTTPS y `www`.** El certificado lo pone Cloudflare, no hay nada que
instalar. En el panel de Cloudflare:

- SSL/TLS → Edge Certificates → **Always Use HTTPS**: activado.
- Para que `www` redirija al dominio principal: Rules → **Redirect Rules** →
  plantilla "Redirect from WWW to root". Si no se configura, `www` igual
  funciona (el túnel lo atiende), pero conviene una sola URL para Google OAuth.

No hace falta abrir puertos en el firewall ni en el router: el túnel solo usa
conexiones salientes.

## 6B. Caddy (HTTPS)

```bash
sudo dnf install -y 'dnf-command(copr)'
sudo dnf copr enable -y @caddy/caddy
sudo dnf install -y caddy

sudo cp deploy/Caddyfile /etc/caddy/Caddyfile
sudo systemctl enable --now caddy
journalctl -u caddy -f    # ver que obtenga el certificado
```

Las instrucciones de instalación de Caddy pueden cambiar; si el `copr` falla,
seguir las de la documentación oficial de Caddy para Fedora/RHEL.

Con SELinux activo, si Caddy devuelve 502 al hablar con Node:

```bash
sudo setsebool -P httpd_can_network_connect 1
```

## 7. Google Cloud Console (OAuth)

APIs & Services → Credentials → el OAuth Client ID de la app:

- **Authorized JavaScript origins:** `https://malbecmotion.com`
- **Authorized redirect URIs:** `https://malbecmotion.com/api/auth/callback/google`

OAuth consent screen:

- **Authorized domains:** `malbecmotion.com`
- Completar URL de la página principal, política de privacidad y términos
  (Google los pide para publicar la app y para verificarla por el scope
  `calendar.events`).

Se puede dejar cargada la URL de ngrok mientras dure la transición.

## 8. MercadoPago

Panel de desarrolladores → tu aplicación:

- **Webhooks → URL de producción:** `https://malbecmotion.com/api/payments/webhook`
- Copiar la **clave secreta** del webhook a `MP_WEBHOOK_SECRET`.
- Pasar a credenciales de producción en `MP_ACCESS_TOKEN` / `MP_PUBLIC_KEY`.

Las `back_urls` y `notification_url` de cada pago ya se arman solas con
`AUTH_URL`; no hay que cargarlas a mano.

## 9. Correo desde @malbecmotion.com

Para que los avisos salgan desde `turnos@malbecmotion.com` sin caer en spam, el
proveedor SMTP (Resend, etc.) pide verificar el dominio: agrega registros
**SPF**, **DKIM** (y conviene **DMARC**) en el DNS. Los valores exactos los da
el proveedor al verificar el dominio.

Con Gmail SMTP el remitente queda siendo la cuenta de Gmail, no el dominio.

## 10. Checklist final

- [ ] `https://malbecmotion.com` abre con candado.
- [ ] `https://www.malbecmotion.com` redirige al dominio sin `www`.
- [ ] Login con Google funciona (si falla con `redirect_uri_mismatch`, revisar
      paso 7 y que `AUTH_URL` coincida exactamente).
- [ ] Reservar un turno con pago lleva a MercadoPago y vuelve a
      `/payments/success`.
- [ ] El webhook llega: `journalctl -u psicolink -f` mientras se paga.
- [ ] La app se puede instalar en el teléfono (PWA requiere HTTPS: ya lo hay).
- [ ] Llega el mail de aviso del turno.

## 11. Actualizar después de cambios

```bash
cd /var/www/psicolink
git pull
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
sudo systemctl restart psicolink
```

## Backup de la base

Todo vive en `prisma/prod.db`. Copiarla periódicamente fuera del servidor, por
ejemplo con un cron diario:

```bash
sqlite3 /var/www/psicolink/prisma/prod.db ".backup '/var/backups/psicolink-$(date +%F).db'"
```
