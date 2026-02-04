using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RentIt.Api.Data;
using RentIt.Api.Models;
using RentIt.Api.Services;

namespace RentIt.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class BookingsController : ControllerBase
{
    private readonly RentItDbContext _context;
    private readonly IBookingService _bookingService;
    private readonly ITenantProvider _tenantProvider;

    public BookingsController(RentItDbContext context, IBookingService bookingService, ITenantProvider tenantProvider)
    {
        _context = context;
        _bookingService = bookingService;
        _tenantProvider = tenantProvider;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Booking>>> GetBookings([FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        var query = _context.Bookings
            .Include(b => b.Article)
            .Include(b => b.Customer)
            .Include(b => b.User)
            .AsQueryable();

        if (from.HasValue)
        {
            query = query.Where(b => b.StartTime >= from.Value);
        }

        if (to.HasValue)
        {
            // Bookings that start before the 'to' date
            query = query.Where(b => b.StartTime <= to.Value); 
        }

        return await query.OrderBy(b => b.StartTime).ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Booking>> GetBooking(Guid id)
    {
        var booking = await _context.Bookings
            .Include(b => b.Article)
            .Include(b => b.Customer)
            .Include(b => b.User)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (booking == null)
        {
            return NotFound();
        }

        return booking;
    }

    [HttpGet("availability")]
    public async Task<ActionResult<bool>> CheckAvailability(Guid articleId, DateTime start, DateTime end, Guid? excludeBookingId)
    {
        var isAvailable = await _bookingService.IsArticleAvailableAsync(articleId, start, end, excludeBookingId);
        return isAvailable;
    }

    [HttpPost]
    public async Task<ActionResult<Booking>> CreateBooking(BookingRequest request)
    {
        // 1. Check Availability
        var isAvailable = await _bookingService.IsArticleAvailableAsync(request.ArticleId, request.StartTime, request.EndTime);
        if (!isAvailable)
        {
            return BadRequest("Article is not available for the selected time period.");
        }

        var article = await _context.Articles.FindAsync(request.ArticleId);
        if (article == null) return NotFound("Article not found");

        var booking = new Booking
        {
             Id = Guid.NewGuid(),
             TenantId = _tenantProvider.GetCurrentTenantId(),
             UserId =  Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? throw new Exception("User not found")),
             CustomerId = request.CustomerId,
             ArticleId = request.ArticleId,
             StartTime = request.StartTime,
             EndTime = request.EndTime,
             BufferMinutes = article.BaseBufferMinutes, // Default to article buffer, can be overridden if needed
             TotalPrice = request.TotalPrice,
             Status = BookingStatus.Confirmed,
             CreatedAt = DateTime.UtcNow
        };

        _context.Bookings.Add(booking);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetBooking), new { id = booking.Id }, booking);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateBooking(Guid id, BookingRequest request)
    {
        var booking = await _context.Bookings.FindAsync(id);
        if (booking == null) return NotFound();

        // If time changed, check availability again (excluding this booking)
        if (booking.StartTime != request.StartTime || booking.EndTime != request.EndTime)
        {
             var isAvailable = await _bookingService.IsArticleAvailableAsync(request.ArticleId, request.StartTime, request.EndTime, id);
             if (!isAvailable)
             {
                 return BadRequest("Article is not available for the new time period.");
             }
        }

        booking.CustomerId = request.CustomerId;
        booking.StartTime = request.StartTime;
        booking.EndTime = request.EndTime;
        if (request.Status.HasValue) booking.Status = request.Status.Value;
        
        booking.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return NoContent();
    }
}

public class BookingRequest
{
    public Guid ArticleId { get; set; }
    public Guid? CustomerId { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public decimal TotalPrice { get; set; }
    public BookingStatus? Status { get; set; }
}
