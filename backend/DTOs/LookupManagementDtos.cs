using System.ComponentModel.DataAnnotations;

namespace HelpDesk.API.DTOs;

public class CategoryManagementDto
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    public bool IsActive { get; set; } = true;
}

public class OrderedLookupManagementDto
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    [Range(0, 1000)]
    public int SortOrder { get; set; }
}
