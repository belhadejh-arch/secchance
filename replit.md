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

داخل Replit تُوفَّر `DATABASE_URL` من قاعدة بيانات المشروع. تُحفظ مفاتيح
التوثيق والدفع وكلمة مرور الإدارة في Secrets، وليس في ملفات المشروع. لا
يُنشأ حساب إدارة افتراضي بكلمة مرور ثابتة في التطوير؛ اضبط `ADMIN_PASSWORD`
و`ADMIN_EMAIL` قبل تهيئة حساب الإدارة. في الإنتاج يلزم ضبط
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

الخدمات ليست بيانات تجريبية مُسبقة: يسجّل مقدم خدمة، تعتمد الإدارة حسابه،
ثم يضيف خدماته وأسعارها الفعلية قبل أن يتمكن العميل من توجيه طلب مدفوع.

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