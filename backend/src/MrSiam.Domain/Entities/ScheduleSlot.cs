using MrSiam.Domain.Common;

namespace MrSiam.Domain.Entities;

public class ScheduleSlot : Entity
{
    public int GroupId { get; set; }
    public DayOfWeek Day { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public string? Subject { get; set; }
    public string? Room { get; set; }

    public StudyGroup? Group { get; set; }
}
