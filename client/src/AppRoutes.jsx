import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ArticlesList from './pages/ArticlesList';
import ArticleForm from './pages/ArticleForm';
import OrderForm from './pages/OrderForm';
import CategoriesList from './pages/CategoriesList';
import Settings from './pages/Settings';

import Layout from './components/Layout';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

function AppRoutes() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route path="/" element={<Dashboard />} />
            <Route path="/orders/new" element={<OrderForm />} />
            <Route path="/articles" element={<ArticlesList />} />
            <Route path="/articles/new" element={<ArticleForm />} />
            <Route path="/articles/:id/edit" element={<ArticleForm />} />
            <Route path="/categories" element={<CategoriesList />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default AppRoutes;
