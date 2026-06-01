using HelpDesk.API.Data;
using HelpDesk.API.DTOs;
using HelpDesk.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace HelpDesk.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly JwtService _jwtService;

    public AuthController(ApplicationDbContext context, JwtService jwtService)
    {
        _context = context;
        _jwtService = jwtService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto dto)
    {
        var user = await _context.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Email.ToLower() == dto.Email.ToLower());

        if (user == null)
        {
            return Unauthorized(new { message = "Invalid email or password." });
        }

        if (!user.IsActive)
        {
            return Unauthorized(new { message = "Account is inactive." });
        }

        var passwordValid = BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash);

        if (!passwordValid)
        {
            return Unauthorized(new { message = "Invalid email or password." });
        }

        var token = _jwtService.GenerateToken(user);

        return Ok(new AuthResponseDto
        {
            Token = token,
            User = new
            {
                user.UserId,
                user.FullName,
                user.Email,
                user.PhoneNumber,
                user.Department,
                Role = user.Role.RoleName
            }
        });
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!int.TryParse(userIdValue, out var userId))
        {
            return Unauthorized(new { message = "Invalid token." });
        }

        var user = await _context.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.UserId == userId);

        if (user == null)
        {
            return NotFound(new { message = "User not found." });
        }

        return Ok(new
        {
            user.UserId,
            user.FullName,
            user.Email,
            user.PhoneNumber,
            user.Department,
            Role = user.Role.RoleName
        });
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("admin-test")]
    public IActionResult AdminTest()
    {
        return Ok(new { message = "Admin access works." });
    }

    [Authorize(Roles = "Admin,Agent")]
    [HttpGet("staff-test")]
    public IActionResult StaffTest()
    {
        return Ok(new { message = "Admin or Agent access works." });
    }
}