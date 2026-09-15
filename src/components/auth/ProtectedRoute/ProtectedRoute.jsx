import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { selectIsAuthenticated } from '../../../redux/authSlice';
import { useToast } from '../../ui/Toast/ToastContext';

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const location = useLocation();
  const toast = useToast();

  useEffect(() => {
    if (!isAuthenticated) {
      toast.info('Please sign in to view your account orders.');
    }
  }, [isAuthenticated, toast]);

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location, openAuth: true }} replace />;
  }

  return children;
};

export default ProtectedRoute;
