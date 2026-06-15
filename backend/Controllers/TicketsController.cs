using HelpDesk.API.Data;
using HelpDesk.API.DTOs;
using HelpDesk.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace HelpDesk.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TicketsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public TicketsController(ApplicationDbContext context)
    {
        _context = context;
    }

    private int GetCurrentUserId()
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.Parse(value!);
    }

    private string GetCurrentUserRole()
    {
        return User.FindFirstValue(ClaimTypes.Role) ?? "";
    }

    private async Task<string> GenerateTicketReference()
    {
        var lastTicket = await _context.Tickets
            .OrderByDescending(t => t.TicketId)
            .FirstOrDefaultAsync();

        int nextNumber = 1001;
        if (lastTicket != null && !string.IsNullOrEmpty(lastTicket.TicketReference))
        {
            var parts = lastTicket.TicketReference.Split('-');
            if (parts.Length == 2 && int.TryParse(parts[1], out var lastNum))
            {
                nextNumber = lastNum + 1;
            }
        }

        return $"HD-{nextNumber}";
    }

    [HttpGet]
    public async Task<IActionResult> GetTickets()
    {
        try
        {
            var userId = GetCurrentUserId();
            var role = GetCurrentUserRole();

            var query = _context.Tickets.AsQueryable();

            if (role == "User")
            {
                query = query.Where(t => t.CreatedByUserId == userId);
            }
            else if (role == "Agent")
            {
                query = query.Where(t => t.AssignedToUserId == userId || t.CreatedByUserId == userId);
            }

            var tickets = await query
                .OrderByDescending(t => t.CreatedAt)
                .Select(t => new
                {
                    t.TicketId,
                    t.TicketReference,
                    t.Title,
                    t.Description,
                    t.CreatedAt,
                    t.UpdatedAt,
                    t.ResolvedAt,
                    t.ClosedAt,
                    Category = t.Category != null ? t.Category.CategoryName : null,
                    CategoryId = t.CategoryId,
                    Priority = t.Priority != null ? t.Priority.PriorityName : null,
                    PriorityId = t.PriorityId,
                    Status = t.Status != null ? t.Status.StatusName : null,
                    StatusId = t.StatusId,
                    CreatedBy = t.CreatedByUser != null ? t.CreatedByUser.FullName : null,
                    CreatedByUserId = t.CreatedByUserId,
                    AssignedTo = t.AssignedToUser != null ? t.AssignedToUser.FullName : null,
                    AssignedToUserId = t.AssignedToUserId
                })
                .ToListAsync();

            return Ok(tickets);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while fetching tickets.", error = ex.Message });
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetTicket(int id)
    {
        var userId = GetCurrentUserId();
        var role = GetCurrentUserRole();

        var ticket = await _context.Tickets
            .Include(t => t.CreatedByUser)
            .Include(t => t.AssignedToUser)
            .Include(t => t.Category)
            .Include(t => t.Priority)
            .Include(t => t.Status)
            .FirstOrDefaultAsync(t => t.TicketId == id);

        if (ticket == null)
        {
            return NotFound(new { message = "Ticket not found." });
        }

        if (role == "User" && ticket.CreatedByUserId != userId)
        {
            return Forbid();
        }

        return Ok(new
        {
            ticket.TicketId,
            ticket.TicketReference,
            ticket.Title,
            ticket.Description,
            ticket.CreatedAt,
            ticket.UpdatedAt,
            ticket.ResolvedAt,
            ticket.ClosedAt,
            Category = ticket.Category.CategoryName,
            CategoryId = ticket.CategoryId,
            Priority = ticket.Priority.PriorityName,
            PriorityId = ticket.PriorityId,
            Status = ticket.Status.StatusName,
            StatusId = ticket.StatusId,
            CreatedBy = ticket.CreatedByUser.FullName,
            CreatedByUserId = ticket.CreatedByUserId,
            AssignedTo = ticket.AssignedToUser?.FullName,
            AssignedToUserId = ticket.AssignedToUserId
        });
    }

    [HttpGet("{id}/activitylogs")]
    public async Task<IActionResult> GetActivityLogs(int id)
    {
        var ticket = await _context.Tickets.FindAsync(id);
        if (ticket == null)
        {
            return NotFound(new { message = "Ticket not found." });
        }

        var logs = await _context.ActivityLogs
            .Include(l => l.User)
            .Where(l => l.TicketId == id)
            .OrderByDescending(l => l.CreatedAt)
            .Select(l => new
            {
                l.ActivityLogId,
                l.Action,
                l.Description,
                l.CreatedAt,
                User = l.User.FullName,
                UserId = l.UserId
            })
            .ToListAsync();

        return Ok(logs);
    }

    [HttpPost]
    public async Task<IActionResult> CreateTicket(CreateTicketDto dto)
    {
        try
        {
            var userId = GetCurrentUserId();

            var categoryExists = await _context.Categories.AnyAsync(c => c.CategoryId == dto.CategoryId && c.IsActive);
            if (!categoryExists)
            {
                return BadRequest(new { message = "Invalid category." });
            }

            var priorityExists = await _context.Priorities.AnyAsync(p => p.PriorityId == dto.PriorityId);
            if (!priorityExists)
            {
                return BadRequest(new { message = "Invalid priority." });
            }

            var reference = await GenerateTicketReference();

            var ticket = new Ticket
            {
                TicketReference = reference,
                Title = dto.Title,
                Description = dto.Description,
                CategoryId = dto.CategoryId,
                PriorityId = dto.PriorityId,
                StatusId = 1,
                CreatedByUserId = userId,
                CreatedAt = DateTime.UtcNow
            };

            ticket.ActivityLogs.Add(new ActivityLog
            {
                UserId = userId,
                Action = "Created",
                Description = "Ticket created",
                CreatedAt = DateTime.UtcNow
            });

            _context.Tickets.Add(ticket);
            await _context.SaveChangesAsync();

            await _context.Entry(ticket).Reference(t => t.Category).LoadAsync();
            await _context.Entry(ticket).Reference(t => t.Priority).LoadAsync();
            await _context.Entry(ticket).Reference(t => t.Status).LoadAsync();
            await _context.Entry(ticket).Reference(t => t.CreatedByUser).LoadAsync();

            return CreatedAtAction(nameof(GetTicket), new { id = ticket.TicketId }, new
            {
                ticket.TicketId,
                ticket.TicketReference,
                ticket.Title,
                ticket.Description,
                ticket.CreatedAt,
                Category = ticket.Category.CategoryName,
                CategoryId = ticket.CategoryId,
                Priority = ticket.Priority.PriorityName,
                PriorityId = ticket.PriorityId,
                Status = ticket.Status.StatusName,
                StatusId = ticket.StatusId,
                CreatedBy = ticket.CreatedByUser.FullName,
                CreatedByUserId = ticket.CreatedByUserId
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while creating the ticket.", error = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateTicket(int id, UpdateTicketDto dto)
    {
        var userId = GetCurrentUserId();
        var role = GetCurrentUserRole();
        var currentUserName = User.FindFirstValue(ClaimTypes.Name) ?? "Unknown";

        var ticket = await _context.Tickets
            .Include(t => t.Status)
            .Include(t => t.AssignedToUser)
            .FirstOrDefaultAsync(t => t.TicketId == id);

        if (ticket == null)
        {
            return NotFound(new { message = "Ticket not found." });
        }

        if (role == "User" && ticket.CreatedByUserId != userId)
        {
            return Forbid();
        }

        var categoryExists = await _context.Categories.AnyAsync(c => c.CategoryId == dto.CategoryId && c.IsActive);
        if (!categoryExists)
        {
            return BadRequest(new { message = "Invalid category." });
        }

        var priorityExists = await _context.Priorities.AnyAsync(p => p.PriorityId == dto.PriorityId);
        if (!priorityExists)
        {
            return BadRequest(new { message = "Invalid priority." });
        }

        var statusExists = await _context.Statuses.AnyAsync(s => s.StatusId == dto.StatusId);
        if (!statusExists)
        {
            return BadRequest(new { message = "Invalid status." });
        }

        if (dto.AssignedToUserId.HasValue)
        {
            var userExists = await _context.Users.AnyAsync(u => u.UserId == dto.AssignedToUserId.Value);
            if (!userExists)
            {
                return BadRequest(new { message = "Invalid assigned user." });
            }
        }

        var previousStatusId = ticket.StatusId;
        var previousAssignedToUserId = ticket.AssignedToUserId;

        if (dto.StatusId != previousStatusId)
        {
            var newStatus = await _context.Statuses.FindAsync(dto.StatusId);
            var oldStatus = await _context.Statuses.FindAsync(previousStatusId);
            var oldName = oldStatus?.StatusName ?? "Unknown";
            var newName = newStatus?.StatusName ?? "Unknown";

            _context.ActivityLogs.Add(new ActivityLog
            {
                UserId = userId,
                TicketId = id,
                Action = "Status Updated",
                Description = $"Status changed from {oldName} to {newName}",
                CreatedAt = DateTime.UtcNow
            });
        }

        if (dto.AssignedToUserId != previousAssignedToUserId)
        {
            string assignedName = "Unassigned";
            if (dto.AssignedToUserId.HasValue)
            {
                var assignedUser = await _context.Users.FindAsync(dto.AssignedToUserId.Value);
                assignedName = assignedUser?.FullName ?? "Unknown";
            }

            _context.ActivityLogs.Add(new ActivityLog
            {
                UserId = userId,
                TicketId = id,
                Action = "Assigned",
                Description = $"Assigned to {assignedName}",
                CreatedAt = DateTime.UtcNow
            });
        }

        bool detailsChanged = ticket.Title != dto.Title
            || ticket.Description != dto.Description
            || ticket.CategoryId != dto.CategoryId
            || ticket.PriorityId != dto.PriorityId;

        ticket.Title = dto.Title;
        ticket.Description = dto.Description;
        ticket.CategoryId = dto.CategoryId;
        ticket.PriorityId = dto.PriorityId;
        ticket.StatusId = dto.StatusId;
        ticket.AssignedToUserId = dto.AssignedToUserId;
        ticket.UpdatedAt = DateTime.UtcNow;

        if (dto.StatusId == 3 && previousStatusId != 3)
        {
            ticket.ResolvedAt = DateTime.UtcNow;
        }

        if (dto.StatusId == 4 && previousStatusId != 4)
        {
            ticket.ClosedAt = DateTime.UtcNow;
        }

        if (detailsChanged)
        {
            _context.ActivityLogs.Add(new ActivityLog
            {
                UserId = userId,
                TicketId = id,
                Action = "Updated",
                Description = "Ticket details updated",
                CreatedAt = DateTime.UtcNow
            });
        }

        await _context.SaveChangesAsync();

        await _context.Entry(ticket).Reference(t => t.Category).LoadAsync();
        await _context.Entry(ticket).Reference(t => t.Priority).LoadAsync();
        await _context.Entry(ticket).Reference(t => t.Status).LoadAsync();
        await _context.Entry(ticket).Reference(t => t.CreatedByUser).LoadAsync();
        await _context.Entry(ticket).Reference(t => t.AssignedToUser).LoadAsync();

        return Ok(new
        {
            ticket.TicketId,
            ticket.TicketReference,
            ticket.Title,
            ticket.Description,
            ticket.CreatedAt,
            ticket.UpdatedAt,
            ticket.ResolvedAt,
            ticket.ClosedAt,
            Category = ticket.Category.CategoryName,
            CategoryId = ticket.CategoryId,
            Priority = ticket.Priority.PriorityName,
            PriorityId = ticket.PriorityId,
            Status = ticket.Status.StatusName,
            StatusId = ticket.StatusId,
            CreatedBy = ticket.CreatedByUser.FullName,
            CreatedByUserId = ticket.CreatedByUserId,
            AssignedTo = ticket.AssignedToUser?.FullName,
            AssignedToUserId = ticket.AssignedToUserId
        });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTicket(int id)
    {
        var userId = GetCurrentUserId();
        var role = GetCurrentUserRole();

        var ticket = await _context.Tickets
            .Include(t => t.TicketComments)
            .Include(t => t.TicketAttachments)
            .Include(t => t.Notifications)
            .Include(t => t.ActivityLogs)
            .FirstOrDefaultAsync(t => t.TicketId == id);

        if (ticket == null)
        {
            return NotFound(new { message = "Ticket not found." });
        }

        if (role == "User" && ticket.CreatedByUserId != userId)
        {
            return Forbid();
        }

        _context.ActivityLogs.RemoveRange(ticket.ActivityLogs);
        _context.Notifications.RemoveRange(ticket.Notifications);
        _context.TicketAttachments.RemoveRange(ticket.TicketAttachments);
        _context.TicketComments.RemoveRange(ticket.TicketComments);
        _context.Tickets.Remove(ticket);

        await _context.SaveChangesAsync();

        return Ok(new { message = "Ticket deleted successfully." });
    }
}
