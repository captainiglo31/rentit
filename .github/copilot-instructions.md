# Copilot Instructions for RentIt

## 🧠 Project Architecture
RentIt is a multi-tenant rental management system with a .NET 8 backend and a React/Vite frontend (PWA/Android).

- **Backend (Api/)**: ASP.NET Core 8 Web API using Entity Framework Core and PostgreSQL.
- **Frontend (client/)**: React 19, Vite, Tailwind CSS v4, TanStack Query v5.
- **Mobile**: Capacitor v8 wraps the frontend for Android.
- **Multi-Tenancy**: Implemented via Global Query Filters in EF Core.
- **Booking Logic**: "Smart booking" logic includes buffer times between rentals.

## 🛠 Developer Workflow
- **Backend**: Run `dotnet run` in `Api/` (Listening on http://localhost:5000).
- **Frontend**: Run `npm run dev` in `client/` (Listening on http://localhost:5173).
- **Database**: Use `dotnet ef migrations add <Name>` and `dotnet ef database update` in `Api/`.
- **Mobile**: Use `npx cap open android` in `client/` to open Android Studio.

## 🧱 Key Conventions & Patterns

### 1. Multi-Tenancy (Backend)
- **Pattern**: Data isolation is enforced at the database level using EF Core Global Query Filters.
- **Implementation**:
  - `ITenantProvider` service identifies the current tenant.
  - Entities (`User`, `Article`, `Booking`) must have a `TenantId`.
  - `RentItDbContext` applies filters: `entity.HasQueryFilter(e => e.TenantId == _tenantProvider.GetCurrentTenantId());`.
- **Reference**: See implementation in [Api/Data/RentItDbContext.cs](Api/Data/RentItDbContext.cs).

### 2. Booking Logic (Backend)
- **Pattern**: Availability checks must account for `BufferMinutes` to prevent back-to-back conflicts.
- **Implementation**:
  - Conflict logic: `existingStart < newEnd && existingEndWithBuffer > newStart`.
  - Always use `IBookingService.IsArticleAvailableAsync` rather than ad-hoc checks.
- **Reference**: [Api/Services/BookingService.cs](Api/Services/BookingService.cs).

### 3. Frontend Architecture
- **State Management**: Use TanStack Query (`useQuery`, `useMutation`) for all server state.
- **Components**: Functional components with Hooks. Mobile-first responsive design using Tailwind CSS.
- **API Usage**: Current pattern uses `fetch` directly within `useQuery` functions.
- **Styling**: Tailwind v4 (no `tailwind.config.js` needed for basic usage, CSS imports used).

### 4. Database Entities
- **Ids**: Use `Guid` for primary keys.
- **Relationships**: Configure relationships in `RentItDbContext.OnModelCreating`, not just attributes.
- **Precision**: Money values use `HasPrecision(18, 2)`.

## ⚠️ Critical Dependencies
- **PostgreSQL**: Required for backend.
- **Capacitor**: Mobile interactions must be compatible with web and native android.
