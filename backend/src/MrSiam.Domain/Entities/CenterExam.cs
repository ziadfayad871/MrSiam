using MrSiam.Domain.Common;

namespace MrSiam.Domain.Entities;

// امتحان ورقى بيتعمل في السنتر — الدرجات بتتسجل يدويًا وتظهر للطالب وبتوصل لولي الأمر
public class CenterExam : Entity
{
    public int CourseId { get; set; }
    public required string Title { get; set; }
    public DateOnly ExamDate { get; set; }
    public decimal TotalMarks { get; set; } = 100;
    public decimal PassMark { get; set; } = 50;
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Course? Course { get; set; }
    public ICollection<CenterExamResult> Results { get; set; } = [];
}

public class CenterExamResult : Entity
{
    public int CenterExamId { get; set; }
    public int StudentId { get; set; }
    public decimal Score { get; set; }
    public bool IsAbsent { get; set; }
    public string? Notes { get; set; }
    public DateTime RecordedAt { get; set; } = DateTime.UtcNow;

    public CenterExam? Exam { get; set; }
    public Student? Student { get; set; }
}