using MrSiam.Domain.Common;

namespace MrSiam.Domain.Entities;

public class StudyGroupMember : Entity
{
    public int GroupId { get; set; }
    public int StudentId { get; set; }
    public DateTime AddedAt { get; set; } = DateTime.UtcNow;

    public StudyGroup? Group { get; set; }
    public Student? Student { get; set; }
}
