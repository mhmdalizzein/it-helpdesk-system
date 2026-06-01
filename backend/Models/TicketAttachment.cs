using System;
using System.ComponentModel.DataAnnotations;

namespace HelpDesk.API.Models;

public class TicketAttachment
{
    public int TicketAttachmentId { get; set; }

    public int TicketId { get; set; }

    public int UploadedByUserId { get; set; }

    [Required]
    [MaxLength(255)]
    public string FileName { get; set; } = string.Empty;

    [Required]
    public string FilePath { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? FileType { get; set; }

    public int FileSize { get; set; }

    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    public Ticket Ticket { get; set; } = null!;

    public User UploadedByUser { get; set; } = null!;
}
