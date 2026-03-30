 تشغيل الذكاء الاصطناعي على فيديو
تأكد إنك مفعل البيئة الافتراضية (venv)، وتأكد إن إعدادات الداتا بيز في ملف .env صحيحة، ثم انسخ هذا الأمر والصقه:

Bash
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/visionguard"

for i in 1 2 3; do
  echo "🚀 جاري معالجة الكاميرا رقم: $i..."
  python main.py \
    --input "frontend/public/videos/cam${i}.mp4" \
    --save-events-db \
    --enable-alerts \
    --db-run-name "demo_cam${i}"
done
(ملاحظة: تأكد أن رابط DATABASE_URL يطابق اسم المستخدم وكلمة المرور لقاعدة بيانات PostgreSQL بجهازك).



الخطوة الثانية: تشغيل الباك إند (FastAPI)

Bash
uvicorn src.api.main:app --reload --host 0.0.0.0 --port 8000
الخطوة الثالثة: تشغيل الفرونت إند (React)
افتح تيرمنال ثاني (New Terminal)، وادخل مجلد الواجهة وشغلها:

Bash
cd frontend
npm run dev
🎉 النتيجة:
الآن افتح رابط الواجهة http://localhost:5173/