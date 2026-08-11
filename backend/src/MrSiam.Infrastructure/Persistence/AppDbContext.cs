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
    }
}
