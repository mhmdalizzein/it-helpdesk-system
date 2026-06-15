using System.ComponentModel.DataAnnotations;

namespace HelpDesk.API.DTOs;

public class CreateTicketDto
{
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    public string Description { get; set; } = string.Empty;

    [Required]
    public int CategoryId { get; set; }

    [Required]
    public int PriorityId { get; set; }
}
