# Quiz Arena Backend - Sunucu Kurulum Rehberi

DigitalOcean sunucusunda (206.189.201.111) backend kurulumu ve Socket.IO ayarları.

---

## 1. Sunucuya Bağlan

```bash
ssh root@206.189.201.111
```

---

## 2. Gereksinimler (Node.js, PM2, Git)

```bash
# Node.js 18+ (yoksa)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# PM2 (sürekli çalışması için)
sudo npm install -g pm2

# Git (yoksa)
sudo apt install -y git
```

---

## 3. Projeyi Klonla

```bash
cd /var/www   # veya /home veya uygun bir dizin
sudo mkdir -p /var/www
cd /var/www
sudo git clone https://github.com/omercankara/quizbackend.git
cd quizbackend
```

> **Not:** Repo private ise `git clone` yerine token ile:
> `git clone https://TOKEN@github.com/omercankara/quizbackend.git`

---

## 4. .env Dosyası Oluştur

```bash
nano .env
```

Aşağıdaki içeriği yapıştır (DB bilgilerini kendi sunucuna göre düzenle):

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASS=omercan34.!
DB_NAME=quiz_arena
```

Kaydet: `Ctrl+O` → Enter → `Ctrl+X`

---

## 5. Bağımlılıkları Kur ve Çalıştır

```bash
npm install
npm start
```

Terminalde "Server 3000 portunda çalışıyor" görünmeli. Test için `Ctrl+C` ile durdur, sonra PM2 ile başlat:

```bash
pm2 start src/index.js --name quizbackend
pm2 save
pm2 startup
```

---

## 6. Nginx - Socket.IO Proxy

Mevcut `quizarena` config'inde (`/etc/nginx/sites-available/quizarena`) **hem API hem Socket.IO** için proxy olmalı. Örnek tam config:

```nginx
server {
    listen 80;
    server_name _;

    location = /phpmyadmin { return 301 /phpmyadmin/; }
    location /phpmyadmin/ {
        alias /usr/share/phpmyadmin/;
        index index.php;
        location ~ \.php$ {
            fastcgi_pass unix:/run/php/php8.3-fpm.sock;
            fastcgi_param SCRIPT_FILENAME $request_filename;
            include fastcgi_params;
        }
    }

    # Socket.IO - WebSocket upgrade (ÖNEMLİ: bu blok olmadan soket bağlantısı çalışmaz)
    location /socket.io/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # API ve diğer istekler
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Config test ve reload:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 7. Frontend Ayarları

Expo/React Native build'de API/Socket URL sunucu IP ile ayarlanmalı:

```bash
# Frontend dizininde
EXPO_PUBLIC_API_URL=http://206.189.201.111 npm run build
```

veya `frontend/.env` / `app.json` içinde:

```
EXPO_PUBLIC_API_URL=http://206.189.201.111
```

---

## 8. Test

- API: `http://206.189.201.111/` → `{"status":"ok","message":"Quiz Game Backend"}`
- Socket.IO: Ana socket ve `/chat` namespace'i aynı host üzerinden çalışır (polling → websocket upgrade)

---

## PM2 Komutları

```bash
pm2 list          # Çalışan uygulamalar
pm2 logs quizbackend   # Loglar
pm2 restart quizbackend
pm2 stop quizbackend
```
