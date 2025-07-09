# İslami Sosyal Platform - Yerel Dosya Tabanlı Veri Saklama

Bu proje artık PostgreSQL veya Supabase yerine yerel dosya sisteminde JSON formatında veri saklamaktadır.

## 🗂️ Veri Saklama Sistemi

### Dosya Yapısı
```
data/
├── users.json              # Kullanıcı verileri
├── posts.json              # Gönderi verileri
├── dua-requests.json       # Dua talepleri
├── comments.json           # Yorumlar
├── likes.json              # Beğeniler
├── bookmarks.json          # Yer imleri
├── communities.json        # Topluluklar
├── community-members.json  # Topluluk üyelikleri
├── events.json             # Etkinlikler
├── event-attendees.json    # Etkinlik katılımcıları
├── reports.json            # Şikayetler
└── user-bans.json          # Kullanıcı yasakları
```

### Veri Formatı
Her dosya JSON array formatında veri saklar:
```json
[
  {
    "id": "unique-id",
    "created_at": "2025-01-27T10:00:00.000Z",
    "updated_at": "2025-01-27T10:00:00.000Z",
    // ... diğer alanlar
  }
]
```

## 🚀 Kurulum ve Çalıştırma

### 1. Proje Kurulumu
```bash
# Bağımlılıkları yükle
npm install

# Veri klasörünü oluştur
npm run prepare:data

# Geliştirme sunucusunu başlat
npm run dev
```

### 2. İlk Çalıştırma
- Uygulama ilk çalıştırıldığında otomatik olarak örnek veriler oluşturulur
- Demo kullanıcılar ve gönderiler hazır olarak gelir
- Veri dosyaları `data/` klasöründe saklanır

### 3. Production Build
```bash
# Production build
npm run build

# Production sunucu
npm start
```

## 📊 Özellikler

### Otomatik Veri Yönetimi
- **İlk Kurulum**: Örnek veriler otomatik oluşturulur
- **Veri Kalıcılığı**: Tüm veriler dosya sisteminde saklanır
- **Sayfa Yenileme**: Veriler her sayfa yüklemesinde dosyadan okunur
- **Gerçek Zamanlı**: Değişiklikler anında dosyaya yazılır

### Veri Güvenliği
- **Backup Sistemi**: `npm run data:backup` ile yedekleme
- **Restore Sistemi**: Yedekten geri yükleme
- **Hata Toleransı**: Dosya okuma hatalarında boş array döndürür
- **Atomik Yazma**: Veri bütünlüğü korunur

### İslami Platform Özellikleri
- ✅ Kullanıcı kayıt/giriş sistemi
- ✅ Gönderi paylaşımı ve etkileşim
- ✅ Dua istekleri sistemi
- ✅ İslami topluluklar
- ✅ Etkinlik yönetimi
- ✅ Beğeni ve yorum sistemi
- ✅ Yer imi (bookmark) sistemi
- ✅ Admin paneli ve moderasyon
- ✅ İçerik filtreleme
- ✅ Şikayet sistemi
- ✅ Kullanıcı yasaklama

## 🔧 Veri Yönetimi

### Yedekleme
```bash
# Otomatik tarihli yedek oluştur
npm run data:backup

# Manuel yedek
cp -r data data-backup-manual
```

### Geri Yükleme
```bash
# Yedekten geri yükle
cp -r data-backup-20250127-143000/* data/
```

### Veri Temizleme
```bash
# Tüm verileri sil (dikkatli kullanın!)
rm -rf data/*.json

# Uygulama yeniden başlatıldığında örnek veriler oluşturulur
npm run dev
```

## 📁 Dosya Detayları

### users.json
```json
[
  {
    "id": "user-id",
    "email": "user@example.com",
    "name": "Kullanıcı Adı",
    "username": "username",
    "bio": "Kullanıcı biyografisi",
    "verified": true,
    "role": "user",
    "created_at": "2025-01-27T10:00:00.000Z"
  }
]
```

### posts.json
```json
[
  {
    "id": "post-id",
    "user_id": "user-id",
    "content": "Gönderi içeriği",
    "type": "text",
    "category": "Genel",
    "tags": ["tag1", "tag2"],
    "likes_count": 0,
    "comments_count": 0,
    "created_at": "2025-01-27T10:00:00.000Z"
  }
]
```

## 🔍 API Endpoints

Tüm API endpoints aynı şekilde çalışır:
- `GET /api/posts` - Gönderileri listele
- `POST /api/posts` - Yeni gönderi oluştur
- `GET /api/dua-requests` - Dua taleplerini listele
- `GET /api/health` - Sistem sağlık durumu

## ⚡ Performans

### Avantajlar
- **Hızlı Başlangıç**: Veritabanı kurulumu gerektirmez
- **Basit Deployment**: Sadece dosya sistemi gerekir
- **Düşük Kaynak**: Minimal sistem gereksinimleri
- **Offline Çalışma**: İnternet bağlantısı gerektirmez

### Sınırlamalar
- **Eşzamanlılık**: Çoklu kullanıcı yazma işlemlerinde dikkat gerekir
- **Ölçeklenebilirlik**: Büyük veri setleri için uygun değil
- **Backup**: Manuel yedekleme gerekir
- **Arama**: Karmaşık sorgular için sınırlı

## 🛠️ Geliştirme

### Yeni Veri Tipi Ekleme
1. `shared/schema.ts` dosyasına yeni tip ekle
2. `DATA_FILES` objesine yeni dosya yolu ekle
3. Storage interface'ine yeni metodlar ekle
4. API routes'larına endpoint'ler ekle

### Veri Migrasyonu
```javascript
// Eski veri formatını yeni formata dönüştürme örneği
const oldData = await fs.readFile('data/old-format.json');
const newData = oldData.map(item => ({
  ...item,
  newField: 'default-value'
}));
await fs.writeFile('data/new-format.json', JSON.stringify(newData));
```

## 🔒 Güvenlik

- Dosya erişim izinleri kontrol edilir
- Input validation yapılır
- XSS ve injection koruması
- Rate limiting uygulanır
- Content moderation aktif

---

**Yerel dosya sistemi ile güçlendirilmiş İslami sosyal platform** 🕌

Bu sistem küçük ve orta ölçekli projeler için idealdir. Büyük ölçekli uygulamalar için PostgreSQL veya MongoDB gibi veritabanlarına geçiş önerilir.