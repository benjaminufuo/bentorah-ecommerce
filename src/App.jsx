import { createBrowserRouter, RouterProvider, Outlet, ScrollRestoration } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import { ToastProvider } from './components/ui/Toast/ToastContext';
import Navbar from './components/layout/Navbar/Navbar';
import Footer from './components/layout/Footer/Footer';
import CartDrawer from './components/cart/CartDrawer/CartDrawer';
import Home from './pages/Home/Home';
import Products from './pages/Products/Products';
import ProductDetails from './pages/ProductDetails/ProductDetails';
import Cart from './pages/Cart/Cart';
import Checkout from './pages/Checkout/Checkout';
import Payment from './pages/Payment/Payment';
import OrderSuccess from './pages/OrderSuccess/OrderSuccess';
import OrderDetails from './pages/OrderDetails/OrderDetails';
import Orders from './pages/Orders/Orders';
import PaymentCallback from './pages/PaymentCallback/PaymentCallback';
import ResetPassword from './pages/ResetPassword/ResetPassword';
import AuthCallback from './pages/AuthCallback/AuthCallback';
import About from './pages/About/About';
import NotFound from './pages/NotFound/NotFound';
import ProtectedRoute from './components/auth/ProtectedRoute/ProtectedRoute';

function AppLayout() {
  return (
    <div className="bentorah-page">
      {/* <a href="#main-content" className="skip-link">Skip to main content</a> */}
      <Navbar />
      <CartDrawer />
      <main id="main-content" className="bentorah-main">
        <Outlet />
      </main>
      <Footer />
      <ScrollRestoration />
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'products', element: <Products key="shop" pageType="shop" /> },
      { path: 'new-arrivals', element: <Products key="new-arrivals" pageType="new-arrivals" /> },
      { path: 'deals', element: <Products key="deals" pageType="deals" /> },
      { path: 'products/:id', element: <ProductDetails /> },
      { path: 'cart', element: <Cart /> },
      { path: 'checkout', element: <Checkout /> },
      { path: 'payment', element: <Payment /> },
      { path: 'payment/callback', element: <PaymentCallback /> },
      { path: 'payment-callback', element: <PaymentCallback /> },
      { path: 'reset-password', element: <ResetPassword /> },
      { path: 'reset-password/callback', element: <ResetPassword /> },
      { path: 'auth/reset-password', element: <ResetPassword /> },
      { path: 'auth/google/callback', element: <AuthCallback /> },
      { path: 'auth/callback', element: <AuthCallback /> },
      { path: 'google/callback', element: <AuthCallback /> },
      { path: 'oauth-callback', element: <AuthCallback /> },
      { path: 'order-success', element: <OrderSuccess /> },
      { path: 'orders', element: <ProtectedRoute><Orders /></ProtectedRoute> },
      { path: 'orders/:id', element: <ProtectedRoute><OrderDetails /></ProtectedRoute> },
      { path: 'about', element: <About /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);

function App() {
  return (
    <Provider store={store}>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </Provider>
  );
}

export default App;
