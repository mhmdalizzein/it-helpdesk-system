using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace HelpDesk.API.Models;

public class User
{
    public int UserId { get; set; }

    public int RoleId { get; set; }

    [Required]
    [MaxLength(150)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [MaxLength(150)]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    [MaxLength(30)]
    public string? PhoneNumber { get; set; }

    [MaxLength(100)]
    public string? Department { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    public Role Role { get; set; } = null!;

    public ICollection<Ticket> CreatedTickets { get; set; } = new List<Ticket>();

    public ICollection<Ticket> AssignedTickets { get; set; } = new List<Ticket>();

    public ICollection<TicketComment> TicketComments { get; set; } = new List<TicketComment>();

    public ICollection<TicketAttachment> TicketAttachments { get; set; } = new List<TicketAttachment>();

    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();

    public ICollection<ActivityLog> ActivityLogs { get; set; } = new List<ActivityLog>();
}
