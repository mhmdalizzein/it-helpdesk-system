using HelpDesk.API.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

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
