using Microsoft.EntityFrameworkCore;
using MrSiam.Domain.Entities;

namespace MrSiam.Application.Abstractions;

public interface IApplicationDbContext
{
    DbSet<AppUser> Users { get; }
    DbSet<Student> Students { get; }
    DbSet<Teacher> Teachers { get; }
    DbSet<Course> Courses { get; }
    DbSet<Lesson> Lessons { get; }
    DbSet<Exam> Exams { get; }
    DbSet<Question> Questions { get; }
    DbSet<AnswerOption> AnswerOptions { get; }
    DbSet<ExamAttempt> ExamAttempts { get; }
    DbSet<AttemptAnswer> AttemptAnswers { get; }
    DbSet<Achievement> Achievements { get; }
    DbSet<StudentAchievement> StudentAchievements { get; }
    DbSet<Payment> Payments { get; }
    DbSet<AttendanceRecord> AttendanceRecords { get; }
    DbSet<TopStudent> TopStudents { get; }
    DbSet<StudentTestimonial> StudentTestimonials { get; }
    DbSet<Assignment> Assignments { get; }
    DbSet<AssignmentQuestion> AssignmentQuestions { get; }
    DbSet<AssignmentSubmission> AssignmentSubmissions { get; }
    DbSet<StudentNote> StudentNotes { get; }
    DbSet<Bookmark> Bookmarks { get; }
    DbSet<WatchProgress> WatchProgress { get; }
    DbSet<XPTransaction> XPTransactions { get; }
    DbSet<MistakeNotebook> MistakeNotebook { get; }
    DbSet<Notification> Notifications { get; }
    DbSet<AuditLog> AuditLogs { get; }
    DbSet<LessonResource> LessonResources { get; }
    DbSet<Certificate> Certificates { get; }
    DbSet<SubscriptionPlan> SubscriptionPlans { get; }
    DbSet<Coupon> Coupons { get; }
    DbSet<Subscription> Subscriptions { get; }
    DbSet<Parent> Parents { get; }
    DbSet<LiveLesson> LiveLessons { get; }
    DbSet<StudyGroup> StudyGroups { get; }
    DbSet<StudyGroupMember> StudyGroupMembers { get; }
    DbSet<ScheduleSlot> ScheduleSlots { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
