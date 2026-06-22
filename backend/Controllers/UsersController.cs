using HelpDesk.API.Data;
using HelpDesk.API.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace HelpDesk.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public UsersController(ApplicationDbContext context)
    {
        _context = context;
    }

    private int GetCurrentUserId()
    {
        return int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    }

    [Authorize]
    [HttpGet("profile")]
    public async Task<ActionResult<UserProfileDto>> GetProfile()
    {
        var userId = GetCurrentUserId();
        var user = await _context.Users
            .AsNoTracking()
            .Include(item => item.Role)
            .FirstOrDefaultAsync(item => item.UserId == userId);

        if (user == null)
        {
            return NotFound(new { message = "User profile not found." });
        }

        var relatedTickets = _context.Tickets.AsNoTracking().AsQueryable();
        relatedTickets = user.Role.RoleName == "Agent"
            ? relatedTickets.Where(ticket => ticket.CreatedByUserId == userId || ticket.AssignedToUserId == userId)
            : relatedTickets.Where(ticket => ticket.CreatedByUserId == userId);

        var profile = new UserProfileDto
        {
            UserId = user.UserId,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role.RoleName,
            CreatedAt = user.CreatedAt,
            CreatedTicketsCount = await _context.Tickets.CountAsync(ticket => ticket.CreatedByUserId == userId),
            AssignedTicketsCount = user.Role.RoleName == "Agent"
                ? await _context.Tickets.CountAsync(ticket => ticket.AssignedToUserId == userId)
                : null,
            RecentTickets = await relatedTickets
                .OrderByDescending(ticket => ticket.UpdatedAt ?? ticket.CreatedAt)
                .Take(5)
                .Select(ticket => new ProfileTicketDto
                {
                    TicketId = ticket.TicketId,
                    TicketReference = ticket.TicketReference,
                    Title = ticket.Title,
                    Status = ticket.Status.StatusName,
                    Priority = ticket.Priority.PriorityName,
                    CreatedAt = ticket.CreatedAt
                })
                .ToListAsync()
        };

        return Ok(profile);
    }

    [Authorize]
    [HttpPut("password")]
    public async Task<IActionResult> ChangePassword(ChangePasswordDto request)
    {
        if (string.IsNullOrWhiteSpace(request.CurrentPassword)
            || string.IsNullOrWhiteSpace(request.NewPassword)
            || string.IsNullOrWhiteSpace(request.ConfirmPassword))
        {
            return BadRequest(new { message = "All password fields are required." });
        }

        if (request.NewPassword.Length < 8
            || !request.NewPassword.Any(char.IsUpper)
            || !request.NewPassword.Any(char.IsLower)
            || !request.NewPassword.Any(char.IsDigit))
        {
            return BadRequest(new { message = "New password must be at least 8 characters and include uppercase, lowercase, and a number." });
        }

        if (request.NewPassword != request.ConfirmPassword)
        {
            return BadRequest(new { message = "New password and confirmation do not match." });
        }

        var user = await _context.Users.FindAsync(GetCurrentUserId());
        if (user == null)
        {
            return NotFound(new { message = "User not found." });
        }

        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
        {
            return BadRequest(new { message = "Current password is incorrect." });
        }

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return Ok(new { message = "Password changed successfully." });
    }

    [Authorize(Roles = "Admin")]
    [HttpGet]
    public async Task<ActionResult<List<UserListItemDto>>> GetUsers([FromQuery] string? search, [FromQuery] string? role)
    {
        var query = _context.Users.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(user => user.FullName.ToLower().Contains(term) || user.Email.ToLower().Contains(term));
        }

        if (!string.IsNullOrWhiteSpace(role))
        {
            var roleName = role.Trim().ToLower();
            query = query.Where(user => user.Role.RoleName.ToLower() == roleName);
        }

        return Ok(await query
            .OrderBy(user => user.FullName)
            .Select(user => new UserListItemDto
            {
                UserId = user.UserId,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role.RoleName,
                IsActive = user.IsActive,
                Department = user.Department,
                CreatedAt = user.CreatedAt,
                CreatedTicketsCount = user.CreatedTickets.Count,
                AssignedTicketsCount = user.AssignedTickets.Count
            })
            .ToListAsync());
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("system-counts")]
    public async Task<ActionResult<SystemCountsDto>> GetSystemCounts()
    {
        return Ok(new SystemCountsDto
        {
            TotalUsers = await _context.Users.CountAsync(),
            ActiveUsers = await _context.Users.CountAsync(user => user.IsActive),
            AdminUsers = await _context.Users.CountAsync(user => user.Role.RoleName == "Admin"),
            AgentUsers = await _context.Users.CountAsync(user => user.Role.RoleName == "Agent"),
            EmployeeUsers = await _context.Users.CountAsync(user => user.Role.RoleName == "User"),
            TotalTickets = await _context.Tickets.CountAsync(),
            UnassignedTickets = await _context.Tickets.CountAsync(ticket => ticket.AssignedToUserId == null),
            Categories = await _context.Categories.CountAsync(),
            Priorities = await _context.Priorities.CountAsync(),
            Statuses = await _context.Statuses.CountAsync()
        });
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:int}/role")]
    public async Task<IActionResult> UpdateRole(int id, UpdateUserRoleDto request)
    {
        var currentUserId = GetCurrentUserId();
        var user = await _context.Users.Include(item => item.Role).FirstOrDefaultAsync(item => item.UserId == id);
        if (user == null) return NotFound(new { message = "User not found." });
        if (id == currentUserId) return BadRequest(new { message = "You cannot change your own role." });

        var role = await _context.Roles.FirstOrDefaultAsync(item => item.RoleName.ToLower() == request.Role.Trim().ToLower());
        if (role == null) return BadRequest(new { message = "Invalid role." });

        if (user.Role.RoleName == "Admin" && role.RoleName != "Admin"
            && await _context.Users.CountAsync(item => item.IsActive && item.Role.RoleName == "Admin") <= 1)
        {
            return BadRequest(new { message = "The last active administrator cannot be demoted." });
        }

        if (user.Role.RoleName == "Agent" && role.RoleName != "Agent"
            && await HasActiveAssignedTickets(id))
        {
            return BadRequest(new { message = "Reassign this agent's active tickets before changing their role." });
        }

        user.RoleId = role.RoleId;
        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return Ok(new { message = "User role updated successfully." });
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:int}/active")]
    public async Task<IActionResult> UpdateActiveState(int id, UpdateUserActiveDto request)
    {
        var currentUserId = GetCurrentUserId();
        var user = await _context.Users.Include(item => item.Role).FirstOrDefaultAsync(item => item.UserId == id);
        if (user == null) return NotFound(new { message = "User not found." });
        if (id == currentUserId && !request.IsActive) return BadRequest(new { message = "You cannot deactivate your own account." });

        if (!request.IsActive && user.Role.RoleName == "Admin"
            && await _context.Users.CountAsync(item => item.IsActive && item.Role.RoleName == "Admin") <= 1)
        {
            return BadRequest(new { message = "The last active administrator cannot be deactivated." });
        }

        if (!request.IsActive && user.Role.RoleName == "Agent" && await HasActiveAssignedTickets(id))
        {
            return BadRequest(new { message = "Reassign this agent's active tickets before deactivating the account." });
        }

        user.IsActive = request.IsActive;
        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return Ok(new { message = request.IsActive ? "User activated successfully." : "User deactivated successfully." });
    }

    private Task<bool> HasActiveAssignedTickets(int userId)
    {
        return _context.Tickets.AnyAsync(ticket =>
            ticket.AssignedToUserId == userId
            && ticket.Status.StatusName != "Resolved"
            && ticket.Status.StatusName != "Closed");
    }

    [Authorize(Roles = "Admin,Agent")]
    [HttpGet("agents")]
    public async Task<IActionResult> GetAgents()
    {
        return Ok(await _context.Users
            .AsNoTracking()
            .Where(user => user.Role.RoleName == "Agent" && user.IsActive)
            .OrderBy(user => user.FullName)
            .Select(user => new { user.UserId, user.FullName, user.Email })
            .ToListAsync());
    }
}
