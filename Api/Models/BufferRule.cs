namespace RentIt.Api.Models;

public class BufferRule
{
    public Guid Id { get; set; }
    public Guid ArticleId { get; set; }
    public DayOfWeek? DayOfWeek { get; set; }
    public int ExtraBufferMinutes { get; set; }
    public int Priority { get; set; }
    
    // Navigation properties
    public Article Article { get; set; } = null!;
}
