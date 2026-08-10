# منصة مستر محمد صيام — The Digital Atlas

منصة تعليمية متكاملة لمادة الدراسات الاجتماعية والتاريخ والجغرافيا (الإعدادية والثانوية)، بتصميم "أطلس رقمي": بوصلة، خريطة، خط زمني، خرائط قديمة وإحداثيات.

## البنية

```
mr.mohamedsiam/
├── backend/                     # .NET 10 — Clean Architecture
│   ├── MrSiam.slnx
│   └── src/
│       ├── MrSiam.Domain        # الكيانات + الأنواع (مرحلة، مادة، دور...)
│       ├── MrSiam.Application   # MediatR + FluentValidation (السيناريوهات)
│       ├── MrSiam.Infrastructure # EF Core SQLite + JWT + البذرة
│       └── MrSiam.Api           # Web API + Serilog + CORS
└── frontend/                    # React 19 + TypeScript + Vite + Tailwind v4
    └── src/
        ├── design-system/       # نظام التصميم (توكنز، بوصلة، خرائط، UI kit، حركة)
        ├── layouts/             # SiteLayout + DashboardLayout
        ├── pages/               # 11 صفحة (رئيسية، تسجيل، لوحات، امتحانات...)
        └── lib/                 # API client + Auth + Theme + Types
```

## التشغيل

### 1) الـ Backend (http://localhost:5080)

```bash
dotnet run --project backend/src/MrSiam.Api
```

أول تشغيل ينشئ قاعدة البيانات `mrsiam.db` تلقائياً (SQLite) مع بيانات تجريبية كاملة:
9 مواد، دروس وامتحانات، 12 طالب، ميداليات، مدفوعات وحضور.

### 2) الـ Frontend (http://localhost:5173)

```bash
npm install --prefix frontend
npm run dev --prefix frontend
```

الـ dev server بيوصل للـ API تلقائياً عبر proxy على `/api`.

## الحسابات التجريبية (كلمة المرور للكل: `123456`)

| الدور | اسم المستخدم |
|-------|---------------|
| مدرس | `siam` |
| أمين | `secretary` |
| مدير | `admin` |
| طلاب | `ahmed.samir` · `malak.mahmoud` · `omar.khaled` · `sara.ahmed` · `youssef.ibrahim` · `fatma.ali` · `abdelrahman.hassan` · `nadia.mostafa` · `karim.tarek` · `laila.mohamed` · `hassan.fouad` · `reem.sherif` |

## المميزات

- **لوحة الطالب**: رحلة 6 محطات (إعدادي → ثانوي)، المحطة القادمة، منصة التكريم، ميداليات
- **لوحة المدرس**: إحصائيات، منحنى أداء شهري، أداء المواد، منصة أوائل
- **لوحة الأمين**: حضور اليوم، مستحقات الاشتراكات، سجل الطلاب
- **الامتحانات**: أسئلة اختيار من متعدد وصح/خطأ، تصحيح فوري، ترتيب، ميداليات، المحطة التالية
- **نظام التصميم**: ثيمين (ورق قديم / أطلس ليلي)، بوصلة SVG، خرائط، خط زمني يرسم أثناء التمرير

## الأوامر المفيدة

```bash
dotnet build backend\MrSiam.slnx          # بناء الـ backend
npm run build --prefix frontend           # بناء الـ frontend (tsc + vite)
```
