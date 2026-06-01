using System;
using System.ComponentModel.DataAnnotations;

namespace HelpDesk.API.Models;

public class Notification
{
    public int NotificationId { get; set; }

    public int UserId { get; set; }

    public int TicketId { get; set; }

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    public string Message { get; set; } = string.Empty;

    public bool IsRead { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? ReadAt { get; set; }

    public User User { get; set; } = null!;

    public Ticket Ticket { get; set; } = null!;
}
