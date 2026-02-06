import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { useTranslation } from 'react-i18next';
import { TrashIcon, PencilIcon, PlusIcon } from '@heroicons/react/24/outline';

export default function CategoriesList() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [editingCategory, setEditingCategory] = useState(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const { data: categories = [], isLoading } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
             const res = await api.get('/categories');
             return res.data;
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/categories/${id}`),
        onSuccess: () => queryClient.invalidateQueries(['categories'])
    });

    const saveMutation = useMutation({
        mutationFn: (category) => {
            if (category.id) return api.put(`/categories/${category.id}`, category);
            return api.post('/categories', category);
        },
        onSuccess: () => {
             queryClient.invalidateQueries(['categories']);
             setIsCreateModalOpen(false);
             setEditingCategory(null);
        }
    });

    const handleDelete = (id) => {
        if(window.confirm(t('common.confirmDelete', 'Are you sure?'))) {
            deleteMutation.mutate(id);
        }
    };

    const handleEdit = (cat) => {
        setEditingCategory(cat);
        setIsCreateModalOpen(true);
    };

    const handleCreate = () => {
        setEditingCategory({ name: '', icon: '' });
        setIsCreateModalOpen(true);
    }

    if (isLoading) return <div className="p-8">Loading...</div>;

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen text-slate-900 dark:text-white p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">{t('common.categories', 'Kategorien')}</h1>
                <button 
                    onClick={handleCreate}
                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                    <PlusIcon className="w-5 h-5" />
                    {t('common.create', 'Erstellen')}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map(cat => (
                    <div key={cat.id} className="bg-surface-light dark:bg-surface-dark p-4 rounded-lg shadow-sm border border-border-light dark:border-border-dark flex items-center justify-between">
                         <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300">
                                 {cat.icon ? <span className="material-symbols-outlined">{cat.icon}</span> : <span className="text-xs">IMG</span>}
                             </div>
                             <span className="font-medium">{cat.name}</span>
                         </div>
                         <div className="flex gap-2">
                             <button onClick={() => handleEdit(cat)} className="p-2 text-slate-500 hover:text-primary transition-colors">
                                 <PencilIcon className="w-5 h-5" />
                             </button>
                             <button onClick={() => handleDelete(cat.id)} className="p-2 text-slate-500 hover:text-red-500 transition-colors">
                                 <TrashIcon className="w-5 h-5" />
                             </button>
                         </div>
                    </div>
                ))}
            </div>

            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <CategoryForm 
                        category={editingCategory} 
                        onSave={(data) => saveMutation.mutate(data)}
                        onCancel={() => setIsCreateModalOpen(false)} 
                    />
                </div>
            )}
        </div>
    );
}

function CategoryForm({ category, onSave, onCancel }) {
    const [name, setName] = useState(category?.name || '');
    const [icon, setIcon] = useState(category?.icon || '');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ ...category, name, icon });
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 dark:text-white">
                {category?.id ? 'Kategorie bearbeiten' : 'Neue Kategorie'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name</label>
                    <input 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-transparent dark:text-white"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Icon (Material Symbols Name)</label>
                    <input 
                        type="text" 
                        value={icon}
                        onChange={(e) => setIcon(e.target.value)}
                        placeholder="e.g. inventory_2"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-transparent dark:text-white"
                    />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={onCancel} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md">Abbrechen</button>
                    <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-600">Speichern</button>
                </div>
            </form>
        </div>
    );
}
