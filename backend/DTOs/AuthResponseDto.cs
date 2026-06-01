namespace HelpDesk.API.DTOs;

public class AuthResponseDto
{
    public string Token { get; set; } = string.Empty;

    public object User { get; set; } = new();
}