const http = require('http');
const port = process.env.PORT || 10000;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <title>منصة الفرصة الثانية - Second Chance</title>
        <style>
            body { font-family: Tahoma, sans-serif; background: #f4f6f9; color: #333; text-align: center; padding: 50px; }
            .card { background: white; max-width: 600px; margin: 0 auto; padding: 30px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
            h1 { color: #0d6efd; }
            p { line-height: 1.6; }
        </style>
    </head>
    <body>
        <div class="card">
            <h1>منصة الفرصة الثانية (Second Chance)</h1>
            <p>تطبيق أندرويد وطني لدعم ومرافقة الحالات، الاستشارات القانونية والنفسية، وعلاج الإدمان وفق التشريع الجزائري.</p>
            <p><strong>حالة النظام:</strong> الخادم يعمل بنجاح وجاهز لاستقبال العمليات والربط.</p>
        </div>
    </body>
    </html>
  `);
});

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
