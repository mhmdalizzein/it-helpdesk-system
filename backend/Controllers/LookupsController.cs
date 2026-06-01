using HelpDesk.API.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HelpDesk.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LookupsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public LookupsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("roles")]
    public async Task<IActionResult> GetRoles()
    {
        var roles = await _context.Roles
            .OrderBy(role => role.RoleId)
            .ToListAsync();

        return Ok(roles);
    }

    [HttpGet("statuses")]
    public async Task<IActionResult> GetStatuses()
    {
        var statuses = await _context.Statuses
            .OrderBy(status => status.SortOrder)
            .ToListAsync();

        return Ok(statuses);
    }

    [HttpGet("priorities")]
    public async Task<IActionResult> GetPriorities()
    {
        var priorities = await _context.Priorities
            .OrderBy(priority => priority.SortOrder)
            .ToListAsync();

        return Ok(priorities);
    }

    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories()
    {
        var categories = await _context.Categories
            .Where(category => category.IsActive)
            .OrderBy(category => category.CategoryName)
            .ToListAsync();

        return Ok(categories);
    }
}