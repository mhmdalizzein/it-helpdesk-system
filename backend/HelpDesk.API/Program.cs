var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

app.MapGet("/", () => Results.Redirect("/swagger"));

app.MapGet("/health", () =>
{
    return Results.Ok(new
    {
        status = "Backend is running",
        project = "IT Help Desk API"
    });
})
.WithName("HealthCheck");

app.Run();