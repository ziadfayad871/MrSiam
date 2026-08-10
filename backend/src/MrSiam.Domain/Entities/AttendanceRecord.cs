using MrSiam.Domain.Common;
using MrSiam.Domain.Enums;

namespace MrSiam.Domain.Entities;

public class AttendanceRecord : Entity
{
    public int StudentId { get; set; }
    public DateOnly Date { get; set; }
    public AttendanceStatus Status { get; set; }
    public string? Notes { get; set; }

    public Student? Student { get; set; }
}
