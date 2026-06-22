namespace HelpDesk.API.DTOs;

public class DashboardActivityDto
{
    public int ActivityLogId { get; set; }

    public int TicketId { get; set; }

    public string TicketReference { get; set; } = string.Empty;

    public string Action { get; set; } = string.Empty;

    public string? Description { get; set; }

    public DateTime CreatedAt { get; set; }

    public string User { get; set; } = string.Empty;
}
