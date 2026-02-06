import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { useTranslation } from 'react-i18next';
import { ArrowLeftIcon, CalendarIcon, UserIcon, CurrencyEuroIcon } from '@heroicons/react/24/outline';

export default function OrderForm() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [error, setError] = useState('');

    // Default dates: Start tomorrow 10:00, End tomorrow 18:00
    const defaultStart = new Date();
    defaultStart.setDate(defaultStart.getDate() + 1);
    defaultStart.setHours(10, 0, 0, 0);
    
    const defaultEnd = new Date(defaultStart);
    defaultEnd.setHours(18, 0, 0, 0);

    // Format for datetime-local input: YYYY-MM-DDTHH:mm
    const formatDate = (date) => date.toISOString().slice(0, 16);

    const [formData, setFormData] = useState({
        startTime: formatDate(defaultStart),
        endTime: formatDate(defaultEnd),
        articleId: '',
        customerId: '', // Placeholder, dealing with nullable CustomerId
        customerName: '', // Just for UI if needed, but not part of BookingRequest unless we create customer
        status: 0 // Confirmed
    });

    const [price, setPrice] = useState(0);

    const { data: categories = [] } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => (await api.get('/categories')).data
    });

    const { data: articles = [] } = useQuery({
        queryKey: ['articles'],
        queryFn: async () => (await api.get('/articles')).data
    });

    // Check conflicts whenever dates change
    const { data: conflictingArticleIds = [], isLoading: isLoadingConflicts } = useQuery({
        queryKey: ['conflicts', formData.startTime, formData.endTime],
        queryFn: async () => {
            const res = await api.get(`/bookings/conflicts?start=${formData.startTime}&end=${formData.endTime}`);
            return res.data;
        },
        enabled: !!formData.startTime && !!formData.endTime
    });

    // Group articles by category
    const groupedArticles = useMemo(() => {
        const groups = {};
        // Initialize groups for all categories
        categories.forEach(cat => {
            groups[cat.id] = { name: cat.name, articles: [] };
        });
        // Add "Uncategorized" group
        groups['uncategorized'] = { name: t('Uncategorized'), articles: [] };

        articles.forEach(article => {
            const groupId = article.categoryId || 'uncategorized';
            if (!groups[groupId]) {
                 // in case category was deleted or not fetched?
                 groups[groupId] = { name: 'Unknown Category', articles: [] }; 
            }
            groups[groupId].articles.push(article);
        });
        return groups;
    }, [articles, categories, t]);

    const handleDateChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        // Reset article selection if it becomes unavailable? 
        // Better let user see it is unavailable.
    };

    const handleArticleChange = (e) => {
        const articleId = e.target.value;
        const article = articles.find(a => a.id === articleId);
        
        setFormData({ ...formData, articleId });
        
        if (article) {
             // Calculate estimated price
             const start = new Date(formData.startTime);
             const end = new Date(formData.endTime);
             const diffMs = end - start;
             const diffDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24))); // Minimum 1 day or exact calculation?
             // Use exact fraction of days or just per event? Assuming per day for now as per `PricePerDay`.
             // Simple logic: if < 24h, counts as 1 day.
             const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
             setPrice(days * article.pricePerDay);
        }
    };

    const mutation = useMutation({
        mutationFn: async (data) => {
            const payload = {
                articleId: data.articleId,
                customerId: null, // nullable for now
                startTime: data.startTime,
                endTime: data.endTime,
                totalPrice: price,
                status: 0 // Confirmed
            };
            await api.post('/bookings', payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['bookings']);
            navigate('/');
        },
        onError: (err) => {
            setError(err.response?.data?.message || err.response?.data || 'Error creating booking');
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        
        if (conflictingArticleIds.includes(formData.articleId)) {
            setError(t('Selected article is not available for this time period.'));
            return;
        }
        
        mutation.mutate(formData);
    };

    const selectedArticle = articles.find(a => a.id === formData.articleId);

    return (
        <div className="bg-white dark:bg-slate-900 min-h-full p-4 sm:p-6 lg:p-8">
            <div className="max-w-2xl mx-auto">
                <div className="mb-6 flex items-center">
                    <button onClick={() => navigate(-1)} className="mr-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-gray-400">
                        <ArrowLeftIcon className="h-5 w-5" />
                    </button>
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">New Booking</h1>
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded relative">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6 bg-gray-50 dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-slate-700">
                    
                    {/* Date Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Time</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <CalendarIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="datetime-local"
                                    name="startTime"
                                    required
                                    className="block w-full pl-10 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white sm:text-sm"
                                    value={formData.startTime}
                                    onChange={handleDateChange}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Time</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <CalendarIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="datetime-local"
                                    name="endTime"
                                    required
                                    className="block w-full pl-10 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white sm:text-sm"
                                    value={formData.endTime}
                                    onChange={handleDateChange}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Article Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Article</label>
                        <select
                            name="articleId"
                            required
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white sm:text-sm"
                            value={formData.articleId}
                            onChange={handleArticleChange}
                        >
                            <option value="">-- Select Article --</option>
                            {Object.values(groupedArticles).map(group => (
                                group.articles.length > 0 && (
                                    <optgroup key={group.name} label={group.name}>
                                        {group.articles.map(article => {
                                            const isConflict = conflictingArticleIds.includes(article.id);
                                            return (
                                                <option 
                                                    key={article.id} 
                                                    value={article.id}
                                                    disabled={isConflict} 
                                                    className={isConflict ? 'text-gray-400' : ''}
                                                >
                                                    {article.name} {isConflict ? '(Unavailable)' : `(€${article.pricePerDay}/day)`}
                                                </option>
                                            );
                                        })}
                                    </optgroup>
                                )
                            ))}
                        </select>
                        {isLoadingConflicts && <p className="text-xs text-indigo-500 mt-1">Checking availability...</p>}
                    </div>

                    {/* Price Summary */}
                    {selectedArticle && (
                        <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-md flex items-center justify-between">
                            <div className="flex items-center text-indigo-700 dark:text-indigo-300">
                                <CurrencyEuroIcon className="h-6 w-6 mr-2" />
                                <span className="font-semibold">Estimated Total</span>
                            </div>
                            <div className="text-xl font-bold text-indigo-800 dark:text-indigo-200">
                                €{price.toFixed(2)}
                            </div>
                        </div>
                    )}

                    <div className="pt-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={mutation.isPending || (formData.articleId && conflictingArticleIds.includes(formData.articleId))}
                            className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {mutation.isPending ? 'Creating...' : 'Create Booking'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
