using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace HelpDesk.API.Models;

public class Ticket
{
    public int TicketId { get; set; }

    [Required]
    [MaxLength(50)]
    public string TicketReference { get; set; } = string.Empty;

    public int CreatedByUserId { get; set; }

    public int? AssignedToUserId { get; set; }

    public int CategoryId { get; set; }

    public int PriorityId { get; set; }

    public int StatusId { get; set; }

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    public string Description { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    public DateTime? ResolvedAt { get; set; }

    public DateTime? ClosedAt { get; set; }

    public User CreatedByUser { get; set; } = null!;

    public User? AssignedToUser { get; set; }

    public Category Category { get; set; } = null!;

    public Priority Priority { get; set; } = null!;

    public Status Status { get; set; } = null!;

    public ICollection<TicketComment> TicketComments { get; set; } = new List<TicketComment>();

    public ICollection<TicketAttachment> TicketAttachments { get; set; } = new List<TicketAttachment>();

    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();

    public ICollection<ActivityLog> ActivityLogs { get; set; } = new List<ActivityLog>();
}
