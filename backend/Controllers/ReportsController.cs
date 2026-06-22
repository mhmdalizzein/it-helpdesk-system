using HelpDesk.API.Data;
using HelpDesk.API.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HelpDesk.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class ReportsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ReportsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("summary")]
    [ProducesResponseType(typeof(ReportSummaryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ReportSummaryDto>> GetSummary()
    {
        var ticketsByStatus = await _context.Statuses
            .AsNoTracking()
            .OrderBy(status => status.SortOrder)
            .Select(status => new ReportBreakdownItemDto
            {
                Id = status.StatusId,
                Label = status.StatusName,
                Count = status.Tickets.Count()
            })
            .ToListAsync();

        var ticketsByPriority = await _context.Priorities
            .AsNoTracking()
            .OrderBy(priority => priority.SortOrder)
            .Select(priority => new ReportBreakdownItemDto
            {
                Id = priority.PriorityId,
                Label = priority.PriorityName,
                Count = priority.Tickets.Count()
            })
            .ToListAsync();

        var ticketsByCategory = await _context.Categories
            .AsNoTracking()
            .OrderBy(category => category.CategoryName)
            .Select(category => new ReportBreakdownItemDto
            {
                Id = category.CategoryId,
                Label = category.CategoryName,
                Count = category.Tickets.Count()
            })
            .ToListAsync();

        var ticketsAssignedPerAgent = await _context.Users
            .AsNoTracking()
            .Where(user => user.Role.RoleName == "Agent")
            .OrderBy(user => user.FullName)
            .Select(user => new AgentTicketCountDto
            {
                AgentId = user.UserId,
                AgentName = user.FullName,
                Count = user.AssignedTickets.Count()
            })
            .ToListAsync();

        int CountStatuses(params string[] statusNames)
        {
            return ticketsByStatus
                .Where(item => statusNames.Contains(item.Label, StringComparer.OrdinalIgnoreCase))
                .Sum(item => item.Count);
        }

        return Ok(new ReportSummaryDto
        {
            TotalTickets = ticketsByStatus.Sum(item => item.Count),
            OpenTickets = CountStatuses("Open"),
            InProgressTickets = CountStatuses("In Progress"),
            ResolvedClosedTickets = CountStatuses("Resolved", "Closed"),
            TicketsByCategory = ticketsByCategory,
            TicketsByPriority = ticketsByPriority,
            TicketsByStatus = ticketsByStatus,
            TicketsAssignedPerAgent = ticketsAssignedPerAgent
        });
    }
}
