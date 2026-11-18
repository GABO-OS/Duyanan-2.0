import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const API_URL = import.meta.env.VITE_API_URL;

/* ─── Distance-Based Shipping Fee from Duyanan Restaurant (Sitio Hacienda, Brgy. Danlagan, Padre Burgos) ─── */
const PADRE_BURGOS_BARANGAYS = [
    // ₱30 — Zone 1: Nearest (~0–2 km from Sitio Hacienda, Brgy. Danlagan)
    { name: 'Danlagan', fee: 30, distance: '0–2 km', keywords: ['danlagan', 'hacienda', 'sitio hacienda'] },
    { name: 'Yawe', fee: 30, distance: '0–2 km', keywords: ['yawe'] },
    { name: 'Villapaz', fee: 30, distance: '0–2 km', keywords: ['villapaz', 'villa paz', 'vilapaz'] },

    // ₱50 — Zone 2: Mid-close (~2–5 km)
    { name: 'Walay', fee: 50, distance: '2–5 km', keywords: ['walay'] },
    { name: 'Rizal', fee: 50, distance: '2–5 km', keywords: ['rizal'] },
    { name: 'San Isidro', fee: 50, distance: '2–5 km', keywords: ['san isidro', 'isidro'] },
    { name: 'San Vicente', fee: 50, distance: '2–5 km', keywords: ['san vicente', 'vicente'] },
    { name: 'Marquez', fee: 50, distance: '2–5 km', keywords: ['marquez', 'marques'] },
    { name: 'Lipata', fee: 50, distance: '2–5 km', keywords: ['lipata'] },

    // ₱75 — Zone 3: Mid-far (~5–8 km)
    { name: 'Duhat', fee: 75, distance: '5–8 km', keywords: ['duhat'] },
    { name: 'Marao', fee: 75, distance: '5–8 km', keywords: ['marao'] },
    { name: 'Kinagunan Ibaba', fee: 75, distance: '5–8 km', keywords: ['kinagunan ibaba', 'kinagunan-ibaba'] },
    { name: 'Kinagunan Ilaya', fee: 75, distance: '5–8 km', keywords: ['kinagunan ilaya', 'kinagunan-ilaya', 'kinagunan'] },
    { name: 'Hinguiwin', fee: 75, distance: '5–8 km', keywords: ['hinguiwin', 'hingiwin'] },
    { name: 'Sipa', fee: 75, distance: '5–8 km', keywords: ['sipa'] },

    // ₱100 — Zone 4: Far & Poblacion (~8+ km)
    { name: 'Basiao (Poblacion)', fee: 100, distance: '8+ km', keywords: ['basiao'] },
    { name: 'Burgos (Poblacion)', fee: 100, distance: '8+ km', keywords: ['burgos poblacion', 'poblacion burgos', 'brgy burgos', 'brgy. burgos'] },
    { name: 'Campo (Poblacion)', fee: 100, distance: '8+ km', keywords: ['campo'] },
    { name: 'Punta (Poblacion)', fee: 100, distance: '8+ km', keywords: ['punta'] },
    { name: 'Poblacion', fee: 100, distance: '8+ km', keywords: ['poblacion', 'pob.'] },
    { name: 'Cabuyao Norte', fee: 100, distance: '8+ km', keywords: ['cabuyao norte', 'cabuyao-norte'] },
    { name: 'Cabuyao Sur', fee: 100, distance: '8+ km', keywords: ['cabuyao sur', 'cabuyao-sur', 'cabuyao'] },
    { name: 'Tulay Buhangin', fee: 100, distance: '8+ km', keywords: ['tulay buhangin', 'tulay-buhangin', 'tulay'] }
];

const detectDeliveryFee = (address) => {
    if (!address || typeof address !== 'string' || !address.trim()) {
        return { fee: 50, barangay: null, distance: null, matched: false };
    }
    const clean = address.toLowerCase();

    // 1. Check for specific barangays
    for (const b of PADRE_BURGOS_BARANGAYS) {
        for (const kw of b.keywords) {
            const regex = new RegExp(`(^|[^a-z0-9])${kw}([^a-z0-9]|$)`, 'i');
            if (regex.test(clean) || clean.includes(kw)) {
                return {
                    fee: b.fee,
                    barangay: b.name,
                    distance: b.distance,
                    matched: true
                };
            }
        }
    }

    // 2. If general Padre Burgos is present, default to standard 50
    if (clean.includes('padre burgos') || clean.includes('burgos')) {
        return { fee: 50, barangay: 'Padre Burgos (General)', distance: 'Estimated', matched: true };
    }

    return { fee: 50, barangay: null, distance: null, matched: false };
};

/* ─── Scoped Styles ─── */
const styles = `
    .cart-page { padding-top: calc(var(--nav-height) + 24px); padding-bottom: 60px; }

    /* Step indicator */
    .cart-steps { display: flex; align-items: center; justify-content: center; gap: 0; margin-bottom: 32px; width: 100%; max-width: 480px; margin-left: auto; margin-right: auto; padding: 0 8px; }
    .cart-step { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; font-weight: 600; color: #bbb; transition: color 0.3s; flex-shrink: 0; }
    .cart-step.active { color: var(--accent-orange); }
    .cart-step.done { color: #27ae60; }
    .cart-step-num { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
        font-size: 0.85rem; font-weight: 700; border: 2px solid #ddd; background: #fff; color: #bbb; transition: all 0.3s; flex-shrink: 0; }
    .cart-step.active .cart-step-num { border-color: var(--accent-orange); background: var(--accent-orange); color: #fff; box-shadow: 0 2px 12px rgba(211,84,0,0.25); }
    .cart-step.done .cart-step-num { border-color: #27ae60; background: #27ae60; color: #fff; }
    .cart-step-line { flex: 1 1 auto; max-width: 60px; min-width: 14px; height: 2px; background: #e0e0e0; margin: 0 6px; border-radius: 2px; }
    .cart-step-line.active { background: linear-gradient(90deg, var(--accent-orange), #e0e0e0); }
    .cart-step-line.done { background: #27ae60; }

    /* Item cards */
    .cart-item-card { background: #fff; border-radius: 16px; padding: 18px 20px; margin-bottom: 14px;
        box-shadow: 0 2px 12px rgba(0,0,0,0.04); border: 1px solid #f0ece8;
        transition: all 0.25s ease; animation: cartItemIn 0.35s ease-out both; position: relative; overflow: hidden; }
    .cart-item-card:hover { box-shadow: 0 4px 20px rgba(160,64,0,0.08); border-color: #e8ddd4; transform: translateY(-1px); }
    .cart-item-card::before { content: ''; position: absolute; top: 0; left: 0; width: 4px; height: 100%;
        background: linear-gradient(180deg, var(--accent-orange), var(--primary-brown)); border-radius: 4px 0 0 4px; opacity: 0; transition: opacity 0.3s; }
    .cart-item-card:hover::before { opacity: 1; }

    @keyframes cartItemIn {
        from { opacity: 0; transform: translateX(-12px); }
        to { opacity: 1; transform: translateX(0); }
    }

    .cart-item-img { width: 72px; height: 72px; object-fit: cover; border-radius: 12px; flex-shrink: 0;
        box-shadow: 0 2px 8px rgba(0,0,0,0.08); }

    /* Quantity stepper */
    .qty-stepper { display: inline-flex; align-items: center; gap: 0; border: 1.5px solid #e8e0d8; border-radius: 10px; overflow: hidden; background: #fdfbf9; }
    .qty-stepper button { width: 36px; height: 36px; border: none; background: transparent; color: var(--primary-brown);
        font-size: 1.1rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; -webkit-tap-highlight-color: transparent; }
    .qty-stepper button:hover { background: rgba(160,64,0,0.08); }
    .qty-stepper button:active { transform: scale(0.92); }
    .qty-stepper .qty-value { width: 36px; text-align: center; font-weight: 700; font-size: 0.92rem; color: var(--text-dark); 
        border-left: 1px solid #ede7e0; border-right: 1px solid #ede7e0; padding: 4px 0; }

    /* Remove button */
    .cart-remove-btn { width: 38px; height: 38px; border-radius: 10px; border: 1.5px solid #f5e5e5; background: #fff;
        color: #e74c3c; display: flex; align-items: center; justify-content: center; cursor: pointer;
        transition: all 0.25s ease; font-size: 0.95rem; -webkit-tap-highlight-color: transparent; }
    .cart-remove-btn:hover { background: #fdf0f0; border-color: #e74c3c; transform: scale(1.08); }

    /* Order summary card */
    .order-summary { background: #fff; border-radius: 20px; padding: 28px; border: 1px solid #f0ece8;
        box-shadow: 0 4px 24px rgba(0,0,0,0.06); position: sticky; top: calc(var(--nav-height) + 30px); }
    .summary-divider { height: 1px; background: linear-gradient(90deg, transparent, #e0d6cc, transparent); margin: 16px 0; }
    .summary-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; }
    .summary-row.total { padding: 12px 0 4px; }

    /* Checkout button */
    .checkout-btn { width: 100%; min-height: 48px; padding: 14px 20px; border: none; border-radius: 14px;
        background: linear-gradient(135deg, var(--accent-orange), var(--primary-brown));
        color: #fff; font-weight: 700; font-size: 1rem; cursor: pointer;
        transition: all 0.3s ease; box-shadow: 0 4px 16px rgba(160,64,0,0.2); position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center; }
    .checkout-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 24px rgba(160,64,0,0.3); }
    .checkout-btn:active { transform: translateY(0); }
    .checkout-btn::after { content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent); transition: left 0.5s; }
    .checkout-btn:hover::after { left: 100%; }

    .add-more-btn { width: 100%; min-height: 44px; padding: 12px 20px; border: 1.5px solid #e0d6cc; border-radius: 14px;
        background: transparent; color: var(--primary-brown); font-weight: 600; font-size: 0.92rem; cursor: pointer;
        transition: all 0.25s ease; margin-top: 10px; display: flex; align-items: center; justify-content: center; }
    .add-more-btn:hover { background: rgba(160,64,0,0.04); border-color: var(--accent-orange); }

    /* Clear cart button */
    .clear-cart-btn { background: none; border: none; color: #ccc; font-size: 0.78rem; font-weight: 600; cursor: pointer;
        transition: color 0.2s; padding: 6px 8px; min-height: 36px; }
    .clear-cart-btn:hover { color: #e74c3c; }

    /* Group meal badges */
    .gm-badge { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 6px;
        font-size: 0.7rem; font-weight: 600; }
    .gm-badge-people { background: #fef5e7; color: #b7791f; border: 1px solid #fdebd0; }
    .gm-badge-savings { background: #eafaf1; color: #1e8449; border: 1px solid #d5f5e3; }

    /* Empty cart */
    .empty-cart { min-height: 55vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px;
        animation: fadeUp 0.5s ease-out; }
    .empty-cart-icon { font-size: 4.5rem; opacity: 0.12; animation: floatBag 3s ease-in-out infinite; }
    @keyframes floatBag { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

    /* Price animation */
    .price-pop { animation: pricePop 0.3s ease; }
    @keyframes pricePop { 0% { transform: scale(1); } 50% { transform: scale(1.12); } 100% { transform: scale(1); } }

    /* Checkbox styles */
    .cart-checkbox { width: 22px; height: 22px; accent-color: var(--accent-orange); cursor: pointer; flex-shrink: 0;
        border-radius: 4px; margin-top: 2px; transition: transform 0.15s ease; }
    .cart-checkbox:hover { transform: scale(1.15); }
    .cart-checkbox:checked { animation: checkPop 0.25s ease; }
    @keyframes checkPop { 0% { transform: scale(1); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } }
    .cart-item-card.unselected { opacity: 0.55; }
    .cart-item-card.unselected:hover { opacity: 0.75; }
    .select-all-bar { display: flex; align-items: center; gap: 10px; padding: 10px 16px; background: #fdfbf9;
        border: 1.5px solid #f0ece8; border-radius: 12px; margin-bottom: 14px; }
    .select-all-bar label { font-size: 0.85rem; font-weight: 600; color: var(--primary-brown); cursor: pointer; user-select: none; margin: 0; }
    .selected-count-badge { font-size: 0.75rem; font-weight: 700; color: #fff; background: var(--accent-orange);
        padding: 2px 8px; border-radius: 20px; margin-left: auto; }

    /* Responsive */
    @media (max-width: 767px) {
        .cart-page { padding-top: calc(var(--nav-height) + 16px); padding-bottom: 40px; }
        .cart-item-card { padding: 14px 12px; }
        .cart-item-img { width: 60px; height: 60px; border-radius: 10px; }
        .order-summary { position: static; margin-top: 20px; padding: 20px 16px; }
        .cart-step span:not(.cart-step-num) { display: none; }
        .cart-step-line { width: 28px; max-width: 36px; min-width: 14px; margin: 0 4px; }
        .checkout-form-card { padding: 20px 16px; }
    }
    @media (max-width: 480px) {
        .payment-options, .fulfillment-options {
            grid-template-columns: 1fr;
        }
        .qty-stepper button { width: 36px; height: 36px; }
        .qty-stepper .qty-value { width: 32px; }
        .cart-remove-btn { width: 38px; height: 38px; }
        .cart-steps { margin-bottom: 24px; }
    }

    /* Step 2 Form styling */
    .checkout-form-card { background: #fff; border-radius: 18px; padding: 24px; border: 1px solid #f0ece8; box-shadow: 0 2px 12px rgba(0,0,0,0.04); }
    .form-group-custom { margin-bottom: 18px; }
    .form-group-custom label { font-size: 0.82rem; font-weight: 700; color: var(--primary-brown); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; display: block; }
    .form-group-custom input, .form-group-custom textarea, .form-group-custom select { width: 100%; padding: 12px 16px; border: 1.5px solid #e8e0d8; border-radius: 10px; font-size: 0.95rem; color: var(--text-dark); background: #fdfbf9; transition: all 0.25s ease; }
    .form-group-custom input:focus, .form-group-custom textarea:focus, .form-group-custom select:focus { border-color: var(--accent-orange); outline: none; background: #fff; box-shadow: 0 0 0 3px rgba(211,84,0,0.08); }
    
    /* Payment methods */
    .payment-options { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 8px; }
    .payment-option-card { border: 1.5px solid #e8e0d8; border-radius: 12px; padding: 14px; text-align: center; cursor: pointer; background: #fdfbf9; transition: all 0.2s; min-height: 48px; }
    .payment-option-card.selected { border-color: var(--accent-orange); background: rgba(211, 84, 0, 0.03); box-shadow: 0 2px 8px rgba(211,84,0,0.08); }
    .payment-option-card i { font-size: 1.4rem; color: var(--accent-orange); display: block; margin-bottom: 4px; }
    .payment-option-card span { font-size: 0.88rem; font-weight: 600; color: var(--primary-brown); }

    /* Fulfillment (Delivery / Pick-Up) toggle */
    .fulfillment-options { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 8px; }
    .fulfillment-option-card { border: 1.5px solid #e8e0d8; border-radius: 14px; padding: 18px 14px; text-align: center; cursor: pointer; background: #fdfbf9; transition: all 0.25s; min-height: 48px; }
    .fulfillment-option-card.selected { border-color: var(--accent-orange); background: rgba(211, 84, 0, 0.04); box-shadow: 0 3px 14px rgba(211,84,0,0.12); }
    .fulfillment-option-card.disabled { opacity: 0.38; cursor: not-allowed; pointer-events: none; }
    .fulfillment-option-card i { font-size: 1.8rem; color: var(--accent-orange); display: block; margin-bottom: 6px; }
    .fulfillment-option-card .fc-title { font-size: 0.9rem; font-weight: 700; color: var(--primary-brown); display: block; }
    .fulfillment-option-card .fc-sub { font-size: 0.72rem; color: #aaa; display: block; margin-top: 2px; }
    .delivery-area-notice { border-radius: 12px; padding: 12px 16px; font-size: 0.82rem; display: flex; align-items: flex-start; gap: 10px; margin-top: 10px; line-height: 1.5; }
    .delivery-area-notice.ineligible { background: #fff8f0; border: 1.5px solid #fde4c2; color: #a04000; }
    .delivery-area-notice.eligible { background: #f0fff6; border: 1.5px solid #b7e4c7; color: #1a7a3e; }

    /* Success Card */
    .success-card { background: #fff; border-radius: 24px; padding: 32px 20px; border: 1px solid #f0ece8; box-shadow: 0 4px 24px rgba(0,0,0,0.06); text-align: center; max-width: 600px; margin: 0 auto; animation: successFadeUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); }
    .success-icon-container { width: 76px; height: 76px; border-radius: 50%; background: rgba(39, 174, 96, 0.1); color: #27ae60; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 2.2rem; animation: popCheck 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both; }
    
    @keyframes successFadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes popCheck { 0% { transform: scale(0); } 100% { transform: scale(1); } }

    .receipt-box { background: #fdfbf9; border: 1px dashed #e8dcd0; border-radius: 14px; padding: 18px 14px; text-align: left; margin: 20px 0; }
    .receipt-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid rgba(160,64,0,0.04); font-size: 0.88rem; }
    .receipt-row:last-child { border-bottom: none; }
    .receipt-total { border-top: 1.5px solid #e8dcd0; padding-top: 10px; margin-top: 10px; font-weight: 700; font-size: 1.05rem; }

    /* GCash Payment Styles */
    .gcash-card {
        background: linear-gradient(135deg, #f0f7ff 0%, #e6f2ff 100%);
        border: 1.5px solid #b8daff;
        border-radius: 16px;
        padding: 20px;
        margin-top: 16px;
        box-shadow: 0 4px 18px rgba(0, 125, 254, 0.08);
        animation: cartItemIn 0.35s ease-out both;
    }
    .gcash-badge {
        background: #007dfe;
        color: #fff;
        font-weight: 800;
        font-size: 0.82rem;
        padding: 5px 14px;
        border-radius: 50px;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        box-shadow: 0 2px 8px rgba(0, 125, 254, 0.25);
    }
    .gcash-info-box {
        background: #ffffff;
        border: 1px solid #cce5ff;
        border-radius: 12px;
        padding: 14px 16px;
        margin-bottom: 14px;
    }
    .gcash-qr-box {
        background: #ffffff;
        border: 2px dashed #99c9ff;
        border-radius: 16px;
        padding: 16px;
        text-align: center;
        margin-bottom: 18px;
    }
    .proof-upload-area {
        border: 2px dashed #007dfe;
        border-radius: 14px;
        background: #ffffff;
        padding: 22px 16px;
        text-align: center;
        cursor: pointer;
        transition: all 0.25s ease;
    }
    .proof-upload-area:hover {
        background: #f4f9ff;
        border-color: #0056b3;
        transform: translateY(-1px);
    }
    .proof-preview-banner {
        background: #ffffff;
        border: 1.5px solid #28a745;
        border-radius: 14px;
        padding: 14px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        box-shadow: 0 4px 14px rgba(40, 167, 69, 0.1);
    }
    .copy-pill {
        cursor: pointer;
        background: #e7f3ff;
        border: 1px solid #b8daff;
        color: #0062cc;
        border-radius: 8px;
        padding: 3px 10px;
        font-size: 0.75rem;
        font-weight: 700;
        transition: all 0.2s;
    }
    .copy-pill:hover {
        background: #007dfe;
        color: #fff;
    }

    /* Auto-detected Delivery Fee Badge */
    .delivery-fee-badge-box {
        background: #fdfbf9;
        border: 1.5px solid #e8e0d8;
        border-radius: 12px;
        padding: 12px 16px;
        transition: all 0.25s ease;
    }
    .delivery-fee-badge-box.matched {
        background: #f0fff6;
        border-color: #a3e6b7;
    }
    .delivery-fee-pill {
        background: #fff3e0;
        color: var(--accent-orange);
        border: 1.5px solid #ffe0b2;
        border-radius: 8px;
        padding: 4px 12px;
        display: inline-flex;
        align-items: center;
        flex-shrink: 0;
    }
    .delivery-fee-badge-box.matched .delivery-fee-pill {
        background: #e6f9ed;
        color: #1e8449;
        border-color: #b7e4c7;
    } border: 1.5px solid #fde4c2; border-radius: 10px;
        padding: 10px 14px; font-size: 0.8rem; color: #a04000; display: flex; align-items: center; gap: 8px; margin-top: 8px; }
`;

/* ─── Format Group Meal JSON ─── */
const formatDescription = (desc) => {
    if (!desc) return null;
    try {
        const parsed = JSON.parse(desc);
        if (parsed && typeof parsed === 'object' && parsed.inclusions) {
            const items = parsed.inclusions
                .split(/\\n|\n/)
                .map(s => s.trim())
                .filter(Boolean);
            return (
                <div style={{ marginTop: 6 }}>
                    <div style={{ fontSize: '0.75rem', color: '#888', lineHeight: 1.6 }}>
                        {items.map((item, i) => (
                            <span key={i}>{item}{i < items.length - 1 ? ', ' : ''}</span>
                        ))}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                        {parsed.goodFor && (
                            <span className="gm-badge gm-badge-people">👥 Good for {parsed.goodFor}</span>
                        )}
                        {parsed.savings > 0 && (
                            <span className="gm-badge gm-badge-savings">💰 Save ₱{parsed.savings}</span>
                        )}
                    </div>
                </div>
            );
        }
    } catch (e) { /* not JSON */ }
    return <div style={{ fontSize: '0.75rem', color: '#999', marginTop: 4 }}>{desc}</div>;
};

const CartPage = () => {
    const { cart, addToCart, removeFromCart, updateQuantity, clearCart, reservationId, clearReservationLink } = useCart();
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [step, setStep] = useState(1);
    const [checkoutForm, setCheckoutForm] = useState({
        recipientName: '',
        contactNumber: '',
        deliveryAddress: '',
        paymentMethod: 'COD', // COD or GCASH
        notes: ''
    });
    const [orderResult, setOrderResult] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [fulfillmentMethod, setFulfillmentMethod] = useState('DELIVERY'); // 'DELIVERY' or 'PICKUP'
    const [isEligibleForDelivery, setIsEligibleForDelivery] = useState(false);
    // Auto-calculated delivery fee based on customer address
    const deliveryFeeInfo = React.useMemo(() => {
        if (fulfillmentMethod !== 'DELIVERY' || reservationId) {
            return { fee: 0, barangay: null, distance: null, matched: false };
        }
        return detectDeliveryFee(checkoutForm.deliveryAddress);
    }, [fulfillmentMethod, reservationId, checkoutForm.deliveryAddress]);

    // ── GCash Payment & Receipt Proof State ──
    const [paymentProofFile, setPaymentProofFile] = useState(null);
    const [paymentProofPreview, setPaymentProofPreview] = useState('');
    const [paymentProofReference, setPaymentProofReference] = useState('');
    const [viewingReceipt, setViewingReceipt] = useState(null);

    const handleReceiptFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            Swal.fire({
                icon: 'error',
                title: 'Invalid File',
                text: 'Please select an image file (PNG, JPG, JPEG, WEBP) for your GCash receipt screenshot.',
                confirmButtonColor: '#007DFE'
            });
            return;
        }

        // Limit size to 10MB
        if (file.size > 10 * 1024 * 1024) {
            Swal.fire({
                icon: 'error',
                title: 'File Too Large',
                text: 'The selected image is too large. Please select a file smaller than 10MB.',
                confirmButtonColor: '#007DFE'
            });
            return;
        }

        setPaymentProofFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setPaymentProofPreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveReceipt = () => {
        setPaymentProofFile(null);
        setPaymentProofPreview('');
    };

    const handleCopyText = (text, label) => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text);
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: `${label} copied!`,
                showConfirmButton: false,
                timer: 1800
            });
        }
    };

    // ── Item selection state (checkboxes) ──
    const [selectedItems, setSelectedItems] = useState(() => {
        // Default: all items selected
        return new Set(cart.map(item => item.cartItemId));
    });

    // Keep selectedItems in sync when cart changes (items added/removed externally)
    React.useEffect(() => {
        setSelectedItems(prev => {
            const cartIds = new Set(cart.map(item => item.cartItemId));
            const updated = new Set();
            // Keep existing selections that are still in cart
            for (const id of prev) {
                if (cartIds.has(id)) updated.add(id);
            }
            // Auto-select newly added items
            for (const id of cartIds) {
                if (!prev.has(id) && prev.size > 0) updated.add(id);
                else if (prev.size === 0) updated.add(id);
            }
            return updated;
        });
    }, [cart]);

    const toggleItem = (cartItemId) => {
        setSelectedItems(prev => {
            const next = new Set(prev);
            if (next.has(cartItemId)) next.delete(cartItemId);
            else next.add(cartItemId);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedItems.size === cart.length) {
            setSelectedItems(new Set());
        } else {
            setSelectedItems(new Set(cart.map(item => item.cartItemId)));
        }
    };

    const isAllSelected = cart.length > 0 && selectedItems.size === cart.length;
    const selectedCart = cart.filter(item => selectedItems.has(item.cartItemId));

    React.useEffect(() => {
        if (reservationId) {
            fetch(`${API_URL}/api/reservations/${reservationId}`)
                .then(res => {
                    if (!res.ok) return null;
                    return res.json();
                })
                .then(data => {
                    if (data && data.status) {
                        if (data.status === 'CONFIRMED') {
                            clearReservationLink();
                            Swal.fire({
                                icon: 'info',
                                title: 'Pre-Order Unavailable',
                                text: `Reservation #${reservationId} has been confirmed by the admin. Pre-ordering is no longer available. Your cart has been switched to regular checkout.`,
                                confirmButtonColor: '#A04000'
                            });
                        } else if (data.status !== 'PENDING') {
                            clearReservationLink();
                        }
                    }
                })
                .catch(err => console.error("Error validating reservation pre-order:", err));
        }
    }, [reservationId]);

    // Totals are computed from SELECTED items only
    const itemCount = selectedCart.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = selectedCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const isDeliveryOrder = !reservationId && fulfillmentMethod === 'DELIVERY';
    const appliedShipping = isDeliveryOrder ? deliveryFeeInfo.fee : 0;
    const grandTotal = subtotal + appliedShipping;
    // Keep 'total' as an alias for grandTotal so existing code stays compatible
    const total = grandTotal;
    const cartTotalCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    const handleIncrement = (item) => {
        updateQuantity(item.cartItemId, item.quantity + 1);
    };

    const handleDecrement = (item) => {
        updateQuantity(item.cartItemId, item.quantity - 1);
    };

    const handleClearCart = async () => {
        const result = await Swal.fire({
            title: 'Clear Cart?',
            text: 'This will remove all items from your cart.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e74c3c',
            cancelButtonColor: '#999',
            confirmButtonText: 'Yes, clear it'
        });
        if (result.isConfirmed) clearCart();
    };

    const handleProceedToCheckout = () => {
        if (selectedCart.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'No Items Selected',
                text: 'Please select at least one item to checkout.',
                confirmButtonColor: '#A04000'
            });
            return;
        }
        if (!isAuthenticated) {
            Swal.fire({
                icon: 'info',
                title: 'Sign In Required to Order',
                text: 'You can build and view your order as a guest, but an account is required to place and complete your order.',
                showCancelButton: true,
                confirmButtonText: 'Log In',
                cancelButtonText: 'Register',
                confirmButtonColor: 'var(--primary-brown)',
                cancelButtonColor: 'var(--accent-orange)'
            }).then((result) => {
                if (result.isConfirmed) {
                    navigate('/login');
                } else if (result.dismiss === Swal.DismissReason.cancel) {
                    navigate('/register');
                }
            });
            return;
        }
        
        // Fetch user profile to prefill the checkout form
        if (user?.token) {
            setLoadingProfile(true);
            fetch(`${API_URL}/api/auth/me`, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            })
            .then(res => {
                if (!res.ok) throw new Error("Failed to fetch profile");
                return res.json();
            })
            .then(data => {
                const eligible = (data.address || '').toLowerCase().includes('padre burgos');
                setIsEligibleForDelivery(eligible);
                setFulfillmentMethod(eligible ? 'DELIVERY' : 'PICKUP');
                setCheckoutForm(prev => ({
                    ...prev,
                    recipientName: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
                    contactNumber: data.phone || '',
                    deliveryAddress: reservationId ? `Dine-In (Pre-Order for Reservation #${reservationId})` : (data.address || '')
                }));
            })
            .catch(err => {
                console.error("Error fetching user profile for checkout:", err);
            })
            .finally(() => {
                setLoadingProfile(false);
                setStep(2);
            });
        } else {
            setCheckoutForm(prev => ({
                ...prev,
                deliveryAddress: reservationId ? `Dine-In (Pre-Order for Reservation #${reservationId})` : prev.deliveryAddress
            }));
            setStep(2);
        }
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setCheckoutForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectPayment = (method) => {
        setCheckoutForm(prev => ({ ...prev, paymentMethod: method }));
    };

    const handlePlaceOrder = async () => {
        if (selectedCart.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'No Items Selected',
                text: 'Please go back and select items to checkout.',
                confirmButtonColor: '#A04000'
            });
            return;
        }
        const needsAddress = !reservationId && fulfillmentMethod === 'DELIVERY';
        if (!checkoutForm.recipientName || !checkoutForm.contactNumber || (needsAddress && !checkoutForm.deliveryAddress)) {
            Swal.fire({
                icon: 'warning',
                title: 'Required Fields',
                text: needsAddress
                    ? 'Please fill in your name, contact number, and delivery address.'
                    : 'Please fill in your name and contact number.',
                confirmButtonColor: '#A04000'
            });
            return;
        }



        // Validate GCash Receipt upload
        if (checkoutForm.paymentMethod === 'GCASH' && !paymentProofFile) {
            Swal.fire({
                icon: 'warning',
                title: 'GCash Receipt Required',
                html: `<div style="font-size:0.95rem; line-height:1.5;">Please transfer <b>₱${grandTotal.toFixed(2)}</b> to the GCash details provided and upload your receipt screenshot before placing the order.</div>`,
                confirmButtonColor: '#007DFE',
                confirmButtonText: '<i class="bi bi-upload me-1"></i> Upload Receipt Now'
            });
            return;
        }

        const result = await Swal.fire({
            title: 'Place Order?',
            html: `<div style="font-size:0.95rem">Confirm order for <b>${itemCount} item${itemCount !== 1 ? 's' : ''}</b>${appliedShipping > 0 ? ` + <b style="color:#27ae60">₱${appliedShipping.toFixed(0)} shipping</b>` : ''} totaling <b style="color:#a04000">₱${grandTotal.toFixed(2)}</b> via <b>${checkoutForm.paymentMethod === 'COD' ? 'Cash on Delivery' : 'G-Cash'}</b>?</div>`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#A04000',
            cancelButtonColor: '#999',
            confirmButtonText: '<i class="bi bi-check-lg me-1"></i> Yes, Place Order'
        });

        if (result.isConfirmed) {
            setIsCheckingOut(true);
            try {
                // 1. Upload payment proof if GCash was selected
                let uploadedProofUrl = null;
                if (checkoutForm.paymentMethod === 'GCASH' && paymentProofFile) {
                    const formData = new FormData();
                    formData.append('image', paymentProofFile);
                    const uploadRes = await fetch(`${API_URL}/api/orders/upload-proof`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${user.token}`
                        },
                        body: formData
                    });

                    if (!uploadRes.ok) {
                        const errData = await uploadRes.json().catch(() => ({}));
                        throw new Error(errData.error || 'Failed to upload receipt screenshot. Please try again.');
                    }
                    const uploadJson = await uploadRes.json();
                    uploadedProofUrl = uploadJson.imageUrl;
                }

                const isDineIn = !!reservationId;
                const isPickup = !isDineIn && fulfillmentMethod === 'PICKUP';
                const addressOrType = isDineIn
                    ? `Dine-In (Pre-order for Reservation #${reservationId})`
                    : isPickup ? 'Pick-Up at Duyanan Restaurant' : checkoutForm.deliveryAddress;
                const paymentLabel = checkoutForm.paymentMethod === 'COD' 
                    ? (isDineIn ? 'Pay at Restaurant' : 'Cash on Delivery') 
                    : 'G-Cash';

                const combinedNotes = isDineIn
                    ? `ORDER TYPE: DINE-IN (Reservation #${reservationId}) | Guest: ${checkoutForm.recipientName} | Contact: ${checkoutForm.contactNumber} | Payment: ${paymentLabel} | Notes: ${checkoutForm.notes || 'None'}`
                    : isPickup
                        ? `ORDER TYPE: PICK-UP | Recipient: ${checkoutForm.recipientName} | Contact: ${checkoutForm.contactNumber} | Payment: ${paymentLabel} | Notes: ${checkoutForm.notes || 'None'}`
                        : `ORDER TYPE: DELIVERY | Recipient: ${checkoutForm.recipientName} | Contact: ${checkoutForm.contactNumber} | Address: ${checkoutForm.deliveryAddress} | Payment: ${paymentLabel} | Notes: ${checkoutForm.notes || 'None'}`;
                
                const response = await fetch(`${API_URL}/api/orders`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${user.token}`
                    },
                    body: JSON.stringify({
                        reservationId: reservationId ? parseInt(reservationId, 10) : null,
                        orderType: isDineIn ? "DINE_IN" : fulfillmentMethod,
                        paymentMethod: checkoutForm.paymentMethod,
                        paymentProofImage: uploadedProofUrl,
                        paymentReference: paymentProofReference ? paymentProofReference.trim() : null,
                        shippingFee: isDeliveryOrder ? appliedShipping : 0,
                        deliveryZone: isDeliveryOrder ? (deliveryFeeInfo.barangay ? `Brgy. ${deliveryFeeInfo.barangay} (₱${appliedShipping})` : 'Padre Burgos') : null,
                        notes: combinedNotes,
                        items: selectedCart.map(item => ({
                            productId: item.id,
                            quantity: item.quantity,
                            variant: item.variant,
                            price: item.price
                        }))
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    setOrderResult({
                        id: data.id || data.orderId || 'N/A',
                        total: grandTotal,
                        subtotal: subtotal,
                        shippingFee: appliedShipping,
                        deliveryZone: isDeliveryOrder ? (deliveryFeeInfo.barangay ? `Brgy. ${deliveryFeeInfo.barangay}` : 'Padre Burgos') : null,
                        recipientName: checkoutForm.recipientName,
                        deliveryAddress: addressOrType,
                        paymentMethod: checkoutForm.paymentMethod,
                        paymentStatus: checkoutForm.paymentMethod === 'GCASH' ? 'PENDING_VERIFICATION' : 'UNPAID',
                        paymentProofImage: uploadedProofUrl,
                        paymentReference: paymentProofReference ? paymentProofReference.trim() : null,
                        isDineIn: isDineIn,
                        isPickup: isPickup,
                        reservationId: reservationId
                    });
                    
                    Swal.fire({
                        icon: 'success',
                        title: checkoutForm.paymentMethod === 'GCASH' ? 'Proof Uploaded & Order Placed! 💳' : (isDineIn ? 'Pre-Order Placed! 🍽️' : 'Order Placed! 🎉'),
                        text: checkoutForm.paymentMethod === 'GCASH'
                            ? 'Your GCash receipt has been uploaded and will be verified by the admin shortly!'
                            : (isDineIn
                                ? 'Your pre-ordered food is confirmed and will be prepared for your reserved table!'
                                : isPickup
                                    ? 'Your order is confirmed! Please pick it up at Duyanan Restaurant when ready.'
                                    : 'Your delicious meal is being prepared and will be delivered shortly.'),
                        confirmButtonColor: '#A04000',
                        timer: 3500
                    });

                    // Only remove the selected/checked-out items from cart, keep the rest
                    selectedCart.forEach(item => removeFromCart(item.cartItemId));
                    setSelectedItems(new Set());
                    setStep(3);
                } else {
                    if (data.error && (data.error.includes('confirmed') || data.error.includes('Pre-ordering'))) {
                        clearReservationLink();
                    }
                    Swal.fire({
                        icon: 'error',
                        title: 'Order Failed',
                        text: data.error || 'There was a problem placing your order.',
                        confirmButtonColor: '#A04000'
                    });
                }
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Checkout Error',
                    text: 'Could not reach the server. Please try again later.',
                    confirmButtonColor: '#A04000'
                });
            }
            setIsCheckingOut(false);
        }
    };

    /* ─── Empty Cart State ─── */
    if (cart.length === 0) {
        return (
            <>
                <style>{styles}</style>
                <div className="container cart-page">
                    <div className="empty-cart">
                        <div className="empty-cart-icon">🛒</div>
                        <h3 style={{ color: 'var(--primary-brown)', fontWeight: 700, marginBottom: 4 }}>Your cart is empty</h3>
                        <p style={{ color: '#999', fontSize: '0.95rem', maxWidth: 340, textAlign: 'center', lineHeight: 1.5 }}>
                            Looks like you haven't added any delicious meals yet. Explore our menu and find something you'll love!
                        </p>
                        <Link to="/menu" className="checkout-btn" style={{ width: 'auto', padding: '12px 36px', display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
                            <i className="bi bi-card-list"></i> Browse Menu
                        </Link>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <style>{styles}</style>
            <div className="container cart-page">

                {/* ─── Step Progress ─── */}
                <div className="cart-steps">
                    <div className={`cart-step ${step === 1 ? 'active' : step > 1 ? 'done' : ''}`}>
                        <span className="cart-step-num">{step > 1 ? <i className="bi bi-check-lg"></i> : '1'}</span>
                        <span>Review Order</span>
                    </div>
                    <div className={`cart-step-line ${step > 1 ? 'done' : ''}`}></div>
                    <div className={`cart-step ${step === 2 ? 'active' : step > 2 ? 'done' : ''}`}>
                        <span className="cart-step-num">{step > 2 ? <i className="bi bi-check-lg"></i> : '2'}</span>
                        <span>Checkout</span>
                    </div>
                    <div className={`cart-step-line ${step > 2 ? 'done' : ''}`}></div>
                    <div className={`cart-step ${step === 3 ? 'active' : ''}`}>
                        <span className="cart-step-num">3</span>
                        <span>Order Confirmed</span>
                    </div>
                </div>

                <div className="row g-4">
                    {step === 1 && (
                        <>
                            {/* ─── Left: Cart Items ─── */}
                            <div className="col-lg-8">
                                {reservationId && (
                                    <div style={{
                                        background: 'linear-gradient(135deg, #fff3cd, #ffe8a1)',
                                        border: '1.5px solid #ffeba2',
                                        borderRadius: '14px',
                                        padding: '14px 20px',
                                        marginBottom: '20px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        color: '#856404',
                                        boxShadow: '0 2px 10px rgba(0,0,0,0.04)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <span style={{ fontSize: '1.5rem' }}>🍽️</span>
                                            <div>
                                                <strong style={{ fontSize: '0.95rem', display: 'block' }}>Pre-ordering for Reservation #{reservationId}</strong>
                                                <span style={{ fontSize: '0.82rem', opacity: 0.9 }}>This order will be linked to your reservation.</span>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={clearReservationLink}
                                            style={{
                                                background: 'rgba(133, 100, 4, 0.1)',
                                                border: '1px solid rgba(133, 100, 4, 0.2)',
                                                borderRadius: '8px',
                                                color: '#856404',
                                                fontSize: '0.78rem',
                                                fontWeight: 700,
                                                padding: '6px 12px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Unlink
                                        </button>
                                    </div>
                                )}

                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h4 style={{ color: 'var(--primary-brown)', fontWeight: 700, margin: 0 }}>
                                        <i className="bi bi-bag-check me-2" style={{ opacity: 0.6 }}></i>
                                        Your Order
                                        <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#aaa', marginLeft: 8 }}>
                                            ({cartTotalCount} {cartTotalCount === 1 ? 'item' : 'items'})
                                        </span>
                                    </h4>
                                    <button className="clear-cart-btn" onClick={handleClearCart}>
                                        <i className="bi bi-trash3 me-1"></i> Clear All
                                    </button>
                                </div>

                                {/* Select All Bar */}
                                <div className="select-all-bar">
                                    <input
                                        type="checkbox"
                                        className="cart-checkbox"
                                        id="select-all-checkbox"
                                        checked={isAllSelected}
                                        onChange={toggleSelectAll}
                                    />
                                    <label htmlFor="select-all-checkbox">
                                        {isAllSelected ? 'Deselect All' : 'Select All'}
                                    </label>
                                    {selectedItems.size > 0 && selectedItems.size < cart.length && (
                                        <span className="selected-count-badge">
                                            {selectedItems.size} of {cart.length} selected
                                        </span>
                                    )}
                                    {selectedItems.size === cart.length && (
                                        <span className="selected-count-badge">
                                            All selected
                                        </span>
                                    )}
                                </div>

                                {cart.map((item, index) => (
                                    <div className={`cart-item-card ${!selectedItems.has(item.cartItemId) ? 'unselected' : ''}`} key={item.cartItemId} style={{ animationDelay: `${index * 0.06}s` }}>
                                        <div className="d-flex align-items-start gap-3">
                                            <input
                                                type="checkbox"
                                                className="cart-checkbox"
                                                checked={selectedItems.has(item.cartItemId)}
                                                onChange={() => toggleItem(item.cartItemId)}
                                                title={selectedItems.has(item.cartItemId) ? 'Deselect item' : 'Select item for checkout'}
                                            />
                                            <img 
                                                src={item.imageUrl || 'https://placehold.co/72x72/f5ebe0/a04000?text=🍽️'} 
                                                alt={item.name} 
                                                className="cart-item-img" 
                                            />
                                            <div className="flex-grow-1" style={{ minWidth: 0 }}>
                                                <div className="d-flex justify-content-between align-items-start">
                                                    <div style={{ minWidth: 0, flex: 1 }}>
                                                        <h6 style={{ fontWeight: 700, color: '#2c2c2c', margin: 0, fontSize: '0.95rem' }}>
                                                            {item.name}
                                                        </h6>
                                                        {item.variant && (
                                                            <span style={{ fontSize: '0.75rem', color: 'var(--accent-orange)', fontWeight: 600 }}>
                                                                {item.variant}
                                                            </span>
                                                        )}
                                                        {formatDescription(item.description)}
                                                    </div>
                                                    <button 
                                                        className="cart-remove-btn ms-2 flex-shrink-0" 
                                                        onClick={() => removeFromCart(item.cartItemId)} 
                                                        title="Remove item"
                                                    >
                                                        <i className="bi bi-trash3"></i>
                                                    </button>
                                                </div>

                                                {/* Bottom: Price + Qty */}
                                                <div className="d-flex justify-content-between align-items-center mt-3">
                                                    <div className="qty-stepper">
                                                        <button 
                                                            onClick={() => handleDecrement(item)}
                                                            title={item.quantity <= 1 ? "Remove item" : "Decrease quantity"}
                                                        >
                                                            {item.quantity <= 1 ? <i className="bi bi-trash3" style={{ fontSize: '0.75rem', color: '#e74c3c' }}></i> : '−'}
                                                        </button>
                                                        <span className="qty-value">{item.quantity}</span>
                                                        <button onClick={() => handleIncrement(item)} title="Increase quantity">+</button>
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary-brown)' }}>
                                                            ₱{(item.price * item.quantity).toFixed(2)}
                                                        </div>
                                                        {item.quantity > 1 && (
                                                            <div style={{ fontSize: '0.72rem', color: '#bbb' }}>
                                                                ₱{item.price.toFixed(2)} each
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* ─── Right: Order Summary ─── */}
                            <div className="col-lg-4">
                                <div className="order-summary">
                                    <h5 style={{ fontWeight: 700, color: 'var(--primary-brown)', marginBottom: 20 }}>
                                        <i className="bi bi-receipt me-2" style={{ opacity: 0.5 }}></i>
                                        Order Summary
                                    </h5>

                                    <div className="summary-row">
                                        <span style={{ color: '#888', fontSize: '0.9rem' }}>Selected ({itemCount} of {cartTotalCount})</span>
                                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>₱{total.toFixed(2)}</span>
                                    </div>
                                    <div className="summary-row">
                                        <span style={{ color: '#888', fontSize: '0.9rem' }}>{reservationId ? 'Order Type' : 'Fulfillment'}</span>
                                        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#27ae60' }}>
                                            {reservationId ? 'Dine-In 🍽️' : fulfillmentMethod === 'PICKUP' ? '🏃 Pick-Up' : '🚚 Delivery'}
                                        </span>
                                    </div>

                                    <div className="summary-divider"></div>

                                    <div className="summary-row total">
                                        <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#333' }}>Total</span>
                                        <span style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--primary-brown)' }}>
                                            ₱{total.toFixed(2)}
                                        </span>
                                    </div>

                                    <div className="summary-divider"></div>

                                    <button 
                                        className="checkout-btn" 
                                        onClick={handleProceedToCheckout}
                                        disabled={loadingProfile || selectedItems.size === 0}
                                        style={selectedItems.size === 0 ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                                    >
                                        {loadingProfile ? (
                                            <><span className="spinner-border spinner-border-sm me-2"></span> Loading...</>
                                        ) : (
                                            <><i className="bi bi-arrow-right-circle me-2"></i> Proceed to Checkout</>
                                        )}
                                    </button>

                                    <Link to="/menu" className="add-more-btn text-center d-block" style={{ textDecoration: 'none' }}>
                                        <i className="bi bi-plus-lg me-1"></i> Add More Items
                                    </Link>

                                    {/* Trust badges */}
                                    <div className="text-center mt-4" style={{ opacity: 0.4 }}>
                                        <div style={{ fontSize: '0.72rem', color: '#999', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                                            <span><i className="bi bi-shield-check me-1"></i>Secure</span>
                                            <span>•</span>
                                            <span><i className="bi bi-clock me-1"></i>Fast Prep</span>
                                            <span>•</span>
                                            <span><i className="bi bi-heart me-1"></i>Fresh</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            {/* ─── Left: Checkout Details ─── */}
                            <div className="col-lg-8">
                                <div className="checkout-form-card">
                                    <h5 style={{ fontWeight: 700, color: 'var(--primary-brown)', marginBottom: 20 }}>
                                        <i className={`bi ${reservationId ? 'bi-shop' : 'bi-truck'} me-2`} style={{ opacity: 0.6 }}></i>
                                        {reservationId ? `Dine-In Pre-Order Details (Reservation #${reservationId})` : 'Delivery & Recipient Details'}
                                    </h5>
                                    
                                    <div className="form-group-custom">
                                        <label>Guest / Contact Full Name <span className="text-danger">*</span></label>
                                        <input 
                                            type="text" 
                                            name="recipientName"
                                            value={checkoutForm.recipientName}
                                            onChange={handleFormChange}
                                            placeholder="Enter full name"
                                            required
                                        />
                                    </div>

                                    <div className="form-group-custom">
                                        <label>Contact Number <span className="text-danger">*</span></label>
                                        <input 
                                            type="text" 
                                            name="contactNumber"
                                            value={checkoutForm.contactNumber}
                                            onChange={handleFormChange}
                                            placeholder="e.g. 09123456789"
                                            required
                                        />
                                    </div>

                                    {reservationId ? (
                                        <div className="form-group-custom">
                                            <label>Order Type & Table Location</label>
                                            <div style={{ background: '#fff9e6', border: '1.5px solid #ffe8a1', borderRadius: '12px', padding: '14px 18px', color: '#856404' }}>
                                                <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <span>🍽️ Dine-In Pre-Order</span>
                                                    <span className="badge bg-warning text-dark border">Reservation #{reservationId}</span>
                                                </div>
                                                <div style={{ fontSize: '0.82rem', marginTop: 4, opacity: 0.9 }}>
                                                    Your ordered dishes will be prepared fresh and served directly at your reserved table upon arrival!
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {/* ── Fulfillment Method Toggle ── */}
                                            <div className="form-group-custom">
                                                <label>Fulfillment Method <span className="text-danger">*</span></label>
                                                <div className="fulfillment-options">
                                                    <div
                                                        id="fulfillment-delivery"
                                                        className={`fulfillment-option-card ${fulfillmentMethod === 'DELIVERY' ? 'selected' : ''} ${!isEligibleForDelivery ? 'disabled' : ''}`}
                                                        onClick={() => isEligibleForDelivery && setFulfillmentMethod('DELIVERY')}
                                                    >
                                                        <i className="bi bi-truck"></i>
                                                        <span className="fc-title">Delivery</span>
                                                        <span className="fc-sub">To your door</span>
                                                    </div>
                                                    <div
                                                        id="fulfillment-pickup"
                                                        className={`fulfillment-option-card ${fulfillmentMethod === 'PICKUP' ? 'selected' : ''}`}
                                                        onClick={() => setFulfillmentMethod('PICKUP')}
                                                    >
                                                        <i className="bi bi-bag-check"></i>
                                                        <span className="fc-title">Pick-Up</span>
                                                        <span className="fc-sub">At the restaurant</span>
                                                    </div>
                                                </div>

                                                {isEligibleForDelivery ? (
                                                    <div className="delivery-area-notice eligible">
                                                        <i className="bi bi-check-circle-fill" style={{ flexShrink: 0, marginTop: 1 }}></i>
                                                        <span>Your address is within our delivery area in <strong>Padre Burgos, Quezon Province</strong>. Delivery is available!</span>
                                                    </div>
                                                ) : (
                                                    <div className="delivery-area-notice ineligible">
                                                        <i className="bi bi-info-circle-fill" style={{ flexShrink: 0, marginTop: 1 }}></i>
                                                        <span>Delivery is only available within <strong>Padre Burgos, Quezon Province</strong>. Your registered address is outside the delivery area — your order is set to <strong>Pick-Up</strong>.</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* ── Address or Pick-Up Location ── */}
                                            {fulfillmentMethod === 'DELIVERY' ? (
                                                <div className="form-group-custom">
                                                    <label>Delivery Address <span className="text-danger">*</span></label>
                                                    <textarea
                                                        name="deliveryAddress"
                                                        value={checkoutForm.deliveryAddress}
                                                        onChange={handleFormChange}
                                                        rows="3"
                                                        placeholder="e.g. Sitio Riverside, Brgy. Danlagan, Padre Burgos, Quezon"
                                                        required
                                                    />
                                                    {/* Auto-detected Delivery Fee Indicator */}
                                                    <div className={`delivery-fee-badge-box mt-2 ${deliveryFeeInfo.matched ? 'matched' : ''}`}>
                                                        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                                                            <div className="d-flex align-items-center gap-2">
                                                                <i className={`bi ${deliveryFeeInfo.matched ? 'bi-check-circle-fill text-success' : 'bi-geo-alt-fill text-primary'}`} style={{ fontSize: '1.15rem' }}></i>
                                                                <div>
                                                                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-brown)' }}>
                                                                        {deliveryFeeInfo.matched ? (
                                                                            <span>Delivery to <strong>Brgy. {deliveryFeeInfo.barangay}</strong> {deliveryFeeInfo.distance && <span className="text-muted small">({deliveryFeeInfo.distance})</span>}</span>
                                                                        ) : (
                                                                            <span>Shipping fee auto-detected from address</span>
                                                                        )}
                                                                    </div>
                                                                    <div style={{ fontSize: '0.74rem', color: '#888' }}>
                                                                        Based on distance from Duyanan Restaurant (Sitio Hacienda, Brgy. Danlagan)
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="delivery-fee-pill">
                                                                <span style={{ fontSize: '0.75rem', opacity: 0.85, marginRight: 4 }}>Fee:</span>
                                                                <strong style={{ fontSize: '1rem' }}>₱{appliedShipping}</strong>
                                                            </div>
                                                        </div>
                                                        {!deliveryFeeInfo.matched && checkoutForm.deliveryAddress.trim().length > 0 && (
                                                            <div className="mt-2 pt-2 border-top" style={{ fontSize: '0.75rem', color: '#b7791f', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                                <i className="bi bi-info-circle-fill"></i>
                                                                <span>Include your <strong>Barangay</strong> (e.g., Danlagan, Rizal, Duhat, Poblacion) for exact rate (₱30, ₱50, ₱75, or ₱100).</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="form-group-custom">
                                                    <label>Pick-Up Location</label>
                                                    <div style={{ background: '#f9f5f1', border: '1.5px solid #e8ddd4', borderRadius: '12px', padding: '14px 18px', color: 'var(--primary-brown)', display: 'flex', alignItems: 'center', gap: 12 }}>
                                                        <i className="bi bi-geo-alt-fill" style={{ fontSize: '1.2rem', color: 'var(--accent-orange)', flexShrink: 0 }}></i>
                                                        <div>
                                                            <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>Duyanan Restaurant</div>
                                                            <div style={{ fontSize: '0.8rem', color: '#999', marginTop: 2 }}>Padre Burgos, Quezon Province</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    <div className="form-group-custom">
                                        <label>Payment Method <span className="text-danger">*</span></label>
                                        <div className="payment-options">
                                            <div 
                                                className={`payment-option-card ${checkoutForm.paymentMethod === 'COD' ? 'selected' : ''}`}
                                                onClick={() => handleSelectPayment('COD')}
                                            >
                                                <i className={`bi ${reservationId ? 'bi-shop-window' : 'bi-cash-stack'}`}></i>
                                                <span>{reservationId ? 'Pay at Restaurant' : 'Cash on Delivery'}</span>
                                            </div>
                                            <div 
                                                className={`payment-option-card ${checkoutForm.paymentMethod === 'GCASH' ? 'selected' : ''}`}
                                                onClick={() => handleSelectPayment('GCASH')}
                                            >
                                                <i className="bi bi-phone" style={{ color: '#007DFE' }}></i>
                                                <span>G-Cash</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ── GCash Payment Instructions & Proof Upload ── */}
                                    {checkoutForm.paymentMethod === 'GCASH' && (
                                        <div className="gcash-card mb-4">
                                            <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                                                <div className="gcash-badge">
                                                    <i className="bi bi-phone-fill"></i> GCash Manual Transfer
                                                </div>
                                                <span className="badge bg-white text-primary border" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                                                    Verified Merchant
                                                </span>
                                            </div>

                                            <div className="gcash-info-box">
                                                <div className="row g-2 align-items-center">
                                                    <div className="col-12 col-sm-6">
                                                        <div className="text-muted small">Account Name</div>
                                                        <div className="fw-bold text-dark" style={{ fontSize: '0.92rem' }}>DUYANAN RESTAURANT</div>
                                                    </div>
                                                    <div className="col-12 col-sm-6">
                                                        <div className="d-flex justify-content-between align-items-center">
                                                            <div>
                                                                <div className="text-muted small">GCash Number</div>
                                                                <div className="fw-bold text-primary" style={{ fontSize: '0.95rem', letterSpacing: '0.5px' }}>0917-824-3921</div>
                                                            </div>
                                                            <button 
                                                                type="button" 
                                                                className="copy-pill border-0"
                                                                onClick={() => handleCopyText('09178243921', 'GCash Number')}
                                                            >
                                                                <i className="bi bi-clipboard me-1"></i> Copy
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="col-12 mt-2 pt-2 border-top">
                                                        <div className="d-flex justify-content-between align-items-center">
                                                            <div>
                                                                <span className="text-muted small me-2">Exact Amount to Pay:</span>
                                                                <span className="fw-bold" style={{ color: 'var(--accent-orange)', fontSize: '1.05rem' }}>₱{grandTotal.toFixed(2)}</span>
                                                            </div>
                                                            <button 
                                                                type="button" 
                                                                className="copy-pill border-0"
                                                                onClick={() => handleCopyText(total.toFixed(2), 'Total Amount')}
                                                            >
                                                                <i className="bi bi-clipboard me-1"></i> Copy Amount
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* QR Code Section */}
                                            <div className="gcash-qr-box">
                                                <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
                                                    <i className="bi bi-qr-code-scan text-primary" style={{ fontSize: '1.2rem' }}></i>
                                                    <span className="fw-bold text-dark" style={{ fontSize: '0.88rem' }}>Scan QR Code with your GCash App</span>
                                                </div>
                                                
                                                {/* Stylized QR Card */}
                                                <div className="d-inline-block bg-white p-3 rounded-3 shadow-sm border position-relative" style={{ maxWidth: '200px' }}>
                                                    <svg width="160" height="160" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        {/* QR Background & Corner Positioning Squares */}
                                                        <rect width="160" height="160" fill="white"/>
                                                        {/* Top-Left Finder */}
                                                        <rect x="10" y="10" width="40" height="40" rx="6" fill="#007DFE"/>
                                                        <rect x="16" y="16" width="28" height="28" rx="3" fill="white"/>
                                                        <rect x="22" y="22" width="16" height="16" rx="2" fill="#007DFE"/>
                                                        {/* Top-Right Finder */}
                                                        <rect x="110" y="10" width="40" height="40" rx="6" fill="#007DFE"/>
                                                        <rect x="116" y="16" width="28" height="28" rx="3" fill="white"/>
                                                        <rect x="122" y="22" width="16" height="16" rx="2" fill="#007DFE"/>
                                                        {/* Bottom-Left Finder */}
                                                        <rect x="10" y="110" width="40" height="40" rx="6" fill="#007DFE"/>
                                                        <rect x="16" y="116" width="28" height="28" rx="3" fill="white"/>
                                                        <rect x="22" y="122" width="16" height="16" rx="2" fill="#007DFE"/>
                                                        {/* Simulated Data Pattern Modules */}
                                                        <rect x="60" y="15" width="8" height="8" fill="#1a1a1a"/>
                                                        <rect x="75" y="15" width="8" height="8" fill="#1a1a1a"/>
                                                        <rect x="90" y="15" width="8" height="8" fill="#1a1a1a"/>
                                                        <rect x="60" y="30" width="8" height="8" fill="#1a1a1a"/>
                                                        <rect x="80" y="30" width="8" height="8" fill="#1a1a1a"/>
                                                        <rect x="60" y="45" width="8" height="8" fill="#1a1a1a"/>
                                                        <rect x="75" y="45" width="8" height="8" fill="#1a1a1a"/>
                                                        <rect x="90" y="45" width="8" height="8" fill="#1a1a1a"/>
                                                        
                                                        <rect x="15" y="60" width="8" height="8" fill="#1a1a1a"/>
                                                        <rect x="30" y="60" width="8" height="8" fill="#1a1a1a"/>
                                                        <rect x="45" y="60" width="8" height="8" fill="#1a1a1a"/>
                                                        <rect x="60" y="60" width="12" height="12" fill="#007DFE"/>
                                                        <rect x="80" y="60" width="12" height="12" fill="#007DFE"/>
                                                        <rect x="105" y="60" width="8" height="8" fill="#1a1a1a"/>
                                                        <rect x="120" y="60" width="8" height="8" fill="#1a1a1a"/>
                                                        <rect x="135" y="60" width="8" height="8" fill="#1a1a1a"/>

                                                        {/* Center GCash Shield Icon */}
                                                        <circle cx="80" cy="80" r="16" fill="#007DFE"/>
                                                        <path d="M74 80L78 84L86 76" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>

                                                        <rect x="15" y="90" width="8" height="8" fill="#1a1a1a"/>
                                                        <rect x="30" y="90" width="8" height="8" fill="#1a1a1a"/>
                                                        <rect x="45" y="90" width="8" height="8" fill="#1a1a1a"/>
                                                        <rect x="60" y="90" width="8" height="8" fill="#1a1a1a"/>
                                                        <rect x="90" y="90" width="8" height="8" fill="#1a1a1a"/>
                                                        <rect x="105" y="90" width="8" height="8" fill="#1a1a1a"/>
                                                        <rect x="125" y="90" width="8" height="8" fill="#1a1a1a"/>

                                                        <rect x="60" y="110" width="8" height="8" fill="#1a1a1a"/>
                                                        <rect x="75" y="110" width="8" height="8" fill="#1a1a1a"/>
                                                        <rect x="95" y="110" width="8" height="8" fill="#1a1a1a"/>
                                                        <rect x="115" y="110" width="8" height="8" fill="#1a1a1a"/>
                                                        <rect x="135" y="110" width="8" height="8" fill="#1a1a1a"/>

                                                        <rect x="60" y="125" width="8" height="8" fill="#1a1a1a"/>
                                                        <rect x="80" y="125" width="8" height="8" fill="#1a1a1a"/>
                                                        <rect x="100" y="125" width="8" height="8" fill="#1a1a1a"/>
                                                        <rect x="120" y="125" width="8" height="8" fill="#1a1a1a"/>
                                                        <rect x="140" y="125" width="8" height="8" fill="#1a1a1a"/>

                                                        <rect x="60" y="140" width="8" height="8" fill="#1a1a1a"/>
                                                        <rect x="75" y="140" width="8" height="8" fill="#1a1a1a"/>
                                                        <rect x="90" y="140" width="8" height="8" fill="#1a1a1a"/>
                                                        <rect x="110" y="140" width="8" height="8" fill="#1a1a1a"/>
                                                        <rect x="130" y="140" width="8" height="8" fill="#1a1a1a"/>
                                                    </svg>
                                                    <div className="mt-1 small fw-bold text-primary" style={{ fontSize: '0.72rem' }}>
                                                        Duyanan Restaurant
                                                    </div>
                                                </div>
                                                <div className="text-muted small mt-2" style={{ fontSize: '0.78rem' }}>
                                                    Pay exact amount: <b className="text-dark">₱{grandTotal.toFixed(2)}</b>
                                                </div>
                                            </div>

                                            {/* Proof of Payment Upload */}
                                            <div className="mb-3">
                                                <label className="fw-bold small text-dark d-flex align-items-center gap-1 mb-2">
                                                    <span>Upload GCash Receipt Screenshot</span>
                                                    <span className="text-danger">*</span>
                                                    <span className="badge bg-primary text-white ms-auto" style={{ fontSize: '0.7rem' }}>Required</span>
                                                </label>

                                                {!paymentProofPreview ? (
                                                    <label className="proof-upload-area w-100 mb-0 d-block">
                                                        <input 
                                                            type="file" 
                                                            accept="image/*" 
                                                            onChange={handleReceiptFileChange}
                                                            style={{ display: 'none' }} 
                                                        />
                                                        <i className="bi bi-cloud-arrow-up-fill text-primary" style={{ fontSize: '2.4rem' }}></i>
                                                        <div className="fw-bold text-dark mt-1" style={{ fontSize: '0.9rem' }}>
                                                            Click or tap to upload GCash receipt screenshot
                                                        </div>
                                                        <div className="text-muted small mt-1" style={{ fontSize: '0.78rem' }}>
                                                            Supports PNG, JPG, JPEG, WEBP (Max: 10MB)
                                                        </div>
                                                    </label>
                                                ) : (
                                                    <div className="proof-preview-banner">
                                                        <div className="d-flex align-items-center gap-3 overflow-hidden">
                                                            <img 
                                                                src={paymentProofPreview} 
                                                                alt="Receipt Preview" 
                                                                style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '10px', border: '1px solid #d4edda', flexShrink: 0, cursor: 'pointer' }}
                                                                onClick={() => setViewingReceipt(paymentProofPreview)}
                                                                title="Click to zoom in"
                                                            />
                                                            <div className="overflow-hidden">
                                                                <div className="d-flex align-items-center gap-1 text-success fw-bold small">
                                                                    <i className="bi bi-check-circle-fill"></i> Receipt Attached
                                                                </div>
                                                                <div className="text-truncate text-muted small" style={{ fontSize: '0.78rem' }}>
                                                                    {paymentProofFile?.name || 'receipt-screenshot.png'}
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-link p-0 text-primary small text-decoration-none fw-bold"
                                                                    style={{ fontSize: '0.75rem' }}
                                                                    onClick={() => setViewingReceipt(paymentProofPreview)}
                                                                >
                                                                    <i className="bi bi-zoom-in me-1"></i> Preview Full Image
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <button 
                                                            type="button" 
                                                            className="btn btn-sm btn-outline-danger"
                                                            style={{ borderRadius: '8px', padding: '6px 12px', fontSize: '0.78rem', flexShrink: 0 }}
                                                            onClick={handleRemoveReceipt}
                                                        >
                                                            <i className="bi bi-trash3 me-1"></i> Change
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Reference Number Field */}
                                            <div>
                                                <label className="fw-bold small text-muted mb-1" style={{ fontSize: '0.78rem' }}>
                                                    GCash Reference No. (Optional)
                                                </label>
                                                <input 
                                                    type="text" 
                                                    className="form-control"
                                                    value={paymentProofReference}
                                                    onChange={(e) => setPaymentProofReference(e.target.value)}
                                                    placeholder="e.g. 1002 9384 7581 (from your GCash receipt)"
                                                    style={{ borderRadius: '10px', fontSize: '0.85rem', padding: '10px 14px' }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="form-group-custom">
                                        <label>Order Notes / Special Instructions (Optional)</label>
                                        <textarea 
                                            name="notes"
                                            value={checkoutForm.notes}
                                            onChange={handleFormChange}
                                            rows="2"
                                            placeholder="Any notes for the kitchen or delivery rider..."
                                        />
                                    </div>

                                    <button 
                                        className="btn border-0 py-2.5 px-4 mt-2" 
                                        onClick={() => setStep(1)} 
                                        style={{ 
                                            background: 'transparent', 
                                            color: 'var(--primary-brown)', 
                                            fontWeight: 600, 
                                            display: 'inline-flex', 
                                            alignItems: 'center', 
                                            gap: 8,
                                            padding: '8px 16px',
                                            border: '1.5px solid #e0d6cc',
                                            borderRadius: '12px'
                                        }}
                                    >
                                        <i className="bi bi-arrow-left"></i> Back to Review Order
                                    </button>
                                </div>
                            </div>

                            {/* ─── Right: Summary / Confirm ─── */}
                            <div className="col-lg-4">
                                <div className="order-summary">
                                    <h5 style={{ fontWeight: 700, color: 'var(--primary-brown)', marginBottom: 20 }}>
                                        <i className="bi bi-receipt me-2" style={{ opacity: 0.5 }}></i>
                                        Order Summary
                                    </h5>

                                    <div className="summary-row">
                                        <span style={{ color: '#888', fontSize: '0.9rem' }}>Subtotal ({itemCount} items)</span>
                                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>₱{subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="summary-row">
                                        <span style={{ color: '#888', fontSize: '0.9rem' }}>{reservationId ? 'Order Type' : 'Fulfillment'}</span>
                                        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#27ae60' }}>
                                            {reservationId ? 'Dine-In 🍽️' : fulfillmentMethod === 'PICKUP' ? '🏃 Pick-Up' : '🚚 Delivery'}
                                        </span>
                                    </div>
                                    {isDeliveryOrder && (
                                        <div className="summary-row">
                                            <span style={{ color: '#888', fontSize: '0.9rem' }}>
                                                🛵 Shipping Fee
                                                {deliveryFeeInfo.barangay && (
                                                    <span style={{ fontSize: '0.75rem', color: '#888', marginLeft: 4 }}>
                                                        ({deliveryFeeInfo.barangay})
                                                    </span>
                                                )}
                                            </span>
                                            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#e67e22' }}>
                                                ₱{appliedShipping.toFixed(2)}
                                            </span>
                                        </div>
                                    )}

                                    <div className="summary-divider"></div>

                                    <div className="summary-row total">
                                        <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#333' }}>Grand Total</span>
                                        <span style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--primary-brown)' }}>
                                            ₱{grandTotal.toFixed(2)}
                                        </span>
                                    </div>

                                    <div className="summary-divider"></div>

                                    <button 
                                        className="checkout-btn" 
                                        onClick={handlePlaceOrder}
                                        disabled={isCheckingOut}
                                    >
                                        {isCheckingOut ? (
                                            <><span className="spinner-border spinner-border-sm me-2"></span> Placing Order...</>
                                        ) : (
                                            <><i className="bi bi-check2-circle me-2"></i> Confirm & Place Order</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    {step === 3 && (
                        <div className="col-12">
                            <div className="success-card">
                                <div className="success-icon-container">
                                    <i className="bi bi-check-lg"></i>
                                </div>
                                <h3 style={{ color: 'var(--primary-brown)', fontWeight: 800, marginBottom: 8 }}>
                                    {orderResult?.isDineIn ? 'Dine-In Pre-Order Placed! 🍽️' : 'Order Placed Successfully! 🎉'}
                                </h3>
                                <p style={{ color: '#666', fontSize: '0.95rem', maxWidth: 450, margin: '0 auto 20px' }}>
                                    {orderResult?.isDineIn
                                        ? 'Thank you! Your pre-ordered food is confirmed and will be served at your reserved table upon your arrival.'
                                        : orderResult?.isPickup
                                            ? 'Thank you! Your order is confirmed. Please visit Duyanan Restaurant to pick it up once it\'s ready.'
                                            : 'Thank you for your purchase. Your delicious meal is being prepared and will be delivered shortly.'}
                                </p>

                                {/* ══════════════════════════════════════════
                                    SCREEN 4 — Live Order Tracker Timeline
                                ══════════════════════════════════════════ */}
                                <div className="order-tracker-banner my-4 text-start" style={{ maxWidth: '580px', margin: '0 auto' }}>
                                    <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                                        <div className="d-flex align-items-center gap-2">
                                            <span className="live-pulse-dot" style={{ width: '10px', height: '10px' }}></span>
                                            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary-brown)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                                                Live Order Tracker
                                            </span>
                                        </div>
                                        <span className="badge rounded-pill" style={{ background: '#fff3e0', color: 'var(--accent-orange)', border: '1px solid #ffe0b2', padding: '6px 14px', fontSize: '0.78rem', fontWeight: 700 }}>
                                            🔥 Sizzling in Kitchen
                                        </span>
                                    </div>
                                    <div className="order-timeline">
                                        <div className="order-step done">
                                            <div className="order-step-dot"><i className="bi bi-check2"></i></div>
                                            <span className="order-step-label">1. Order Confirmed</span>
                                        </div>
                                        <div className="order-step-line done"></div>
                                        <div className="order-step active">
                                            <div className="order-step-dot">🍳</div>
                                            <span className="order-step-label">2. Sizzling in Kitchen</span>
                                        </div>
                                        <div className="order-step-line"></div>
                                        <div className="order-step">
                                            <div className="order-step-dot">
                                                {orderResult?.isDineIn ? '🍽️' : orderResult?.isPickup ? '🛍️' : '🛵'}
                                            </div>
                                            <span className="order-step-label">
                                                3. {orderResult?.isDineIn ? 'Served at Table' : orderResult?.isPickup ? 'Ready for Pick-Up' : 'Out for Delivery'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {orderResult && (
                                    <div className="receipt-box">
                                        <h6 style={{ fontWeight: 700, color: 'var(--primary-brown)', borderBottom: '1.5px dashed #e8dcd0', paddingBottom: 8, marginBottom: 12 }}>
                                            Receipt Details
                                        </h6>
                                        <div className="receipt-row">
                                            <span className="text-muted">Order ID</span>
                                            <span className="fw-bold text-dark">#{orderResult.id}</span>
                                        </div>
                                        <div className="receipt-row">
                                            <span className="text-muted">{orderResult.isDineIn ? 'Guest Name' : 'Recipient'}</span>
                                            <span className="text-dark fw-semibold">{orderResult.recipientName}</span>
                                        </div>
                                        <div className="receipt-row">
                                            <span className="text-muted">{orderResult.isDineIn ? 'Order Type' : orderResult.isPickup ? 'Pick-Up At' : 'Delivery Address'}</span>
                                            <span className="text-dark fw-semibold">
                                                {orderResult.isDineIn ? (
                                                    <span className="badge bg-warning text-dark border">
                                                        🍽️ Dine-In (Reservation #{orderResult.reservationId})
                                                    </span>
                                                ) : orderResult.isPickup ? (
                                                    <span className="badge" style={{ background: '#fff3e0', color: '#a04000', border: '1px solid #ffcc80', fontSize: '0.85rem' }}>
                                                        🏃 Pick-Up at Duyanan Restaurant
                                                    </span>
                                                ) : orderResult.deliveryAddress}
                                            </span>
                                        </div>
                                        {orderResult.shippingFee > 0 && (
                                            <div className="receipt-row">
                                                <span className="text-muted">🛵 Shipping Fee</span>
                                                <span className="text-dark fw-semibold">₱{orderResult.shippingFee.toFixed(2)} {orderResult.deliveryZone && <span style={{fontSize:'0.78rem',color:'#aaa'}}>{orderResult.deliveryZone.split(' — ')[0]}</span>}</span>
                                            </div>
                                        )}
                                        <div className="receipt-row">
                                            <span className="text-muted">Payment Method</span>
                                            <span className="text-dark fw-semibold">
                                                {orderResult.paymentMethod === 'COD' 
                                                    ? (orderResult.isDineIn ? 'Pay at Restaurant' : 'Cash on Delivery (COD)') 
                                                    : 'G-Cash (Manual Transfer)'}
                                            </span>
                                        </div>
                                        <div className="receipt-row">
                                            <span className="text-muted">Payment Status</span>
                                            <span>
                                                {orderResult.paymentMethod === 'GCASH' ? (
                                                    <span className="badge px-2.5 py-1.5" style={{ backgroundColor: '#fff9e6', color: '#b7791f', border: '1px solid #ffeeba', borderRadius: '50px', fontSize: '0.78rem', fontWeight: 700 }}>
                                                        <i className="bi bi-hourglass-split me-1"></i> Awaiting Admin Verification
                                                    </span>
                                                ) : (
                                                    <span className="badge bg-light text-dark border" style={{ borderRadius: '50px', fontSize: '0.78rem' }}>
                                                        Pay upon arrival
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                        {orderResult.paymentReference && (
                                            <div className="receipt-row">
                                                <span className="text-muted">GCash Ref No.</span>
                                                <span className="text-dark fw-semibold small">{orderResult.paymentReference}</span>
                                            </div>
                                        )}
                                        {orderResult.paymentProofImage && (
                                            <div className="receipt-row align-items-center">
                                                <span className="text-muted">Payment Proof</span>
                                                <div className="d-flex align-items-center gap-2">
                                                    <img 
                                                        src={orderResult.paymentProofImage.startsWith('/') ? `${API_URL}${orderResult.paymentProofImage}` : orderResult.paymentProofImage} 
                                                        alt="Receipt Proof" 
                                                        style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #ddd', cursor: 'pointer' }}
                                                        onClick={() => setViewingReceipt(orderResult.paymentProofImage.startsWith('/') ? `${API_URL}${orderResult.paymentProofImage}` : orderResult.paymentProofImage)}
                                                    />
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-link p-0 text-primary fw-bold text-decoration-none small"
                                                        onClick={() => setViewingReceipt(orderResult.paymentProofImage.startsWith('/') ? `${API_URL}${orderResult.paymentProofImage}` : orderResult.paymentProofImage)}
                                                    >
                                                        <i className="bi bi-eye me-1"></i> View Receipt
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                        <div className="receipt-row receipt-total">
                                            <span>Total Amount</span>
                                            <span style={{ color: 'var(--accent-orange)' }}>₱{orderResult.total.toFixed(2)}</span>
                                        </div>
                                    </div>
                                )}

                                <div className="d-flex flex-column flex-sm-row justify-content-center gap-3">
                                    <button 
                                        className="checkout-btn" 
                                        onClick={() => navigate('/profile', { state: { tab: 'orders' } })}
                                        style={{ width: 'auto', padding: '12px 30px' }}
                                    >
                                        <i className="bi bi-receipt me-2"></i> Track My Order
                                    </button>
                                    <button 
                                        className="add-more-btn" 
                                        onClick={() => navigate('/menu')}
                                        style={{ width: 'auto', padding: '12px 30px', marginTop: 0 }}
                                    >
                                        <i className="bi bi-shop me-2"></i> Order More Food
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Receipt Screenshot Zoom Modal ── */}
            {viewingReceipt && (
                <div 
                    className="modal show d-block" 
                    tabIndex="-1" 
                    style={{ backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 1055, backdropFilter: 'blur(4px)' }}
                    onClick={() => setViewingReceipt(null)}
                >
                    <div className="modal-dialog modal-dialog-centered modal-md" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px', overflow: 'hidden' }}>
                            <div className="modal-header border-bottom py-3 px-4 d-flex justify-content-between align-items-center" style={{ backgroundColor: '#007DFE', color: '#fff' }}>
                                <h6 className="modal-title fw-bold mb-0 d-flex align-items-center gap-2">
                                    <i className="bi bi-receipt"></i> GCash Receipt Screenshot
                                </h6>
                                <button 
                                    type="button" 
                                    className="btn-close btn-close-white" 
                                    onClick={() => setViewingReceipt(null)}
                                    aria-label="Close"
                                />
                            </div>
                            <div className="modal-body p-3 text-center bg-light">
                                <img 
                                    src={viewingReceipt} 
                                    alt="GCash Payment Receipt" 
                                    className="img-fluid rounded-3 shadow-sm"
                                    style={{ maxHeight: '70vh', objectFit: 'contain' }}
                                />
                            </div>
                            <div className="modal-footer border-0 py-2.5 px-4 bg-white d-flex justify-content-between">
                                <span className="small text-muted">
                                    <i className="bi bi-shield-check text-success me-1"></i> Payment Proof Submitted
                                </span>
                                <button 
                                    type="button" 
                                    className="btn btn-sm btn-secondary" 
                                    style={{ borderRadius: '8px', padding: '6px 18px' }}
                                    onClick={() => setViewingReceipt(null)}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default CartPage;
