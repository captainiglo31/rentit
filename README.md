# RentIt - Multi-Tenant Rental Management System

Software product for markets to control rent products with multi-tenancy support, mobile-first design, and smart booking logic.

## 🏗️ Architecture

### Backend (ASP.NET Core 8 Web API)
- **Framework**: ASP.NET Core 8.0
- **ORM**: Entity Framework Core 8.0
- **Database**: PostgreSQL
- **Features**:
  - Multi-tenancy with Global Query Filters
  - Smart booking with buffer time logic
  - REST API with Swagger documentation

### Frontend (React + Vite)
- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS
- **Data Fetching**: TanStack Query (React Query)
- **Mobile**: Capacitor for Android PWA
- **Features**:
  - Mobile-first responsive design
  - Progressive Web App (PWA) capabilities
  - Native Android app support

## 📦 Project Structure

```
rentit/
├── Api/                    # ASP.NET Core 8 Web API
│   ├── Models/            # Entity models (Tenant, User, Article, Booking)
│   ├── Data/              # DbContext with multi-tenancy filters
│   ├── Services/          # Business logic services
│   └── Program.cs         # Application entry point
│
└── client/                # React frontend
    ├── src/               # React components and logic
    ├── public/            # Static assets and PWA manifest
    ├── android/           # Capacitor Android platform
    └── capacitor.config.json  # Capacitor configuration
```

## 🚀 Getting Started

### Prerequisites
- .NET 8.0 SDK
- Node.js 20+
- PostgreSQL 14+
- (Optional) Android Studio for mobile development

### Backend Setup

1. Navigate to the API directory:
```bash
cd Api
```

2. Update the connection string in `appsettings.json` if needed:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=rentit;Username=postgres;Password=postgres"
  }
}
```

3. Install EF Core tools (if not already installed):
```bash
dotnet tool install --global dotnet-ef
```

4. Create the database and run migrations:
```bash
dotnet ef migrations add InitialCreate
dotnet ef database update
```

5. Run the API:
```bash
dotnet run
```

The API will be available at `https://localhost:7000` or `http://localhost:5000`

### Frontend Setup

1. Navigate to the client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

4. Build for production:
```bash
npm run build
```

### Mobile (Android) Setup

1. Build the web app:
```bash
cd client
npm run build
```

2. Sync with Capacitor:
```bash
npx cap sync android
```

3. Open in Android Studio:
```bash
npx cap open android
```

## 🎯 Key Features

### Multi-Tenancy
The system uses Global Query Filters in Entity Framework Core to automatically isolate data per tenant. Each entity (except Tenant) has a `TenantId` field, and queries are automatically filtered based on the current tenant context.

### Smart Booking Logic
The `Booking` entity includes a `BufferMinutes` property that adds extra time after each booking. This prevents back-to-back bookings without cleanup or preparation time. The `EffectiveEndTime` property calculates the actual blocking time (EndTime + BufferMinutes).

### Mobile-First PWA
The React frontend is designed with a mobile-first approach using Tailwind CSS. It includes:
- Responsive design that works on all screen sizes
- PWA manifest for installation on mobile devices
- Capacitor integration for native Android features

## 📊 Data Models

### Tenant
- Core entity for multi-tenancy
- Contains: Name, Domain, IsActive

### User
- Tenant-scoped users
- Contains: Email, FirstName, LastName, PasswordHash

### Article
- Rentable items/products
- Contains: Name, Description, ImageUrl, PricePerDay, IsAvailable

### Booking
- Rental bookings with buffer logic
- Contains: UserId, ArticleId, StartTime, EndTime, BufferMinutes, Status
- Calculated: EffectiveEndTime (EndTime + BufferMinutes)

## 🛠️ Technologies

**Backend**:
- ASP.NET Core 8.0
- Entity Framework Core 8.0
- Npgsql (PostgreSQL provider)

**Frontend**:
- React 18
- Vite 7
- Tailwind CSS 4
- TanStack Query
- Capacitor 6

## 📝 API Endpoints

- `GET /api/health` - Health check endpoint
- Additional endpoints can be added as controllers

## 🔒 Security Notes

- Update the PostgreSQL connection string with secure credentials
- Implement proper authentication and authorization
- Use HTTPS in production
- Store sensitive configuration in environment variables or secure vaults

## 📱 PWA Features

The application includes:
- Web App Manifest (`manifest.json`)
- Mobile-optimized viewport settings
- Theme color configuration
- Offline capability (can be extended with service workers)

## 🤝 Contributing

This is the initial project structure. Extend it with:
- Authentication and authorization
- API controllers for CRUD operations
- Additional frontend pages and components
- Service workers for offline functionality
- Push notifications
- And more!

## 📄 License

See LICENSE file for details. 
