using System.Text.Json.Serialization;

namespace RentIt.Api.Models;

public class Article
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid? CategoryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string SKU { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public decimal PricePerDay { get; set; }
    public int BaseBufferMinutes { get; set; } = 60;
    
    public ArticleType Type { get; set; } = ArticleType.Individual;

    public bool IsActive { get; set; } = true;
    public bool IsAvailable { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public Tenant Tenant { get; set; } = null!;
    public Category? Category { get; set; }
    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    public ICollection<BufferRule> BufferRules { get; set; } = new List<BufferRule>();
}

public enum ArticleType
{
    Individual = 0,
    Bulk = 1
}
