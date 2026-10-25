import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import Swal from 'sweetalert2';
import duyananBg from '../assets/img/banner/duyanan_bg.webp';
import sfcImg from '../assets/img/menu/sfc.webp';
import habhabImg from '../assets/img/menu/habhab.webp';
import turonImg from '../assets/img/menu/turon.webp';
import c2Img from '../assets/img/banner/c2.webp';
import c3Img from '../assets/img/banner/c3.webp';

const carouselSlides = [
    {
        img: sfcImg,
        tag: '⭐️ Best Seller',
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

/* ── Fade-in-up hook ── */
function useFadeInUp(threshold = 0.15) {
    const ref = useRef(null);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) { el.classList.add('visible'); obs.unobserve(el); } },
            { threshold }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, [threshold]);
    return ref;
}

const Home = () => {
    const [activeSlide, setActiveSlide] = useState(0);
    const [touchStartX, setTouchStartX] = useState(null);
    const [touchEndX, setTouchEndX] = useState(null);

    const goTo = useCallback((index) => {
        setActiveSlide((index + carouselSlides.length) % carouselSlides.length);
    }, []);

    const handleTouchStart = (e) => { setTouchEndX(null); setTouchStartX(e.targetTouches[0].clientX); };
    const handleTouchMove = (e) => { setTouchEndX(e.targetTouches[0].clientX); };
    const handleTouchEnd = () => {
        if (touchStartX === null || touchEndX === null) return;
        const distance = touchStartX - touchEndX;
        if (distance > 50) goTo(activeSlide + 1);
        else if (distance < -50) goTo(activeSlide - 1);
    };

    const location = useLocation();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const { addToCart } = useCart();
    const [alert, setAlert] = useState(null);
    const [isAlertVisible, setIsAlertVisible] = useState(false);

    // Scroll animation refs
    const highlightsRef  = useFadeInUp();
    const featuresTitleRef = useFadeInUp();
    const featuresRef    = useFadeInUp();
    const whyRef         = useFadeInUp();
    const specials1Ref   = useFadeInUp(0.1);
    const specials2Ref   = useFadeInUp(0.1);
    const specials3Ref   = useFadeInUp(0.1);
    const ctaRef         = useFadeInUp();

    const handleGuestAddToCart = (itemName) => {
        if (!isAuthenticated) {
            Swal.fire({
                icon: 'info', title: 'Login Required',
                html: `You need an account to order <b>${itemName}</b>.<br/><br/>Please <b>log in</b> or <b>register</b> to continue.`,
                showCancelButton: true,
                confirmButtonText: '🔑 Login', cancelButtonText: 'Register',
                confirmButtonColor: '#7B3F00', cancelButtonColor: '#D35400',
            }).then((result) => {
                if (result.isConfirmed) navigate('/login');
                else if (result.dismiss === Swal.DismissReason.cancel) navigate('/register');
            });
            return;
        }
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
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location, navigate]);

    useEffect(() => {
        if (alert) {
            setIsAlertVisible(true);
            const timer = setTimeout(() => {
                setIsAlertVisible(false);
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

            {/* ══════════════════════════════════════════
                SCREEN 1 — Hero Section (UPGRADED)
            ══════════════════════════════════════════ */}
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
                    paddingTop: 'var(--nav-height)',
                }}
            >
                {/* Multi-layer overlay for depth */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'linear-gradient(160deg, rgba(0,0,0,0.28) 0%, rgba(90,28,0,0.52) 60%, rgba(110,44,0,0.65) 100%)'
                }} />
                {/* Bokeh grain texture overlay */}
                <div style={{
                    position: 'absolute', inset: 0, opacity: 0.18,
                    backgroundImage: 'radial-gradient(ellipse at 20% 50%, rgba(255,200,100,0.25) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(255,160,60,0.2) 0%, transparent 55%)'
                }} />

                <div className="container position-relative" style={{ zIndex: 1 }}>
                    <div
                        className="frosted-panel p-4 p-sm-5 mx-auto"
                        style={{
                            maxWidth: '840px',
                            background: 'rgba(255,255,255,0.10)',
                            backdropFilter: 'blur(32px) saturate(200%)',
                            WebkitBackdropFilter: 'blur(32px) saturate(200%)',
                            border: '1px solid rgba(255,255,255,0.35)',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.45)',
                            animation: 'heroEntrance 0.9s cubic-bezier(0.22,1,0.36,1) both'
                        }}
                    >
                        {/* Live Status Pill */}
                        <div
                            className="d-inline-flex align-items-center gap-2 px-3 py-1 mb-4 rounded-pill"
                            style={{
                                background: 'rgba(0,0,0,0.42)',
                                backdropFilter: 'blur(14px)',
                                WebkitBackdropFilter: 'blur(14px)',
                                border: '1px solid rgba(255,255,255,0.22)',
                                color: '#fff',
                                fontSize: 'clamp(0.75rem, 2.2vw, 0.88rem)',
                                boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
                            }}
                        >
                            <span className="live-pulse-dot"></span>
                            <span className="fw-semibold">Kitchen Open Now</span>
                            <span style={{ opacity: 0.4 }}>•</span>
                            <span>Closes 9:00 PM</span>
                        </div>

                        {/* Main headline */}
                        <h1
                            className="mb-3"
                            style={{
                                color: '#fff',
                                textShadow: '0 3px 16px rgba(0,0,0,0.55)',
                                fontWeight: 900,
                                fontSize: 'clamp(2rem, 6.5vw, 4rem)',
                                lineHeight: 1.1,
                                letterSpacing: '-0.02em'
                            }}
                        >
                            TULOY PO KAYO,<br />
                            <span style={{ color: '#ffd580' }}>SA DUYANAN!</span>
                        </h1>

                        <p className="lead mb-4 mx-auto" style={{
                            color: 'rgba(255,255,255,0.88)',
                            textShadow: '1px 1px 6px rgba(0,0,0,0.4)',
                            fontSize: 'clamp(0.95rem, 2.8vw, 1.15rem)',
                            maxWidth: '560px',
                            lineHeight: 1.7
                        }}>
                            Experience the authentic taste of Filipino comfort food in a warm,
                            relaxing garden atmosphere — in the heart of Padre Burgos, Quezon.
                        </p>

                        {/* CTA Buttons */}
                        <div className="d-flex flex-column flex-sm-row justify-content-center gap-2 gap-sm-3">
                            <Link
                                to="/menu"
                                id="hero-order-now"
                                className="btn-brand text-decoration-none d-flex align-items-center justify-content-center gap-2 shadow"
                                style={{ minHeight: '52px', padding: '14px 38px', borderRadius: '50px', fontWeight: 700, fontSize: '1.02rem', boxShadow: '0 8px 24px rgba(211,84,0,0.45)' }}
                            >
                                Order Now <i className="bi bi-arrow-right"></i>
                            </Link>
                            <Link
                                to="/book-reservation"
                                id="hero-book-reservation"
                                className="btn-outline-brand text-decoration-none d-flex align-items-center justify-content-center gap-2"
                                style={{
                                    minHeight: '52px', padding: '14px 32px', borderRadius: '50px',
                                    background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)',
                                    borderColor: 'rgba(255,255,255,0.5)', color: '#fff', fontSize: '1.02rem'
                                }}
                            >
                                <i className="bi bi-calendar2-check"></i> Book Reservation
                            </Link>
                        </div>

                        {/* Scroll cue */}
                        <div className="mt-4" style={{ opacity: 0.6, animation: 'scrollBounce 2s ease-in-out infinite' }}>
                            <i className="bi bi-chevron-down" style={{ fontSize: '1.1rem' }}></i>
                        </div>
                    </div>
                </div>
            </header>

            {/* ── Value Highlights Bar (floating) ── */}
            <div ref={highlightsRef} className="container fade-in-up" style={{ marginTop: '-38px', position: 'relative', zIndex: 10 }}>
                <div
                    className="row g-2 g-md-3 p-3 p-md-3 rounded-4 shadow-lg mx-1 mx-md-0"
                    style={{
                        background: '#ffffff',
                        border: '1px solid rgba(160,64,0,0.08)',
                        boxShadow: '0 14px 40px rgba(110,44,0,0.10)'
                    }}
                >
                    {[
                        { icon: '🍜', title: 'Authentic Lucban Recipes', desc: 'Original heritage flavor & spices' },
                        { icon: '🌿', title: 'Al Fresco Duyan Garden',  desc: 'Cozy hammocks under fairy lights' },
                        { icon: '🍗', title: 'Prepared Fresh Daily',    desc: 'Crispy, sizzling hot to order' },
                        { icon: '👨‍👩‍👧‍👦', title: 'Salo-Salo Friendly', desc: 'Generous servings for family & barkada' }
                    ].map((h, idx) => (
                        <div className="col-6 col-lg-3" key={idx}>
                            <div className="d-flex align-items-center gap-2 gap-md-3 p-2 h-100 highlight-tile">
                                <span style={{ fontSize: 'clamp(1.5rem,3.5vw,2rem)', flexShrink: 0 }}>{h.icon}</span>
                                <div className="text-truncate">
                                    <h6 className="fw-bold mb-0 text-truncate" style={{ color: 'var(--primary-brown)', fontSize: 'clamp(0.82rem,2.2vw,0.95rem)' }}>{h.title}</h6>
                                    <p className="text-muted small mb-0 d-none d-sm-block text-truncate" style={{ fontSize: '0.78rem' }}>{h.desc}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ══════════════════════════════════════════
                Features Carousel
            ══════════════════════════════════════════ */}
            <section style={{ paddingTop: '56px', paddingBottom: '48px' }}>
                <p ref={featuresTitleRef} className="text-center fade-in-up" style={{
                    color: 'var(--primary-brown)', fontWeight: 800, letterSpacing: '6px',
                    textTransform: 'uppercase', fontSize: 'clamp(1.2rem, 3.5vw, 1.7rem)',
                    marginBottom: '32px', marginTop: 0
                }}>
                    <span style={{ color: 'var(--accent-orange)' }}>✦</span>
                    &nbsp; Features &nbsp;
                    <span style={{ color: 'var(--accent-orange)' }}>✦</span>
                </p>

                <div ref={featuresRef} className="container fade-in-up">
                    <div
                        style={{ position: 'relative', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 56px rgba(0,0,0,0.16)', userSelect: 'none' }}
                        onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
                    >
                        {/* Slide */}
                        <div style={{ position: 'relative', height: '480px' }}>
                            <img
                                key={activeSlide} src={slide.img} alt={slide.title}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'opacity 0.6s ease' }}
                            />
                            {/* Gradient overlay */}
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.2) 65%, transparent 100%)' }} />
                            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '100px', background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%)', pointerEvents: 'none' }} />

                            {/* Caption */}
                            <div style={{
                                position: 'absolute', top: '50%', left: '6%',
                                transform: 'translateY(-50%)', maxWidth: 'min(480px, 88%)',
                                textAlign: 'left', zIndex: 12
                            }}>
                                <span style={{
                                    display: 'inline-block', background: 'var(--accent-orange)', color: '#fff',
                                    fontSize: '0.78rem', fontWeight: 700, padding: '5px 16px', borderRadius: '50px',
                                    marginBottom: '16px', letterSpacing: '0.5px', boxShadow: '0 3px 12px rgba(211,84,0,0.55)'
                                }}>
                                    {slide.tag}
                                </span>
                                <h2 style={{
                                    color: '#fff', fontWeight: 800,
                                    fontSize: 'clamp(1.7rem, 4.5vw, 2.6rem)',
                                    textShadow: '0 2px 14px rgba(0,0,0,0.6)',
                                    lineHeight: 1.15, marginBottom: '14px'
                                }}>
                                    {slide.title}
                                </h2>
                                <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1rem', marginBottom: '24px', textShadow: '0 1px 5px rgba(0,0,0,0.5)', lineHeight: 1.65 }}>
                                    {slide.desc}
                                </p>
                                <div className="d-flex align-items-center gap-3 flex-wrap">
                                    {slide.price && (
                                        <span style={{ color: '#ffd580', fontSize: '1.8rem', fontWeight: 800, textShadow: '0 2px 10px rgba(0,0,0,0.4)', lineHeight: 1 }}>
                                            {slide.price}
                                        </span>
                                    )}
                                    <Link to="/menu" className="btn-brand text-decoration-none shadow-sm" style={{ padding: '11px 28px', position: 'relative', zIndex: 15 }}>
                                        Order Now
                                    </Link>
                                </div>
                            </div>

                            {/* Slide indicators */}
                            <div style={{
                                position: 'absolute', bottom: '22px', left: '50%', transform: 'translateX(-50%)',
                                display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 16px',
                                borderRadius: '20px', background: 'rgba(0,0,0,0.44)', backdropFilter: 'blur(10px)',
                                WebkitBackdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.16)', zIndex: 20
                            }}>
                                {carouselSlides.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={(e) => { e.stopPropagation(); goTo(i); }}
                                        aria-label={`Go to slide ${i + 1}`}
                                        style={{
                                            width: i === activeSlide ? '30px' : '10px', height: '10px', borderRadius: '5px',
                                            border: 'none', background: i === activeSlide ? 'var(--accent-orange)' : 'rgba(255,255,255,0.4)',
                                            cursor: 'pointer', padding: 0, transition: 'all 0.3s ease',
                                            boxShadow: i === activeSlide ? '0 0 10px rgba(211,84,0,0.8)' : 'none'
                                        }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Left/Right click zones */}
                        <div onClick={() => goTo(activeSlide - 1)} style={{ position: 'absolute', top: 0, left: 0, width: '50%', height: '100%', cursor: 'pointer', zIndex: 5 }} />
                        <div onClick={() => goTo(activeSlide + 1)} style={{ position: 'absolute', top: 0, right: 0, width: '50%', height: '100%', cursor: 'pointer', zIndex: 5 }} />

                        {/* Desktop chevrons */}
                        {[
                            { side: 'left',  icon: 'chevron-left',  action: () => goTo(activeSlide - 1) },
                            { side: 'right', icon: 'chevron-right', action: () => goTo(activeSlide + 1) }
                        ].map(({ side, icon, action }) => (
                            <button key={side} onClick={(e) => { e.stopPropagation(); action(); }}
                                aria-label={`${side === 'left' ? 'Previous' : 'Next'} slide`}
                                className="d-none d-md-flex align-items-center justify-content-center"
                                style={{
                                    position: 'absolute', top: '50%', [side]: '20px', transform: 'translateY(-50%)',
                                    width: '44px', height: '44px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.28)',
                                    background: 'rgba(0,0,0,0.38)', color: '#fff', backdropFilter: 'blur(8px)',
                                    cursor: 'pointer', zIndex: 16, transition: 'all 0.25s ease'
                                }}>
                                <i className={`bi bi-${icon} fs-5`}></i>
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════
                Why Duyanan? — Atmosphere Section
            ══════════════════════════════════════════ */}
            <section style={{ paddingTop: '16px', paddingBottom: '64px' }}>
                <div className="container">
                    <div ref={whyRef} className="fade-in-up row g-0 rounded-4 overflow-hidden shadow-lg" style={{ background: 'linear-gradient(135deg, #3d1200 0%, #7b2d00 50%, #a04000 100%)', minHeight: '340px' }}>
                        {/* Left: Text */}
                        <div className="col-12 col-lg-6 d-flex flex-column justify-content-center p-4 p-sm-5">
                            <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: '8px',
                                background: 'rgba(255,213,128,0.18)', border: '1px solid rgba(255,213,128,0.4)',
                                borderRadius: '50px', padding: '5px 16px', marginBottom: '20px', width: 'fit-content'
                            }}>
                                <span style={{ fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, color: '#ffd580' }}>🌿 About Our Experience</span>
                            </div>
                            <h2 style={{ color: '#fff', fontWeight: 900, fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', lineHeight: 1.15, marginBottom: '16px', textShadow: '0 2px 12px rgba(0,0,0,0.4)' }}>
                                More Than Just a Meal — It's a <span style={{ color: '#ffd580' }}>Feeling</span>
                            </h2>
                            <p style={{ color: 'rgba(255,255,255,0.82)', fontSize: '1rem', lineHeight: 1.75, marginBottom: '28px' }}>
                                Nestled in the heart of Padre Burgos, Quezon, Duyanan Restaurant offers the warmest Filipino hospitality.
                                Relax in a hammock, share laughter with loved ones, and savor dishes made with generations of love.
                            </p>
                            <div className="d-flex flex-wrap gap-3">
                                {['🪢 Hammock Seating', '🌙 Evening Fairy Lights', '🍲 Heritage Recipes'].map((badge, i) => (
                                    <span key={i} style={{
                                        background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)',
                                        color: '#fff', borderRadius: '50px', padding: '6px 18px',
                                        fontSize: '0.82rem', fontWeight: 600
                                    }}>{badge}</span>
                                ))}
                            </div>
                        </div>

                        {/* Right: Visual Atmosphere Showcase */}
                        <div className="col-12 col-lg-6 p-4 p-sm-5 d-flex align-items-center justify-content-center">
                            <div className="position-relative w-100" style={{ maxWidth: '480px' }}>
                                {/* Main Ambiance Photo Card */}
                                <div 
                                    className="atmosphere-showcase-card"
                                    style={{
                                        position: 'relative',
                                        borderRadius: '24px',
                                        overflow: 'hidden',
                                        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.45)',
                                        border: '1px solid rgba(255, 255, 255, 0.22)',
                                        aspectRatio: '4/3',
                                        background: 'rgba(0, 0, 0, 0.2)',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <img 
                                        src={c2Img} 
                                        alt="Duyanan Garden Ambiance"
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover'
                                        }}
                                    />
                                    <div style={{
                                        position: 'absolute',
                                        inset: 0,
                                        background: 'linear-gradient(to top, rgba(30, 10, 0, 0.9) 0%, rgba(30, 10, 0, 0.25) 55%, transparent 100%)',
                                        pointerEvents: 'none'
                                    }} />

                                    {/* Bottom Content inside Photo */}
                                    <div style={{
                                        position: 'absolute',
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        padding: '20px 22px',
                                        zIndex: 2
                                    }}>
                                        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                                            <div>
                                                <div style={{ color: '#ffd580', fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.01em' }}>
                                                    ✨ Garden Dining Pavilion
                                                </div>
                                                <div style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.82rem', marginTop: '3px' }}>
                                                    Fairy lights, wooden hammocks & cool mountain breeze
                                                </div>
                                            </div>
                                            <Link 
                                                to="/reservations" 
                                                className="btn btn-sm fw-bold px-3 py-2 rounded-pill shadow-sm"
                                                style={{
                                                    backgroundColor: 'var(--accent-orange)',
                                                    color: '#fff',
                                                    border: 'none',
                                                    fontSize: '0.82rem',
                                                    whiteSpace: 'nowrap'
                                                }}
                                            >
                                                Book a Table <i className="bi bi-arrow-right ms-1"></i>
                                            </Link>
                                        </div>
                                    </div>
                                </div>

                                {/* Floating Top-Left Badge */}
                                <div style={{
                                    position: 'absolute',
                                    top: '-12px',
                                    left: '16px',
                                    background: 'rgba(0, 0, 0, 0.72)',
                                    backdropFilter: 'blur(12px)',
                                    WebkitBackdropFilter: 'blur(12px)',
                                    border: '1px solid rgba(255, 213, 128, 0.4)',
                                    color: '#ffd580',
                                    padding: '5px 14px',
                                    borderRadius: '50px',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    letterSpacing: '0.05em',
                                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
                                    zIndex: 3
                                }}>
                                    🌿 Padre Burgos, Quezon
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════
                SCREEN 1 — Recommended Specials (UPGRADED)
            ══════════════════════════════════════════ */}
            <section className="section-py" style={{ paddingTop: 0 }}>
                <div className="container">
                    <div className="text-center mb-5">
                        <span style={{
                            display: 'inline-block', background: 'rgba(211,84,0,0.1)', color: 'var(--accent-orange)',
                            border: '1px solid rgba(211,84,0,0.2)', borderRadius: '50px', padding: '5px 18px',
                            fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px'
                        }}>⭐ Today's Picks</span>
                        <h2 className="fw-extrabold mb-2" style={{ color: 'var(--primary-brown)', fontSize: 'clamp(1.75rem, 5vw, 2.5rem)', fontWeight: 800 }}>
                            Recommended Specials
                        </h2>
                        <p className="text-muted mx-auto mb-0" style={{ maxWidth: '600px', fontSize: '1.05rem', lineHeight: '1.65' }}>
                            Indulge in our selection of customer-favorite Filipino comfort food and dessert, prepared fresh daily.
                        </p>
                    </div>

                    <div className="row g-4 d-flex align-items-stretch">
                        {[
                            {
                                name: 'Sizzling Fried Chicken', price: '₱109.00', img: sfcImg,
                                tag: '⭐️ Bestseller', portion: 'Good for 2-3 persons',
                                rating: '4.9', reviews: '124',
                                desc: 'Crispy local fried chicken served sizzling on an iron hotplate with our secret savory gravy.',
                                ref: specials1Ref
                            },
                            {
                                name: 'Pancit Habhab', price: '₱250.00', img: habhabImg,
                                tag: '🍜 Local Pride', portion: 'Good for 3-4 persons',
                                rating: '4.8', reviews: '86',
                                desc: 'Traditional sautéed Lucban noodles tossed with vegetables, sliced pork, and savory vinegar flavor.',
                                ref: specials2Ref
                            },
                            {
                                name: 'Lumpiang Turon', price: '₱50.00', img: turonImg,
                                tag: '🍰 Sweet Delight', portion: 'Sweet Snack / Dessert',
                                rating: '5.0', reviews: '42',
                                desc: 'Golden brown banana rolls filled with jackfruit, caramelized in brown sugar syrup, served warm.',
                                ref: specials3Ref
                            }
                        ].map((item, index) => (
                            <div className="col-md-4 fade-in-up" ref={item.ref} key={index} style={{ transitionDelay: `${index * 0.12}s` }}>
                                <div className="card h-100 border-0 bestseller-card position-relative bg-white" style={{ overflow: 'hidden', borderRadius: '24px' }}>
                                    {/* Tag */}
                                    <span className="badge position-absolute top-0 start-0 m-3 px-3 py-2 shadow-sm" style={{
                                        backgroundColor: 'rgba(160,64,0,0.92)', color: '#fff',
                                        fontSize: '0.75rem', fontWeight: 700, zIndex: 2,
                                        borderRadius: '50px', letterSpacing: '0.4px', backdropFilter: 'blur(6px)'
                                    }}>
                                        {item.tag}
                                    </span>
                                    {/* Portion pill */}
                                    <span className="badge position-absolute top-0 end-0 m-3 px-3 py-2 shadow-sm" style={{
                                        backgroundColor: 'rgba(0,0,0,0.55)', color: '#fff',
                                        fontSize: '0.72rem', fontWeight: 600, zIndex: 2, borderRadius: '50px', backdropFilter: 'blur(6px)'
                                    }}>
                                        <i className="bi bi-people-fill me-1"></i> {item.portion}
                                    </span>

                                    <div className="card-img-wrap" style={{ overflow: 'hidden', height: '280px', position: 'relative' }}>
                                        <img src={item.img} className="card-img-top w-100 h-100" alt={item.name} loading="lazy" decoding="async" style={{ objectFit: 'cover' }} />
                                        {/* Bottom price overlay */}
                                        <div style={{
                                            position: 'absolute', bottom: 0, left: 0, right: 0, height: '60px',
                                            background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%)'
                                        }} />
                                    </div>

                                    <div className="card-body text-center d-flex flex-column p-4">
                                        <h5 className="card-title fw-bold mb-1" style={{ color: 'var(--primary-brown)', fontSize: '1.3rem' }}>{item.name}</h5>

                                        {/* Rating */}
                                        <div className="d-flex justify-content-center align-items-center gap-1 mb-3 text-warning" style={{ fontSize: '0.88rem' }}>
                                            <i className="bi bi-star-fill"></i>
                                            <strong className="text-dark">{item.rating}</strong>
                                            <span className="text-muted">({item.reviews} reviews)</span>
                                        </div>

                                        <p className="card-text text-muted mb-4" style={{ flexGrow: 1, minHeight: '52px', fontSize: '0.95rem', lineHeight: '1.65' }}>
                                            {item.desc}
                                        </p>

                                        <div className="mt-auto">
                                            <p className="card-text mb-3">
                                                <span style={{ color: 'var(--accent-orange)', fontWeight: 800, fontSize: '1.55rem' }}>{item.price}</span>
                                            </p>
                                            <button
                                                className="btn-brand w-100 shadow-sm d-flex align-items-center justify-content-center gap-2"
                                                onClick={() => handleGuestAddToCart(item.name)}
                                                style={{ borderRadius: '30px', padding: '13px 0', fontSize: '0.92rem', fontWeight: 700, minHeight: '46px' }}
                                            >
                                                {!isAuthenticated ? (
                                                    <><i className="bi bi-bag-plus"></i> Order Now</>
                                                ) : (
                                                    <><i className="bi bi-cart-plus"></i> Add to Cart</>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Explore Full Menu CTA */}
                    <div ref={ctaRef} className="text-center mt-5 pt-2 fade-in-up">
                        <Link
                            to="/menu"
                            className="btn-outline-brand text-decoration-none shadow-sm px-5 py-3 d-inline-flex align-items-center gap-2"
                            style={{ borderRadius: '50px', fontWeight: 700, fontSize: '0.98rem' }}
                        >
                            <span>Explore Full Menu</span>
                            <i className="bi bi-arrow-right"></i>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Home page keyframe styles */}
            <style>{`
                @keyframes heroEntrance {
                    from { opacity: 0; transform: translateY(28px) scale(0.97); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes scrollBounce {
                    0%, 100% { transform: translateY(0); opacity: 0.6; }
                    50%       { transform: translateY(5px); opacity: 1; }
                }
                .highlight-tile { transition: transform 0.22s ease; cursor: default; }
                .highlight-tile:hover { transform: scale(1.03); }
                .stat-tile:hover { transform: translateY(-3px); background: rgba(255,255,255,0.18) !important; }
            `}</style>
        </div>
    );
};

export default Home;
