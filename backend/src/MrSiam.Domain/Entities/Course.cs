using MrSiam.Domain.Common;
using MrSiam.Domain.Enums;

namespace MrSiam.Domain.Entities;

public class Course : Entity
{
    public required string Title { get; set; }
    public required string Description { get; set; }
    public Subject Subject { get; set; }
    public Stage Stage { get; set; }
    public int TeacherId { get; set; }
    public bool IsActive { get; set; } = true;
    public int Order { get; set; }
    public string? ImageUrl { get; set; }
    public int? Month { get; set; }

    public Teacher? Teacher { get; set; }
    public ICollection<Lesson> Lessons { get; set; } = new List<Lesson>();
    public ICollection<Exam> Exams { get; set; } = new List<Exam>();
}
