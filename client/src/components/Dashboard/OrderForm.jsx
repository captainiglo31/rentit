import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../api/axios'
import { useTranslation } from 'react-i18next'

export default function OrderForm({ isOpen, onClose }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    customerId: '', // Simple mock for now or select from Users
    customerName: '', // If we don't have user selection yet
    startDate: '',
    endDate: '',
    bookings: [], // { articleId: '', quantity: 1 }
    customPositions: [] // { name: '', quantity: 1, price: 0 }
  })

  // To simplify, we'll just mock Customer ID or create a "Guest" customer if needed.
  // Real app needs Customer Selection.
  // For the MVP prompt, we have "Kunde Müller".
  
  // We need to fetch Articles to select from.
  const { data: articles = [] } = useQuery({
      queryKey: ['articles'],
      queryFn: async () => (await api.get('/articles')).data
  });

  const createOrderMutation = useMutation({
      mutationFn: async (data) => {
          // Map to API DTO
          const payload = {
             customerId: "00000000-0000-0000-0000-000000000000", // Needs valid ID.
             // We need a valid Customer Guid.
             // We'll create a new Customer on the fly? Or fetch customers.
             ...data,
             startDate: new Date(data.startDate).toISOString(),
             endDate: new Date(data.endDate).toISOString()
          }
          // Workaround for CustomerId: Use the first one found or we need a Customer Picker.
          // Let's assume we pick a customer from a fetched list.
          if (!payload.customerId || payload.customerId === "00000000-0000-0000-0000-000000000000") {
             // Fetch customers
             const customers = (await api.get('/customers')).data;
             if (customers.length > 0) payload.customerId = customers[0].id;
             else {
                 // Create one? The backend requires existing ID.
                 // We will fail here if no customers exist.
                 throw new Error("No customers available. Create a customer first.");
             }
          }
          return await api.post('/orders', payload);
      },
      onSuccess: () => {
          queryClient.invalidateQueries(['orders']);
          onClose();
          setFormData({ customerId: '', customerName: '', startDate: '', endDate: '', bookings: [], customPositions: [] });
      }
  });

  const addBooking = () => {
      if (articles.length === 0) return;
      setFormData(prev => ({
          ...prev,
          bookings: [...prev.bookings, { articleId: articles[0].id, quantity: 1 }]
      }));
  }

  const addCustomPos = () => {
      setFormData(prev => ({
          ...prev,
          customPositions: [...prev.customPositions, { name: '', quantity: 1, price: 0 }]
      }));
  }

  const updateBooking = (index, field, value) => {
      const newBookings = [...formData.bookings];
      newBookings[index][field] = value;
      setFormData(prev => ({ ...prev, bookings: newBookings }));
  }

  const updateCustomPos = (index, field, value) => {
      const newPos = [...formData.customPositions];
      newPos[index][field] = value;
      setFormData(prev => ({ ...prev, customPositions: newPos }));
  }

  const handleSubmit = (e) => {
      e.preventDefault();
      createOrderMutation.mutate(formData);
  }

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white dark:bg-slate-800 px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
                <form onSubmit={handleSubmit}>
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                        {t('common.addOrder')}
                      </Dialog.Title>
                      
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Dates */}
                          <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Start Date</label>
                              <input type="date" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                value={formData.startDate}
                                onChange={e => setFormData({...formData, startDate: e.target.value})}
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">End Date</label>
                              <input type="date" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                value={formData.endDate}
                                onChange={e => setFormData({...formData, endDate: e.target.value})}
                              />
                          </div>
                      </div>

                      {/* Items */}
                      <div className="mt-6">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">Items</h4>
                          <div className="space-y-2 mt-2">
                              {formData.bookings.map((booking, idx) => (
                                  <div key={idx} className="flex gap-2 items-center">
                                      <select 
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white text-sm"
                                        value={booking.articleId}
                                        onChange={e => updateBooking(idx, 'articleId', e.target.value)}
                                      >
                                          {articles.map(a => (
                                              <option key={a.id} value={a.id}>{a.name}</option>
                                          ))}
                                      </select>
                                      <input 
                                        type="number" 
                                        min="1" 
                                        className="w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white text-sm"
                                        value={booking.quantity}
                                        onChange={e => updateBooking(idx, 'quantity', parseInt(e.target.value))}
                                      />
                                      <button type="button" onClick={() => {
                                          const newBookings = [...formData.bookings];
                                          newBookings.splice(idx, 1);
                                          setFormData(prev => ({...prev, bookings: newBookings}));
                                      }} className="text-red-500 hover:text-red-700">
                                          <TrashIcon className="h-5 w-5" />
                                      </button>
                                  </div>
                              ))}
                              <button type="button" onClick={addBooking} className="flex items-center text-indigo-600 hover:text-indigo-800 text-sm">
                                  <PlusIcon className="h-4 w-4 mr-1" /> Add Article
                              </button>
                          </div>
                      </div>

                      {/* Custom Positions */}
                       <div className="mt-6">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">Custom Items (Free Text)</h4>
                          <div className="space-y-2 mt-2">
                              {formData.customPositions.map((pos, idx) => (
                                  <div key={idx} className="flex gap-2 items-center">
                                      <input 
                                        type="text" 
                                        placeholder="Item Name"
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white text-sm"
                                        value={pos.name}
                                        onChange={e => updateCustomPos(idx, 'name', e.target.value)}
                                      />
                                      <input 
                                        type="number" 
                                        min="1" 
                                        placeholder="Qty"
                                        className="w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white text-sm"
                                        value={pos.quantity}
                                        onChange={e => updateCustomPos(idx, 'quantity', parseInt(e.target.value))}
                                      />
                                      <button type="button" onClick={() => {
                                          const newPos = [...formData.customPositions];
                                          newPos.splice(idx, 1);
                                          setFormData(prev => ({...prev, customPositions: newPos}));
                                      }} className="text-red-500 hover:text-red-700">
                                          <TrashIcon className="h-5 w-5" />
                                      </button>
                                  </div>
                              ))}
                              <button type="button" onClick={addCustomPos} className="flex items-center text-indigo-600 hover:text-indigo-800 text-sm">
                                  <PlusIcon className="h-4 w-4 mr-1" /> Add Custom Item
                              </button>
                          </div>
                      </div>

                    </div>
                  </div>
                  <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                    <button
                      type="submit"
                      disabled={createOrderMutation.isPending}
                      className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                    >
                      {createOrderMutation.isPending ? 'Saving...' : 'Create Order'}
                    </button>
                    <button
                      type="button"
                      className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:hover:bg-slate-600"
                      onClick={onClose}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
