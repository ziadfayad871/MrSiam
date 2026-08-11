using MrSiam.Domain.Common;

namespace MrSiam.Domain.Entities;

public class XPTransaction : Entity
{
    public int StudentId { get; set; }
    public int Amount { get; set; }
    public required string Reason { get; set; }
    public int? RelatedCourseId { get; set; }
    public int? RelatedExamId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
