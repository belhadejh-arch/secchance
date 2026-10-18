# منصة الفرصة الثانية — SCP

## التشغيل المحلي

يحتاج الخادم إلى `NEON_DATABASE_URL` لقاعدة Neon خارجية، أو `DATABASE_URL`
لقاعدة PostgreSQL التي تديرها Replit. عند ضبط `NEON_DATABASE_URL` يستخدمها
الخادم بدل `DATABASE_URL` دون تعديل إعداد Replit المُدار. شغّل:

```bash
npm install
npm run dev
```

للمعاينة داخل Replit:

```bash
PORT=5000 npm run dev
```

## بنية النشر

- الـBackend هو خادم Node.js في `server/index.js` ويخدم واجهة Vite في التطوير.
- الـFrontend هو Vite/React ويُبنى إلى `dist/`.
- تخزين البيانات بالكامل في PostgreSQL؛ لا يعتمد التطبيق على ملف SQLite محلي.
- مخطط قاعدة البيانات والبيانات المرجعية في `server/schema.sql`. يجب تطبيقه على قاعدة التطوير قبل أول تشغيل؛ لا ينفّذ الخادم أوامر إنشاء الجداول تلقائيًا.
- ينشئ الخادم حساب الإدارة عند ضبط `ADMIN_EMAIL` و`ADMIN_PASSWORD` في Secrets؛ لا توجد كلمة مرور افتراضية.
- لا توجد حسابات أو ملفات حالات تجريبية مزروعة في قاعدة البيانات.

## المتغيرات المطلوبة

داخل Replit تُوفَّر `DATABASE_URL` من قاعدة بيانات المشروع. للاتصال بقاعدة
Neon خارجية، أضف `NEON_DATABASE_URL` إلى Secrets بدل استبدال المتغير المُدار.
تُحفظ مفاتيح التوثيق والدفع وكلمة مرور الإدارة في Secrets، وليس في ملفات
المشروع. لا توجد كلمة مرور افتراضية لحساب الإدارة؛ اضبط `ADMIN_PASSWORD`
و`ADMIN_EMAIL` قبل تهيئته. في الإنتاج يلزم ضبط
`JWT_SECRET` و`JWT_REFRESH_SECRET` و`ADMIN_PASSWORD`.

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

### دفع Chargily

- `CHARGILY_SECRET_KEY`: مفتاح Chargily Pay V2 السري، يُضبط في Secrets.
- `CHARGILY_MODE`: إما `test` للاختبار الحقيقي عبر بيئة Chargily التجريبية أو `live` للإنتاج.
- `PUBLIC_BACKEND_URL`: رابط HTTPS العام للخادم لاستقبال Webhook على
  `/api/v1/payments/webhook`.
- `FRONTEND_URL`: رابط HTTPS العام للواجهة لاستقبال عودة العميل بعد الدفع.

تُنشئ المنصة رابط الدفع بعد قبول مقدم الخدمة فقط، وتحوّل العميل إلى صفحة
Chargily المستضافة. لا تُخزَّن بيانات البطاقة، ولا يعتبر رجوع المتصفح إثباتاً
للدفع؛ لا تُؤكَّد العملية والموعد إلا بعد التحقق من توقيع Webhook ومطابقة
المبلغ. عند غياب الإعدادات تُرفض محاولة إنشاء الدفع بوضوح بدلاً من تحصيل وهمي.
المبالغ المسترجعة تحتاج معالجة فعلية لدى البوابة؛ حالة «مطلوب استرجاعه» لا
تعني أن المال رُدّ بالفعل.

الخدمات ليست بيانات تجريبية مُسبقة: يسجّل المختص طلبه وتراجعه الإدارة؛ عند
اعتماد الأخصائي النفسي أو الطبيب أو المستشار القانوني تُفعّل له استشارة افتراضية
بسعر 500 دج. يجب على المختص نشر مواعيده الحقيقية من لوحة المواعيد قبل أن يتمكن
المستفيد من اختيار موعد وإرسال طلب مدفوع. لا تُتاح الخدمات للحسابات قيد المراجعة.

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