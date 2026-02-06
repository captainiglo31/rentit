import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Login() {
    const { t } = useTranslation();
    const [isRegister, setIsRegister] = useState(false);
    const { login, registerTenant } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        tenantName: '',
        tenantDomain: ''
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            if (isRegister) {
                await registerTenant(formData);
            } else {
                await login(formData.email, formData.password);
            }
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Authentication failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
            <div className="max-w-md w-full space-y-8 bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700">
                <div>
                    <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
                        {isRegister ? t('common.register', 'Register your Market') : t('common.loginTitle', 'Sign in to RentIt')}
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                        {isRegister ? t('common.registerDesc', 'Create a new tenant account') : t('common.loginDesc', 'Access your rental management system')}
                    </p>
                </div>
                
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4">
                            <div className="flex">
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200">{error}</h3>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <div className="rounded-md shadow-sm -space-y-px">
                        {isRegister && (
                            <>
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                     <div>
                                        <label htmlFor="firstName" className="sr-only">First Name</label>
                                        <input
                                            id="firstName"
                                            name="firstName"
                                            type="text"
                                            required
                                            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-slate-700 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                            placeholder="First Name"
                                            value={formData.firstName}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="lastName" className="sr-only">Last Name</label>
                                        <input
                                            id="lastName"
                                            name="lastName"
                                            type="text"
                                            required
                                            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-slate-700 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                            placeholder="Last Name"
                                            value={formData.lastName}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                                <div className="mb-2">
                                    <label htmlFor="tenantName" className="sr-only">Market Name</label>
                                    <input
                                        id="tenantName"
                                        name="tenantName"
                                        type="text"
                                        required
                                        className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-slate-700 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                        placeholder="Market Name (e.g. My Rental Shop)"
                                        value={formData.tenantName}
                                        onChange={handleChange}
                                    />
                                </div>
                            </>
                        )}
                        
                        <div className="mb-2">
                            <label htmlFor="email-address" className="sr-only">Email address</label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-slate-700 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="Email address"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">Password</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-slate-700 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="Password"
                                value={formData.password}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
                        >
                            {isLoading ? 'Processing...' : (isRegister ? t('common.registerBtn', 'Start Free Trial') : t('common.loginBtn', 'Sign in'))}
                        </button>
                    </div>

                    <div className="text-sm text-center">
                        <button 
                            type="button"
                            onClick={() => setIsRegister(!isRegister)}
                            className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                        >
                            {isRegister ? t('common.alreadyHaveAccount', 'Already have an account? Sign in') : t('common.needAccount', 'Need a new market? Register')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
