import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import Swal from 'sweetalert2';
import duyananBg from '../assets/img/duyanan_bg.webp';
import sfcImg from '../assets/img/sfc.webp';
import habhabImg from '../assets/img/habhab.webp';
import turonImg from '../assets/img/turon.webp';

const carouselSlides = [
    {
        img: sfcImg,
        tag: '🍗 Best Seller',
        title: 'Sizzling Fried Chicken',
        desc: 'Crispy on the outside, juicy on the inside — a Duyanan classic.',
        price: '₱109',
    },
    {
        img: habhabImg,
        tag: '🍜 Local Favorite',
        title: 'Pancit Habhab',
        desc: 'Authentic Lucban noodles tossed in savory sauce, served the traditional way.',
        price: '₱250',
    },
    {
        img: duyananBg,
        tag: '🌿 Dine With Us',
        title: 'A Place to Gather',
        desc: 'Enjoy Filipino comfort food in a warm, relaxing atmosphere.',
        price: null,
    },
];

const Home = () => {
    const [activeSlide, setActiveSlide] = useState(0);
    const [touchStartX, setTouchStartX] = useState(null);
    const [touchEndX, setTouchEndX] = useState(null);

    const goTo = useCallback((index) => {
        setActiveSlide((index + carouselSlides.length) % carouselSlides.length);
    }, []);

    const handleTouchStart = (e) => {
        setTouchEndX(null);
        setTouchStartX(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e) => {
        setTouchEndX(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (touchStartX === null || touchEndX === null) return;
        const distance = touchStartX - touchEndX;
        if (distance > 50) {
            goTo(activeSlide + 1);
        } else if (distance < -50) {
            goTo(activeSlide - 1);
        }
    };

    const location = useLocation();
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();
    const { addToCart } = useCart();
    const [alert, setAlert] = useState(null);
    const [isAlertVisible, setIsAlertVisible] = useState(false);

    const handleGuestAddToCart = (itemName) => {
        if (!isAuthenticated) {
            Swal.fire({
                icon: 'info',
                title: 'Login Required',
                html: `You need an account to order <b>${itemName}</b>.<br/><br/>Please <b>log in</b> or <b>register</b> to continue.`,
                showCancelButton: true,
                confirmButtonText: '🔑 Login',
                cancelButtonText: 'Register',
                confirmButtonColor: '#7B3F00',
                cancelButtonColor: '#D35400',
            }).then((result) => {
                if (result.isConfirmed) navigate('/login');
                else if (result.dismiss === Swal.DismissReason.cancel) navigate('/register');
            });
            return;
        }
        // When real product data is used, call addToCart(product) here
        Swal.fire({
            toast: true, position: 'bottom-end', icon: 'success',
            title: 'Added to cart', text: `${itemName} has been added.`,
            showConfirmButton: false, timer: 2500, timerProgressBar: true
        });
    };

    // Admins are no longer forcefully redirected to the dashboard.
    // They can browse the homepage and use the 'Admin' button in the navbar to access the dashboard.

    useEffect(() => {
        if (location.state?.alert) {
            setAlert({ message: location.state.alert, type: location.state.type || 'info' });
            setIsAlertVisible(true);
            // Clear state so it doesn't reappear on refresh
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location, navigate]);

    useEffect(() => {
        if (alert) {
            setIsAlertVisible(true);
            const timer = setTimeout(() => {
                setIsAlertVisible(false);
                // Wait for animation to finish before clearing state
                setTimeout(() => setAlert(null), 800);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [alert]);

    // Auto-advance every 4 seconds
    useEffect(() => {
        const timer = setInterval(() => {
            setActiveSlide(prev => (prev + 1) % carouselSlides.length);
        }, 4000);
        return () => clearInterval(timer);
    }, []);

    const slide = carouselSlides[activeSlide];

    return (
        <div className="position-relative">
            {/* ── Floating Alert ── */}
            {alert && (
                <div className="position-fixed top-0 start-50 translate-middle-x mt-4" style={{ zIndex: 10000, width: 'max-content', maxWidth: '90%' }}>
                    <div className={`alert alert-${alert.type === 'danger' ? 'danger' : 'success'} border-0 shadow-lg rounded-4 py-3 px-4 fw-bold d-inline-flex align-items-center mb-0 animate__animated ${isAlertVisible ? 'animate__fadeInDown' : 'animate__backOutUp'}`} role="alert">
                        <i className={`bi ${alert.type === 'danger' ? 'bi-exclamation-triangle-fill' : 'bi-check-circle-fill'} me-3 fs-4`}></i>
                        {alert.message}
                    </div>
                </div>
            )}

            {/* Hero Section */}
            <header
                style={{
                    backgroundImage: `url(${duyananBg})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    color: '#fff',
                    textAlign: 'center',
                    paddingTop: 'var(--nav-height)'
                }}
            >
                {/* Overlay */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'linear-gradient(160deg, rgba(0,0,0,0.35) 0%, rgba(110,44,0,0.4) 100%)'
                }} />

                <div className="container position-relative" style={{ zIndex: 1 }}>
                    <div
                        className="frosted-panel p-4 p-sm-5 mx-auto"
                        style={{
                            maxWidth: '800px',
                            background: 'rgba(255,255,255,0.10)',
                            backdropFilter: 'blur(28px) saturate(200%)',
                            WebkitBackdropFilter: 'blur(28px) saturate(200%)',
                            border: '1px solid rgba(255,255,255,0.4)',
                            boxShadow: '0 12px 48px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.5)'
                        }}
                    >
                        <h1 className="mb-4" style={{ color: '#fff', textShadow: '2px 2px 8px rgba(0,0,0,0.6)', fontWeight: 800, fontSize: 'clamp(2rem, 6vw, 3.8rem)' }}>
                            TULOY PO KAYO, SA DUYANAN!
                        </h1>
                        <p className="lead mb-4" style={{ color: 'rgba(255,255,255,0.92)', textShadow: '1px 1px 4px rgba(0,0,0,0.5)', fontSize: 'clamp(0.95rem, 3vw, 1.15rem)' }}>
                            Experience the authentic taste of Filipino cuisine in a relaxing atmosphere.
                        </p>
                        <div className="d-flex flex-column flex-sm-row justify-content-center gap-2 gap-sm-3">
                            <Link to="/menu" className="btn-outline-brand text-decoration-none d-flex align-items-center justify-content-center" style={{ minHeight: '44px' }}>Order Now</Link>
                            <Link to="/book-reservation" className="btn-outline-brand text-decoration-none d-flex align-items-center justify-content-center" style={{ minHeight: '44px' }}>Book Reservation</Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* ── Features Carousel ── */}
            <section style={{ paddingTop: '50px', paddingBottom: '40px' }}>
                {/* Section heading */}
                <p className="text-center" style={{
                    color: 'var(--primary-brown)',
                    fontWeight: 800,
                    letterSpacing: '6px',
                    textTransform: 'uppercase',
                    fontSize: 'clamp(1.4rem, 4vw, 1.8rem)',
                    marginBottom: '32px',
                    marginTop: 0
                }}>
                    <span style={{ color: 'var(--accent-orange)' }}>✦</span>
                    &nbsp; Features &nbsp;
                    <span style={{ color: 'var(--accent-orange)' }}>✦</span>
                </p>

                <div className="container">
                    {/* Carousel wrapper */}
                    <div
                        style={{
                            position: 'relative',
                            borderRadius: '24px',
                            overflow: 'hidden',
                            boxShadow: '0 16px 45px rgba(0,0,0,0.14)',
                            userSelect: 'none'
                        }}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    >
                        {/* Slide */}
                        <div style={{ position: 'relative', height: '480px' }}>
                            <img
                                key={activeSlide}
                                src={slide.img}
                                alt={slide.title}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'opacity 0.5s ease' }}
                            />
                            {/* Left-to-right gradient overlay */}
                            <div style={{
                                position: 'absolute', inset: 0,
                                background: 'linear-gradient(90deg, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.25) 60%, transparent 100%)'
                            }} />

                            {/* Subtle bottom gradient to ensure scroll/slide indicators are crisp */}
                            <div style={{
                                position: 'absolute', bottom: 0, left: 0, right: 0, height: '90px',
                                background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 100%)',
                                pointerEvents: 'none'
                            }} />

                            {/* Caption */}
                            <div style={{
                                position: 'absolute',
                                top: '50%',
                                left: '6%',
                                transform: 'translateY(-50%)',
                                maxWidth: 'min(460px, 88%)',
                                textAlign: 'left',
                                zIndex: 12
                            }}>
                                <span style={{
                                    display: 'inline-block',
                                    background: 'var(--accent-orange)',
                                    color: '#fff',
                                    fontSize: '0.78rem',
                                    fontWeight: 700,
                                    padding: '4px 14px',
                                    borderRadius: '50px',
                                    marginBottom: '14px',
                                    letterSpacing: '0.5px',
                                    boxShadow: '0 2px 8px rgba(211,84,0,0.5)'
                                }}>
                                    {slide.tag}
                                </span>

                                <h2 style={{
                                    color: '#fff',
                                    fontWeight: 800,
                                    fontSize: 'clamp(1.6rem, 4vw, 2.4rem)',
                                    textShadow: '0 2px 12px rgba(0,0,0,0.6)',
                                    lineHeight: 1.2,
                                    marginBottom: '12px'
                                }}>
                                    {slide.title}
                                </h2>

                                <p style={{
                                    color: 'rgba(255,255,255,0.85)',
                                    fontSize: '1rem',
                                    marginBottom: '22px',
                                    textShadow: '0 1px 4px rgba(0,0,0,0.5)',
                                    lineHeight: 1.6
                                }}>
                                    {slide.desc}
                                </p>

                                <div className="d-flex align-items-center gap-3 flex-wrap">
                                    {slide.price && (
                                        <span style={{ color: '#ffd580', fontSize: '1.7rem', fontWeight: 800, textShadow: '0 2px 8px rgba(0,0,0,0.4)', lineHeight: 1 }}>
                                            {slide.price}
                                        </span>
                                    )}
                                    <Link to="/menu" className="btn-brand text-decoration-none shadow-sm" style={{ padding: '10px 26px', position: 'relative', zIndex: 15 }}>
                                        Order Now
                                    </Link>
                                </div>
                            </div>

                            {/* ── Scroll Bar / Indicator Pills INSIDE the Card ── */}
                            <div
                                style={{
                                    position: 'absolute',
                                    bottom: '20px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '6px 14px',
                                    borderRadius: '20px',
                                    background: 'rgba(0, 0, 0, 0.42)',
                                    backdropFilter: 'blur(8px)',
                                    WebkitBackdropFilter: 'blur(8px)',
                                    border: '1px solid rgba(255, 255, 255, 0.18)',
                                    zIndex: 20
                                }}
                            >
                                {carouselSlides.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            goTo(i);
                                        }}
                                        aria-label={`Go to slide ${i + 1}`}
                                        style={{
                                            width: i === activeSlide ? '28px' : '10px',
                                            height: '10px',
                                            borderRadius: '5px',
                                            border: 'none',
                                            background: i === activeSlide ? 'var(--accent-orange)' : 'rgba(255,255,255,0.45)',
                                            cursor: 'pointer',
                                            padding: 0,
                                            transition: 'all 0.3s ease',
                                            boxShadow: i === activeSlide ? '0 0 8px rgba(211,84,0,0.7)' : 'none'
                                        }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Invisible left click zone — go prev */}
                        <div
                            onClick={() => goTo(activeSlide - 1)}
                            style={{
                                position: 'absolute', top: 0, left: 0,
                                width: '50%', height: '100%',
                                cursor: 'pointer', zIndex: 5
                            }}
                        />

                        {/* Invisible right click zone — go next */}
                        <div
                            onClick={() => goTo(activeSlide + 1)}
                            style={{
                                position: 'absolute', top: 0, right: 0,
                                width: '50%', height: '100%',
                                cursor: 'pointer', zIndex: 5
                            }}
                        />

                        {/* Desktop Left / Right Navigation Chevrons */}
                        <button
                            onClick={(e) => { e.stopPropagation(); goTo(activeSlide - 1); }}
                            aria-label="Previous slide"
                            className="d-none d-md-flex align-items-center justify-content-center"
                            style={{
                                position: 'absolute',
                                top: '50%',
                                left: '20px',
                                transform: 'translateY(-50%)',
                                width: '42px',
                                height: '42px',
                                borderRadius: '50%',
                                border: '1px solid rgba(255,255,255,0.25)',
                                background: 'rgba(0,0,0,0.35)',
                                color: '#fff',
                                backdropFilter: 'blur(6px)',
                                cursor: 'pointer',
                                zIndex: 16,
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <i className="bi bi-chevron-left fs-5"></i>
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); goTo(activeSlide + 1); }}
                            aria-label="Next slide"
                            className="d-none d-md-flex align-items-center justify-content-center"
                            style={{
                                position: 'absolute',
                                top: '50%',
                                right: '20px',
                                transform: 'translateY(-50%)',
                                width: '42px',
                                height: '42px',
                                borderRadius: '50%',
                                border: '1px solid rgba(255,255,255,0.25)',
                                background: 'rgba(0,0,0,0.35)',
                                color: '#fff',
                                backdropFilter: 'blur(6px)',
                                cursor: 'pointer',
                                zIndex: 16,
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <i className="bi bi-chevron-right fs-5"></i>
                        </button>
                    </div>
                </div>
            </section>

            {/* Recommended Section */}
            <section className="section-py">
                <div className="container">
                    <div className="text-center mb-5">
                        <h2 className="fw-extrabold mb-2" style={{ color: 'var(--primary-brown)', textShadow: '0 1px 2px rgba(255,255,255,0.5)', fontSize: 'clamp(1.75rem, 5vw, 2.5rem)', fontWeight: 800 }}>Recommended Specials</h2>
                        <p className="text-muted mx-auto mb-0" style={{ maxWidth: '650px', fontSize: '1.05rem', lineHeight: '1.6' }}>Indulge in our selection of customer-favorite Filipino comfort food and dessert, prepared fresh daily.</p>
                    </div>

                    <div className="row g-4 d-flex align-items-stretch">
                        {[
                            { 
                                name: 'Sizzling Fried Chicken', 
                                price: '₱109.00', 
                                img: sfcImg, 
                                tag: '⭐️ Bestseller', 
                                rating: '4.9', 
                                reviews: '124', 
                                desc: 'Crispy local fried chicken served sizzling on an iron hotplate with our secret savory gravy.' 
                            },
                            { 
                                name: 'Pancit Habhab', 
                                price: '₱250.00', 
                                img: habhabImg, 
                                tag: '🔥 Customer Choice', 
                                rating: '4.8', 
                                reviews: '86', 
                                desc: 'Traditional sautéed Lucban noodles tossed with vegetables, sliced pork, and vinegar flavor.' 
                            },
                            { 
                                name: 'Lumpiang Turon', 
                                price: '₱50.00', 
                                img: turonImg, 
                                tag: '🍰 Sweet Delight', 
                                rating: '5.0', 
                                reviews: '42', 
                                desc: 'Golden brown banana rolls filled with jackfruit, caramelized in brown sugar syrup, served warm.' 
                            }
                        ].map((item, index) => (
                            <div className="col-md-4" key={index}>
                                <div className="card h-100 border-0 frosted-card position-relative" style={{ overflow: 'hidden', borderRadius: '24px' }}>
                                    {/* Tag Overlay */}
                                    <span className="badge position-absolute top-0 start-0 m-3 px-3 py-2 shadow" style={{ backgroundColor: 'rgba(139, 58, 15, 0.95)', color: '#fff', fontSize: '0.75rem', fontWeight: 700, zIndex: 2, borderRadius: '50px', letterSpacing: '0.5px' }}>
                                        {item.tag}
                                    </span>
                                    <div style={{ overflow: 'hidden', height: '280px' }}>
                                        <img src={item.img} className="card-img-top w-100 h-100" alt={item.name} loading="lazy" decoding="async" style={{ objectFit: 'cover' }} />
                                    </div>
                                    <div className="card-body text-center d-flex flex-column p-4">
                                        <h5 className="card-title fw-bold mb-1" style={{ color: 'var(--primary-brown)', fontSize: '1.35rem' }}>{item.name}</h5>
                                        
                                        {/* Rating */}
                                        <div className="d-flex justify-content-center align-items-center gap-1 mb-3 text-warning" style={{ fontSize: '0.88rem' }}>
                                            <i className="bi bi-star-fill"></i>
                                            <strong className="text-dark">{item.rating}</strong>
                                            <span className="text-muted">({item.reviews} reviews)</span>
                                        </div>

                                        <p className="card-text text-muted mb-4" style={{ flexGrow: 1, minHeight: '52px', fontSize: '0.95rem', lineHeight: '1.6' }}>
                                            {item.desc}
                                        </p>

                                        <div className="mt-auto">
                                            <p className="card-text text-muted mb-3">
                                                <span style={{ color: 'var(--accent-orange)', fontWeight: 800, fontSize: '1.45rem' }}>{item.price}</span>
                                            </p>
                                            <button 
                                                className="btn-outline-brand w-100 shadow-sm"
                                                onClick={() => handleGuestAddToCart(item.name)}
                                                title={!isAuthenticated ? 'Login to add items to cart' : ''}
                                                style={{
                                                    opacity: isAuthenticated ? 1 : 0.85,
                                                    cursor: isAuthenticated ? 'pointer' : 'not-allowed',
                                                    borderRadius: '30px',
                                                    padding: '12px 0',
                                                    fontSize: '0.9rem',
                                                    minHeight: '44px'
                                                }}
                                            >
                                                {!isAuthenticated && <i className="bi bi-lock-fill me-1" style={{ fontSize: '0.9rem' }}></i>}
                                                Add to cart
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
