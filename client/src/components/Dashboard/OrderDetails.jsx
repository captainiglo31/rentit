import { useState, useRef, useEffect } from 'react';
import { XMarkIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function OrderDetails({ order, onClose }) {
    const { t } = useTranslation();
    const [isExpanded, setIsExpanded] = useState(false);
    const contentRef = useRef(null);
    const [contentHeight, setContentHeight] = useState(300); // Default height

    if (!order) return null;

    const toggleExpand = () => {
        setIsExpanded(!isExpanded);
        setContentHeight(isExpanded ? 300 : 500); // Toggle between heights
    };

    // Group items. Order positions are best, fall back to bookings grouping
    const displayItems = () => {
        // Use custom positions / OrderPositions if available as they are summarized
        if (order.customPositions && order.customPositions.length > 0) {
            return order.customPositions.map(pos => ({
                id: pos.id,
                name: pos.name,
                count: pos.quantity,
                type: 'position'
            }));
        } 
        
        // Else group bookings by Article Name
        if (order.bookings && order.bookings.length > 0) {
            const groups = {};
            order.bookings.forEach(b => {
                const name = b.articleName || 'Unknown';
                if (!groups[name]) groups[name] = 0;
                groups[name]++;
            });
            return Object.keys(groups).map(name => ({
                id: name,
                name: name,
                count: groups[name],
                type: 'booking'
            }));
        }
        return [];
    };

    const items = displayItems();

    return (
        <div 
            className="absolute bottom-0 left-0 right-0 z-30 bg-white dark:bg-slate-800 border-t border-border-light dark:border-border-dark shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] flex flex-col transition-all duration-300 ease-in-out"
            style={{ height: `${contentHeight}px`, maxHeight: '80vh' }}
        >
            {/* Header / Drag Handle Area */}
            <div className="flex-none flex items-center justify-between px-5 py-2 border-b border-border-light dark:border-border-dark cursor-ns-resize" 
                 onClick={toggleExpand}>
                 <div className="flex-1 flex justify-center">
                    <div className="w-12 h-1 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                 </div>
            </div>

            <div className="flex-1 flex flex-col px-5 py-4 gap-4 overflow-hidden">
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                {t('common.order', 'Auftrag')} #{order.orderNumber}
                            </h2>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 uppercase tracking-wide">
                                {order.status || 'Confirmed'}
                            </span>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {order.customerName} • <span className="font-semibold text-primary">
                                {format(new Date(order.startDate), 'EEE dd.', { locale: de })} - {format(new Date(order.endDate), 'EEE dd. MMM', { locale: de })}
                            </span>
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={toggleExpand} className="text-primary hover:bg-primary/10 p-2 rounded-full transition-colors">
                            {isExpanded ? <ChevronDownIcon className="size-6" /> : <ChevronUpIcon className="size-6" />}
                        </button>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 p-2 rounded-full transition-colors">
                            <XMarkIcon className="size-6" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto pr-1">
                    {items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-background-light dark:bg-slate-800/50 border border-border-light dark:border-border-dark">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-primary">
                                    <span className="material-symbols-outlined">inventory_2</span>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.name}</p>
                                    <p className="text-xs text-slate-500">{item.type === 'booking' ? 'Mietartikel' : 'Zusatzartikel'}</p>
                                </div>
                            </div>
                            <span className="text-sm font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-700 px-2 py-1 rounded border border-border-light dark:border-border-dark">
                                {item.count}x
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
