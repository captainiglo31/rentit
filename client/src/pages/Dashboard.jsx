import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { CubeIcon, CalendarIcon } from '@heroicons/react/24/outline';

export default function Dashboard() {
    const { user, logout } = useAuth();

    // Fetch articles as a test
    const { data: articles, isLoading } = useQuery({
        queryKey: ['articles'],
        queryFn: async () => {
            const res = await api.get('/articles');
            return res.data;
        }
    });

    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            <div className="flex-shrink-0 flex items-center">
                                <span className="text-xl font-bold text-indigo-600">RentIt</span>
                            </div>
                        </div>
                        <div className="flex items-center">
                           <span className="mr-4 text-gray-700">
                               {user?.tenantName} | {user?.firstName}
                           </span>
                           <button
                                onClick={logout}
                                className="text-gray-500 hover:text-gray-700"
                           >
                               Logout
                           </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
                        <Link to="/articles" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                             <CubeIcon className="h-5 w-5 mr-2" />
                             Manage Articles
                        </Link>
                    </div>
                    
                    <div className="mt-6">
                        <h2 className="text-lg font-medium text-gray-900">Recent Articles</h2>
                        {isLoading ? (
                            <p>Loading...</p>
                        ) : (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-4">
                                {articles?.length === 0 && <p className="text-gray-500">No articles found.</p>}
                                {articles?.map((article) => (
                                    <div key={article.id} className="bg-white overflow-hidden shadow rounded-lg px-4 py-5 sm:p-6">
                                        <h3 className="text-lg font-medium text-gray-900">{article.name}</h3>
                                        <p className="mt-1 text-sm text-gray-500 truncate">{article.description}</p>
                                        <div className="mt-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                Active
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
