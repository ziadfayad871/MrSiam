using MrSiam.Domain.Common;
using MrSiam.Domain.Enums;

namespace MrSiam.Domain.Entities;

public class Student : Entity
{
    public int UserId { get; set; }
    public required string StudentCode { get; set; }
    public required string FullName { get; set; }
    public required string GuardianPhone { get; set; }
    public required string AcademicYear { get; set; }
    public Stage Stage { get; set; } = Stage.PrepOne;
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;
    public int StreakCurrent { get; set; }
    public int StreakLongest { get; set; }
    public DateTime? LastActiveDay { get; set; }

    public AppUser? User { get; set; }
    public ICollection<ExamAttempt> Attempts { get; set; } = new List<ExamAttempt>();
    public ICollection<StudentAchievement> Achievements { get; set; } = new List<StudentAchievement>();
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
    public ICollection<AttendanceRecord> Attendance { get; set; } = new List<AttendanceRecord>();
}
