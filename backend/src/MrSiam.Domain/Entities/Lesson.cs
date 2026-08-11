using MrSiam.Domain.Common;

namespace MrSiam.Domain.Entities;

public class Lesson : Entity
{
    public int CourseId { get; set; }
    public required string Title { get; set; }
    public required string Summary { get; set; }
    public int Order { get; set; }
    public int DurationMinutes { get; set; }
    public required string ContentType { get; set; }
    public string? VideoUrl { get; set; }

    public Course? Course { get; set; }
}
