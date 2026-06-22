using HelpDesk.API.Data;
using HelpDesk.API.Models;
using Microsoft.EntityFrameworkCore;

namespace HelpDesk.API.Services;

public class DataSeeder
{
    private readonly ApplicationDbContext _context;

    public DataSeeder(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task SeedAsync()
    {
        await SeedRolesAsync();
    }

    private async Task SeedRolesAsync()
    {
        if (!await _context.Roles.AnyAsync())
        {
            _context.Roles.AddRange(
                new Role { RoleName = "Admin", Description = "System administrator with full access" },
                new Role { RoleName = "Agent", Description = "Support agent who handles tickets" },
                new Role { RoleName = "User", Description = "Regular user who creates tickets" }
            );

            await _context.SaveChangesAsync();
        }
    }

}
