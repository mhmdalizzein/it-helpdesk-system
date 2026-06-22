namespace HelpDesk.API.Services.AI;

public class AIOptions
{
    public const string SectionName = "AI";

    public string Provider { get; set; } = "Demo";

    public OpenAIOptions OpenAI { get; set; } = new();

    public int MaxOutputTokens { get; set; } = 700;
}

public class OpenAIOptions
{
    public string? ApiKey { get; set; }

    public string? Model { get; set; }

    public string Endpoint { get; set; } = "https://api.openai.com/v1/responses";
}
