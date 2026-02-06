import { useState, useEffect } from 'react';
import { 
    XMarkIcon, 
    ChevronUpIcon, 
    ChevronDownIcon,
    PencilSquareIcon,
    CheckIcon,
    TrashIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';

const EditableField = ({ label, value, onChange, isEditing, type = "text", className = "" }) => {
    const { i18n } = useTranslation();
    const dateLocale = i18n.language === 'de' ? de : enUS;

    if (!isEditing) {
        return (
            <div className={`flex flex-col ${className}`}>
                <span className="text-[10px] uppercase text-gray-500 font-semibold">{label}</span>
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate min-h-[1.25rem]">
                    {type === 'datetime-local' && value ? format(new Date(value), 'dd.MM.yyyy HH:mm', { locale: dateLocale }) : (value || '-')}
                </span>
            </div>
        );
    }

    return (
        <div className={`flex flex-col ${className}`}>
            <label className="text-[10px] uppercase text-gray-500 font-semibold mb-1">{label}</label>
            <input
                type={type}
                value={type === 'datetime-local' && value ? new Date(value).toISOString().slice(0, 16) : value || ''}
                onChange={(e) => onChange(e.target.value)}
                className="w-full text-sm p-1.5 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none"
            />
        </div>
    );
};

export default function OrderDetails({ order, onClose }) {
    const { t, i18n } = useTranslation();
    const queryClient = useQueryClient();
    const [isExpanded, setIsExpanded] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    
    // Local state for editing to avoid immediate mutation
    const [localOrder, setLocalOrder] = useState(order);
    const dateLocale = i18n.language === 'de' ? de : enUS;

    useEffect(() => {
        setLocalOrder(order);
    }, [order]);

    if (!order) return null;

    const toggleExpand = () => {
        setIsExpanded(!isExpanded);
    };

    const updateOrderMutation = useMutation({
        mutationFn: async (payload) => {
            await api.put(`/orders/${order.id}`, payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['orders']);
            setIsEditing(false);
        }
    });

    const handleSave = () => {
        const payload = {
            customerName: localOrder.customerName,
            customerEmail: localOrder.customerEmail,
            customerPhone: localOrder.customerPhone,
            startDate: localOrder.startDate,
            endDate: localOrder.endDate,
            status: parseInt(localOrder.status)
        };
        updateOrderMutation.mutate(payload);
    };

    const handleCancelEdit = () => {
        setLocalOrder(order);
        setIsEditing(false);
    };

    const handleChange = (field, value) => {
        setLocalOrder(prev => ({ ...prev, [field]: value }));
    };

    // Updated Group items logic with Categories
    const displayItems = () => {
        const positions = (localOrder.customPositions || []).map(pos => ({
            id: pos.id,
            name: pos.name,
            count: pos.quantity,
            category: t('common.position'),
            type: 'position'
        }));

        const bookings = (localOrder.bookings || []).map(b => ({
            id: b.id,
            name: b.articleName || 'Unknown',
            category: b.categoryName || t('common.unknownCategory'), 
            type: 'booking'
        }));
        
        // Group identical bookings
        const articleGroups = {};
        bookings.forEach(b => {
            const key = `${b.name}|${b.category}`;
            if (!articleGroups[key]) {
                articleGroups[key] = {
                    name: b.name,
                    category: b.category,
                    count: 0,
                    type: 'booking'
                };
            }
            articleGroups[key].count++;
        });

        const groupedBookings = Object.values(articleGroups);
        const allItems = [...positions, ...groupedBookings];

        // Group by Category
        const categoryGroups = {};
        allItems.forEach(item => {
            if (!categoryGroups[item.category]) {
                categoryGroups[item.category] = [];
            }
            categoryGroups[item.category].push(item);
        });
        
        return categoryGroups;
    };

    const categoryGroups = displayItems();

    return (
        <div 
            className={`fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-800 rounded-t-2xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] border-t border-gray-100 dark:border-gray-700 transition-all duration-300 ease-in-out flex flex-col`}
            style={{ height: isExpanded ? '90vh' : '50vh' }}
        >
            {/* Handle Bar */}
            <div 
                className="flex-none flex items-center justify-center pt-3 pb-1 cursor-ns-resize hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors rounded-t-2xl"
                onClick={toggleExpand}
            >
                <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
            </div>

            {/* Header Toolbar */}
            <div className="flex-none px-6 py-3 flex items-start justify-between border-b border-gray-100 dark:border-gray-700">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                           <span>#{localOrder.orderNumber}</span>
                           <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold ${
                                localOrder.status === 3 ? 'bg-red-100 text-red-700' : 
                                localOrder.status === 2 ? 'bg-blue-100 text-blue-700' :
                                localOrder.status === 0 ? 'bg-gray-100 text-gray-700' :
                                'bg-green-100 text-green-700'
                           }`}>
                                {localOrder.status === 0 ? t('common.draft') : 
                                 localOrder.status === 1 ? t('common.confirmed') : 
                                 localOrder.status === 2 ? t('common.completed') : 
                                 t('common.cancelled')}
                           </span>
                        </h2>
                    </div>
                    <p className="text-xs text-gray-400">
                        {t('common.edited')}: {format(new Date(localOrder.updatedAt || localOrder.createdAt), 'dd.MM.yyyy HH:mm', { locale: dateLocale })}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {isEditing ? (
                        <>
                            <button 
                                onClick={handleSave}
                                disabled={updateOrderMutation.isPending}
                                className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-full transition-colors"
                                title={t('common.saveChanges')}
                            >
                                <CheckIcon className="size-5" />
                            </button>
                            <button 
                                onClick={handleCancelEdit}
                                className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-full transition-colors"
                                title={t('common.cancelEditing')}
                            >
                                <XMarkIcon className="size-5" />
                            </button>
                        </>
                    ) : (
                        <button 
                            onClick={() => setIsEditing(true)}
                            className="p-2 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 rounded-full transition-colors"
                            title={t('common.editOrder')}
                        >
                            <PencilSquareIcon className="size-5" />
                        </button>
                    )}
                    
                    <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1"></div>

                    <button 
                        onClick={toggleExpand} 
                        className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-full transition-colors"
                    >
                        {isExpanded ? <ChevronDownIcon className="size-5" /> : <ChevronUpIcon className="size-5" />}
                    </button>
                    <button 
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    >
                        <XMarkIcon className="size-5" />
                    </button>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    
                    {/* Column 1: Customer Details */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-primary border-b border-primary/10 pb-2 mb-3">
                            <span className="material-symbols-outlined text-xl">person</span>
                            <h3 className="font-semibold text-sm uppercase tracking-wide">{t('common.customerName')}</h3>
                        </div>
                        <div className="space-y-3">
                            <EditableField 
                                label={t('common.customerName')} 
                                value={localOrder.customerName} 
                                onChange={(val) => handleChange('customerName', val)}
                                isEditing={isEditing}
                            />
                            <EditableField 
                                label={t('common.phone')} 
                                value={localOrder.customerPhone} 
                                onChange={(val) => handleChange('customerPhone', val)}
                                isEditing={isEditing}
                            />
                            <EditableField 
                                label={t('common.email')} 
                                value={localOrder.customerEmail} 
                                onChange={(val) => handleChange('customerEmail', val)}
                                isEditing={isEditing}
                            />
                        </div>
                    </div>

                    {/* Column 2: Period & Status */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-primary border-b border-primary/10 pb-2 mb-3">
                            <span className="material-symbols-outlined text-xl">calendar_month</span>
                            <h3 className="font-semibold text-sm uppercase tracking-wide">{t('common.rentalPeriod')}</h3>
                        </div>
                        <div className="space-y-3">
                             <EditableField 
                                label={t('common.startDate')} 
                                value={localOrder.startDate} 
                                type="datetime-local"
                                onChange={(val) => handleChange('startDate', val)}
                                isEditing={isEditing}
                            />
                             <EditableField 
                                label={t('common.endDate')}
                                value={localOrder.endDate} 
                                type="datetime-local"
                                onChange={(val) => handleChange('endDate', val)}
                                isEditing={isEditing}
                            />
                            {isEditing && (
                                <div className="flex flex-col">
                                    <label className="text-[10px] uppercase text-gray-500 font-semibold mb-1">{t('common.status')}</label>
                                    <select 
                                        value={localOrder.status}
                                        onChange={(e) => handleChange('status', e.target.value)}
                                        className="w-full text-sm p-1.5 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none"
                                    >
                                        <option value="0">{t('common.draft')}</option>
                                        <option value="1">{t('common.confirmed')}</option>
                                        <option value="2">{t('common.completed')}</option>
                                        <option value="3">{t('common.cancelled')}</option>
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>

                     {/* Column 3: Articles */}
                     <div className="space-y-4 md:col-span-1 lg:col-span-1">
                        <div className="flex items-center gap-2 text-primary border-b border-primary/10 pb-2 mb-3">
                            <span className="material-symbols-outlined text-xl">inventory_2</span>
                            <h3 className="font-semibold text-sm uppercase tracking-wide">{t('common.articles')}</h3>
                        </div>
                        <div className="flex flex-col gap-4">
                             {Object.keys(categoryGroups).length === 0 && (
                                <div className="flex flex-col items-center justify-center py-8 text-gray-400 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
                                    <span className="material-symbols-outlined text-3xl mb-1">remove_shopping_cart</span>
                                    <span className="text-xs">{t('common.noArticles')}</span>
                                </div>
                             )}

                             {Object.entries(categoryGroups).map(([category, items]) => (
                                <div key={category} className="space-y-2">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-1">{category}</h4>
                                    <div className="space-y-2">
                                        {items.map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                                        <span className="text-xs font-bold">{item.count}</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-tight">{item.name}</p>
                                                        {item.type === 'position' && <p className="text-[10px] text-gray-400 uppercase font-medium mt-0.5">{item.type}</p>}
                                                    </div>
                                                </div>
                                                {isEditing && (
                                                    <button className="text-gray-300 hover:text-red-500 transition-colors">
                                                        <TrashIcon className="size-4" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                             ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
