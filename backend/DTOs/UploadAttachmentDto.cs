using System.ComponentModel.DataAnnotations;

namespace HelpDesk.API.DTOs;

public class UploadAttachmentDto
{
    [Required]
    public IFormFile File { get; set; } = null!;
}
