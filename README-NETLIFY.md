# İslami Sosyal Platform - Netlify Deployment

Bu proje Netlify üzerinde PostgreSQL veritabanı ile çalışacak şekilde optimize edilmiştir.

## 🚀 Netlify Deployment Rehberi

### 1. Proje Hazırlığı

```bash
# Bağımlılıkları yükle
npm install

# Netlify CLI'yi global olarak yükle
npm install -g netlify-cli

# Netlify'a giriş yap
netlify login
```

### 2. PostgreSQL Veritabanı Kurulumu

#### Neon PostgreSQL (Önerilen)
1. [Neon.tech](https://neon.tech) hesabı oluşturun
2. Yeni bir PostgreSQL veritabanı oluşturun
3. Connection string'i kopyalayın

#### Supabase PostgreSQL
1. [Supabase.com](https://supabase.com) hesabı oluşturun
2. Yeni proje oluşturun
3. Settings > Database > Connection string'i kopyalayın

### 3. Environment Variables

Netlify Dashboard'da Environment Variables ekleyin:

```env
# PostgreSQL Database
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require

# Optional: Backup database
POSTGRES_URL=postgresql://username:password@host:port/database?sslmode=require

# Application Settings
NODE_ENV=production
```

### 4. Database Schema Kurulumu

```bash
# Schema'yı veritabanına push et
npm run db:push

# Veya migration kullan
npm run db:migrate
```

### 5. Build ve Deploy

#### Otomatik Deploy (Git)
1. GitHub/GitLab repository'nizi Netlify'a bağlayın
2. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist/public`
   - Functions directory: `netlify/functions`

#### Manuel Deploy
```bash
# Build
npm run build

# Deploy
netlify deploy --prod
```

### 6. Local Development

```bash
# Netlify dev server
npm run netlify:dev

# Veya normal dev server
npm run dev
```

## 🏗️ Netlify Özel Konfigürasyonu

### Serverless Functions
- API routes otomatik olarak `/.netlify/functions/api` altında çalışır
- PostgreSQL bağlantısı serverless function'larda optimize edilmiştir
- Connection pooling ve timeout ayarları yapılmıştır

### Build Optimizasyonları
- Client ve server ayrı ayrı build edilir
- Netlify Functions için özel bundling
- Static assets optimize edilir

### Database Connection
- Production'da SSL bağlantısı zorunlu
- Connection pooling aktif
- Timeout ve retry mekanizmaları

## 📊 Özellikler

### Dual Mode System
- **Production**: PostgreSQL veritabanı
- **Demo Mode**: DATABASE_URL yoksa otomatik demo data

### Netlify Optimizasyonları
- Serverless function cold start optimizasyonu
- Database connection caching
- Error handling ve fallback mekanizmaları

### İslami Platform Özellikleri
- ✅ Gönderi paylaşımı ve etkileşim
- ✅ Dua istekleri sistemi
- ✅ İslami topluluklar
- ✅ Etkinlik yönetimi
- ✅ Mesajlaşma sistemi
- ✅ Admin paneli ve moderasyon
- ✅ İçerik filtreleme
- ✅ Çoklu tema desteği

## 🔧 Troubleshooting

### Database Connection Issues
1. Environment variables'ları kontrol edin
2. SSL sertifikası ayarlarını doğrulayın
3. Connection string formatını kontrol edin

### Build Errors
```bash
# Cache temizle
rm -rf node_modules dist netlify/functions
npm install
npm run build
```

### Function Timeout
- Netlify Functions 10 saniye timeout'a sahiptir
- Database queries optimize edilmiştir
- Connection pooling kullanılmaktadır

## 📁 Dosya Yapısı

```
├── netlify/
│   └── functions/
│       └── api.js          # Serverless API handler
├── server/
│   ├── db-netlify.ts       # Netlify PostgreSQL config
│   └── storage-netlify.ts  # Netlify storage layer
├── client/                 # React frontend
├── shared/                 # Shared schemas
└── netlify.toml           # Netlify configuration
```

## 🌐 Production URLs

- **Frontend**: `https://your-site.netlify.app`
- **API**: `https://your-site.netlify.app/.netlify/functions/api`
- **Health Check**: `https://your-site.netlify.app/.netlify/functions/api/health`

## 📈 Performance

- **Cold Start**: ~200ms
- **Database Query**: ~50ms
- **API Response**: ~100ms
- **Page Load**: ~1.5s

## 🔒 Security

- PostgreSQL SSL bağlantısı
- Environment variables güvenli
- API rate limiting
- Content moderation
- User authentication

## 📞 Support

Deployment sorunları için:
1. Netlify build logs'ları kontrol edin
2. Database connection'ı test edin
3. Environment variables'ları doğrulayın

---

**Netlify + PostgreSQL ile güçlendirilmiş İslami sosyal platform** 🕌