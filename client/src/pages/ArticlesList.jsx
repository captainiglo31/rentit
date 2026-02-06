import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

export default function ArticlesList() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    const { data: articles = [], isLoading, error } = useQuery({
        queryKey: ['articles'],
        queryFn: async () => {
             const res = await api.get('/articles');
             return res.data;
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            await api.delete(`/articles/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['articles']);
        }
    });

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this article?')) {
            await deleteMutation.mutateAsync(id);
        }
    };

    if (isLoading) return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading articles...</div>;
    if (error) return <div className="p-8 text-center text-red-500">Error loading articles: {error.message}</div>;

    return (
        <div className="bg-white dark:bg-slate-900 h-full p-4 sm:p-6 lg:p-8">
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('common.articles')}</h1>
                    <p className="mt-2 text-sm text-gray-700 dark:text-gray-400">
                        A list of all rental articles (products) available in your market.
                    </p>
                </div>
                <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                    <Link
                        to="/articles/new"
                        className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto transition-colors"
                    >
                        <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                        Add Article
                    </Link>
                </div>
            </div>
            <div className="mt-8 flex flex-col">
                <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg dark:ring-slate-700">
                            <table className="min-w-full divide-y divide-gray-300 dark:divide-slate-700">
                                <thead className="bg-gray-50 dark:bg-slate-800">
                                    <tr>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6">
                                            Name
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                            SKU
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                            Type
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-slate-700 bg-white dark:bg-slate-900">
                                    {articles.map((article) => (
                                        <tr key={article.id}>
                                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-6">
                                                {article.name}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300">
                                                {article.sku}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300">
                                                <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                                                    article.type === 1 
                                                    ? 'bg-blue-50 text-blue-700 ring-blue-700/10 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-400/30' 
                                                    : 'bg-purple-50 text-purple-700 ring-purple-700/10 dark:bg-purple-900/30 dark:text-purple-400 dark:ring-purple-400/30'
                                                }`}>
                                                    {article.type === 1 ? 'Bulk' : 'Individual'}
                                                </span>
                                            </td>
                                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 flex gap-2">
                                                <Link to={`/articles/${article.id}/edit`} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                                                    <PencilIcon className="h-5 w-5" />
                                                    <span className="sr-only">Edit, {article.name}</span>
                                                </Link>
                                                <button onClick={() => handleDelete(article.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                                                    <TrashIcon className="h-5 w-5" />
                                                    <span className="sr-only">Delete, {article.name}</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {articles.length === 0 && (
                                        <tr>
                                            <td colSpan="2" className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                                No articles found. Start by creating one.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
