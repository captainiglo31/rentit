using Microsoft.EntityFrameworkCore;
using RentIt.Api.Data;
using RentIt.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add CORS for React frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:3000") // Vite default ports
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Configure PostgreSQL database
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Host=localhost;Database=rentit;Username=postgres;Password=postgres";

builder.Services.AddDbContext<RentItDbContext>(options =>
    options.UseNpgsql(connectionString));

// Register multi-tenancy services
builder.Services.AddScoped<ITenantProvider, TenantProvider>();
builder.Services.AddScoped<IBookingService, BookingService>();

// Add controllers for API endpoints
builder.Services.AddControllers();

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowFrontend");

app.UseAuthorization();
app.MapControllers();

// Health check endpoint
app.MapGet("/api/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }))
    .WithName("HealthCheck")
    .WithOpenApi();

app.Run();
