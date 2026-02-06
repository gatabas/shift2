# SHIFT BACKEND - WINDOWS SERVİS KURULUMU

## 📦 İÇİNDEKİLER

Bu paket, Shift Backend'i Windows servis olarak çalıştırmak için gerekli tüm dosyaları içerir.

### Dosyalar:
- `install-service.bat` - İlk kurulum (Tek sefer çalıştırın)
- `start-service.bat` - Servisi başlat
- `stop-service.bat` - Servisi durdur
- `restart-service.bat` - Servisi yeniden başlat
- `logs.bat` - Canlı logları görüntüle
- `status.bat` - Servis durumunu kontrol et
- `uninstall-service.bat` - Servisi tamamen kaldır

---

## 🚀 HIZLI KURULUM

### Adım 1: Dosyaları Kopyala
Bu batch dosyalarını `C:\inetpub\wwwroot\shift\` klasörüne kopyalayın
(server.js'in olduğu klasör)

### Adım 2: Yönetici Olarak Çalıştır
`install-service.bat` dosyasına **SAĞ TIK** → **Yönetici olarak çalıştır**

### Adım 3: Bekle
Kurulum otomatik tamamlanacak. Ekranda "KURULUM TAMAMLANDI!" yazısını gördüğünüzde TAMAM!

---

## ✅ ARTIK NE OLDU?

- ✅ Backend sürekli çalışıyor (arka planda)
- ✅ Bilgisayar her açıldığında otomatik başlıyor
- ✅ Çökerse otomatik yeniden başlıyor
- ✅ Siz hiçbir şey yapmıyorsunuz

---

## 🎮 KULLANIM

### Servisi Durdurmak İstiyorsanız:
`stop-service.bat` çalıştırın

### Servisi Başlatmak İstiyorsanız:
`start-service.bat` çalıştırın

### Kod Değiştirdiyseniz:
`restart-service.bat` çalıştırın (değişiklikleri yükler)

### Sorun Varsa:
`logs.bat` çalıştırın (hataları gösterir)

### Durumu Kontrol Etmek İstiyorsanız:
`status.bat` çalıştırın

---

## 🔧 MANUEL KOMUTLAR

PowerShell veya CMD'de şu komutları kullanabilirsiniz:

```bash
# Durum
pm2 list

# Loglar (canlı)
pm2 logs shift-backend

# Durdur
pm2 stop shift-backend

# Başlat
pm2 start shift-backend

# Yeniden Başlat
pm2 restart shift-backend

# Detaylı Bilgi
pm2 info shift-backend
```

---

## ❌ SERVİSİ TAMAMEN KALDIRMAK

Eğer servisi artık kullanmayacaksanız:
`uninstall-service.bat` çalıştırın

---

## 🆘 SORUN GİDERME

### "PM2 tanınmıyor" Hatası
Node.js'in PATH'e eklendiğinden emin olun:
1. Başlat → "Ortam değişkenlerini düzenle" ara
2. Path'e `C:\Program Files\nodejs\` ekleyin
3. CMD'yi kapatıp tekrar açın

### Servis Çalışmıyor
```bash
pm2 logs shift-backend
```
komutuyla hataları kontrol edin.

### Port Çakışması
Başka bir program 3000 portunu kullanıyorsa:
1. `.env` dosyasında `PORT=3001` yapın
2. `restart-service.bat` çalıştırın

---

## 📞 DESTEK

Sorun yaşarsanız:
- `logs.bat` çalıştırın
- Ekran görüntüsü alın
- Hata mesajını paylaşın

---

## ⚡ ÖNEMLİ NOTLAR

1. **İlk kurulumdan sonra** bilgisayarı yeniden başlatın (tavsiye)
2. **Kod değiştirdiyseniz** `restart-service.bat` çalıştırın
3. **SQL Server** çalışır durumda olmalı
4. **IIS** çalışır durumda olmalı

---

## 🎉 TAMAMDIR!

Artık backend sürekli çalışıyor. Hiçbir şey yapmanıza gerek yok! 🚀
