# Fatura Yükleme Sistemi

Bu proje, kullanıcıların PDF ve resim formatındaki faturalarını yükleyebilecekleri ve yönetebilecekleri bir web uygulamasıdır.

## Özellikler

- PDF ve resim dosyalarını yükleme
- Yüklenen dosyaları veritabanında saklama
- Yüklenen faturaların listesini görüntüleme
- Modern ve kullanıcı dostu arayüz

## Kurulum

1. MongoDB'yi yükleyin ve çalıştırın
2. Projeyi klonlayın
3. Ana dizinde:
   ```bash
   npm install
   ```
4. Client dizininde:
   ```bash
   cd client
   npm install
   ```

## Çalıştırma

1. Backend'i başlatmak için ana dizinde:
   ```bash
   npm run dev
   ```

2. Frontend'i başlatmak için client dizininde:
   ```bash
   npm start
   ```

3. Tarayıcınızda `http://localhost:3000` adresine gidin

## Teknolojiler

- Frontend: React, Material-UI
- Backend: Node.js, Express
- Veritabanı: MongoDB
- Dosya Yükleme: Multer

## Notlar

- Maksimum dosya boyutu: 5MB
- Desteklenen dosya formatları: PDF, JPG, JPEG, PNG 