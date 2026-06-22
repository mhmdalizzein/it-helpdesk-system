using System.ComponentModel.DataAnnotations;

namespace HelpDesk.API.DTOs;

public class AIRecommendationRequestDto
{
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [MaxLength(5000)]
    public string Description { get; set; } = string.Empty;
}

public class AIChatRequestDto
{
    [Required]
    [MaxLength(2000)]
    public string Message { get; set; } = string.Empty;
}

public class AITextResponseDto
{
    public string Result { get; set; } = string.Empty;
}

public class AIRecommendationResponseDto
{
    public int RecommendedId { get; set; }

    public string RecommendedName { get; set; } = string.Empty;

    public string Reason { get; set; } = string.Empty;
}

public class AIStatusResponseDto
{
    public string Provider { get; set; } = string.Empty;

    public string Mode { get; set; } = string.Empty;

    public bool IsConfigured { get; set; }

    public string? Model { get; set; }

    public string Message { get; set; } = string.Empty;
}
