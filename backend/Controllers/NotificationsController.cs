using HelpDesk.API.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace HelpDesk.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public NotificationsController(ApplicationDbContext context)
    {
        _context = context;
    }

    private int GetCurrentUserId()
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.Parse(value!);
    }

    [HttpGet]
    public async Task<IActionResult> GetNotifications([FromQuery] bool unreadOnly = false)
    {
        var userId = GetCurrentUserId();

        var query = _context.Notifications
            .Include(notification => notification.Ticket)
            .Where(notification => notification.UserId == userId);

        if (unreadOnly)
        {
            query = query.Where(notification => !notification.IsRead);
        }

        var notifications = await query
            .OrderByDescending(notification => notification.CreatedAt)
            .Take(50)
            .Select(notification => new
            {
                notification.NotificationId,
                notification.UserId,
                notification.TicketId,
                TicketReference = notification.Ticket.TicketReference,
                notification.Title,
                notification.Message,
                notification.IsRead,
                notification.CreatedAt,
                notification.ReadAt
            })
            .ToListAsync();

        return Ok(notifications);
    }

    [HttpPut("{id}/read")]
    public async Task<IActionResult> MarkAsRead(int id)
    {
        var userId = GetCurrentUserId();

        var notification = await _context.Notifications
            .Include(item => item.Ticket)
            .FirstOrDefaultAsync(item => item.NotificationId == id && item.UserId == userId);

        if (notification == null)
        {
            return NotFound(new { message = "Notification not found." });
        }

        if (!notification.IsRead)
        {
            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        return Ok(new
        {
            notification.NotificationId,
            notification.UserId,
            notification.TicketId,
            TicketReference = notification.Ticket.TicketReference,
            notification.Title,
            notification.Message,
            notification.IsRead,
            notification.CreatedAt,
            notification.ReadAt
        });
    }

    [HttpPut("read-all")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        var userId = GetCurrentUserId();
        var unreadNotifications = await _context.Notifications
            .Where(notification => notification.UserId == userId && !notification.IsRead)
            .ToListAsync();

        foreach (var notification in unreadNotifications)
        {
            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        return Ok(new { markedRead = unreadNotifications.Count });
    }
}
