namespace HelpDesk.API.DTOs;

public class ReportSummaryDto
{
    public int TotalTickets { get; set; }

    public int OpenTickets { get; set; }

    public int InProgressTickets { get; set; }

    public int ResolvedClosedTickets { get; set; }

    public List<ReportBreakdownItemDto> TicketsByCategory { get; set; } = [];

    public List<ReportBreakdownItemDto> TicketsByPriority { get; set; } = [];

    public List<ReportBreakdownItemDto> TicketsByStatus { get; set; } = [];

    public List<AgentTicketCountDto> TicketsAssignedPerAgent { get; set; } = [];
}

public class ReportBreakdownItemDto
{
    public int Id { get; set; }

    public string Label { get; set; } = string.Empty;

    public int Count { get; set; }
}

public class AgentTicketCountDto
{
    public int AgentId { get; set; }

    public string AgentName { get; set; } = string.Empty;

    public int Count { get; set; }
}
