import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (isRegister) {
                await registerTenant(formData);
            } else {
                await login(formData.email, formData.password);
            }
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Authentication failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        {isRegister ? 'Register your Market' : 'Sign in to RentIt'}
                    </h2>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <input type="hidden" name="remember" value="true" />
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <input
                                type="email"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="Email address"
                                value={formData.email}
                                onChange={e => setFormData({...formData, email: e.target.value})}
                            />
                        </div>
                        <div>
                            <input
                                type="password"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="Password"
                                value={formData.password}
                                onChange={e => setFormData({...formData, password: e.target.value})}
                            />
                        </div>
                        
                        {isRegister && (
                            <>
                                <div>
                                    <input
                                        type="text"
                                        required
                                        className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                        placeholder="First Name"
                                        value={formData.firstName}
                                        onChange={e => setFormData({...formData, firstName: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <input
                                        type="text"
                                        required
                                        className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                        placeholder="Last Name"
                                        value={formData.lastName}
                                        onChange={e => setFormData({...formData, lastName: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <input
                                        type="text"
                                        required
                                        className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                        placeholder="Market Name (Tenant)"
                                        value={formData.tenantName}
                                        onChange={e => setFormData({...formData, tenantName: e.target.value})}
                                    />
                                </div>
                                <div className="">
                                    <input
                                        type="text"
                                        required
                                        className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                        placeholder="Domain (e.g. market1.rentit.com)"
                                        value={formData.tenantDomain}
                                        onChange={e => setFormData({...formData, tenantDomain: e.target.value})}
                                    />
                                </div>
                            </>
                        )}
                        {!isRegister && (
                            // Add rounded-b to password field if not registering
                             <div className="hidden"></div>
                        )}
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm">{error}</div>
                    )}

                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            {isRegister ? 'Register' : 'Sign in'}
                        </button>
                    </div>
                </form>
                <div className="text-center">
                    <button
                        onClick={() => setIsRegister(!isRegister)}
                        className="text-indigo-600 hover:text-indigo-500"
                    >
                        {isRegister ? 'Already have an account? Sign in' : 'Need to register a new market?'}
                    </button>
                </div>
            </div>
        </div>
    );
}
