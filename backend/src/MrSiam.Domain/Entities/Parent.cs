using MrSiam.Domain.Common;

namespace MrSiam.Domain.Entities;

public class Parent : Entity
{
    public int UserId { get; set; }
    public required string FullName { get; set; }
    public string? Phone { get; set; }

    public AppUser? User { get; set; }
    public ICollection<Student> Students { get; set; } = new List<Student>();
}
