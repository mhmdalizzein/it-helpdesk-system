using HelpDesk.API.Data;
using HelpDesk.API.Models;
using HelpDesk.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace HelpDesk.API.Controllers;

[ApiController]
[Route("api/Tickets/{ticketId}/[controller]")]
[Authorize]
public class TicketAttachmentsController : ControllerBase
{
    private const long MaxFileSize = 10 * 1024 * 1024;

    private static readonly Dictionary<string, string> AllowedFileTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        [".png"] = "image/png",
        [".jpg"] = "image/jpeg",
        [".jpeg"] = "image/jpeg",
        [".pdf"] = "application/pdf",
        [".doc"] = "application/msword",
        [".docx"] = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    };

    private readonly ApplicationDbContext _context;
    private readonly IWebHostEnvironment _environment;
    private readonly NotificationService _notificationService;

    public TicketAttachmentsController(
        ApplicationDbContext context,
        IWebHostEnvironment environment,
        NotificationService notificationService)
    {
        _context = context;
        _environment = environment;
        _notificationService = notificationService;
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

    private string GetCurrentUserName()
    {
        return User.FindFirstValue(ClaimTypes.Name) ?? "Unknown";
    }

    private bool CanAccessTicket(Ticket ticket)
    {
        var role = GetCurrentUserRole();
        var userId = GetCurrentUserId();

        return role != "User" || ticket.CreatedByUserId == userId;
    }

    private async Task<Ticket?> FindAccessibleTicket(int ticketId)
    {
        var ticket = await _context.Tickets.FirstOrDefaultAsync(item => item.TicketId == ticketId);

        if (ticket == null || !CanAccessTicket(ticket))
        {
            return null;
        }

        return ticket;
    }

    [HttpGet]
    public async Task<IActionResult> GetAttachments(int ticketId)
    {
        var ticket = await FindAccessibleTicket(ticketId);
        if (ticket == null)
        {
            return NotFound(new { message = "Ticket not found." });
        }

        var attachments = await _context.TicketAttachments
            .Include(attachment => attachment.UploadedByUser)
            .Where(attachment => attachment.TicketId == ticketId)
            .OrderByDescending(attachment => attachment.UploadedAt)
            .Select(attachment => new
            {
                attachment.TicketAttachmentId,
                attachment.TicketId,
                attachment.FileName,
                attachment.FileType,
                attachment.FileSize,
                attachment.UploadedAt,
                UploadedBy = attachment.UploadedByUser.FullName,
                attachment.UploadedByUserId
            })
            .ToListAsync();

        return Ok(attachments);
    }

    [HttpPost]
    [RequestSizeLimit(MaxFileSize)]
    public async Task<IActionResult> UploadAttachment(int ticketId, [FromForm] IFormFile file)
    {
        var ticket = await FindAccessibleTicket(ticketId);
        if (ticket == null)
        {
            return NotFound(new { message = "Ticket not found." });
        }

        if (file == null || file.Length == 0)
        {
            return BadRequest(new { message = "Please choose a file to upload." });
        }

        if (file.Length > MaxFileSize)
        {
            return BadRequest(new { message = "File size must be 10 MB or less." });
        }

        var originalFileName = Path.GetFileName(file.FileName);
        if (string.IsNullOrWhiteSpace(originalFileName))
        {
            return BadRequest(new { message = "Invalid file name." });
        }

        var extension = Path.GetExtension(originalFileName);
        if (!AllowedFileTypes.TryGetValue(extension, out var contentType))
        {
            return BadRequest(new { message = "Only png, jpg, jpeg, pdf, doc, and docx files are allowed." });
        }

        var uploadDirectory = Path.Combine(
            _environment.ContentRootPath,
            "Uploads",
            "TicketAttachments",
            ticketId.ToString()
        );
        Directory.CreateDirectory(uploadDirectory);

        var storedFileName = $"{Guid.NewGuid():N}{extension.ToLowerInvariant()}";
        var storedPath = Path.Combine(uploadDirectory, storedFileName);

        await using (var stream = System.IO.File.Create(storedPath))
        {
            await file.CopyToAsync(stream);
        }

        var relativePath = Path.Combine("Uploads", "TicketAttachments", ticketId.ToString(), storedFileName);
        var userId = GetCurrentUserId();
        var actorName = GetCurrentUserName();

        var attachment = new TicketAttachment
        {
            TicketId = ticketId,
            UploadedByUserId = userId,
            FileName = originalFileName,
            FilePath = relativePath,
            FileType = contentType,
            FileSize = checked((int)file.Length),
            UploadedAt = DateTime.UtcNow
        };

        _context.TicketAttachments.Add(attachment);
        _context.ActivityLogs.Add(new ActivityLog
        {
            UserId = userId,
            TicketId = ticketId,
            Action = "Attachment Uploaded",
            Description = $"{originalFileName} uploaded",
            CreatedAt = DateTime.UtcNow
        });

        _notificationService.QueueAttachmentUploaded(ticket, userId, actorName, originalFileName);

        await _context.SaveChangesAsync();

        return Ok(new
        {
            attachment.TicketAttachmentId,
            attachment.TicketId,
            attachment.FileName,
            attachment.FileType,
            attachment.FileSize,
            attachment.UploadedAt,
            UploadedBy = actorName,
            attachment.UploadedByUserId
        });
    }

    [HttpGet("{attachmentId}/download")]
    public async Task<IActionResult> DownloadAttachment(int ticketId, int attachmentId)
    {
        var attachment = await _context.TicketAttachments
            .Include(item => item.Ticket)
            .FirstOrDefaultAsync(item =>
                item.TicketAttachmentId == attachmentId &&
                item.TicketId == ticketId);

        if (attachment == null)
        {
            return NotFound(new { message = "Attachment not found." });
        }

        if (!CanAccessTicket(attachment.Ticket))
        {
            return Forbid();
        }

        var uploadsRoot = Path.GetFullPath(Path.Combine(
            _environment.ContentRootPath,
            "Uploads",
            "TicketAttachments"
        ));
        var fullPath = Path.GetFullPath(Path.Combine(_environment.ContentRootPath, attachment.FilePath));
        var normalizedRoot = Path.TrimEndingDirectorySeparator(uploadsRoot) + Path.DirectorySeparatorChar;

        if (!fullPath.StartsWith(normalizedRoot, StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { message = "Invalid attachment path." });
        }

        if (!System.IO.File.Exists(fullPath))
        {
            return NotFound(new { message = "Attachment file is missing." });
        }

        return PhysicalFile(
            fullPath,
            attachment.FileType ?? "application/octet-stream",
            attachment.FileName
        );
    }
}
