import { useQuery } from '@tanstack/react-query'

function App() {
  // Example API call to backend health endpoint
  const { data, isLoading, error } = useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const response = await fetch('http://localhost:5000/api/health')
      if (!response.ok) throw new Error('API not available')
      return response.json()
    },
    retry: false,
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-indigo-600">RentIt</h1>
          <p className="text-sm text-gray-600">Multi-Tenant Rental Management</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Card */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Welcome to RentIt
            </h2>
            <p className="text-gray-600 mb-4">
              A modern, mobile-first PWA for managing rental products with multi-tenancy support.
            </p>
            
            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="p-4 bg-indigo-50 rounded-lg">
                <h3 className="font-semibold text-indigo-800 mb-2">🏢 Multi-Tenant</h3>
                <p className="text-sm text-gray-700">
                  Isolated data per tenant with global query filters
                </p>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">📱 Mobile-First</h3>
                <p className="text-sm text-gray-700">
                  PWA with Capacitor for native Android experience
                </p>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg">
                <h3 className="font-semibold text-purple-800 mb-2">📅 Smart Booking</h3>
                <p className="text-sm text-gray-700">
                  Buffer time logic prevents back-to-back conflicts
                </p>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">🚀 Modern Stack</h3>
                <p className="text-sm text-gray-700">
                  ASP.NET Core 8, React, PostgreSQL, Tailwind CSS
                </p>
              </div>
            </div>
          </div>

          {/* API Status Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Backend API Status
            </h3>
            
            {isLoading && (
              <div className="flex items-center text-gray-600">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600 mr-3"></div>
                Checking API connection...
              </div>
            )}
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">
                  ❌ Backend API is not running
                </p>
                <p className="text-sm text-red-600 mt-2">
                  Start the API with: <code className="bg-red-100 px-2 py-1 rounded">cd Api && dotnet run</code>
                </p>
              </div>
            )}
            
            {data && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 font-semibold">
                  ✅ Backend API is running
                </p>
                <p className="text-sm text-green-700 mt-2">
                  Status: {data.status} | Time: {new Date(data.timestamp).toLocaleTimeString()}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 bg-white border-t">
        <div className="container mx-auto px-4 text-center text-gray-600 text-sm">
          <p>RentIt © 2026 - Multi-Tenant Rental Management System</p>
        </div>
      </footer>
    </div>
  )
}

export default App
