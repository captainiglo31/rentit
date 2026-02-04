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
public class ArticlesController : ControllerBase
{
    private readonly RentItDbContext _context;
    private readonly ITenantProvider _tenantProvider;

    public ArticlesController(RentItDbContext context, ITenantProvider tenantProvider)
    {
        _context = context;
        _tenantProvider = tenantProvider;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Article>>> GetArticles()
    {
        return await _context.Articles
            .Include(a => a.Category)
            .ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Article>> GetArticle(Guid id)
    {
        var article = await _context.Articles
            .Include(a => a.Category)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (article == null)
        {
            return NotFound();
        }

        return article;
    }

    [HttpPost]
    public async Task<ActionResult<Article>> CreateArticle(Article article)
    {
        // TenantId is automatically handled by the TenantProvider/Auth mechanism conceptually,
        // but for safety/explicitness we set it from the provider if the user didn't (or overwrite it).
        // However, the best practice with Global Filters is that saving usually strictly respects the navigation property or explicit ID.
        // Let's ensure the TenantId is set to the current tenant.
        
        article.TenantId = _tenantProvider.GetCurrentTenantId();
        article.Id = Guid.NewGuid();
        article.CreatedAt = DateTime.UtcNow;

        _context.Articles.Add(article);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetArticle), new { id = article.Id }, article);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateArticle(Guid id, Article article)
    {
        if (id != article.Id)
        {
            return BadRequest();
        }

        // Verify ownership via query
        var existingArticle = await _context.Articles.FindAsync(id);
        if (existingArticle == null)
        {
            return NotFound();
        }

        // Update properties
        existingArticle.Name = article.Name;
        existingArticle.Description = article.Description;
        existingArticle.ImageUrl = article.ImageUrl;
        existingArticle.PricePerDay = article.PricePerDay;
        existingArticle.SKU = article.SKU;
        existingArticle.CategoryId = article.CategoryId;
        existingArticle.BaseBufferMinutes = article.BaseBufferMinutes;
        existingArticle.IsActive = article.IsActive;
        existingArticle.IsAvailable = article.IsAvailable;
        existingArticle.UpdatedAt = DateTime.UtcNow;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!ArticleExists(id))
            {
                return NotFound();
            }
            else
            {
                throw;
            }
        }

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteArticle(Guid id)
    {
        var article = await _context.Articles.FindAsync(id);
        if (article == null)
        {
            return NotFound();
        }

        _context.Articles.Remove(article);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private bool ArticleExists(Guid id)
    {
        return _context.Articles.Any(e => e.Id == id);
    }
}
