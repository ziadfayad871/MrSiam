using Microsoft.EntityFrameworkCore;
using MrSiam.Application.Abstractions;
using MrSiam.Domain.Entities;

namespace MrSiam.Infrastructure.Persistence;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options), IApplicationDbContext
{
    public DbSet<AppUser> Users => Set<AppUser>();
    public DbSet<Student> Students => Set<Student>();
    public DbSet<Teacher> Teachers => Set<Teacher>();
    public DbSet<Course> Courses => Set<Course>();
    public DbSet<Lesson> Lessons => Set<Lesson>();
    public DbSet<Exam> Exams => Set<Exam>();
    public DbSet<Question> Questions => Set<Question>();
    public DbSet<AnswerOption> AnswerOptions => Set<AnswerOption>();
    public DbSet<ExamAttempt> ExamAttempts => Set<ExamAttempt>();
    public DbSet<AttemptAnswer> AttemptAnswers => Set<AttemptAnswer>();
    public DbSet<Achievement> Achievements => Set<Achievement>();
    public DbSet<StudentAchievement> StudentAchievements => Set<StudentAchievement>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<AttendanceRecord> AttendanceRecords => Set<AttendanceRecord>();
    public DbSet<TopStudent> TopStudents => Set<TopStudent>();
    public DbSet<Assignment> Assignments => Set<Assignment>();
    public DbSet<StudentNote> StudentNotes => Set<StudentNote>();
    public DbSet<Bookmark> Bookmarks => Set<Bookmark>();
    public DbSet<WatchProgress> WatchProgress => Set<WatchProgress>();
    public DbSet<XPTransaction> XPTransactions => Set<XPTransaction>();
    public DbSet<MistakeNotebook> MistakeNotebook => Set<MistakeNotebook>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<LessonResource> LessonResources => Set<LessonResource>();
    public DbSet<Certificate> Certificates => Set<Certificate>();
    public DbSet<SubscriptionPlan> SubscriptionPlans => Set<SubscriptionPlan>();
    public DbSet<Coupon> Coupons => Set<Coupon>();
    public DbSet<Subscription> Subscriptions => Set<Subscription>();
    public DbSet<Parent> Parents => Set<Parent>();
    public DbSet<LiveLesson> LiveLessons => Set<LiveLesson>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<AppUser>(e =>
        {
            e.HasIndex(u => u.Username).IsUnique();
            e.Property(u => u.Username).HasMaxLength(64);
            e.Property(u => u.FullName).HasMaxLength(120);
        });

        builder.Entity<Student>(e =>
        {
            e.HasIndex(s => s.StudentCode).IsUnique();
            e.Property(s => s.FullName).HasMaxLength(120);
            e.Property(s => s.GuardianPhone).HasMaxLength(24);
            e.Property(s => s.AcademicYear).HasMaxLength(16);
            e.HasOne(s => s.User).WithOne(u => u.Student).HasForeignKey<Student>(s => s.UserId).OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<Teacher>(e =>
        {
            e.Property(t => t.FullName).HasMaxLength(120);
            e.HasOne(t => t.User).WithOne(u => u.Teacher).HasForeignKey<Teacher>(t => t.UserId).OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<Course>(e =>
        {
            e.HasOne(c => c.Teacher).WithMany(t => t.Courses).HasForeignKey(c => c.TeacherId).OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<Lesson>(e =>
        {
            e.HasOne(l => l.Course).WithMany(c => c.Lessons).HasForeignKey(l => l.CourseId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<Exam>(e =>
        {
            e.HasOne(x => x.Course).WithMany(c => c.Exams).HasForeignKey(x => x.CourseId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Lesson).WithMany().HasForeignKey(x => x.LessonId).OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<Question>(e =>
        {
            e.HasOne(q => q.Exam).WithMany(x => x.Questions).HasForeignKey(q => q.ExamId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(q => q.Lesson).WithMany().HasForeignKey(q => q.LessonId).OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<AnswerOption>(e =>
        {
            e.HasOne(o => o.Question).WithMany(q => q.Options).HasForeignKey(o => o.QuestionId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<ExamAttempt>(e =>
        {
            e.HasOne(a => a.Exam).WithMany(x => x.Attempts).HasForeignKey(a => a.ExamId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(a => a.Student).WithMany(s => s.Attempts).HasForeignKey(a => a.StudentId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<AttemptAnswer>(e =>
        {
            e.HasOne(a => a.Attempt).WithMany(x => x.Answers).HasForeignKey(a => a.AttemptId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(a => a.Question).WithMany().HasForeignKey(a => a.QuestionId).OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<Achievement>(e =>
        {
            e.HasIndex(a => a.Code).IsUnique();
        });

        builder.Entity<StudentAchievement>(e =>
        {
            e.HasKey(sa => new { sa.StudentId, sa.AchievementId });
            e.HasOne(sa => sa.Student).WithMany(s => s.Achievements).HasForeignKey(sa => sa.StudentId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(sa => sa.Achievement).WithMany().HasForeignKey(sa => sa.AchievementId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<Payment>(e =>
        {
            e.HasOne(p => p.Student).WithMany(s => s.Payments).HasForeignKey(p => p.StudentId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<AttendanceRecord>(e =>
        {
            e.HasIndex(a => new { a.StudentId, a.Date }).IsUnique();
            e.HasOne(a => a.Student).WithMany(s => s.Attendance).HasForeignKey(a => a.StudentId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<TopStudent>(e =>
        {
            e.Property(t => t.FullName).HasMaxLength(120);
            e.Property(t => t.StageAr).HasMaxLength(40);
            e.Property(t => t.Achievement).HasMaxLength(120);
            e.Property(t => t.Year).HasMaxLength(16);
            e.Property(t => t.PhotoUrl).HasMaxLength(300);
        });

        builder.Entity<Assignment>(e =>
        {
            e.Property(a => a.Title).HasMaxLength(160);
            e.HasOne(a => a.Course).WithMany().HasForeignKey(a => a.CourseId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<StudentNote>(e =>
        {
            e.HasIndex(n => new { n.StudentId, n.LessonId });
            e.Property(n => n.Text).HasMaxLength(4000);
            e.HasOne<Student>().WithMany().HasForeignKey(n => n.StudentId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne<Lesson>().WithMany().HasForeignKey(n => n.LessonId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<Bookmark>(e =>
        {
            e.HasIndex(b => new { b.StudentId, b.Kind });
            e.HasOne<Student>().WithMany().HasForeignKey(b => b.StudentId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(b => b.Lesson).WithMany().HasForeignKey(b => b.LessonId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(b => b.Exam).WithMany().HasForeignKey(b => b.ExamId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<WatchProgress>(e =>
        {
            e.HasIndex(w => new { w.StudentId, w.LessonId }).IsUnique();
            e.HasOne<Student>().WithMany().HasForeignKey(w => w.StudentId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(w => w.Lesson).WithMany().HasForeignKey(w => w.LessonId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<XPTransaction>(e =>
        {
            e.HasIndex(x => new { x.StudentId, x.CreatedAt });
            e.HasOne<Student>().WithMany().HasForeignKey(x => x.StudentId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<MistakeNotebook>(e =>
        {
            e.HasIndex(m => new { m.StudentId, m.QuestionId }).IsUnique();
            e.Property(m => m.QuestionText).HasMaxLength(2000);
            e.Property(m => m.StudentAnswer).HasMaxLength(1000);
            e.Property(m => m.CorrectAnswer).HasMaxLength(1000);
            e.Property(m => m.Explanation).HasMaxLength(2000);
            e.Property(m => m.LessonTitle).HasMaxLength(200);
            e.Property(m => m.Topic).HasMaxLength(120);
            e.HasOne<Student>().WithMany().HasForeignKey(m => m.StudentId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne<Question>().WithMany().HasForeignKey(m => m.QuestionId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(m => m.Exam).WithMany().HasForeignKey(m => m.ExamId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<Notification>(e =>
        {
            e.HasIndex(n => new { n.UserId, n.CreatedAt });
            e.Property(n => n.Title).HasMaxLength(160);
            e.Property(n => n.Body).HasMaxLength(600);
            e.Property(n => n.Type).HasMaxLength(40);
            e.Property(n => n.Link).HasMaxLength(300);
        });

        builder.Entity<AuditLog>(e =>
        {
            e.HasIndex(a => new { a.CreatedAt, a.Action });
            e.Property(a => a.Action).HasMaxLength(60);
            e.Property(a => a.Entity).HasMaxLength(60);
            e.Property(a => a.EntityId).HasMaxLength(40);
            e.Property(a => a.Username).HasMaxLength(64);
            e.Property(a => a.IpAddress).HasMaxLength(45);
        });

        builder.Entity<LessonResource>(e =>
        {
            e.Property(r => r.Title).HasMaxLength(200);
            e.Property(r => r.Kind).HasMaxLength(30);
            e.Property(r => r.FileUrl).HasMaxLength(400);
            e.HasOne<Lesson>().WithMany().HasForeignKey(r => r.LessonId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<Certificate>(e =>
        {
            e.HasIndex(c => new { c.StudentId, c.ExamId }).IsUnique();
            e.HasIndex(c => c.Code).IsUnique();
            e.Property(c => c.Title).HasMaxLength(200);
            e.Property(c => c.Grade).HasMaxLength(40);
            e.Property(c => c.Code).HasMaxLength(40);
            e.HasOne(c => c.Student).WithMany().HasForeignKey(c => c.StudentId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(c => c.Exam).WithMany().HasForeignKey(c => c.ExamId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(c => c.Course).WithMany().HasForeignKey(c => c.CourseId).OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<Parent>(e =>
        {
            e.Property(p => p.FullName).HasMaxLength(120);
            e.Property(p => p.Phone).HasMaxLength(24);
            e.HasOne(p => p.User).WithOne().HasForeignKey<Parent>(p => p.UserId).OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<Student>(e =>
        {
            e.HasOne(s => s.Parent).WithMany(p => p.Students).HasForeignKey(s => s.ParentId).OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<SubscriptionPlan>(e =>
        {
            e.Property(p => p.Name).HasMaxLength(120);
            e.Property(p => p.Description).HasMaxLength(400);
        });

        builder.Entity<Coupon>(e =>
        {
            e.HasIndex(c => c.Code).IsUnique();
            e.Property(c => c.Code).HasMaxLength(40);
        });

        builder.Entity<Subscription>(e =>
        {
            e.HasIndex(s => new { s.StudentId, s.Status });
            e.HasOne(s => s.Student).WithMany().HasForeignKey(s => s.StudentId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(s => s.Plan).WithMany().HasForeignKey(s => s.PlanId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(s => s.Coupon).WithMany().HasForeignKey(s => s.CouponId).OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<LiveLesson>(e =>
        {
            e.Property(l => l.Title).HasMaxLength(200);
            e.Property(l => l.Description).HasMaxLength(600);
            e.Property(l => l.MeetUrl).HasMaxLength(400);
            e.HasOne(l => l.Course).WithMany().HasForeignKey(l => l.CourseId).OnDelete(DeleteBehavior.Restrict);
        });
    }
}
