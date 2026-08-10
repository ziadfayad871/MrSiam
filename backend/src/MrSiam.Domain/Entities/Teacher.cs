using MrSiam.Domain.Common;

namespace MrSiam.Domain.Entities;

public class Teacher : Entity
{
    public int UserId { get; set; }
    public required string FullName { get; set; }
    public required string Title { get; set; }
    public required string Bio { get; set; }
    public required string Philosophy { get; set; }
    public int ExperienceYears { get; set; }
    public required string GraduatedFrom { get; set; }
    public string? PortraitUrl { get; set; }

    public AppUser? User { get; set; }
    public ICollection<Course> Courses { get; set; } = new List<Course>();
}
