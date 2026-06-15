using HelpDesk.API.Data;
using HelpDesk.API.DTOs;
using HelpDesk.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace HelpDesk.API.Controllers;

[ApiController]
[Route("api/Tickets/{ticketId}/[controller]")]
[Authorize]
public class TicketCommentsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public TicketCommentsController(ApplicationDbContext context)
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

    [HttpGet]
    public async Task<IActionResult> GetComments(int ticketId)
    {
        var role = GetCurrentUserRole();

        var query = _context.TicketComments
            .Include(c => c.User)
            .Where(c => c.TicketId == ticketId);

        if (role == "User")
        {
            query = query.Where(c => !c.IsInternal);
        }

        var comments = await query
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new
            {
                c.TicketCommentId,
                c.TicketId,
                c.CommentText,
                c.IsInternal,
                c.CreatedAt,
                User = c.User.FullName,
                UserId = c.UserId
            })
            .ToListAsync();

        return Ok(comments);
    }

    [HttpPost]
    public async Task<IActionResult> AddComment(int ticketId, CreateCommentDto dto)
    {
        var userId = GetCurrentUserId();
        var role = GetCurrentUserRole();

        var ticket = await _context.Tickets.FindAsync(ticketId);
        if (ticket == null)
        {
            return NotFound(new { message = "Ticket not found." });
        }

        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            return NotFound(new { message = "User not found." });
        }

        if (role == "User" && ticket.CreatedByUserId != userId)
        {
            return Forbid();
        }

        var comment = new TicketComment
        {
            TicketId = ticketId,
            UserId = userId,
            CommentText = dto.CommentText,
            IsInternal = dto.IsInternal,
            CreatedAt = DateTime.UtcNow
        };

        _context.TicketComments.Add(comment);

        _context.ActivityLogs.Add(new ActivityLog
        {
            UserId = userId,
            TicketId = ticketId,
            Action = "Comment Added",
            Description = dto.IsInternal ? "Internal note added" : "Comment added",
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        return Ok(new
        {
            comment.TicketCommentId,
            comment.TicketId,
            comment.CommentText,
            comment.IsInternal,
            comment.CreatedAt,
            User = user.FullName,
            UserId = userId
        });
    }

    [HttpDelete("{commentId}")]
    public async Task<IActionResult> DeleteComment(int ticketId, int commentId)
    {
        var userId = GetCurrentUserId();
        var role = GetCurrentUserRole();

        var comment = await _context.TicketComments
            .FirstOrDefaultAsync(c => c.TicketCommentId == commentId && c.TicketId == ticketId);

        if (comment == null)
        {
            return NotFound(new { message = "Comment not found." });
        }

        if (role == "User" && comment.UserId != userId)
        {
            return Forbid();
        }

        _context.TicketComments.Remove(comment);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Comment deleted." });
    }
}
