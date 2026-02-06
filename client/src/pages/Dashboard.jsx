import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
    startOfWeek, 
    endOfWeek, 
    addDays, 
    addWeeks, 
    subWeeks, 
    format, 
    isSameDay, 
    isWithinInterval 
} from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import clsx from 'clsx'; 
import OrderDetails from '../components/Dashboard/OrderDetails';
import OrderForm from '../components/Dashboard/OrderForm';

export default function Dashboard() {
    const { t, i18n } = useTranslation();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState('week'); // 'week' | 'day'
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    
    const dateLocale = i18n.language === 'de' ? de : enUS;

    const startDate = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start
    const days = useMemo(() => {
         return Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));
    }, [startDate]);

    const { data: orders = [], isLoading } = useQuery({
        queryKey: ['orders', startDate.toISOString()], 
        queryFn: async () => {
             const start = format(startDate, 'yyyy-MM-dd');
             const end = format(addDays(startDate, 7), 'yyyy-MM-dd');
             const res = await api.get('/orders?from=' + start + '&to=' + end);
             return res.data;
        }
    });

    const nextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
    const prevWeek = () => setCurrentDate(subWeeks(currentDate, 1));

    return (
        <div className="flex flex-col h-full bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-white overflow-hidden">
             {/* Header Toolbar matching dashboard.html styles */}
            <div className="flex-none bg-surface-light dark:bg-surface-dark px-4 py-3 flex items-center justify-between border-b border-border-light dark:border-border-dark shadow-sm z-20">
                <div className="flex items-center gap-3">
                     <button className="p-2 -ml-2 rounded-full hover:bg-background-light dark:hover:bg-slate-700 transition-colors">
                        <span className="material-symbols-outlined text-[24px]">menu</span>
                     </button>
                     <h1 className="text-xl font-bold tracking-tight">Kundenplaner</h1>
                </div>
                
                <div className="flex items-center gap-2">
                     <div className="flex items-center gap-1 bg-background-light dark:bg-slate-700 px-1 py-1 rounded-lg">
                        <button onClick={prevWeek} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded">
                            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                        </button>
                        <button className="flex items-center gap-2 px-2 py-1 text-sm font-medium">
                            <span className="material-symbols-outlined text-[20px]">calendar_month</span>
                            <span>{format(currentDate, 'MMM yyyy', { locale: dateLocale })}</span>
                        </button>
                        <button onClick={nextWeek} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded">
                            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                        </button>
                     </div>
                     <button className="p-2 rounded-full hover:bg-background-light dark:hover:bg-slate-700 transition-colors text-primary">
                        <span className="material-symbols-outlined text-[24px]">search</span>
                     </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex-none bg-surface-light dark:bg-surface-dark pt-2 pb-3 px-4 flex gap-3 overflow-x-auto no-scrollbar border-b border-border-light dark:border-border-dark z-10">
                <div className="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-slate-900 dark:bg-primary px-4 shadow-sm cursor-pointer">
                    <span className="text-white text-sm font-semibold">Woche {format(currentDate, 'w')}</span>
                    <span className="material-symbols-outlined text-white text-[18px]">expand_more</span>
                </div>
                <div className="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-background-light dark:bg-slate-700 px-4 border border-border-light dark:border-border-dark cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600">
                    <span className="material-symbols-outlined text-slate-500 dark:text-slate-300 text-[18px]">filter_list</span>
                    <p className="text-slate-700 dark:text-slate-200 text-sm font-medium">Alle Status</p>
                </div>
                 <button 
                         onClick={() => setIsCreateModalOpen(true)}
                         className="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-primary/10 dark:bg-primary/20 px-4 border border-primary/20 cursor-pointer ml-auto"
                     >
                        <span className="material-symbols-outlined text-primary text-[18px]">add</span>
                        <p className="text-primary text-sm font-bold">{t('common.addOrder')}</p>
                 </button>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 relative overflow-hidden flex flex-col">
                
                {/* Header Row (Days) */}
                <div className="flex border-b border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark">
                    <div className="w-[140px] shrink-0 border-r border-border-light dark:border-border-dark p-3 bg-surface-light dark:bg-surface-dark z-20 shadow-[4px_0_10px_-5px_rgba(0,0,0,0.1)] flex items-end">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('common.customerName')}</span>
                    </div>
                    <div className="flex-1 overflow-hidden">
                         <div className="flex min-w-[600px]">
                            {days.map(day => (
                                <div key={day.toISOString()} className={clsx(
                                    "flex-1 h-10 flex flex-col items-center justify-center border-r border-border-light dark:border-border-dark",
                                    isSameDay(day, new Date()) ? "bg-slate-100 dark:bg-slate-800" : "bg-slate-50 dark:bg-slate-800/50"
                                )}>
                                    <span className={clsx(
                                        "text-xs font-bold",
                                        isSameDay(day, new Date()) ? "text-primary" : "text-slate-700 dark:text-slate-300"
                                    )}>
                                        {format(day, 'EEE dd', { locale: dateLocale })}
                                    </span>
                                </div>
                            ))}
                         </div>
                    </div>
                </div>

                {/* Scrollable Grid Body */}
                <div className={clsx("flex-1 overflow-y-auto overflow-x-auto relative transition-all duration-300", selectedOrder ? "pb-[50vh]" : "")}>
                    <div className="flex min-w-[740px]">
                        {/* Left Column (Customers) - Sticky */}
                        <div className="w-[140px] sticky left-0 z-10 bg-surface-light dark:bg-surface-dark border-r border-border-light dark:border-border-dark flex flex-col shadow-[4px_0_10px_-5px_rgba(0,0,0,0.1)]">
                            {orders.length === 0 && <div className="p-4 text-xs text-slate-500">No orders found.</div>}
                            
                            {orders.map(order => (
                                <div 
                                    key={order.id} 
                                    onClick={() => setSelectedOrder(order)}
                                    className={clsx(
                                        "h-20 border-b border-border-light dark:border-border-dark p-2 flex flex-col justify-center gap-1 group relative cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors",
                                        selectedOrder?.id === order.id ? "bg-primary/5 dark:bg-primary/10" : ""
                                    )}
                                >
                                    {selectedOrder?.id === order.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>}
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-[10px] font-bold text-blue-700 dark:text-blue-300">
                                            {(order.customerName || "??").substring(0,2).toUpperCase()}
                                        </div>
                                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate" title={order.customerName}>
                                            {order.customerName || "Unknown Customer"}
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate pl-8">#{order.orderNumber}</span>
                                </div>
                            ))}
                        </div>

                        {/* Right Grid (Timeline) */}
                        <div className="flex-1 flex flex-col relative bg-white dark:bg-[#151b26]">
                            {/* Background Columns */}
                            <div className="absolute inset-0 flex pointer-events-none">
                                {days.map((day, i) => (
                                    <div key={day.toISOString()} className={clsx(
                                        "flex-1 border-r border-border-light dark:border-border-dark border-dashed",
                                        (i >= 5) ? "bg-slate-50/50 dark:bg-slate-800/20" : "" // Weekend highlight
                                    )}></div>
                                ))}
                            </div>

                            {/* Order Rows */}
                            {orders.map(order => (
                                <div key={order.id} className="h-20 border-b border-border-light dark:border-border-dark relative w-full flex items-center">
                                    <OrderBar 
                                        order={order} 
                                        weekStart={startDate} 
                                        onClick={() => setSelectedOrder(order)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            {/* Details Side Panel (Bottom Sheet) */}
            {selectedOrder && (
               <OrderDetails order={selectedOrder} onClose={() => setSelectedOrder(null)} />
            )}

            {/* Floating Action Button (Alternative to top right) */}
            <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="absolute bottom-6 right-6 size-14 bg-primary text-white rounded-2xl shadow-lg shadow-blue-500/30 flex items-center justify-center hover:bg-blue-600 transition-transform active:scale-95 z-40 sm:hidden"
            >
                <span className="material-symbols-outlined text-[28px]">add</span>
            </button>

            {/* Modals */}
            <OrderForm isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
        </div>
    );
}

function OrderBar({ order, weekStart, onClick }) {
    // Calculate Position
    const dayWidth = 100 / 7;
    const orderStart = new Date(order.startDate);
    const orderEnd = new Date(order.endDate);
    const weekEnd = addDays(weekStart, 7);

    // If order is outside current week, dont render (or handle clipping)
    if (orderEnd < weekStart || orderStart > weekEnd) return null;

    // Clip start
    const effectiveStart = orderStart < weekStart ? weekStart : orderStart;
    const effectiveEnd = orderEnd > weekEnd ? weekEnd : orderEnd;

    const diffStartStr = (effectiveStart - weekStart); // ms
    const diffDuration = (effectiveEnd - effectiveStart);
    
    // Convert to days
    const msPerDay = 24 * 60 * 60 * 1000;
    const startOffsetDays = diffStartStr / msPerDay;
    const durationDays = diffDuration / msPerDay;

    const left = startOffsetDays * dayWidth;
    const width = Math.max(durationDays * dayWidth, dayWidth / 7); // Min width 1 day roughly

    // Determine icon
    let icon = "inventory_2"; // default box
    const firstBooking = order.bookings?.[0];
    if (firstBooking) {
            const articleName = firstBooking.articleName?.toLowerCase() || "";
            // Furniture / Equipment specific
            if (articleName.includes("chair") || articleName.includes("stuhl")) icon = "chair";
            else if (articleName.includes("table") || articleName.includes("tisch")) icon = "table_restaurant";
            // Vehicles
            else if (articleName.includes("trailer") || articleName.includes("anhänger")) icon = "rv_hookup";
            else if (articleName.includes("car") || articleName.includes("auto") || articleName.includes("transporter") || articleName.includes("bus")) icon = "local_shipping";
            // Fallback based on type
            else if (firstBooking.articleType === 0) icon = "directions_car"; // Individual items often vehicles
    }

    return (
        <div 
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className="absolute h-14 bg-primary rounded-md shadow-md flex items-center px-2 z-10 cursor-pointer hover:bg-blue-600 transition-colors group/block ring-2 ring-white dark:ring-slate-800"
            style={{ left: `${left}%`, width: `${width}%` }}
        >
            <div className="flex items-center justify-evenly w-full text-white overflow-hidden">
                <div className="flex flex-col items-center">
                    <span className="material-symbols-outlined text-[16px]">{icon}</span>
                </div>
                {width > 20 && (
                 <>
                    <div className="w-px h-6 bg-white/20"></div>
                     <div className="flex flex-col overflow-hidden pl-1">
                        <span className="text-[10px] font-bold leading-none truncate block">
                            #{order.orderNumber}
                        </span>
                        {firstBooking && (
                             <span className="text-[9px] font-medium leading-none truncate opacity-80 mt-0.5">
                                {firstBooking.articleName}
                            </span>
                        )}
                     </div>
                 </>
                )}
            </div>
        </div>
    );
}
