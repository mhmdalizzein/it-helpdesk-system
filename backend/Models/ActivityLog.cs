using System;
using System.ComponentModel.DataAnnotations;

namespace HelpDesk.API.Models;

public class ActivityLog
{
    public int ActivityLogId { get; set; }

    public int UserId { get; set; }

    public int TicketId { get; set; }

    [Required]
    [MaxLength(100)]
    public string Action { get; set; } = string.Empty;

    public string? Description { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;

    public Ticket Ticket { get; set; } = null!;
}
