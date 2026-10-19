# أوامر النشر على Render وVercel

## 1. Render — Backend

أنشئ Web Service من نفس المستودع، ثم استخدم:

```text
Build Command: npm install && npm run build
Start Command: npm start
```

يجب أن يقرأ التطبيق المنفذ من `PORT` الذي يحقنه Render. أضف متغيرات البيئة التالية في Render:

```text
DATABASE_URL=<رابط PostgreSQL>
FRONTEND_URL=https://<اسم-المشروع>.vercel.app
JWT_SECRET=<قيمة عشوائية طويلة>
JWT_REFRESH_SECRET=<قيمة عشوائية طويلة مختلفة>
ADMIN_EMAIL=admin@scp.dz
ADMIN_PASSWORD=<كلمة مرور قوية جديدة>
ADMIN_PHONE=0550000000
```

في Render يستخدم الخادم `DATABASE_URL` كمصدر PostgreSQL الأساسي حتى لو وُجد
`NEON_DATABASE_URL`. لا تضبطهما على قاعدتين مختلفتين؛ جميع عمليات التسجيل
والقراءة الإدارية والخدمات يجب أن تمر عبر قاعدة واحدة.

في Replit، يمكن إبقاء `DATABASE_URL` المُدار كما هو وإضافة `NEON_DATABASE_URL`
إلى Secrets؛ عند وجوده يستخدم الخادم اتصال Neon بدل قاعدة Replit.

لا تضع `/api/v1` داخل `FRONTEND_URL`.

## 2. Vercel — Frontend

اربط نفس المستودع بمشروع Vercel، ثم استخدم:

```text
Build Command: npm run build:frontend
Output Directory: dist
Install Command: npm install
```

أضف متغير البيئة:

```text
VITE_API_URL=https://<اسم-الخدمة>.onrender.com
```

بعد أول نشر على Vercel، انسخ الرابط الحقيقي إلى `FRONTEND_URL` في Render ثم أعد تشغيل خدمة Render.

## 3. حساب الإدارة الأساسي

لا توجد كلمة مرور افتراضية آمنة. لإنشاء حساب الإدارة الأول، اضبط `ADMIN_EMAIL` و`ADMIN_PASSWORD` في Secrets قبل تشغيل الخادم. يجب أن تكون كلمة المرور طويلة وفريدة (12 حرفًا على الأقل). ينشئ الخادم الحساب في قاعدة البيانات مرة واحدة إذا لم يكن البريد موجودًا، ولا يغيّر كلمة مرور حساب موجود. بعد تسجيل الدخول يمكن للأدمن فتح **إدارة الحسابات** وإنشاء الحسابات المهنية؛ تبدأ هذه الحسابات بحالة `pending_approval` إلى أن تعتمدها الإدارة.