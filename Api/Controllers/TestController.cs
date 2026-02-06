using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RentIt.Api.Data;
using RentIt.Api.Models;

namespace RentIt.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TestController : ControllerBase
{
    private readonly RentItDbContext _context;

    public TestController(RentItDbContext context)
    {
        _context = context;
    }

    [HttpPost("seed")]
    public async Task<IActionResult> Seed()
    {
        // 1. Ensure Tenant
        var tenant = await _context.Tenants.FirstOrDefaultAsync();
        if (tenant == null)
        {
            tenant = new Tenant
            {
                Id = Guid.NewGuid(),
                Name = "Demo Tenant",
                Domain = "localhost",
                IsActive = true
            };
            _context.Tenants.Add(tenant);
            await _context.SaveChangesAsync();
        }

        // 2. Ensure User (Staff)
        var user = await _context.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.TenantId == tenant.Id);
        if (user == null)
        {
            user = new User
            {
                Id = Guid.NewGuid(),
                TenantId = tenant.Id,
                Email = "admin@rentit.com",
                FirstName = "Admin",
                LastName = "User",
                PasswordHash = "hashed_password",
                IsActive = true
            };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
        }

        // 3. Categories
        var categoriesData = new[]
        {
            new { Name = "Kühlwagen", Icon = "rv_hookup" },
            new { Name = "Kühltruhen", Icon = "kitchen" },
            new { Name = "Gläser", Icon = "local_bar" },
            new { Name = "Garnituren", Icon = "table_restaurant" }
        };

        var categories = new Dictionary<string, Category>();
        foreach (var cData in categoriesData)
        {
            var category = await _context.Categories.IgnoreQueryFilters()
                .FirstOrDefaultAsync(c => c.Name == cData.Name && c.TenantId == tenant.Id);
            
            if (category == null)
            {
                category = new Category
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenant.Id,
                    Name = cData.Name,
                    Icon = cData.Icon
                };
                _context.Categories.Add(category);
            }
            categories[cData.Name] = category;
        }
        await _context.SaveChangesAsync();

        // 3b. Customers
        var customersData = new[]
        {
            new { Name = "Kunde Müller", Code = "KM", Type = "Stammkunde" },
            new { Name = "Getränke Haus", Code = "GH", Type = "Großabnehmer" },
            new { Name = "Sportverein", Code = "SV", Type = "Veranstaltung" },
            new { Name = "Stadtfest K.", Code = "SK", Type = "Einmalig" }
        };

        var customers = new Dictionary<string, Customer>();
        foreach (var cData in customersData)
        {
            var customer = await _context.Customers.IgnoreQueryFilters()
                .FirstOrDefaultAsync(c => c.Name == cData.Name && c.TenantId == tenant.Id);
            
            if (customer == null)
            {
                customer = new Customer
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenant.Id,
                    Name = cData.Name,
                    InternalNote = cData.Type
                };
                _context.Customers.Add(customer);
            }
            customers[cData.Name] = customer;
        }
        await _context.SaveChangesAsync();

        // 4. Articles
        var articlesData = new[]
        {
            new { Name = "Ausschankwagen A", Price = 150m, Category = "Kühlwagen" },
            new { Name = "Kühltruhe", Price = 30m, Category = "Kühltruhen" },
            new { Name = "Gläser-Sets", Price = 15m, Category = "Gläser" },
            new { Name = "Wodka", Price = 12m, Category = "Gläser" }, 
            new { Name = "Kiste Veltins", Price = 18m, Category = "Gläser" }, 
            new { Name = "Grill", Price = 40m, Category = "Garnituren" },
            new { Name = "Stehtisch", Price = 10m, Category = "Garnituren" },
            new { Name = "Bank", Price = 5m, Category = "Garnituren" }
        };

        var articles = new Dictionary<string, Article>();
        foreach (var aData in articlesData)
        {
            var article = await _context.Articles.IgnoreQueryFilters()
                .FirstOrDefaultAsync(a => a.Name == aData.Name && a.TenantId == tenant.Id);
            
            if (article == null)
            {
                article = new Article
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenant.Id,
                    Name = aData.Name,
                    PricePerDay = aData.Price,
                    IsAvailable = true,
                    CategoryId = categories.ContainsKey(aData.Category) ? categories[aData.Category].Id : null
                };
                _context.Articles.Add(article);
            }
            // Update cat if missing
            else if (article.CategoryId == null && categories.ContainsKey(aData.Category))
            {
                article.CategoryId = categories[aData.Category].Id;
            }
            articles[aData.Name] = article;
        }
        await _context.SaveChangesAsync();

        // 5. Orders & Bookings
        // Use fixed dates relative to "Today" to match visualization
        // Visualization: Week 42, Oct 16 - Oct 22 (Mon-Sun)
        // Order #4021: KM, Wed 18 - Sat 21.
        
        // We will create data for the NEXT week relative to now, or hardcoded for a specific date if the user wants purely static data.
        // User screenshot implies dynamic date (Feb 2026).
        // Let's create data for the *current* week of the server time.
        // Current date: Feb 5, 2026 (Thursday).
        // Week starts Mon Feb 2.
        
        var today = DateTime.UtcNow.Date; // Feb 5
        var currentMon = today.AddDays(-(int)today.DayOfWeek + 1); // Monday Feb 2
        // If today is Sunday (0), DayOfWeek is 0. (0-1) = -1 -> add -6 days to get Monday.
        if (today.DayOfWeek == DayOfWeek.Sunday) currentMon = today.AddDays(-6);
        
        // Order 1: Kunde Müller (KM) - Wed to Sat (Feb 4 - Feb 7)
        // Matches Order #4021 items
        var order1Start = currentMon.AddDays(2); // Wed
        var order1End = currentMon.AddDays(5); // Sat
        await CreateOrder(tenant.Id, user.Id, customers["Kunde Müller"], order1Start, order1End, "4021", new[]
        {
            new { Article = articles["Ausschankwagen A"], Qty = 1 },
            new { Article = articles["Kühltruhe"], Qty = 2 },
            new { Article = articles["Gläser-Sets"], Qty = 5 },
            new { Article = articles["Wodka"], Qty = 30 }, // Consumable
            new { Article = articles["Kiste Veltins"], Qty = 10 } // Consumable
        });
        
        // Order 2: Getränke Haus (GH) - "x40 Inv, x12 Bar" - Oct 16-18 (Mo-Wed)
        // Map to Mon-Wed (Feb 2 - Feb 4)
        var order2Start = currentMon; // Mon
        var order2End = currentMon.AddDays(2); // Wed
        await CreateOrder(tenant.Id, user.Id, customers["Getränke Haus"], order2Start, order2End, "4022", new[]
        {
            new { Article = articles["Kiste Veltins"], Qty = 40 },
            new { Article = articles["Wodka"], Qty = 12 }
        });

        // Order 3: Sportverein (SV) - "Grill" - Oct 20-21 (Fr-Sa)
        // Map to Fri-Sat (Feb 6 - Feb 7)
        var order3Start = currentMon.AddDays(4); // Fri
        var order3End = currentMon.AddDays(5); // Sat
         await CreateOrder(tenant.Id, user.Id, customers["Sportverein"], order3Start, order3End, "4023", new[]
        {
            new { Article = articles["Grill"], Qty = 1 }
        });

        // Order 4: Stadtfest K (SK) - Not in Gantt? Ah, "SK" is in left column.
        // Maybe "x2 RV, x50 Chair" belongs to SK?
        // Map to Thu-Sat (Feb 5 - Feb 7)
        var order4Start = currentMon.AddDays(3); // Thu
        var order4End = currentMon.AddDays(5); // Sat
         await CreateOrder(tenant.Id, user.Id, customers["Stadtfest K."], order4Start, order4End, "4024", new[]
        {
            new { Article = articles["Ausschankwagen A"], Qty = 2 },
            new { Article = articles["Bank"], Qty = 50 }
        });

        await _context.SaveChangesAsync();
        return Ok("Seeding complete for Week of " + currentMon.ToShortDateString());
    }

    private async Task CreateOrder(Guid tenantId, Guid userId, Customer customer, DateTime start, DateTime end, string orderDisplay, dynamic items)
    {
        // Check if order exists
        var existing = await _context.Orders.IgnoreQueryFilters()
            .FirstOrDefaultAsync(o => o.OrderNumber == orderDisplay && o.TenantId == tenantId);
        
        if (existing != null) return;

        var order = new Order
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            CustomerId = customer.Id,
            OrderNumber = orderDisplay, // Status is string in Order.cs? No, Enum?
            // Order.cs has Status as Enum OrderStatus
            Status = OrderStatus.Confirmed,
            StartDate = start,
            EndDate = end
        };
        _context.Orders.Add(order);

        foreach (var item in items)
        {
            // Position
            var pos = new OrderPosition
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                OrderId = order.Id,
                Name = item.Article.Name,
                Quantity = item.Qty,
                Price = item.Article.PricePerDay
            };
            _context.OrderPositions.Add(pos);

            // Create Booking only if it's not a consumable?
            // "Wodka" and "Kiste Veltins" are consumables. 
            // Rentable items: Wagen, Kühltruhe, Gläser, Grill, Bank.
            // Simplified: If Name contains "Wodka" or "Veltins", don't book.
            string name = item.Article.Name;
            if (!name.Contains("Wodka") && !name.Contains("Veltins"))
            {
                // Create one booking per quantity? Or one booking with metadata? 
                // Booking represents ONE resource instance usually?
                // The dashboard Gantt says "x1", "x2".
                // Our Booking model has ArticleId. If we have 2 Fridges, we might need 2 Bookings if we track individual assets.
                // But Article is a Type (SKU).
                // If we don't track individual asset instances, we can't block distinct slots.
                // But the system seems to be "Type based" availability?
                // BookingService logic: `_context.Bookings.Where(b => b.ArticleId == articleId ...)`
                // So creating n Bookings for Quantity n is correct if we want to consume n capacity.
                
                for(int i=0; i< item.Qty; i++)
                {
                    var booking = new Booking
                    {
                        Id = Guid.NewGuid(),
                        TenantId = tenantId,
                        OrderId = order.Id,
                        UserId = userId,
                        CustomerId = customer.Id,
                        ArticleId = item.Article.Id,
                        StartTime = start,
                        EndTime = end,
                        Status = BookingStatus.Confirmed,
                        TotalPrice = item.Article.PricePerDay * (decimal)(end - start).TotalDays
                    };
                     _context.Bookings.Add(booking);
                }
            }
        }
    }
}
