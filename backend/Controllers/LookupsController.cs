using HelpDesk.API.Data;
using HelpDesk.API.DTOs;
using HelpDesk.API.Models;
using Microsoft.AspNetCore.Authorization;
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

    [Authorize(Roles = "Admin")]
    [HttpGet("categories/all")]
    public async Task<IActionResult> GetAllCategories()
    {
        var categories = await _context.Categories
            .AsNoTracking()
            .OrderBy(category => category.CategoryName)
            .Select(category => new
            {
                category.CategoryId,
                category.CategoryName,
                category.Description,
                category.IsActive
            })
            .ToListAsync();

        return Ok(categories);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("categories")]
    public async Task<IActionResult> CreateCategory(CategoryManagementDto request)
    {
        var name = request.Name.Trim();
        if (await _context.Categories.AnyAsync(item => item.CategoryName.ToLower() == name.ToLower()))
        {
            return Conflict(new { message = "A category with this name already exists." });
        }

        var category = new Category
        {
            CategoryName = name,
            Description = request.Description?.Trim(),
            IsActive = request.IsActive
        };
        _context.Categories.Add(category);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            category.CategoryId,
            category.CategoryName,
            category.Description,
            category.IsActive
        });
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("categories/{id:int}")]
    public async Task<IActionResult> UpdateCategory(int id, CategoryManagementDto request)
    {
        var category = await _context.Categories.FindAsync(id);
        if (category == null)
        {
            return NotFound(new { message = "Category not found." });
        }

        var name = request.Name.Trim();
        if (await _context.Categories.AnyAsync(item =>
            item.CategoryId != id && item.CategoryName.ToLower() == name.ToLower()))
        {
            return Conflict(new { message = "A category with this name already exists." });
        }

        category.CategoryName = name;
        category.Description = request.Description?.Trim();
        category.IsActive = request.IsActive;
        await _context.SaveChangesAsync();

        return Ok(new
        {
            category.CategoryId,
            category.CategoryName,
            category.Description,
            category.IsActive
        });
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("priorities")]
    public async Task<IActionResult> CreatePriority(OrderedLookupManagementDto request)
    {
        var name = request.Name.Trim();
        if (await _context.Priorities.AnyAsync(item => item.PriorityName.ToLower() == name.ToLower()))
        {
            return Conflict(new { message = "A priority with this name already exists." });
        }

        var priority = new Priority
        {
            PriorityName = name,
            Description = request.Description?.Trim(),
            SortOrder = request.SortOrder
        };
        _context.Priorities.Add(priority);
        await _context.SaveChangesAsync();
        return Ok(new
        {
            priority.PriorityId,
            priority.PriorityName,
            priority.Description,
            priority.SortOrder
        });
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("priorities/{id:int}")]
    public async Task<IActionResult> UpdatePriority(int id, OrderedLookupManagementDto request)
    {
        var priority = await _context.Priorities.FindAsync(id);
        if (priority == null)
        {
            return NotFound(new { message = "Priority not found." });
        }

        var name = request.Name.Trim();
        if (await _context.Priorities.AnyAsync(item =>
            item.PriorityId != id && item.PriorityName.ToLower() == name.ToLower()))
        {
            return Conflict(new { message = "A priority with this name already exists." });
        }

        priority.PriorityName = name;
        priority.Description = request.Description?.Trim();
        priority.SortOrder = request.SortOrder;
        await _context.SaveChangesAsync();
        return Ok(new
        {
            priority.PriorityId,
            priority.PriorityName,
            priority.Description,
            priority.SortOrder
        });
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("statuses")]
    public async Task<IActionResult> CreateStatus(OrderedLookupManagementDto request)
    {
        var name = request.Name.Trim();
        if (await _context.Statuses.AnyAsync(item => item.StatusName.ToLower() == name.ToLower()))
        {
            return Conflict(new { message = "A status with this name already exists." });
        }

        var status = new Status
        {
            StatusName = name,
            Description = request.Description?.Trim(),
            SortOrder = request.SortOrder
        };
        _context.Statuses.Add(status);
        await _context.SaveChangesAsync();
        return Ok(new
        {
            status.StatusId,
            status.StatusName,
            status.Description,
            status.SortOrder
        });
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("statuses/{id:int}")]
    public async Task<IActionResult> UpdateStatus(int id, OrderedLookupManagementDto request)
    {
        var status = await _context.Statuses.FindAsync(id);
        if (status == null)
        {
            return NotFound(new { message = "Status not found." });
        }

        var name = request.Name.Trim();
        if (await _context.Statuses.AnyAsync(item =>
            item.StatusId != id && item.StatusName.ToLower() == name.ToLower()))
        {
            return Conflict(new { message = "A status with this name already exists." });
        }

        status.StatusName = name;
        status.Description = request.Description?.Trim();
        status.SortOrder = request.SortOrder;
        await _context.SaveChangesAsync();
        return Ok(new
        {
            status.StatusId,
            status.StatusName,
            status.Description,
            status.SortOrder
        });
    }
}
