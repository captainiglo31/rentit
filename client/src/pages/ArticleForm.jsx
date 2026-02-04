import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function ArticleForm() {
    const { id } = useParams();
    const isEditMode = !!id;
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        description: '',
        pricePerDay: '',
        baseBufferMinutes: 60,
        isActive: true,
        isAvailable: true
    });

    // Fetch article data if in edit mode
    const { data: article, isLoading: isLoadingArticle } = useQuery({
        queryKey: ['article', id],
        queryFn: async () => {
             const res = await api.get(`/articles/${id}`);
             return res.data;
        },
        enabled: isEditMode
    });

    useEffect(() => {
        if (article) {
            setFormData({
                name: article.name,
                sku: article.sku || '',
                description: article.description || '',
                pricePerDay: article.pricePerDay,
                baseBufferMinutes: article.baseBufferMinutes,
                isActive: article.isActive,
                isAvailable: article.isAvailable
            });
        }
    }, [article]);

    const mutation = useMutation({
        mutationFn: async (data) => {
            if (isEditMode) {
                return await api.put(`/articles/${id}`, data);
            } else {
                return await api.post('/articles', data);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['articles']);
            navigate('/articles');
        },
        onError: (err) => {
             setError(err.response?.data?.message || 'Failed to save article');
        }
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        // Convert numeric fields
        const payload = {
            ...formData,
            id: isEditMode ? id : undefined, // Ensure ID is passed for updates if backend requires it in body (controller checks id vs body.Id)
            pricePerDay: parseFloat(formData.pricePerDay),
            baseBufferMinutes: parseInt(formData.baseBufferMinutes)
        };
        
        mutation.mutate(payload);
    };

    if (isEditMode && isLoadingArticle) return <div>Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
             <div className="max-w-3xl mx-auto">
                <div className="mb-6">
                    <Link to="/articles" className="flex items-center text-gray-500 hover:text-gray-700">
                        <ArrowLeftIcon className="h-5 w-5 mr-1" />
                        Back to Articles
                    </Link>
                </div>

                <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
                    <div className="md:grid md:grid-cols-3 md:gap-6">
                        <div className="md:col-span-1">
                            <h3 className="text-lg font-medium leading-6 text-gray-900">
                                {isEditMode ? 'Edit Article' : 'New Article'}
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Basic information about the rental item.
                            </p>
                        </div>
                        <div className="mt-5 md:mt-0 md:col-span-2">
                             <form onSubmit={handleSubmit}>
                                <div className="grid grid-cols-6 gap-6">
                                    <div className="col-span-6">
                                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                                        <input
                                            type="text"
                                            name="name"
                                            id="name"
                                            required
                                            className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md border p-2"
                                            value={formData.name}
                                            onChange={e => setFormData({...formData, name: e.target.value})}
                                        />
                                    </div>

                                    <div className="col-span-6 sm:col-span-3">
                                        <label htmlFor="sku" className="block text-sm font-medium text-gray-700">SKU / Code</label>
                                        <input
                                            type="text"
                                            name="sku"
                                            id="sku"
                                            className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md border p-2"
                                            value={formData.sku}
                                            onChange={e => setFormData({...formData, sku: e.target.value})}
                                        />
                                    </div>

                                    <div className="col-span-6">
                                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                                        <textarea
                                            name="description"
                                            id="description"
                                            rows={3}
                                            className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md border p-2"
                                            value={formData.description}
                                            onChange={e => setFormData({...formData, description: e.target.value})}
                                        />
                                    </div>

                                    <div className="col-span-6 sm:col-span-3">
                                        <label htmlFor="pricePerDay" className="block text-sm font-medium text-gray-700">Price per Day</label>
                                        <div className="mt-1 relative rounded-md shadow-sm">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <span className="text-gray-500 sm:text-sm">$</span>
                                            </div>
                                            <input
                                                type="number"
                                                name="pricePerDay"
                                                id="pricePerDay"
                                                required
                                                min="0"
                                                step="0.01"
                                                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md border p-2"
                                                placeholder="0.00"
                                                value={formData.pricePerDay}
                                                onChange={e => setFormData({...formData, pricePerDay: e.target.value})}
                                            />
                                        </div>
                                    </div>

                                    <div className="col-span-6 sm:col-span-3">
                                        <label htmlFor="baseBufferMinutes" className="block text-sm font-medium text-gray-700">Buffer Time (Minutes)</label>
                                        <input
                                            type="number"
                                            name="baseBufferMinutes"
                                            id="baseBufferMinutes"
                                            required
                                            min="0"
                                            className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md border p-2"
                                            value={formData.baseBufferMinutes}
                                            onChange={e => setFormData({...formData, baseBufferMinutes: e.target.value})}
                                        />
                                        <p className="mt-1 text-xs text-gray-500">Cleanup time needed after return.</p>
                                    </div>

                                    <div className="col-span-6">
                                        <div className="flex items-start">
                                            <div className="flex items-center h-5">
                                                <input
                                                    id="isActive"
                                                    name="isActive"
                                                    type="checkbox"
                                                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                                    checked={formData.isActive}
                                                    onChange={e => setFormData({...formData, isActive: e.target.checked})}
                                                />
                                            </div>
                                            <div className="ml-3 text-sm">
                                                <label htmlFor="isActive" className="font-medium text-gray-700">Active</label>
                                                <p className="text-gray-500">Inactive articles are hidden from bookings.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {error && (
                                    <div className="mt-4 text-red-600 text-sm">
                                        {error}
                                    </div>
                                )}

                                <div className="mt-6 flex justify-end">
                                    <Link
                                        to="/articles"
                                        className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        Cancel
                                    </Link>
                                    <button
                                        type="submit"
                                        disabled={mutation.isPending}
                                        className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
                                    >
                                        {mutation.isPending ? 'Saving...' : 'Save'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
