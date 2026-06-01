using System;
using System.ComponentModel.DataAnnotations;

namespace HelpDesk.API.Models;

public class TicketComment
{
    public int TicketCommentId { get; set; }

    public int TicketId { get; set; }

    public int UserId { get; set; }

    [Required]
    public string CommentText { get; set; } = string.Empty;

    public bool IsInternal { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Ticket Ticket { get; set; } = null!;

    public User User { get; set; } = null!;
}
