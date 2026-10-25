import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import Swal from 'sweetalert2';

const API_URL = import.meta.env.VITE_API_URL;

import bg1 from '../assets/img/banner/duyanan_bg.webp';
import bg2 from '../assets/img/menu/sfc.webp';
import bg3 from '../assets/img/menu/habhab.webp';

const bgImages = [bg1, bg2, bg3];

const ambianceOptions = [
    { value: 'outdoor', label: 'Al Fresco Garden',     emoji: '🌿', desc: 'Open-air under fairy lights', img: bg1 },
    { value: 'duyan',   label: 'Bamboo Duyan Gazebo',  emoji: '🪢', desc: 'Rustic hammocks & garden',   img: bg3 },
    { value: 'indoor',  label: 'Indoor Fiesta Hall',   emoji: '🏠', desc: 'Air-cooled banquet dining',  img: bg2 },
];

const timeSlots = ['10:30 AM', '11:30 AM', '12:30 PM', '1:30 PM', '6:00 PM', '7:00 PM', '8:00 PM'];

const timeSlotToValue = (label) => {
    const [time, meridian] = label.split(' ');
    const [h, m] = time.split(':').map(Number);
    let hours = h;
    if (meridian === 'PM' && h !== 12) hours += 12;
    if (meridian === 'AM' && h === 12) hours = 0;
    return `${String(hours).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const Reservations = () => {
    const navigate = useNavigate();
    const [currentBg, setCurrentBg] = useState(0);
    const { setReservationId } = useCart();
    const [selectedAmbiance, setSelectedAmbiance] = useState('');
    const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
    const [guestCount, setGuestCount] = useState(2);
    const [formData, setFormData] = useState({
        seatingType: '',
        date: '',
        time: '',
        guests: '2',
        request: '',
        eventType: ''
    });
    const { user, isAuthenticated } = useAuth();

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentBg((prev) => (prev + 1) % bgImages.length);
        }, 4000);
        return () => clearInterval(timer);
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAmbianceSelect = (value) => {
        setSelectedAmbiance(value);
        setFormData(prev => ({ ...prev, seatingType: value }));
    };

    const handleTimeSlotSelect = (slot) => {
        setSelectedTimeSlot(slot);
        setFormData(prev => ({ ...prev, time: timeSlotToValue(slot) }));
    };

    const handleGuestChange = (delta) => {
        const next = Math.min(Math.max(1, guestCount + delta), 30);
        setGuestCount(next);
        setFormData(prev => ({ ...prev, guests: String(next) }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isAuthenticated) {
            Swal.fire({ icon: 'warning', title: 'Please Log In', text: 'You need to be logged in to make a reservation.', confirmButtonColor: 'var(--primary-brown)' });
            navigate('/login');
            return;
        }

        const selectedDateTime = new Date(`${formData.date}T${formData.time}`);
        if (selectedDateTime < new Date()) {
            Swal.fire({ icon: 'error', title: 'Invalid Date/Time', text: 'Reservation date and time cannot be in the past!', confirmButtonColor: 'var(--primary-brown)' });
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/reservations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
                body: JSON.stringify({
                    guestName: `${user.firstName} ${user.lastName}`,
                    contactNumber: 'N/A',
                    reservationDate: formData.date,
                    reservationTime: formData.time,
                    numberOfGuests: guestCount,
                    specialRequests: formData.request,
                    seatingType: selectedAmbiance || formData.seatingType,
                    eventType: formData.eventType
                })
            });

            const data = await response.json();

            if (response.ok) {
                const result = await Swal.fire({
                    icon: 'success',
                    title: 'Reservation Confirmed! 🎉',
                    text: 'Your table has been successfully booked! Would you like to browse the menu and pre-order food for your visit?',
                    showCancelButton: true,
                    confirmButtonColor: 'var(--accent-orange)',
                    cancelButtonColor: '#6c757d',
                    confirmButtonText: '🍽️ Yes, Browse Menu',
                    cancelButtonText: 'No, Thanks'
                });
                if (result.isConfirmed) {
                    if (setReservationId) setReservationId(data.reservation?._id || data._id);
                    navigate('/menu');
                } else {
                    navigate('/');
                }
            } else {
                Swal.fire({ icon: 'error', title: 'Reservation Failed', text: data.message || 'Something went wrong.', confirmButtonColor: 'var(--primary-brown)' });
            }
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Connection Error', text: 'Unable to connect. Please try again.', confirmButtonColor: 'var(--primary-brown)' });
        }
    };

    const inputStyle = {
        borderRadius: '12px',
        border: '1.5px solid rgba(160, 64, 0, 0.2)',
        backgroundColor: '#fff',
        padding: '12px 16px',
        fontSize: '1rem',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        width: '100%',
        outline: 'none',
        color: '#333'
    };

    const labelStyle = {
        color: 'var(--primary-brown)',
        fontWeight: '700',
        fontSize: '0.85rem',
        marginBottom: '8px',
        display: 'block',
        letterSpacing: '0.04em',
        textTransform: 'uppercase'
    };

    return (
        <div className="container-fluid p-0" style={{ minHeight: '100vh', display: 'flex' }}>
            <div className="row g-0 w-100">

                {/* ── Left: Background Slider ── */}
                <div className="col-lg-6 d-none d-lg-block position-relative" style={{ minHeight: '100vh', overflow: 'hidden' }}>
                    {bgImages.map((img, index) => (
                        <div
                            key={index}
                            style={{
                                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                                backgroundImage: `url(${img})`,
                                backgroundSize: 'cover', backgroundPosition: 'center',
                                opacity: index === currentBg ? 1 : 0,
                                transition: 'opacity 1.2s ease-in-out',
                            }}
                        />
                    ))}
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.58) 100%)' }} />
                    <div style={{ position: 'absolute', bottom: '60px', left: '48px', right: '48px', color: '#fff', zIndex: 2 }}>
                        <div style={{ fontSize: '2.6rem', marginBottom: '14px' }}>🌿</div>
                        <h2 style={{ fontWeight: 800, fontSize: '2rem', textShadow: '0 2px 14px rgba(0,0,0,0.5)', marginBottom: '12px', lineHeight: 1.2 }}>
                            Reserve Your Spot at Duyanan
                        </h2>
                        <p style={{ opacity: 0.88, fontSize: '1rem', lineHeight: 1.65, textShadow: '0 1px 4px rgba(0,0,0,0.4)', maxWidth: '380px' }}>
                            Book a table in our cozy al fresco garden, relaxing bamboo hammock gazebo, or air-cooled indoor fiesta hall.
                        </p>
                        {/* Ambiance preview dots */}
                        <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
                            {bgImages.map((_, i) => (
                                <div key={i} style={{ width: i === currentBg ? '24px' : '8px', height: '8px', borderRadius: '4px', background: i === currentBg ? 'var(--accent-orange)' : 'rgba(255,255,255,0.4)', transition: 'all 0.4s ease' }} />
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Right: Premium Form ── */}
                <div
                    className="col-12 col-lg-6 d-flex flex-column align-items-center justify-content-start py-4 px-3 px-sm-4"
                    style={{ background: 'var(--gradient-bg)', minHeight: '100vh', overflowY: 'auto' }}
                >
                    <div style={{ width: '100%', maxWidth: '480px', marginTop: 'calc(var(--nav-height) + 20px)', paddingBottom: '48px' }}>

                        {/* Header */}
                        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                            <div style={{ fontSize: '2.8rem', marginBottom: '8px', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.12))' }}>🍃</div>
                            <h2 style={{ color: 'var(--primary-brown)', fontWeight: 800, margin: 0, fontSize: 'clamp(1.5rem, 4vw, 2rem)' }}>
                                Book a Reservation
                            </h2>
                            <p style={{ color: '#777', marginTop: '8px', fontSize: '0.92rem' }}>
                                Choose your dining experience below
                            </p>
                        </div>

                        {/* Guest login banner */}
                        {!isAuthenticated && (
                            <div style={{
                                background: 'linear-gradient(90deg, #7B3F00, #D35400)',
                                color: '#fff', borderRadius: '14px',
                                padding: '14px 20px', marginBottom: '24px',
                                display: 'flex', alignItems: 'center', gap: '12px',
                                boxShadow: '0 4px 14px rgba(211,84,0,0.25)'
                            }}>
                                <i className="bi bi-shield-lock-fill" style={{ fontSize: '1.5rem', flexShrink: 0 }}></i>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>You&apos;re viewing as a guest</div>
                                    <div style={{ fontSize: '0.83rem', opacity: 0.9 }}>
                                        <a href="/login" style={{ color: '#ffd580', fontWeight: 700, textDecoration: 'underline' }}>Log in</a>
                                        {' '}or{' '}
                                        <a href="/register" style={{ color: '#ffd580', fontWeight: 700, textDecoration: 'underline' }}>Register</a>
                                        {' '}to make a reservation.
                                    </div>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>

                            {/* ── Visual Ambiance Selector ── */}
                            <div className="mb-4">
                                <label style={labelStyle}>🌿 Choose Your Atmosphere</label>
                                <div className="row g-2">
                                    {ambianceOptions.map(opt => (
                                        <div className="col-4" key={opt.value}>
                                            <div
                                                className={`ambiance-card${selectedAmbiance === opt.value ? ' selected' : ''}`}
                                                onClick={() => handleAmbianceSelect(opt.value)}
                                                role="button" tabIndex={0}
                                                onKeyDown={e => e.key === 'Enter' && handleAmbianceSelect(opt.value)}
                                                id={`ambiance-${opt.value}`}
                                            >
                                                <img src={opt.img} alt={opt.label} />
                                                <div className="ambiance-label">
                                                    <div style={{ fontSize: '1rem', marginBottom: '2px' }}>{opt.emoji}</div>
                                                    <div style={{ fontSize: '0.72rem', lineHeight: 1.2, fontWeight: 700 }}>{opt.label}</div>
                                                </div>
                                                <div className="ambiance-check">
                                                    <i className="bi bi-check2"></i>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {selectedAmbiance && (
                                    <p style={{ fontSize: '0.8rem', color: 'var(--accent-orange)', marginTop: '8px', fontWeight: 600, marginBottom: 0 }}>
                                        ✓ {ambianceOptions.find(a => a.value === selectedAmbiance)?.desc}
                                    </p>
                                )}
                            </div>

                            {/* ── Event Type ── */}
                            <div className="mb-4">
                                <label style={labelStyle}>🎉 Event Type</label>
                                <select name="eventType" value={formData.eventType} onChange={handleChange} required style={inputStyle} id="res-event-type">
                                    <option value="" disabled hidden>Select Event Type</option>
                                    <option value="Casual Dining 🍽️">Casual Dining 🍽️</option>
                                    <option value="Birthday Celebration 🎂">Birthday Celebration 🎂</option>
                                    <option value="Anniversary 💑">Anniversary 💑</option>
                                    <option value="Wedding / Reception 💍">Wedding / Reception 💍</option>
                                    <option value="Business Meeting 💼">Business Meeting 💼</option>
                                    <option value="Other Event 🎉">Other Event 🎉</option>
                                </select>
                            </div>

                            {/* ── Date ── */}
                            <div className="mb-4">
                                <label style={labelStyle}>📅 Date</label>
                                <input
                                    type="date" name="date" id="res-date"
                                    value={formData.date} onChange={handleChange} required
                                    min={new Date().toLocaleDateString('en-CA')}
                                    style={inputStyle}
                                />
                            </div>

                            {/* ── Time Slot Chips ── */}
                            <div className="mb-4">
                                <label style={labelStyle}>🕐 Preferred Time</label>
                                <div className="d-flex flex-wrap gap-2 mb-2">
                                    {timeSlots.map(slot => (
                                        <button
                                            type="button" key={slot}
                                            className={`time-slot-chip${selectedTimeSlot === slot ? ' active' : ''}`}
                                            onClick={() => handleTimeSlotSelect(slot)}
                                            id={`time-slot-${slot.replace(/[:\s]/g, '-')}`}
                                        >
                                            {slot}
                                        </button>
                                    ))}
                                </div>
                                <input
                                    type="time" name="time" id="res-time"
                                    value={formData.time}
                                    onChange={e => { setSelectedTimeSlot(''); handleChange(e); }}
                                    style={{ ...inputStyle, fontSize: '0.88rem', padding: '10px 14px' }}
                                />
                            </div>

                            {/* ── Guest Stepper ── */}
                            <div className="mb-4">
                                <label style={labelStyle}>👥 Number of Guests</label>
                                <div className="d-flex align-items-center gap-3">
                                    <div className="guest-stepper" id="guest-stepper">
                                        <button type="button" onClick={() => handleGuestChange(-1)} id="guest-dec">−</button>
                                        <span className="guest-count">{guestCount} {guestCount === 1 ? 'Guest' : 'Guests'}</span>
                                        <button type="button" onClick={() => handleGuestChange(1)} id="guest-inc">+</button>
                                    </div>
                                    <span style={{ color: '#999', fontSize: '0.82rem' }}>Max 30 guests</span>
                                </div>
                            </div>

                            {/* ── Special Request ── */}
                            <div className="mb-4">
                                <label style={labelStyle}>
                                    📝 Special Request{' '}
                                    <span style={{ color: '#aaa', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
                                </label>
                                <textarea
                                    name="request" id="res-request"
                                    value={formData.request} onChange={handleChange}
                                    rows="3"
                                    placeholder="e.g. Birthday decoration, dietary restrictions, high chair..."
                                    style={{ ...inputStyle, resize: 'none' }}
                                />
                            </div>

                            {/* ── Submit ── */}
                            <button
                                type="submit"
                                id="res-submit"
                                className="btn-brand w-100 justify-content-center shadow"
                                style={{
                                    padding: '14px 0', fontSize: '1.05rem',
                                    borderRadius: '14px', minHeight: '52px',
                                    opacity: isAuthenticated ? 1 : 0.72,
                                    cursor: isAuthenticated ? 'pointer' : 'not-allowed',
                                }}
                            >
                                {!isAuthenticated && <i className="bi bi-lock-fill"></i>}
                                <i className="bi bi-calendar2-check"></i>
                                {isAuthenticated ? 'Confirm Reservation' : 'Login to Reserve'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reservations;
