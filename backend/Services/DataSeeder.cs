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
        await SeedUsersAsync();
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

    private async Task SeedUsersAsync()
    {
        if (await _context.Users.AnyAsync())
        {
            return;
        }

        var adminRole = await _context.Roles.FirstAsync(role => role.RoleName == "Admin");
        var agentRole = await _context.Roles.FirstAsync(role => role.RoleName == "Agent");
        var userRole = await _context.Roles.FirstAsync(role => role.RoleName == "User");

        _context.Users.AddRange(
            new User
            {
                FullName = "System Admin",
                Email = "admin@helpdesk.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
                Department = "IT",
                RoleId = adminRole.RoleId,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            },
            new User
            {
                FullName = "Support Agent",
                Email = "agent@helpdesk.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Agent123!"),
                Department = "IT Support",
                RoleId = agentRole.RoleId,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            },
            new User
            {
                FullName = "Normal User",
                Email = "user@helpdesk.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("User123!"),
                Department = "Operations",
                RoleId = userRole.RoleId,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            }
        );

        await _context.SaveChangesAsync();
    }
}