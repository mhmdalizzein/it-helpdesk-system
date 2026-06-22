using HelpDesk.API.Data;
using HelpDesk.API.DTOs;
using HelpDesk.API.Models;
using HelpDesk.API.Services;
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
    private readonly NotificationService _notificationService;
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<TicketsController> _logger;

    public TicketsController(
        ApplicationDbContext context,
        NotificationService notificationService,
        IWebHostEnvironment environment,
        ILogger<TicketsController> logger)
    {
        _context = context;
        _notificationService = notificationService;
        _environment = environment;
        _logger = logger;
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

    private IQueryable<Ticket> GetVisibleTicketsQuery(int userId, string role)
    {
        var query = _context.Tickets.AsQueryable();

        if (role == "User")
        {
            query = query.Where(t => t.CreatedByUserId == userId);
        }
        else if (role == "Agent")
        {
            query = query.Where(t => t.AssignedToUserId == userId || t.CreatedByUserId == userId);
        }
        else if (role != "Admin")
        {
            query = query.Where(_ => false);
        }

        return query;
    }

    private static bool CanAccessTicket(Ticket ticket, int userId, string role)
    {
        return role switch
        {
            "Admin" => true,
            "Agent" => ticket.AssignedToUserId == userId || ticket.CreatedByUserId == userId,
            "User" => ticket.CreatedByUserId == userId,
            _ => false
        };
    }

    [HttpGet]
    public async Task<IActionResult> GetTickets()
    {
        try
        {
            var userId = GetCurrentUserId();
            var role = GetCurrentUserRole();

            var query = GetVisibleTicketsQuery(userId, role);

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

    [HttpGet("stats")]
    public async Task<IActionResult> GetTicketStats()
    {
        var userId = GetCurrentUserId();
        var role = GetCurrentUserRole();
        var query = GetVisibleTicketsQuery(userId, role);

        var totalTickets = await query.CountAsync();

        var byStatus = await query
            .GroupBy(ticket => new { ticket.StatusId, ticket.Status.StatusName })
            .OrderBy(group => group.Key.StatusId)
            .Select(group => new
            {
                Id = group.Key.StatusId,
                Label = group.Key.StatusName,
                Count = group.Count()
            })
            .ToListAsync();

        var byPriority = await query
            .GroupBy(ticket => new { ticket.PriorityId, ticket.Priority.PriorityName })
            .OrderBy(group => group.Key.PriorityId)
            .Select(group => new
            {
                Id = group.Key.PriorityId,
                Label = group.Key.PriorityName,
                Count = group.Count()
            })
            .ToListAsync();

        var byCategory = await query
            .GroupBy(ticket => new { ticket.CategoryId, ticket.Category.CategoryName })
            .OrderBy(group => group.Key.CategoryName)
            .Select(group => new
            {
                Id = group.Key.CategoryId,
                Label = group.Key.CategoryName,
                Count = group.Count()
            })
            .ToListAsync();

        int CountStatus(string statusName)
        {
            return byStatus
                .Where(status => string.Equals(status.Label, statusName, StringComparison.OrdinalIgnoreCase))
                .Sum(status => status.Count);
        }

        return Ok(new
        {
            TotalTickets = totalTickets,
            OpenTickets = CountStatus("Open"),
            InProgressTickets = CountStatus("In Progress"),
            ResolvedTickets = CountStatus("Resolved"),
            ByStatus = byStatus,
            ByPriority = byPriority,
            ByCategory = byCategory
        });
    }

    [HttpGet("recent-activity")]
    [ProducesResponseType(typeof(List<DashboardActivityDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<DashboardActivityDto>>> GetRecentActivity(
        [FromQuery] int limit = 8)
    {
        var userId = GetCurrentUserId();
        var role = GetCurrentUserRole();
        var visibleTickets = GetVisibleTicketsQuery(userId, role).Select(ticket => ticket.TicketId);
        var safeLimit = Math.Clamp(limit, 1, 20);

        var query = _context.ActivityLogs
            .AsNoTracking()
            .Where(log => visibleTickets.Contains(log.TicketId));

        if (role == "User")
        {
            query = query.Where(log => log.Description != "Internal note added");
        }

        var activity = await query
            .OrderByDescending(log => log.CreatedAt)
            .Take(safeLimit)
            .Select(log => new DashboardActivityDto
            {
                ActivityLogId = log.ActivityLogId,
                TicketId = log.TicketId,
                TicketReference = log.Ticket.TicketReference,
                Action = log.Action,
                Description = log.Description,
                CreatedAt = log.CreatedAt,
                User = log.User.FullName
            })
            .ToListAsync();

        return Ok(activity);
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

        if (!CanAccessTicket(ticket, userId, role))
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
        var userId = GetCurrentUserId();
        var role = GetCurrentUserRole();
        var ticket = await _context.Tickets.FindAsync(id);
        if (ticket == null)
        {
            return NotFound(new { message = "Ticket not found." });
        }

        if (!CanAccessTicket(ticket, userId, role))
        {
            return Forbid();
        }

        var logsQuery = _context.ActivityLogs
            .Include(l => l.User)
            .Where(l => l.TicketId == id);

        if (role == "User")
        {
            logsQuery = logsQuery.Where(log => log.Description != "Internal note added");
        }

        var logs = await logsQuery
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

            var defaultStatus = await _context.Statuses
                .AsNoTracking()
                .Where(status => status.StatusName.Trim().ToLower() != "xw")
                .OrderBy(status => status.StatusName.Trim().ToLower() == "open"
                    ? 0
                    : status.StatusName.Trim().ToLower() == "new" ? 1 : 2)
                .ThenBy(status => status.SortOrder)
                .ThenBy(status => status.StatusId)
                .FirstOrDefaultAsync();

            if (defaultStatus == null)
            {
                return Conflict(new
                {
                    message = "No valid initial ticket status is configured. Add Open or New in Admin Settings."
                });
            }

            var defaultStatusExists = await _context.Statuses
                .AsNoTracking()
                .AnyAsync(status => status.StatusId == defaultStatus.StatusId);
            if (!defaultStatusExists)
            {
                return Conflict(new { message = "The default ticket status is no longer available. Please try again." });
            }

            var reference = await GenerateTicketReference();

            var ticket = new Ticket
            {
                TicketReference = reference,
                Title = dto.Title,
                Description = dto.Description,
                CategoryId = dto.CategoryId,
                PriorityId = dto.PriorityId,
                StatusId = defaultStatus.StatusId,
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

        var ticket = await _context.Tickets
            .Include(t => t.Status)
            .Include(t => t.AssignedToUser)
            .FirstOrDefaultAsync(t => t.TicketId == id);

        if (ticket == null)
        {
            return NotFound(new { message = "Ticket not found." });
        }

        if (!CanAccessTicket(ticket, userId, role))
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

        var previousStatusId = ticket.StatusId;
        var previousAssignedToUserId = ticket.AssignedToUserId;
        var assignmentChanged = dto.AssignedToUserId != previousAssignedToUserId;
        User? assignedUser = null;

        if (role == "User" && dto.StatusId != previousStatusId)
        {
            return Forbid();
        }

        if (assignmentChanged && role != "Admin")
        {
            return Forbid();
        }

        if (assignmentChanged && dto.AssignedToUserId.HasValue)
        {
            assignedUser = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.UserId == dto.AssignedToUserId.Value && u.IsActive);

            if (assignedUser == null || assignedUser.Role.RoleName != "Agent")
            {
                return BadRequest(new { message = "Tickets can only be assigned to active support agents." });
            }
        }

        string? oldStatusName = null;
        string? newStatusName = null;

        if (dto.StatusId != previousStatusId)
        {
            var newStatus = await _context.Statuses.FindAsync(dto.StatusId);
            var oldStatus = await _context.Statuses.FindAsync(previousStatusId);
            oldStatusName = oldStatus?.StatusName ?? "Unknown";
            newStatusName = newStatus?.StatusName ?? "Unknown";

            _context.ActivityLogs.Add(new ActivityLog
            {
                UserId = userId,
                TicketId = id,
                Action = "Status Updated",
                Description = $"Status changed from {oldStatusName} to {newStatusName}",
                CreatedAt = DateTime.UtcNow
            });
        }

        if (assignmentChanged)
        {
            var assignedName = assignedUser?.FullName ?? "Unassigned";

            _context.ActivityLogs.Add(new ActivityLog
            {
                UserId = userId,
                TicketId = id,
                Action = "Assigned",
                Description = dto.AssignedToUserId.HasValue ? $"Assigned to {assignedName}" : "Ticket unassigned",
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

        if (dto.AssignedToUserId != previousAssignedToUserId && dto.AssignedToUserId.HasValue)
        {
            _notificationService.QueueTicketAssigned(ticket, userId);
        }

        if (oldStatusName != null && newStatusName != null)
        {
            _notificationService.QueueStatusChanged(ticket, userId, oldStatusName, newStatusName);
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

    [HttpDelete("clear-all")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ClearAllTicketsResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ClearAllTicketsResponseDto>> ClearAllTickets(
        [FromBody] ClearAllTicketsRequestDto request,
        CancellationToken cancellationToken)
    {
        var attachmentPaths = await _context.TicketAttachments
            .AsNoTracking()
            .Select(attachment => attachment.FilePath)
            .ToListAsync(cancellationToken);

        await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

        int deletedActivityLogs;
        int deletedNotifications;
        int deletedAttachments;
        int deletedComments;
        int deletedTickets;

        try
        {
            deletedActivityLogs = await _context.ActivityLogs.ExecuteDeleteAsync(cancellationToken);
            deletedNotifications = await _context.Notifications.ExecuteDeleteAsync(cancellationToken);
            deletedAttachments = await _context.TicketAttachments.ExecuteDeleteAsync(cancellationToken);
            deletedComments = await _context.TicketComments.ExecuteDeleteAsync(cancellationToken);
            deletedTickets = await _context.Tickets.ExecuteDeleteAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync(cancellationToken);
            _logger.LogError(ex, "Failed to clear all helpdesk tickets.");
            return StatusCode(
                StatusCodes.Status500InternalServerError,
                new { message = "Tickets could not be cleared safely. No ticket data was removed." });
        }

        var (deletedFiles, fileCleanupFailures) = DeleteAttachmentFiles(attachmentPaths);

        return Ok(new ClearAllTicketsResponseDto
        {
            DeletedTickets = deletedTickets,
            DeletedComments = deletedComments,
            DeletedActivityLogs = deletedActivityLogs,
            DeletedAttachments = deletedAttachments,
            DeletedNotifications = deletedNotifications,
            DeletedAttachmentFiles = deletedFiles,
            AttachmentFileCleanupFailures = fileCleanupFailures,
            Message = deletedTickets == 0
                ? "There were no tickets to clear."
                : $"Cleared {deletedTickets} ticket{(deletedTickets == 1 ? string.Empty : "s")} and related data."
        });
    }

    [HttpDelete("{id:int}")]
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

        if (!CanAccessTicket(ticket, userId, role))
        {
            return Forbid();
        }

        if (role == "Agent" && ticket.CreatedByUserId != userId)
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

    private (int DeletedFiles, int Failures) DeleteAttachmentFiles(IEnumerable<string> relativePaths)
    {
        var uploadsRoot = Path.GetFullPath(Path.Combine(
            _environment.ContentRootPath,
            "Uploads",
            "TicketAttachments"));
        var normalizedRoot = Path.TrimEndingDirectorySeparator(uploadsRoot) + Path.DirectorySeparatorChar;
        var deletedFiles = 0;
        var failures = 0;

        foreach (var relativePath in relativePaths.Distinct(StringComparer.OrdinalIgnoreCase))
        {
            try
            {
                var fullPath = Path.GetFullPath(Path.Combine(_environment.ContentRootPath, relativePath));
                if (!fullPath.StartsWith(normalizedRoot, StringComparison.OrdinalIgnoreCase))
                {
                    failures++;
                    _logger.LogWarning("Skipped attachment cleanup because its stored path was outside the attachment root.");
                    continue;
                }

                if (System.IO.File.Exists(fullPath))
                {
                    System.IO.File.Delete(fullPath);
                    deletedFiles++;
                }

                var parentDirectory = Path.GetDirectoryName(fullPath);
                if (!string.IsNullOrWhiteSpace(parentDirectory)
                    && parentDirectory.StartsWith(normalizedRoot, StringComparison.OrdinalIgnoreCase)
                    && Directory.Exists(parentDirectory)
                    && !Directory.EnumerateFileSystemEntries(parentDirectory).Any())
                {
                    Directory.Delete(parentDirectory);
                }
            }
            catch (Exception ex) when (ex is IOException or UnauthorizedAccessException or ArgumentException)
            {
                failures++;
                _logger.LogWarning(ex, "An attachment file could not be removed after clearing tickets.");
            }
        }

        return (deletedFiles, failures);
    }
}
