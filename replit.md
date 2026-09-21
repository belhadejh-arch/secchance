# منصة الفرصة الثانية — SCP

## التشغيل المحلي

يحتاج الخادم إلى `DATABASE_URL` لقاعدة PostgreSQL. شغّل:

```bash
npm install
npm run dev
```

للمعاينة داخل Replit:

```bash
PORT=5000 npm run dev
```

## بنية النشر

- الـBackend هو Express في `server.ts` ويُبنى إلى `dist/server.cjs`.
- الـFrontend هو Vite/React ويُبنى إلى `dist/`.
- تخزين البيانات بالكامل في PostgreSQL عبر `DATABASE_URL`؛ لا يعتمد التطبيق على ملف SQLite محلي.
- عند تشغيل الخادم لأول مرة تُنشأ الجداول والبيانات المرجعية فقط، ويُنشأ حساب الإدارة الأساسي إذا لم يكن البريد موجودًا.
- لا توجد حسابات أو ملفات حالات تجريبية مزروعة في قاعدة البيانات.

## المتغيرات المطلوبة

### Render

- `DATABASE_URL`
- `FRONTEND_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_PHONE`

### Vercel

- `VITE_API_URL`، وهو رابط خدمة Render بدون `/api/v1` في نهايته.

## الأوامر

```bash
# Render Build Command
npm install && npm run build

# Render Start Command
npm start

# Vercel Build Command
npm run build:frontend

# Vercel Output Directory
dist
```