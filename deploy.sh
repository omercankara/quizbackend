#!/bin/bash
# Quiz Arena Backend - Sunucu Kurulum Scripti
# Kullanım: chmod +x deploy.sh && ./deploy.sh

set -e

echo "=== Quiz Arena Backend Kurulumu ==="

# Dizin
DEPLOY_DIR="/var/www/quizbackend"
REPO_URL="https://github.com/omercankara/quizbackend.git"

# Node.js kontrol
if ! command -v node &> /dev/null; then
    echo "Node.js bulunamadı. Kuruluyor..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi

# PM2 kur (yoksa)
if ! command -v pm2 &> /dev/null; then
    echo "PM2 kuruluyor..."
    sudo npm install -g pm2
fi

# Proje dizini
sudo mkdir -p /var/www
cd /var/www

if [ -d "quizbackend" ]; then
    echo "Mevcut repo güncelleniyor..."
    cd quizbackend
    sudo git pull origin main
else
    echo "Repo klonlanıyor..."
    sudo git clone "$REPO_URL" quizbackend
    cd quizbackend
fi

# .env kontrol
if [ ! -f .env ]; then
    echo ".env dosyası oluşturuluyor (değiştirmeyi unutma!)"
    cat > .env << 'ENVFILE'
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASS=omercan34.!
DB_NAME=quiz_arena
ENVFILE
    echo "!!! .env dosyasını düzenleyip DB şifresini kontrol et!"
    read -p "Devam etmek için Enter'a bas..."
fi

# Bağımlılıklar
echo "npm install..."
npm install

# PM2 ile başlat/restart
echo "PM2 ile başlatılıyor..."
pm2 delete quizbackend 2>/dev/null || true
pm2 start src/index.js --name quizbackend
pm2 save
pm2 startup 2>/dev/null || echo "pm2 startup'ı manuel çalıştır: pm2 startup"

echo ""
echo "=== Kurulum tamamlandı ==="
echo "API: http://206.189.201.111/"
echo "Socket.IO: Nginx proxy üzerinden çalışıyor"
echo "Loglar: pm2 logs quizbackend"
