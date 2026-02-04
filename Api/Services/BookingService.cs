using Microsoft.EntityFrameworkCore;
using RentIt.Api.Data;
using RentIt.Api.Models;

namespace RentIt.Api.Services;

public interface IBookingService
{
    Task<bool> IsArticleAvailableAsync(Guid articleId, DateTime startTime, DateTime endTime, Guid? excludeBookingId = null);
    Task<List<Booking>> GetConflictingBookingsAsync(Guid articleId, DateTime startTime, DateTime endTime);
}

public class BookingService : IBookingService
{
    private readonly RentItDbContext _context;

    public BookingService(RentItDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Checks if an article is available for booking during the specified time period.
    /// Takes into account the buffer time after each booking (EffectiveEndTime).
    /// </summary>
    public async Task<bool> IsArticleAvailableAsync(Guid articleId, DateTime startTime, DateTime endTime, Guid? excludeBookingId = null)
    {
        var conflictingBookings = await GetConflictingBookingsAsync(articleId, startTime, endTime);
        
        if (excludeBookingId.HasValue)
        {
            conflictingBookings = conflictingBookings.Where(b => b.Id != excludeBookingId.Value).ToList();
        }

        return !conflictingBookings.Any();
    }

    /// <summary>
    /// Gets all bookings that conflict with the specified time period.
    /// A conflict occurs when:
    /// - Existing booking's start time is before the new end time
    /// - AND existing booking's effective end time (including buffer) is after the new start time
    /// </summary>
    public async Task<List<Booking>> GetConflictingBookingsAsync(Guid articleId, DateTime startTime, DateTime endTime)
    {
        var bookings = await _context.Bookings
            .Where(b => b.ArticleId == articleId)
            .Where(b => b.Status != BookingStatus.Cancelled)
            .Where(b => b.StartTime < endTime && b.EndTime.AddMinutes(b.BufferMinutes) > startTime)
            .ToListAsync();

        return bookings;
    }
}
