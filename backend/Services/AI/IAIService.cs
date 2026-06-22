namespace HelpDesk.API.Services.AI;

public interface IAIService
{
    bool IsConfigured { get; }

    bool IsDemoMode { get; }

    string Provider { get; }

    string? Model { get; }

    Task<string> GenerateTextAsync(
        string instructions,
        string input,
        CancellationToken cancellationToken = default);
}
