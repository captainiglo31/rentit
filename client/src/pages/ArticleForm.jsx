import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

export default function ArticleForm() {
    const { t } = useTranslation();
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
        type: 0,
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
                type: article.type !== undefined ? article.type : 0,
                isActive: article.isActive,
                isAvailable: article.isAvailable
            });
        }
    }, [article]);

    const mutation = useMutation({
        mutationFn: async (data) => {
            const payload = {
                ...data,
                pricePerDay: parseFloat(data.pricePerDay),
                baseBufferMinutes: parseInt(data.baseBufferMinutes),
                type: parseInt(data.type)
            };

            if (isEditMode) {
                await api.put(`/articles/${id}`, payload);
            } else {
                await api.post('/articles', payload);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['articles']);
            navigate('/articles');
        },
        onError: (err) => {
            setError(err.response?.data?.message || 'Error saving article');
        }
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        mutation.mutate(formData);
    };

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
    };

    if (isLoadingArticle) return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading...</div>;

    return (
        <div className="bg-white dark:bg-slate-900 min-h-full p-4 sm:p-6 lg:p-8">
            <div className="max-w-2xl mx-auto">
                <div className="mb-6 flex items-center">
                    <Link to="/articles" className="mr-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-gray-400">
                        <ArrowLeftIcon className="h-5 w-5" />
                    </Link>
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                        {isEditMode ? 'Edit Article' : 'New Article'}
                    </h1>
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded relative">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6 bg-gray-50 dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-slate-700">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                        <input
                            type="text"
                            name="name"
                            id="name"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white sm:text-sm"
                            value={formData.name}
                            onChange={handleChange}
                        />
                    </div>

                    <div>
                        <label htmlFor="sku" className="block text-sm font-medium text-gray-700 dark:text-gray-300">SKU / Code</label>
                        <input
                            type="text"
                            name="sku"
                            id="sku"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white sm:text-sm"
                            value={formData.sku}
                            onChange={handleChange}
                        />
                    </div>

                    <div>
                        <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
                        <select
                            id="type"
                            name="type"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white sm:text-sm"
                            value={formData.type}
                            onChange={handleChange}
                        >
                            <option value={0}>Individual (Unique Item)</option>
                            <option value={1}>Bulk (Fungible)</option>
                        </select>
                         <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Select 'Individual' for unique assets like cars (VIN). Select 'Bulk' for generic items like chairs.
                        </p>
                    </div>

                    <div>
                        <label htmlFor="pricePerDay" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Price per Day</label>
                        <div className="relative mt-1 rounded-md shadow-sm">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <span className="text-gray-500 dark:text-gray-400 sm:text-sm">€</span>
                            </div>
                            <input
                                type="number"
                                name="pricePerDay"
                                id="pricePerDay"
                                step="0.01"
                                required
                                className="block w-full rounded-md border-gray-300 pl-7 pr-12 focus:border-indigo-500 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white sm:text-sm"
                                placeholder="0.00"
                                value={formData.pricePerDay}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                    
                    <div>
                        <label htmlFor="baseBufferMinutes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Buffer Minutes (Cleanup time)</label>
                        <input
                            type="number"
                            name="baseBufferMinutes"
                            id="baseBufferMinutes"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white sm:text-sm"
                            value={formData.baseBufferMinutes}
                            onChange={handleChange}
                        />
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                        <textarea
                            name="description"
                            id="description"
                            rows={3}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white sm:text-sm"
                            value={formData.description}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="flex items-center space-x-6">
                        <div className="flex items-center">
                            <input
                                id="isActive"
                                name="isActive"
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600"
                                checked={formData.isActive}
                                onChange={handleChange}
                            />
                            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                                Active (Visible)
                            </label>
                        </div>
                        <div className="flex items-center">
                            <input
                                id="isAvailable"
                                name="isAvailable"
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600"
                                checked={formData.isAvailable}
                                onChange={handleChange}
                            />
                            <label htmlFor="isAvailable" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                                Available (Rentable)
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end border-t border-gray-200 dark:border-slate-700 pt-6">
                        <Link
                            to="/articles"
                            className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:hover:bg-slate-600"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={mutation.isPending}
                            className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                        >
                            {mutation.isPending ? 'Saving...' : 'Save Article'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
