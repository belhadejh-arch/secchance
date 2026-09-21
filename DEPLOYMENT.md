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

في بيئة التطوير الحالية:

```text
Email: admin@scp.dz
Password: SCP-Admin-2026!ChangeMe
```

في Render استخدم `ADMIN_PASSWORD` مخصصًا وقويًا؛ إذا كان البريد موجودًا فلن يستبدل التطبيق كلمة المرور الموجودة. بعد تسجيل الدخول يمكن للأدمن فتح **إدارة الحسابات** وإنشاء حسابات الأخصائيين النفسيين والمحامين والمراكز والجمعيات والأسر والمستفيدين. الحسابات المهنية تبدأ بحالة `pending_approval` إلى أن يعتمدها الأدمن.