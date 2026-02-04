namespace RentIt.Api.Models;

public class Booking
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid UserId { get; set; }
    public Guid ArticleId { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    
    /// <summary>
    /// Buffer time in minutes after EndTime to block the article.
    /// This prevents back-to-back bookings without cleanup/preparation time.
    /// </summary>
    public int BufferMinutes { get; set; } = 30;
    
    /// <summary>
    /// Calculated end time including buffer (EndTime + BufferMinutes).
    /// The article is blocked until this time.
    /// </summary>
    public DateTime EffectiveEndTime => EndTime.AddMinutes(BufferMinutes);
    
    public decimal TotalPrice { get; set; }
    public BookingStatus Status { get; set; } = BookingStatus.Pending;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public Tenant Tenant { get; set; } = null!;
    public User User { get; set; } = null!;
    public Article Article { get; set; } = null!;
}

public enum BookingStatus
{
    Pending,
    Confirmed,
    InProgress,
    Completed,
    Cancelled
}
