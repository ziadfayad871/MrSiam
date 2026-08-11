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

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
