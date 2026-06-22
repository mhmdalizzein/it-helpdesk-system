using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Options;

namespace HelpDesk.API.Services.AI;

public class OpenAIService : IAIService
{
    private const string NotConfiguredMessage = "AI service is not configured yet. Please contact your administrator.";
    private const string UnavailableMessage = "The AI service is temporarily unavailable. Please try again later.";

    private readonly HttpClient _httpClient;
    private readonly AIOptions _options;
    private readonly ILogger<OpenAIService> _logger;

    public OpenAIService(
        HttpClient httpClient,
        IOptions<AIOptions> options,
        ILogger<OpenAIService> logger)
    {
        _httpClient = httpClient;
        _options = options.Value;
        _logger = logger;
    }

    public bool IsConfigured =>
        string.Equals(Provider, "OpenAI", StringComparison.OrdinalIgnoreCase)
        && !string.IsNullOrWhiteSpace(_options.OpenAI.ApiKey)
        && !string.IsNullOrWhiteSpace(_options.OpenAI.Model)
        && Uri.TryCreate(_options.OpenAI.Endpoint, UriKind.Absolute, out _);

    public bool IsDemoMode => !IsConfigured;

    public string Provider => string.IsNullOrWhiteSpace(_options.Provider)
        ? "Demo"
        : _options.Provider.Trim();

    public string? Model => _options.OpenAI.Model;

    public async Task<string> GenerateTextAsync(
        string instructions,
        string input,
        CancellationToken cancellationToken = default)
    {
        if (!IsConfigured)
        {
            throw new AIServiceException(NotConfiguredMessage);
        }

        using var request = new HttpRequestMessage(HttpMethod.Post, _options.OpenAI.Endpoint);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.OpenAI.ApiKey);

        var payload = new
        {
            model = _options.OpenAI.Model,
            instructions,
            input,
            max_output_tokens = Math.Clamp(_options.MaxOutputTokens, 100, 2000)
        };

        request.Content = new StringContent(
            JsonSerializer.Serialize(payload),
            Encoding.UTF8,
            "application/json");

        try
        {
            using var response = await _httpClient.SendAsync(request, cancellationToken);
            var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning(
                    "AI request failed with HTTP status {StatusCode}.",
                    (int)response.StatusCode);
                throw new AIServiceException(UnavailableMessage);
            }

            var output = ExtractOutputText(responseBody);
            if (string.IsNullOrWhiteSpace(output))
            {
                _logger.LogWarning("AI response did not contain text output.");
                throw new AIServiceException(UnavailableMessage);
            }

            return output.Trim();
        }
        catch (AIServiceException)
        {
            throw;
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            _logger.LogWarning("AI request timed out.");
            throw new AIServiceException(UnavailableMessage);
        }
        catch (HttpRequestException ex)
        {
            _logger.LogWarning(ex, "AI request could not be completed.");
            throw new AIServiceException(UnavailableMessage, ex);
        }
        catch (JsonException ex)
        {
            _logger.LogWarning(ex, "AI returned an invalid response payload.");
            throw new AIServiceException(UnavailableMessage, ex);
        }
    }

    private static string? ExtractOutputText(string responseBody)
    {
        using var document = JsonDocument.Parse(responseBody);
        var root = document.RootElement;

        if (root.TryGetProperty("output_text", out var directOutput)
            && directOutput.ValueKind == JsonValueKind.String)
        {
            return directOutput.GetString();
        }

        if (!root.TryGetProperty("output", out var outputItems)
            || outputItems.ValueKind != JsonValueKind.Array)
        {
            return null;
        }

        var parts = new List<string>();

        foreach (var outputItem in outputItems.EnumerateArray())
        {
            if (!outputItem.TryGetProperty("content", out var contentItems)
                || contentItems.ValueKind != JsonValueKind.Array)
            {
                continue;
            }

            foreach (var contentItem in contentItems.EnumerateArray())
            {
                if (contentItem.TryGetProperty("text", out var text)
                    && text.ValueKind == JsonValueKind.String
                    && !string.IsNullOrWhiteSpace(text.GetString()))
                {
                    parts.Add(text.GetString()!);
                }
            }
        }

        return parts.Count == 0 ? null : string.Join(Environment.NewLine, parts);
    }
}
