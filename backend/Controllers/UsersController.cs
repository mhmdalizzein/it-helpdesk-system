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

    [Authorize]
    [HttpGet("profile")]
    [ProducesResponseType(typeof(UserProfileDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<UserProfileDto>> GetProfile()
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdValue, out var userId))
        {
            return Unauthorized(new { message = "Invalid authentication token." });
        }

        var profile = await _context.Users
            .AsNoTracking()
            .Where(user => user.UserId == userId)
            .Select(user => new UserProfileDto
            {
                UserId = user.UserId,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role.RoleName,
                CreatedAt = user.CreatedAt,
                CreatedTicketsCount = user.CreatedTickets.Count,
                AssignedTicketsCount = user.Role.RoleName == "Agent"
                    ? user.AssignedTickets.Count
                    : null
            })
            .FirstOrDefaultAsync();

        return profile == null
            ? NotFound(new { message = "User profile not found." })
            : Ok(profile);
    }

    [Authorize(Roles = "Admin")]
    [HttpGet]
    [ProducesResponseType(typeof(List<UserListItemDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<UserListItemDto>>> GetUsers(
        [FromQuery] string? search,
        [FromQuery] string? role)
    {
        var query = _context.Users.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchTerm = search.Trim().ToLower();
            query = query.Where(user =>
                user.FullName.ToLower().Contains(searchTerm)
                || user.Email.ToLower().Contains(searchTerm));
        }

        if (!string.IsNullOrWhiteSpace(role))
        {
            var roleName = role.Trim().ToLower();
            query = query.Where(user => user.Role.RoleName.ToLower() == roleName);
        }

        var users = await query
            .OrderBy(user => user.FullName)
            .Select(user => new UserListItemDto
            {
                UserId = user.UserId,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role.RoleName,
                IsActive = user.IsActive
            })
            .ToListAsync();

        return Ok(users);
    }

    [Authorize(Roles = "Admin,Agent")]
    [HttpGet("agents")]
    public async Task<IActionResult> GetAgents()
    {
        var agents = await _context.Users
            .Include(u => u.Role)
            .Where(u => u.Role.RoleName == "Agent" && u.IsActive)
            .OrderBy(u => u.FullName)
            .Select(u => new
            {
                u.UserId,
                u.FullName,
                u.Email
            })
            .ToListAsync();

        return Ok(agents);
    }
}
