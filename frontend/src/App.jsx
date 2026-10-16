import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import Navigation from './components/Navigation';
import ProtectedRoute from './components/ProtectedRoute';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import 'bootstrap/dist/css/bootstrap.min.css';

// Lazy-loaded pages to split massive chunks (e.g. AdminPanel 181KB, Menu 96KB, Profile 92KB)
// This dramatically reduces initial landing page bundle size and eliminates first-paint blocking.
const Home = lazy(() => import('./pages/Home'));
const Menu = lazy(() => import('./pages/Menu'));
const EventPackages = lazy(() => import('./pages/EventPackages'));
const GroupMeals = lazy(() => import('./pages/GroupMeals'));
const CartPage = lazy(() => import('./pages/CartPage'));
const Reservations = lazy(() => import('./pages/Reservations'));
const About = lazy(() => import('./pages/About'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Profile = lazy(() => import('./pages/Profile'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));

// Elegant branded loading fallback matching Duyanan color scheme
const PageLoadingFallback = () => (
    <div className="d-flex flex-column align-items-center justify-content-center py-5 my-auto" style={{ minHeight: '60vh' }}>
        <div className="spinner-border" role="status" style={{ width: '3rem', height: '3rem', color: '#c2703a' }}>
            <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 fw-bold text-muted" style={{ letterSpacing: '1px', fontSize: '0.95rem' }}>
            Loading Duyanan...
        </p>
    </div>
);

function App() {
    return (
        <AuthProvider>
            <CartProvider>
                <Router>
                    <ScrollToTop />
                    <div className="d-flex flex-column min-vh-100">
                        <Navigation />
                        <Suspense fallback={<PageLoadingFallback />}>
                            <Routes>
                                {/* Public Auth routes */}
                                <Route path="/login" element={<Login />} />
                                <Route path="/register" element={<Register />} />
                                <Route path="/reset-password" element={<ResetPassword />} />

                                {/* Public routes — visible to everyone including guests */}
                                <Route path="/" element={<Home />} />
                                <Route path="/menu" element={<Menu />} />
                                <Route path="/event-packages" element={<EventPackages />} />
                                <Route path="/group-meals" element={<GroupMeals />} />
                                <Route path="/about" element={<About />} />
                                <Route path="/book-reservation" element={<Reservations />} />

                                {/* Protected routes — require login */}
                                <Route path="/cart" element={
                                    <ProtectedRoute>
                                        <CartPage />
                                    </ProtectedRoute>
                                } />
                                <Route path="/profile" element={
                                    <ProtectedRoute>
                                        <Profile />
                                    </ProtectedRoute>
                                } />

                                {/* Admin-only route */}
                                <Route path="/admin" element={
                                    <ProtectedRoute requiredRole="ADMIN">
                                        <AdminPanel />
                                    </ProtectedRoute>
                                } />
                            </Routes>
                        </Suspense>
                        <Footer />
                    </div>
                </Router>
            </CartProvider>
        </AuthProvider>
    );
}

export default App;
