using System.ComponentModel.DataAnnotations;

namespace HelpDesk.API.DTOs;

public class CreateCommentDto
{
    [Required]
    public string CommentText { get; set; } = string.Empty;

    public bool IsInternal { get; set; } = false;
}
