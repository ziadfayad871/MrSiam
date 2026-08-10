using Microsoft.EntityFrameworkCore;
using MrSiam.Application.Abstractions;
using MrSiam.Domain.Entities;
using MrSiam.Domain.Enums;

namespace MrSiam.Infrastructure.Persistence;

public static class SeedData
{
    public static async Task SeedAsync(IApplicationDbContext db, IPasswordHasher hasher)
    {
        if (await db.Users.AnyAsync())
            return;

        var ctx = (AppDbContext)db;

        // ---------- Users ----------
        var teacherUser = NewUser(hasher, "siam", "محمد صيام", Role.Teacher, "123456");
        var secretaryUser = NewUser(hasher, "secretary", "أمناء المعهد", Role.Secretary, "123456");
        var adminUser = NewUser(hasher, "admin", "مدير المنصة", Role.Admin, "123456");

        ctx.Users.AddRange(teacherUser, secretaryUser, adminUser);
        await ctx.SaveChangesAsync();

        // ---------- Teacher ----------
        var teacher = new Teacher
        {
            UserId = teacherUser.Id,
            FullName = "مستر محمد صيام",
            Title = "مدرس الدراسات الاجتماعية والتاريخ والجغرافيا",
            Bio = "مدرس دراسات اجتماعية للمرحلة الإعدادية، ومدرس تاريخ وجغرافيا للمرحلة الثانوية. يؤمن أن التاريخ حكاية تُروى، وأن الجغرافيا خريطة تُقرأ، وأن الطالب حين يمسك البوصلة يستطيع أن يجد طريقه في أي علم.",
            Philosophy = "المنهج الجيد لا يُحفظ، بل يُعاش. كل درس هو محطة، وكل امتحان هو تحدٍّ، وكل تفوق هو اكتشاف جديد في رحلة الطالب.",
            ExperienceYears = 18,
            GraduatedFrom = "كلية التربية - جامعة عين شمس",
            PortraitUrl = null
        };

        ctx.Teachers.Add(teacher);
        await ctx.SaveChangesAsync();

        // ---------- Achievements ----------
        var achievements = new[]
        {
            new Achievement { Code = "journey-started", Title = "بداية الرحلة", Description = "خطوتك الأولى في الأطلس التعليمي", Icon = "compass", Order = 1 },
            new Achievement { Code = "first-pass", Title = "مؤرخ المستقبل", Description = "اجتزت أول امتحان في رحلتك", Icon = "scroll", RequiredExamsPassed = 1, Order = 2 },
            new Achievement { Code = "map-king", Title = "ملك الخرائط", Description = "اجتزت امتحانات الجغرافيا لثلاثة مقررات", Icon = "map", Order = 3 },
            new Achievement { Code = "history-hero", Title = "بطل التاريخ", Description = "اجتزت امتحانات التاريخ لثلاثة مقررات", Icon = "landmark", Order = 4 },
            new Achievement { Code = "perfect-100", Title = "علامة كاملة 100%", Description = "حصلت على 100% في امتحان كامل", Icon = "award", RequiredPerfectExams = 1, Order = 5 },
            new Achievement { Code = "five-passes", Title = "المتفوق", Description = "اجتزت خمسة امتحانات بنجاح", Icon = "star", RequiredExamsPassed = 5, Order = 6 },
            new Achievement { Code = "month-hero", Title = "بطل الشهر", Description = "تصدرت النتائج في أحد الامتحانات", Icon = "trophy", Order = 7 },
            new Achievement { Code = "ten-exams", Title = "المستكشف", Description = "اجتزت عشرة امتحانات في رحلتك", Icon = "route", RequiredExamsPassed = 10, Order = 8 },
        };

        ctx.Achievements.AddRange(achievements);
        await ctx.SaveChangesAsync();

        // ---------- Courses / Lessons / Exams ----------
        await SeedCoursesAsync(ctx);

        // ---------- Students ----------
        var students = await SeedStudentsAsync(ctx, hasher);

        // ---------- Attempts ----------
        await SeedAttemptsAsync(ctx, students);

        // ---------- Journey started achievement for all ----------
        var journeyAchievement = achievements.First(a => a.Code == "journey-started");
        foreach (var s in students)
        {
            ctx.StudentAchievements.Add(new StudentAchievement
            {
                StudentId = s.Id,
                AchievementId = journeyAchievement.Id,
                UnlockedAt = DateTime.UtcNow.AddDays(-Random.Shared.Next(3, 40))
            });
        }

        await ctx.SaveChangesAsync();

        // ---------- Payments & Attendance ----------
        await SeedFinanceAsync(ctx, students);
    }

    private static AppUser NewUser(IPasswordHasher hasher, string username, string fullName, Role role, string password)
    {
        return new AppUser
        {
            Username = username,
            FullName = fullName,
            PasswordHash = hasher.Hash(password),
            Role = role,
            CreatedAt = DateTime.UtcNow.AddMonths(-Random.Shared.Next(1, 14))
        };
    }

    private static async Task SeedCoursesAsync(AppDbContext ctx)
    {
        var teacherId = (await ctx.Teachers.FirstAsync()).Id;

        var history = new Func<string, Stage, string, (Course c, string[] lessons, QuestionSeed[] qs)>((
            (title, stage, desc) =>
            {
                var course = new Course
                {
                    Title = title,
                    Description = desc,
                    Subject = Subject.History,
                    Stage = stage,
                    TeacherId = teacherId,
                    IsActive = true,
                    Order = 1
                };
                return (course, Array.Empty<string>(), Array.Empty<QuestionSeed>());
            }));

        _ = history;

        // ---- Prep 1: Social Studies ----
        await AddCourseAsync(ctx, teacherId,
            "الدراسات الاجتماعية - أولى إعدادي", Subject.SocialStudies, Stage.PrepOne, "رحلة عبر تاريخ مصر القديمة وجغرافيتها",
            new[]
            {
                ("التاريخ: مفهومه وأهميته", "التاريخ هو سجل حياة الإنسان، ووسيلته لفهم الحاضر واستشراف المستقبل."),
                ("مصادر دراسة التاريخ", "الآثار والمخطوطات والنقوش أهم مصادر المعرفة التاريخية."),
                ("المصريون القدماء", "أول حضارة في التاريخ قامت على ضفاف النيل، وابتكرت الكتابة والتقويم."),
                ("جغرافيا مصر", "موقع مصر الجغرافي بين قارات العالم جعلها همزة وصل حضارية.")
            },
            new QuestionSeed("اختبار: بداية الرحلة", ExamType.Lesson, new[]
            {
                ("أين قامت الحضارة المصرية القديمة؟", 0, new[] { "على ضفاف نهر النيل", "في الصحراء الغربية", "على ساحل البحر الأحمر", "في سيناء" }, 2),
                ("ما أهم المصادر المادية لدراسة التاريخ؟", 0, new[] { "الآثار", "الخرائط الذهنية", "الأحلام", "الرسوم البيانية" }, 1),
                ("التاريخ هو سجل حياة الإنسان عبر الزمن.", 1, new[] { "صواب", "خطأ" }, 1),
                ("ما أول حضارة قامت في التاريخ؟", 0, new[] { "الحضارة المصرية القديمة", "الحضارة الرومانية", "الحضارة الفارسية", "الحضارة اليونانية" }, 1)
            }));

        // ---- Prep 2: Social Studies ----
        await AddCourseAsync(ctx, teacherId,
            "الدراسات الاجتماعية - تانية إعدادي", Subject.SocialStudies, Stage.PrepTwo, "الحضارة الإسلامية من مولدها إلى ازدهارها",
            new[]
            {
                ("مولد الحضارة الإسلامية", "انطلقت الدعوة الإسلامية من مكة لتنتشر في العالمين."),
                ("الفتوحات الإسلامية", "امتدت الدولة الإسلامية من الأندلس غرباً إلى الهند شرقاً."),
                ("الدولة الأموية", "اتخذت دمشق عاصمة لها ونشرت اللغة العربية والعملة الموحدة."),
                ("الدولة العباسية", "شهدت العصر الذهبي للعلوم والترجمة وبيت الحكمة في بغداد.")
            },
            new QuestionSeed("اختبار: الحضارة الإسلامية", ExamType.Unit, new[]
            {
                ("ما عاصمة الدولة الأموية؟", 0, new[] { "دمشق", "بغداد", "القاهرة", "القسطنطينية" }, 1),
                ("ما عاصمة الدولة العباسية؟", 0, new[] { "بغداد", "دمشق", "قرطبة", "القيروان" }, 1),
                ("بيت الحكمة أنشئ في العصر العباسي.", 1, new[] { "صواب", "خطأ" }, 1),
                ("امتدت الدولة الإسلامية شرقاً حتى:", 0, new[] { "الهند", "الصين", "اليابان", "كوريا" }, 1)
            }));

        // ---- Prep 3: Social Studies ----
        await AddCourseAsync(ctx, teacherId,
            "الدراسات الاجتماعية - تالتة إعدادي", Subject.SocialStudies, Stage.PrepThree, "مصر في العصر الحديث: من الحملة الفرنسية إلى ثورة يوليو",
            new[]
            {
                ("الحملة الفرنسية 1798", "فتحت مصر على أوروبا الحديثة وكشفت ضعف الدولة العثمانية."),
                ("أسرة محمد علي", "بنى جيشاً حديثاً ومدارس جديدة وحاول تحديث مصر."),
                ("الاحتلال البريطاني 1882", "بدأت مصر عصراً جديداً من الاستعمار والمقاومة."),
                ("ثورة 1919", "أول ثورة شعبية شاملة قادها سعد زغلول."),
                ("ثورة 1952", "أنهت الاحتلال وأرست الجمهورية.")
            },
            new QuestionSeed("اختبار: مصر في العصر الحديث", ExamType.Final, new[]
            {
                ("في أي عام وقعت الحملة الفرنسية؟", 0, new[] { "1798", "1805", "1882", "1919" }, 1),
                ("قاد ثورة 1919 الزعيم:", 0, new[] { "سعد زغلول", "مصطفى كامل", "محمد فريد", "أحمد عرابي" }, 1),
                ("تولى محمد علي حكم مصر عام 1805.", 1, new[] { "صواب", "خطأ" }, 1),
                ("في أي عام قامت ثورة 23 يوليو؟", 0, new[] { "1952", "1948", "1956", "1967" }, 1),
                ("أصبحت مصر جمهورية عام:", 0, new[] { "1953", "1952", "1956", "1962" }, 1)
            }));

        // ---- Sec 1: History ----
        await AddCourseAsync(ctx, teacherId,
            "التاريخ - أولى ثانوي", Subject.History, Stage.SecOne, "حضارات الشرق الأدنى القديم واليونان والرومان",
            new[]
            {
                ("مقدمة في علم التاريخ", "التاريخ علم يدرس تطور الإنسان عبر العصور."),
                ("حضارة بلاد الرافدين", "ابتكرت الكتابة المسمارية وأول الشرائع."),
                ("الحضارة اليونانية", "مهد الفلسفة والديمقراطية والعلوم."),
                ("الحضارة الرومانية", "امتدت إمبراطوريتها حول البحر المتوسط.")
            },
            new QuestionSeed("اختبار: الحضارات القديمة", ExamType.Unit, new[]
            {
                ("من اخترع الكتابة المسمارية؟", 0, new[] { "السومريون", "المصريون", "الرومان", "اليونانيون" }, 1),
                ("مهد الديمقراطية هي الحضارة:", 0, new[] { "اليونانية", "الرومانية", "الفينيقية", "الآشورية" }, 1),
                ("قانون حمورابي من أشهر شرائع بلاد الرافدين.", 1, new[] { "صواب", "خطأ" }, 1),
                ("تقع روما على ضفاف نهر:", 0, new[] { "التايبر", "الفرات", "النيل", "الدانوب" }, 1)
            }));

        // ---- Sec 1: Geography ----
        await AddCourseAsync(ctx, teacherId,
            "الجغرافيا - أولى ثانوي", Subject.Geography, Stage.SecOne, "الأرض: كوكبنا في الكون ومقوماته الطبيعية",
            new[]
            {
                ("مفهوم الجغرافيا", "الجغرافيا علم المكان والعلاقة بين الإنسان وبيئته."),
                ("الكون والمجموعة الشمسية", "الأرض كوكب صغير يدور حول الشمس ضمن مجرة درب التبانة."),
                ("شكل الأرض وأبعادها", "الأرض كروية مفلطحة، تدور حول محورها وحول الشمس."),
                ("خطوط الطول ودوائر العرض", "شبكة الإحداثيات التي تحدد موقع أي مكان على الأرض.")
            },
            new QuestionSeed("اختبار: كوكب الأرض", ExamType.Unit, new[]
            {
                ("كم خط عرض رئيسي؟", 0, new[] { "180", "90", "360", "270" }, 1),
                ("خط الطول الرئيسي يمر بمدينة:", 0, new[] { "غرينتش", "باريس", "القاهرة", "مكة" }, 1),
                ("الأرض تدور حول نفسها مرة كل 24 ساعة.", 1, new[] { "صواب", "خطأ" }, 1),
                ("كم عدد كواكب المجموعة الشمسية؟", 0, new[] { "8", "9", "7", "10" }, 1)
            }));

        // ---- Sec 2: History ----
        await AddCourseAsync(ctx, teacherId,
            "التاريخ - تانية ثانوي", Subject.History, Stage.SecTwo, "مصر بين العثمانيين والحملة الفرنسية ومحمد علي",
            new[]
            {
                ("الدولة العثمانية", "قامت عام 1299 وسيطرت على مصر عام 1517."),
                ("مصر تحت الحكم العثماني", "تحولت مصر إلى ولاية عثمانية يدفع واليها الجزية."),
                ("الحملة الفرنسية على مصر", "أظهرت ضعف مصر وفتحت الباب للإصلاح."),
                ("محمد علي باشا", "مؤسس مصر الحديثة وقائد نهضتها التعليمية والعسكرية.")
            },
            new QuestionSeed("اختبار: مصر والدولة العثمانية", ExamType.Unit, new[]
            {
                ("في أي عام سقطت الدولة المملوكية ودخلت مصر العثمانية؟", 0, new[] { "1517", "1453", "1798", "1520" }, 1),
                ("دخلت الحملة الفرنسية مصر عام:", 0, new[] { "1798", "1805", "1517", "1882" }, 1),
                ("أسس محمد علي المدارس على النمط الحديث.", 1, new[] { "صواب", "خطأ" }, 1),
                ("سقطت القسطنطينية في يد العثمانيين عام:", 0, new[] { "1453", "1517", "1492", "1521" }, 1)
            }));

        // ---- Sec 2: Geography ----
        await AddCourseAsync(ctx, teacherId,
            "الجغرافيا - تانية ثانوي", Subject.Geography, Stage.SecTwo, "المناخ والأقاليم والسكان والتنمية",
            new[]
            {
                ("عناصر المناخ", "الحرارة والضغط الجوي والرياح والرطوبة عناصر المناخ الأساسية."),
                ("الأقاليم المناخية", "يصنف مناخ العالم إلى أقاليم مدارية ومدارية حارة ومعتدلة وباردة."),
                ("السكان والتنمية", "يوزع سكان العالم توزيعاً غير متساوٍ وفق العوامل الطبيعية والبشرية.")
            },
            new QuestionSeed("اختبار: المناخ والأقاليم", ExamType.Unit, new[]
            {
                ("مصر تقع ضمن الإقليم المناخي:", 0, new[] { "الصحراوي الجاف", "المداري", "القطبي", "المعتدل البارد" }, 1),
                ("من عناصر المناخ الأساسية:", 0, new[] { "الحرارة", "التربة", "التضاريس", "الصخور" }, 1),
                ("الأمطار الغزيرة تسقط في الإقليم المداري.", 1, new[] { "صواب", "خطأ" }, 1),
                ("يتركز سكان مصر في:", 0, new[] { "وادي النيل والدلتا", "الصحراء الغربية", "سيناء", "البحر الأحمر" }, 1)
            }));

        // ---- Sec 3: History ----
        await AddCourseAsync(ctx, teacherId,
            "التاريخ - تالتة ثانوي", Subject.History, Stage.SecThree, "مصر في القرن العشرين: من الاحتلال إلى قيادة المنطقة",
            new[]
            {
                ("مصر تحت الاحتلال البريطاني", "بداية القرن العشرين شهدت نضالاً وطنياً متصاعداً."),
                ("ثورة 1919 وتصريح 28 فبراير", "حصلت مصر على استقلال شكلي 1922 ودستور 1923."),
                ("ثورة 1952 وأهدافها", "أنهت الملكية وأرست الجمهورية."),
                ("قناة السويس 1956", "تأميم القناة ومعركة الكرامة ضد العدوان الثلاثي.")
            },
            new QuestionSeed("اختبار: مصر في القرن العشرين", ExamType.Final, new[]
            {
                ("صدر تصريح 28 فبراير عام:", 0, new[] { "1922", "1923", "1919", "1936" }, 1),
                ("أعلن الرئيس جمال عبد الناصر تأميم قناة السويس عام:", 0, new[] { "1956", "1952", "1962", "1948" }, 1),
                ("صدر أول دستور مصري بعد ثورة 1919 عام 1923.", 1, new[] { "صواب", "خطأ" }, 1),
                ("عدوان 1956 الثلاثي شاركت فيه:", 0, new[] { "بريطانيا وفرنسا وإسرائيل", "أمريكا وروسيا وفرنسا", "ألمانيا وإيطاليا وإسرائيل", "اليابان وفرنسا وبريطانيا" }, 1)
            }));

        // ---- Sec 3: Geography ----
        await AddCourseAsync(ctx, teacherId,
            "الجغرافيا - تالتة ثانوي", Subject.Geography, Stage.SecThree, "جغرافية مصر الاقتصادية ومواردها",
            new[]
            {
                ("الاقتصاد المصري", "مزيج من الزراعة والصناعة والخدمات والتجارة."),
                ("المياه والموارد", "النيل شريان مصر، والموارد المعدنية أساس الصناعة."),
                ("التنمية المستدامة", "استراتيجية 2030 ترسم مستقبل مصر الاقتصادي.")
            },
            new QuestionSeed("اختبار: اقتصاد مصر", ExamType.Final, new[]
            {
                ("أهم مصادر مياه مصر:", 0, new[] { "نهر النيل", "الأمطار", "المياه الجوفية", "تحلية البحر" }, 1),
                ("من الموارد المعدنية في مصر:", 0, new[] { "الحديد والمنجنيز", "الذهب بكثرة", "الفحم", "البترول فقط" }, 1),
                ("الزراعة أساسها في وادي النيل والدلتا.", 1, new[] { "صواب", "خطأ" }, 1),
                ("استراتيجية التنمية المستدامة في مصر تستهدف عام:", 0, new[] { "2030", "2025", "2040", "2050" }, 1)
            }));
    }

    private static async Task AddCourseAsync(AppDbContext ctx, int teacherId,
        string title, Subject subject, Stage stage, string description,
        (string title, string summary)[] lessons, QuestionSeed exam)
    {
        var course = new Course
        {
            Title = title,
            Description = description,
            Subject = subject,
            Stage = stage,
            TeacherId = teacherId,
            IsActive = true,
            Order = (int)stage
        };

        ctx.Courses.Add(course);
        await ctx.SaveChangesAsync();

        var order = 1;
        foreach (var (lessonTitle, summary) in lessons)
        {
            var lesson = new Lesson
            {
                CourseId = course.Id,
                Title = lessonTitle,
                Summary = summary,
                Order = order++,
                DurationMinutes = 40,
                ContentType = "lesson"
            };
            ctx.Lessons.Add(lesson);
            await ctx.SaveChangesAsync();

            if (lessonTitle == lessons[0].title)
                exam.LessonId = lesson.Id;
        }

        var savedExam = new Exam
        {
            CourseId = course.Id,
            LessonId = exam.LessonId,
            Title = exam.Title,
            Type = exam.Type,
            DurationMinutes = 20,
            TotalMarks = exam.Questions.Sum(q => (decimal)q.Marks),
            PassMark = Math.Round(exam.Questions.Sum(q => (decimal)q.Marks) * 0.5m, 1),
            IsPublished = true,
            AttemptsAllowed = 3
        };

        ctx.Exams.Add(savedExam);
        await ctx.SaveChangesAsync();

        var qOrder = 1;
        foreach (var (text, type, options, marks) in exam.Questions)
        {
            var question = new Question
            {
                ExamId = savedExam.Id,
                Text = text,
                Type = type == 1 ? QuestionType.TrueFalse : QuestionType.SingleChoice,
                Marks = marks,
                Order = qOrder++
            };
            ctx.Questions.Add(question);
            await ctx.SaveChangesAsync();

            var oOrder = 1;
            foreach (var option in options)
            {
                ctx.AnswerOptions.Add(new AnswerOption
                {
                    QuestionId = question.Id,
                    Text = option,
                    IsCorrect = oOrder == 1,
                    Order = oOrder++
                });
            }
        }

        await ctx.SaveChangesAsync();
    }

    private static async Task<List<Student>> SeedStudentsAsync(AppDbContext ctx, IPasswordHasher hasher)
    {
        var specs = new (string name, string code, string phone, Stage stage, string year, string username)[]
        {
            ("أحمد سمير", "2024001", "0100111222", Stage.PrepThree, "2025/2026", "ahmed.samir"),
            ("ملك محمود", "2024002", "0100111333", Stage.SecThree, "2025/2026", "malak.mahmoud"),
            ("عمر خالد", "2024003", "0100111444", Stage.SecTwo, "2025/2026", "omar.khaled"),
            ("سارة أحمد", "2024004", "0100111555", Stage.SecOne, "2025/2026", "sara.ahmed"),
            ("يوسف إبراهيم", "2024005", "0100111666", Stage.PrepTwo, "2025/2026", "youssef.ibrahim"),
            ("فاطمة علي", "2024006", "0100111777", Stage.PrepOne, "2025/2026", "fatma.ali"),
            ("عبدالرحمن حسن", "2024007", "0100111888", Stage.SecTwo, "2025/2026", "abdelrahman.hassan"),
            ("نادية مصطفى", "2024008", "0100111999", Stage.PrepThree, "2025/2026", "nadia.mostafa"),
            ("كريم طارق", "2024009", "0100111000", Stage.PrepOne, "2025/2026", "karim.tarek"),
            ("ليلى محمد", "2024010", "0100112111", Stage.SecThree, "2025/2026", "laila.mohamed"),
            ("حسن فؤاد", "2024011", "0100112222", Stage.SecOne, "2025/2026", "hassan.fouad"),
            ("ريم شريف", "2024012", "0100112333", Stage.PrepTwo, "2025/2026", "reem.sherif"),
        };

        var students = new List<Student>();

        foreach (var (name, code, phone, stage, year, username) in specs)
        {
            var user = NewUser(hasher, username, name, Role.Student, "123456");
            ctx.Users.Add(user);
            await ctx.SaveChangesAsync();

            var student = new Student
            {
                UserId = user.Id,
                StudentCode = code,
                FullName = name,
                GuardianPhone = phone,
                AcademicYear = year,
                Stage = stage,
                JoinedAt = DateTime.UtcNow.AddMonths(-Random.Shared.Next(2, 10)),
                IsActive = true
            };

            ctx.Students.Add(student);
            students.Add(student);
        }

        await ctx.SaveChangesAsync();
        return students;
    }

    private static async Task SeedAttemptsAsync(AppDbContext ctx, List<Student> students)
    {
        var exams = await ctx.Exams.Include(e => e.Course).Include(e => e.Questions).ThenInclude(q => q.Options).ToListAsync();

        foreach (var student in students)
        {
            var courseIds = exams.Where(e => e.Course.Stage == student.Stage).Select(e => e.CourseId).Distinct().ToList();
            var stageExams = exams.Where(e => courseIds.Contains(e.CourseId)).OrderBy(e => e.Id).ToList();

            if (stageExams.Count == 0)
                continue;

            var attemptsCount = student.StudentCode.GetHashCode() % 3 + 2;

            for (var i = 0; i < attemptsCount && i < stageExams.Count; i++)
            {
                var exam = stageExams[i];
                var seed = student.StudentCode.GetHashCode() + exam.Id;
                var rnd = new Random(seed);

                var score = 0m;
                var correct = 0;
                var wrong = 0;
                var skipped = 0;
                var answers = new List<AttemptAnswer>();

                foreach (var q in exam.Questions)
                {
                    var shouldAnswer = rnd.NextDouble() > 0.08;
                    if (!shouldAnswer)
                    {
                        skipped++;
                        answers.Add(new AttemptAnswer { QuestionId = q.Id, SelectedOptionId = null, IsCorrect = false, IsSkipped = true });
                        continue;
                    }

                    var isCorrect = rnd.NextDouble() < 0.78;
                    var option = isCorrect
                        ? q.Options.First(o => o.IsCorrect)
                        : q.Options.Where(o => !o.IsCorrect).ElementAt(rnd.Next(q.Options.Count(o => !o.IsCorrect)));

                    if (isCorrect)
                    {
                        score += q.Marks;
                        correct++;
                    }
                    else
                    {
                        wrong++;
                    }

                    answers.Add(new AttemptAnswer { QuestionId = q.Id, SelectedOptionId = option.Id, IsCorrect = isCorrect, IsSkipped = false });
                }

                var totalMarks = exam.TotalMarks;
                var percentage = totalMarks > 0 ? Math.Round(score / totalMarks * 100, 1) : 0;

                ctx.ExamAttempts.Add(new ExamAttempt
                {
                    ExamId = exam.Id,
                    StudentId = student.Id,
                    StartedAt = DateTime.UtcNow.AddDays(-(attemptsCount - i) * 3).AddHours(-rnd.Next(1, 5)),
                    SubmittedAt = DateTime.UtcNow.AddDays(-(attemptsCount - i) * 3).AddHours(-rnd.Next(1, 5)).AddMinutes(rnd.Next(5, 18)),
                    Score = score,
                    CorrectCount = correct,
                    WrongCount = wrong,
                    SkippedCount = skipped,
                    Passed = score >= exam.PassMark,
                    Percentage = percentage,
                    Answers = answers
                });
            }
        }

        await ctx.SaveChangesAsync();
    }

    private static async Task SeedFinanceAsync(AppDbContext ctx, List<Student> students)
    {
        var now = DateTime.UtcNow;
        var currentMonth = now.ToString("yyyy-MM");
        var lastMonth = now.AddMonths(-1).ToString("yyyy-MM");

        foreach (var student in students)
        {
            var seed = student.StudentCode.GetHashCode();
            var rnd = new Random(seed);

            var currentStatus = seed % 7 == 0 ? PaymentStatus.Pending
                : seed % 5 == 0 ? PaymentStatus.Overdue
                : PaymentStatus.Paid;

            ctx.Payments.Add(new Payment
            {
                StudentId = student.Id,
                Amount = 300,
                Month = currentMonth,
                Status = currentStatus,
                PaidAt = currentStatus == PaymentStatus.Paid ? now.AddDays(-rnd.Next(1, 12)) : null,
                Method = currentStatus == PaymentStatus.Paid ? (rnd.NextDouble() > 0.5 ? "نقدي" : "تحويل بنكي") : null
            });

            ctx.Payments.Add(new Payment
            {
                StudentId = student.Id,
                Amount = 300,
                Month = lastMonth,
                Status = PaymentStatus.Paid,
                PaidAt = now.AddMonths(-1).AddDays(-rnd.Next(1, 12)),
                Method = "نقدي"
            });

            ctx.AttendanceRecords.Add(new AttendanceRecord
            {
                StudentId = student.Id,
                Date = DateOnly.FromDateTime(now),
                Status = seed % 8 == 0 ? AttendanceStatus.Absent : seed % 11 == 0 ? AttendanceStatus.Late : AttendanceStatus.Present
            });
        }

        await ctx.SaveChangesAsync();
    }

    private record QuestionSeed(string Title, ExamType Type, (string Text, int TypeCode, string[] Options, int Marks)[] Questions)
    {
        public int? LessonId { get; set; }
    }
}
