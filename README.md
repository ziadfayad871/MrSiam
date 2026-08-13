🏛️ منصة مستر محمد صيام — القيصر (AL-QAESAR)

«منصة تعليمية ذكية متكاملة للدراسات الاجتماعية والتاريخ والجغرافيا
للمرحلتين الإعدادية والثانوية، تجمع بين التعليم، الاختبارات، المتابعة، التحفيز، والتحليل في تجربة واحدة مستوحاة من أجواء الخرائط القديمة، البوصلة، الخط الزمني، والرحلات التاريخية.»

---

📌 نبذة عن المشروع

AL-QAESAR هي منصة تعليمية Full-Stack مصممة لإدارة تجربة الطالب التعليمية بالكامل، بدايةً من تسجيل الدخول ومتابعة المواد والدروس، مرورًا بالاختبارات والواجبات والحضور، وصولًا إلى تحليل الأداء والمنافسة والحصول على الميداليات.

تم بناء المشروع باستخدام:

- Backend: .NET 10 Web API
- Architecture: Clean Architecture
- Frontend: React 19 + TypeScript
- Database: SQLite + Entity Framework Core
- Authentication: JWT
- Validation: FluentValidation
- CQRS / Application Layer: MediatR
- Logging: Serilog
- Styling: Tailwind CSS v4
- Build Tool: Vite

---

✨ أهم المميزات

🎓 نظام الطالب

يقدم للطالب Dashboard متكاملة تحتوي على:

- 📚 المواد والدروس
- 🧭 رحلة تعليمية من 6 محطات
- 🗺️ متابعة المرحلة الحالية والقادمة
- 📊 تحليل الأداء
- 🏆 منصة الأوائل
- 🥇 الميداليات والإنجازات
- 📝 الاختبارات
- ⚡ نتائج الاختبارات الفورية
- 📈 متابعة مستوى الطالب
- 🎯 تحفيز الطالب للوصول للمحطة التالية

---

👨‍🏫 لوحة المدرس

تمكن المدرس من متابعة الطلاب والمحتوى التعليمي من مكان واحد.

Dashboard

- إجمالي الطلاب
- عدد الاختبارات
- متوسط الدرجات
- نسب الحضور
- الأداء الشهري
- أداء المواد
- أفضل الطلاب
- إحصائيات تعليمية

تحليل الأداء

- منحنى الأداء الشهري
- مقارنة أداء المواد
- اكتشاف الطلاب المتفوقين
- متابعة الطلاب الأقل أداءً
- ترتيب الطلاب

---

🧑‍💼 لوحة الأمين

لوحة مخصصة لإدارة العمليات اليومية:

- 👥 سجل الطلاب
- 🕐 حضور اليوم
- 💰 متابعة الاشتراكات
- 💳 المستحقات
- 📋 بيانات الطلاب
- 📊 تقارير إدارية

---

📝 نظام الاختبارات

من أهم أجزاء المنصة.

يدعم النظام:

- اختيار من متعدد (MCQ)
- صح / خطأ
- تصحيح تلقائي
- حساب الدرجة
- عرض النتيجة مباشرة
- ترتيب الطالب
- الميداليات
- الانتقال للمحطة التالية
- حفظ نتائج الاختبارات
- تحليل مستوى الطالب

🎯 توليد الاختبارات من المنهج

الاختبارات ليست عشوائية من خارج المحتوى.

يتم إنشاء الأسئلة اعتمادًا على المنهج والمحتوى التعليمي الموجود داخل المنصة، بحيث ترتبط الأسئلة بالدروس والمواد التي يدرسها الطالب.

---

🏆 نظام التحفيز Gamification

المنصة تحتوي على نظام تحفيز يساعد الطالب على الاستمرار في التعلم.

🥇 الميداليات

يمكن للطالب الحصول على ميداليات عند تحقيق إنجازات مثل:

- اجتياز اختبار
- الحصول على درجة مرتفعة
- تحقيق سلسلة نجاحات
- الوصول لمحطة جديدة
- تحقيق ترتيب متقدم

🏅 منصة الأوائل

عرض أفضل الطلاب وترتيبهم بناءً على الأداء والنتائج.

---

🧭 نظام الرحلة التعليمية

تم تصميم تجربة الطالب على شكل رحلة تعليمية.

محطة 1
  ↓
محطة 2
  ↓
محطة 3
  ↓
محطة 4
  ↓
محطة 5
  ↓
محطة 6

كل محطة تمثل مرحلة من رحلة الطالب التعليمية.

ويستطيع الطالب معرفة:

- أين وصل؟
- ماذا أنجز؟
- ما المحطة الحالية؟
- ما المحطة القادمة؟
- ما المطلوب للوصول إليها؟

---

🎨 Design System — AL-QAESAR

تم بناء نظام تصميم خاص بالمنصة مستوحى من الهوية التاريخية والجغرافية.

الهوية البصرية

- 🧭 البوصلة
- 🗺️ الخرائط
- 📜 الورق القديم
- ⏳ الخط الزمني
- 📍 الإحداثيات
- 🏛️ الطابع التاريخي
- ✨ الحركة والتفاعل

Themes

المنصة تدعم ثيمين رئيسيين:

📜 Ancient Paper

واجهة مستوحاة من:

- الخرائط القديمة
- الورق المعتق
- الوثائق التاريخية

🌙 Caesar Night

واجهة ليلية بطابع:

- تاريخي
- فاخر
- داكن
- مستوحى من الإمبراطوريات القديمة

---

🏗️ Architecture

المشروع مبني باستخدام Clean Architecture لفصل المسؤوليات والحفاظ على قابلية التوسع والصيانة.

backend/
│
├── MrSiam.Domain
│   ├── Entities
│   ├── Enums
│   └── Interfaces
│
├── MrSiam.Application
│   ├── Features
│   ├── Commands
│   ├── Queries
│   ├── Validators
│   └── MediatR
│
├── MrSiam.Infrastructure
│   ├── Persistence
│   ├── Entity Framework Core
│   ├── SQLite
│   ├── JWT
│   └── Seed Data
│
└── MrSiam.Api
    ├── Controllers
    ├── Middleware
    ├── Authentication
    ├── Serilog
    └── CORS

---

💻 Frontend Architecture

frontend/
└── src/
    │
    ├── design-system/
    │   ├── tokens
    │   ├── UI Kit
    │   ├── Compass
    │   ├── Maps
    │   └── Animations
    │
    ├── layouts/
    │   ├── SiteLayout
    │   └── DashboardLayout
    │
    ├── pages/
    │   ├── Home
    │   ├── Login
    │   ├── Student Dashboard
    │   ├── Teacher Dashboard
    │   ├── Secretary Dashboard
    │   ├── Exams
    │   └── ...
    │
    └── lib/
        ├── API Client
        ├── Authentication
        ├── Theme
        └── Types

---

🛠️ Tech Stack

Layer| Technology
Backend| .NET 10
API| ASP.NET Core Web API
Architecture| Clean Architecture
Application| MediatR
Validation| FluentValidation
ORM| Entity Framework Core
Database| SQLite
Authentication| JWT
Logging| Serilog
Frontend| React 19
Language| TypeScript
Build Tool| Vite
CSS| Tailwind CSS v4
API Communication| HTTP / REST
Development| Visual Studio / VS Code

---

📁 Project Structure

mr.mohamedsiam/
│
├── backend/
│   │
│   ├── MrSiam.slnx
│   │
│   └── src/
│       ├── MrSiam.Domain
│       ├── MrSiam.Application
│       ├── MrSiam.Infrastructure
│       └── MrSiam.Api
│
├── frontend/
│   │
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
│
└── README.md

---

🚀 Installation & Setup

1️⃣ Clone the project

git clone <repository-url>
cd mr.mohamedsiam

---

⚙️ Backend

انتقل إلى مجلد المشروع وشغل الـ API:

dotnet run --project backend/src/MrSiam.Api

سيعمل الـ Backend افتراضيًا على:

http://localhost:5080

🗄️ Database

يستخدم المشروع:

SQLite

وفي أول تشغيل يتم إنشاء:

mrsiam.db

مع بيانات تجريبية جاهزة.

---

🎨 Frontend

ثبّت الـ dependencies:

npm install --prefix frontend

ثم شغل الـ development server:

npm run dev --prefix frontend

الواجهة ستعمل على:

http://localhost:5173

ويتم توجيه طلبات "/api" إلى الـ Backend من خلال Vite Proxy.

---

👑 Master Account

أول تشغيل يقوم بإنشاء حساب المستر (مالك المنصة) فقط — بدون أي بيانات تجريبية.

Username| Password
👑 master| `Master@123`

من حساب المستر، يمكن إضافة حسابات السكرتارية من قائمة **إدارة المستخدمين** في الشريط الجانبي:

- **إضافة** — إنشاء حساب سكرتير/مدير جديد (اسم مستخدم + كلمة مرور).
- **قائمة المستخدمين** — عرض/تعديل/إيقاف/حذف الحسابات.
- **سجل العمليات** — كل عمليات السكرتارية تُسجّل (الاسم + التاريخ + نوع العملية + الشرح) مع فلترة حسب السكرتير.

---

🔑 Authentication

يعتمد النظام على:

JWT Authentication

مع Role-Based Authorization للتحكم في الصلاحيات.

الأدوار الرئيسية:

Admin
Teacher
Secretary
Student

كل Role يمتلك صلاحيات مختلفة داخل النظام.

---

🔌 API

الـ Frontend يتواصل مع الـ Backend من خلال REST API.

بشكل عام:

React
   │
   │ HTTP / REST
   ▼
ASP.NET Core API
   │
   ▼
Application
   │
   ▼
Infrastructure
   │
   ▼
SQLite

---

📊 Data Flow

User
 ↓
React UI
 ↓
API Client
 ↓
ASP.NET Core API
 ↓
MediatR
 ↓
Application Layer
 ↓
Infrastructure
 ↓
Entity Framework Core
 ↓
SQLite

---

🔨 Useful Commands

Build Backend

dotnet build backend/MrSiam.slnx

Run Backend

dotnet run --project backend/src/MrSiam.Api

Install Frontend Dependencies

npm install --prefix frontend

Run Frontend

npm run dev --prefix frontend

Build Frontend

npm run build --prefix frontend

---

📦 Production Build

لبناء نسخة Production من الـ Frontend:

npm run build --prefix frontend

سيتم إنشاء ملفات Production داخل:

frontend/dist/

وللـ Backend:

dotnet publish backend/src/MrSiam.Api -c Release

---

🔒 Security Notes

بيانات الحسابات الموجودة في README مخصصة للتجربة والتطوير فقط.

في بيئة Production يجب:

- تغيير كلمات المرور الافتراضية.
- استخدام Secrets Management.
- عدم تخزين مفاتيح الـ JWT داخل Git.
- استخدام HTTPS.
- ضبط CORS على الـ domains المطلوبة فقط.
- تأمين إعدادات قاعدة البيانات.
- تفعيل سياسات Authorization المناسبة.

---

🧭 Future Roadmap

المشروع قابل للتوسع لإضافة:

- 🤖 AI Tutor
- 🧠 توليد أسئلة من المنهج باستخدام AI
- 📚 إدارة كاملة للمناهج والوحدات والدروس
- 📝 بنك أسئلة متقدم
- 🎯 اختبارات Adaptive حسب مستوى الطالب
- 📈 تقارير أداء متقدمة
- 🔔 Notifications
- 💬 نظام رسائل بين الطالب والمدرس
- 📱 PWA / Mobile Experience
- 💳 Online Payments
- 📄 شهادات للطلاب
- 🏆 نظام Achievements متقدم
- 📊 تقارير PDF
- 🔎 بحث متقدم داخل المحتوى
- ☁️ نشر المنصة على Cloud Infrastructure

---

🎯 Project Goals

الهدف الأساسي من AL-QAESAR هو تحويل العملية التعليمية التقليدية إلى تجربة رقمية متكاملة تجمع بين:

التعلم
  +
المتابعة
  +
الاختبارات
  +
التحليل
  +
التحفيز
  +
المنافسة

لتصبح رحلة الطالب التعليمية تجربة تفاعلية وليست مجرد مشاهدة محتوى.

---

👨‍💻 Development

AL-QAESAR — Mr. Mohamed Siam Educational Platform

Built with:

.NET 10
React 19
TypeScript
Entity Framework Core
SQLite
JWT
MediatR
FluentValidation
Serilog
Tailwind CSS
Vite

---

⭐ Support

إذا أعجبك المشروع، يمكنك دعم المشروع من خلال:

- ⭐ Star على GitHub
- 🐛 فتح Issue للإبلاغ عن المشاكل
- 💡 اقتراح Features جديدة
- 🤝 المساهمة في تطوير المشروع

---

«🧭 AL-QAESAR — Learn. Explore. Conquer.

رحلتك التعليمية تبدأ من هنا.»