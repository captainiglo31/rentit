using Microsoft.EntityFrameworkCore;
using RentIt.Api.Models;
using RentIt.Api.Services;

namespace RentIt.Api.Data;

public class RentItDbContext : DbContext
{
    private readonly ITenantProvider _tenantProvider;

    public RentItDbContext(DbContextOptions<RentItDbContext> options, ITenantProvider tenantProvider)
        : base(options)
    {
        _tenantProvider = tenantProvider;
    }

    public DbSet<Tenant> Tenants { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<Customer> Customers { get; set; }
    public DbSet<Category> Categories { get; set; }
    public DbSet<Article> Articles { get; set; }
    public DbSet<Booking> Bookings { get; set; }
    public DbSet<BufferRule> BufferRules { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure Tenant entity
        modelBuilder.Entity<Tenant>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Domain).IsUnique();
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Domain).IsRequired().HasMaxLength(100);
        });

        // Configure User entity with multi-tenancy filter
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TenantId, e.Email }).IsUnique();
            entity.Property(e => e.Email).IsRequired().HasMaxLength(256);
            entity.Property(e => e.FirstName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.LastName).IsRequired().HasMaxLength(100);

            entity.HasOne(e => e.Tenant)
                .WithMany(t => t.Users)
                .HasForeignKey(e => e.TenantId)
                .OnDelete(DeleteBehavior.Cascade);

            // Global Query Filter for multi-tenancy
            entity.HasQueryFilter(e => e.TenantId == _tenantProvider.GetCurrentTenantId());
        });

        // Configure Customer entity with multi-tenancy filter
        modelBuilder.Entity<Customer>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Email).HasMaxLength(256);
            
            entity.HasOne(e => e.Tenant)
                .WithMany()
                .HasForeignKey(e => e.TenantId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasQueryFilter(e => e.TenantId == _tenantProvider.GetCurrentTenantId());
        });

        // Configure Category entity with multi-tenancy filter
        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            
            entity.HasOne(e => e.Tenant)
                .WithMany()
                .HasForeignKey(e => e.TenantId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasQueryFilter(e => e.TenantId == _tenantProvider.GetCurrentTenantId());
        });

        // Configure Article entity with multi-tenancy filter
        modelBuilder.Entity<Article>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.SKU).HasMaxLength(50);
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.PricePerDay).HasPrecision(18, 2);

            entity.HasOne(e => e.Tenant)
                .WithMany(t => t.Articles)
                .HasForeignKey(e => e.TenantId)
                .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasOne(e => e.Category)
                .WithMany(c => c.Articles)
                .HasForeignKey(e => e.CategoryId)
                .OnDelete(DeleteBehavior.SetNull);

            // Global Query Filter for multi-tenancy
            entity.HasQueryFilter(e => e.TenantId == _tenantProvider.GetCurrentTenantId());
        });

        // Configure BufferRule (no tenant filter needed, accessed via Article)
        modelBuilder.Entity<BufferRule>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Article)
                .WithMany(a => a.BufferRules)
                .HasForeignKey(e => e.ArticleId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Configure Booking entity with multi-tenancy filter
        modelBuilder.Entity<Booking>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.TotalPrice).HasPrecision(18, 2);
            entity.Property(e => e.BufferMinutes).IsRequired();

            entity.HasOne(e => e.Tenant)
                .WithMany(t => t.Bookings)
                .HasForeignKey(e => e.TenantId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.User)
                .WithMany(u => u.Bookings)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Customer)
                .WithMany(c => c.Bookings)
                .HasForeignKey(e => e.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Article)
                .WithMany(a => a.Bookings)
                .HasForeignKey(e => e.ArticleId)
                .OnDelete(DeleteBehavior.Restrict);

            // Global Query Filter for multi-tenancy
            entity.HasQueryFilter(e => e.TenantId == _tenantProvider.GetCurrentTenantId());

            // Index for checking booking conflicts (considering buffer time)
            entity.HasIndex(e => new { e.ArticleId, e.StartTime, e.EndTime });
        });
    }
}
