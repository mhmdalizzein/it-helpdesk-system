using System.ComponentModel.DataAnnotations;

namespace HelpDesk.API.DTOs;

public class ClearAllTicketsRequestDto
{
    [Required]
    [RegularExpression("^(DELETE|CLEAR)$", ErrorMessage = "Type DELETE or CLEAR to confirm.")]
    public string Confirmation { get; set; } = string.Empty;
}

public class ClearAllTicketsResponseDto
{
    public int DeletedTickets { get; set; }

    public int DeletedComments { get; set; }

    public int DeletedActivityLogs { get; set; }

    public int DeletedAttachments { get; set; }

    public int DeletedNotifications { get; set; }

    public int DeletedAttachmentFiles { get; set; }

    public int AttachmentFileCleanupFailures { get; set; }

    public string Message { get; set; } = string.Empty;
}
