# Kullanıcı Şifreleri

## Varsayılan Şifreler

Aşağıdaki kullanıcılar için varsayılan şifre **1234** olarak ayarlanmıştır:
- admin → 1234
- staff → 1234
- erhan → 1234

## Mevcut Şifreli Kullanıcılar

Bu kullanıcıların şifreleri auth.json dosyasında mevcuttur:
- sadettin
- fatma

## Önemli Notlar

1. **Güvenlik**: İlk girişten sonra mutlaka admin kullanıcısının şifresini değiştirin!
2. **Şifre Değiştirme**: Admin panelinden kullanıcıyı silip yeni şifreyle tekrar oluşturabilirsiniz.
3. **Hash Algoritması**: SHA-256 kullanılmaktadır.

## Şifre Hash'i Nasıl Hesaplanır?

Node.js ile:
```javascript
import crypto from 'crypto';
const password = "yeni_sifre";
const hash = crypto.createHash('sha256').update(password).digest('hex');
console.log(hash);
```

Online: https://emn178.github.io/online-tools/sha256.html

## Test Girişi

1. Tarayıcı önbelleğini temizleyin (Ctrl+Shift+Delete)
2. https://spodeme.pau.edu.tr/shift adresine gidin
3. Kullanıcı adı: **admin**
4. Şifre: **1234**
5. Giriş Yap butonuna tıklayın

## Sorun Giderme

Eğer hala otomatik giriş oluyorsa:
1. F12 → Application → Cookies → sid cookie'sini silin
2. F12 → Application → Session Storage → tüm değerleri silin
3. Sayfayı yenileyin (F5)
