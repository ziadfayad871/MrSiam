using MrSiam.Domain.Common;
using MrSiam.Domain.Enums;

namespace MrSiam.Domain.Entities;

public class StudyGroup : Entity
{
    public required string Name { get; set; }
    public Stage Stage { get; set; }
    public required string AcademicYear { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<StudyGroupMember> Members { get; set; } = new List<StudyGroupMember>();
    public ICollection<ScheduleSlot> Slots { get; set; } = new List<ScheduleSlot>();
}
