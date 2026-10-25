import React, { useState, useEffect } from 'react';

const ADD_ONS_LIST = [
    { id: 'rice', name: 'Extra Garlic Rice', price: 30, emoji: '🍚' },
    { id: 'gravy', name: 'Rich Savory Gravy', price: 15, emoji: '🥣' },
    { id: 'atchara', name: 'Homemade Atchara', price: 20, emoji: '🥗' },
    { id: 'egg', name: 'Fried Egg', price: 20, emoji: '🍳' },
    { id: 'chili', name: 'Spicy Chili Garlic Oil', price: 10, emoji: '🌶️' }
];

const DishCustomizationModal = ({ dish, isOpen, onClose, onAddToCart }) => {
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [selectedFlavor, setSelectedFlavor] = useState('');
    const [selectedAddOns, setSelectedAddOns] = useState([]);
    const [specialNotes, setSpecialNotes] = useState('');
    const [quantity, setQuantity] = useState(1);

    // Derive variants for the dish
    const variants = [];
    if (dish) {
        if (dish.priceSolo > 0) {
            const label = ['Drinks', 'Milk Shakes'].includes(dish.category)
                ? 'Glass'
                : ['Duyanan Specials', 'Burger', 'French Fries', 'Home-Made Siomai', 'Soup'].includes(dish.category)
                    ? 'Regular'
                    : 'Solo';
            variants.push({ id: 'solo', label, price: dish.priceSolo, portion: 'Good for 1 person' });
        }
        if (dish.priceALaCarte > 0 && !['Drinks', 'Milk Shakes'].includes(dish.category)) {
            const label = dish.priceALaCarte2 > 0 ? 'A La Carte 1' : 'A La Carte (Sharing)';
            variants.push({ id: 'alacarte', label, price: dish.priceALaCarte, portion: 'Good for 2-3 persons' });
        }
        if (dish.priceALaCarte2 > 0 && !['Drinks', 'Milk Shakes'].includes(dish.category)) {
            variants.push({ id: 'alacarte2', label: 'A La Carte 2', price: dish.priceALaCarte2, portion: 'Good for 3-4 persons' });
        }
        if (['Drinks', 'Milk Shakes'].includes(dish.category)) {
            if (dish.price1Liter > 0) variants.push({ id: '1l', label: '1 Liter Pitcher', price: dish.price1Liter, portion: 'Good for 2-3 persons' });
            if (dish.price1Point5Liter > 0) variants.push({ id: '1.5l', label: '1.5 Liters Pitcher', price: dish.price1Point5Liter, portion: 'Good for 3-4 persons' });
            if (dish.price2Liter > 0) variants.push({ id: '2l', label: '2 Liters Pitcher', price: dish.price2Liter, portion: 'Good for 4-5 persons' });
        }
    }

    const flavors = dish?.flavors ? dish.flavors.split(',').map(f => f.trim()).filter(Boolean) : [];

    useEffect(() => {
        if (dish) {
            setSelectedVariant(variants[0] || { label: 'Standard', price: dish.priceSolo || dish.priceALaCarte || 0 });
            setSelectedFlavor(flavors.length > 0 ? flavors[0] : '');
            setSelectedAddOns([]);
            setSpecialNotes('');
            setQuantity(1);
        }
    }, [dish]);

    if (!isOpen || !dish) return null;

    const toggleAddOn = (addOn) => {
        setSelectedAddOns(prev =>
            prev.some(a => a.id === addOn.id)
                ? prev.filter(a => a.id !== addOn.id)
                : [...prev, addOn]
        );
    };

    const basePrice = selectedVariant?.price || dish.priceSolo || dish.priceALaCarte || 0;
    const addOnsTotal = selectedAddOns.reduce((sum, a) => sum + a.price, 0);
    const unitPrice = basePrice + addOnsTotal;
    const finalTotal = unitPrice * quantity;

    const handleConfirm = () => {
        const parts = [];
        if (selectedVariant?.label && variants.length > 1) {
            parts.push(selectedVariant.label);
        }
        if (selectedFlavor) {
            parts.push(`Flavor: ${selectedFlavor}`);
        }
        if (selectedAddOns.length > 0) {
            parts.push(`Add-ons: ${selectedAddOns.map(a => a.name).join(', ')}`);
        }
        if (specialNotes.trim()) {
            parts.push(`Note: ${specialNotes.trim()}`);
        }

        const variantString = parts.length > 0 ? parts.join(' | ') : null;
        onAddToCart(dish, variantString, unitPrice, quantity);
        onClose();
    };

    return (
        <div 
            className="modal-backdrop-custom"
            style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.65)',
                backdropFilter: 'blur(6px)',
                zIndex: 1060,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px',
                animation: 'fadeIn 0.2s ease-out'
            }}
            onClick={onClose}
        >
            <div
                className="dish-modal-content"
                style={{
                    backgroundColor: '#fff',
                    borderRadius: '24px',
                    width: '100%',
                    maxWidth: '480px',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                    position: 'relative',
                    animation: 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    display: 'flex',
                    flexDirection: 'column'
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* ── Header Image & Close Button ── */}
                <div style={{ position: 'relative', width: '100%', height: '200px', backgroundColor: '#f5eee6' }}>
                    <img
                        src={dish.imageUrl || 'https://placehold.co/400x250?text=Duyanan+Dish'}
                        alt={dish.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 60%, rgba(0,0,0,0.3) 100%)' }} />

                    {/* Close button */}
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        style={{
                            position: 'absolute',
                            top: '14px',
                            right: '14px',
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(0,0,0,0.45)',
                            color: '#fff',
                            border: '1px solid rgba(255,255,255,0.25)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontSize: '1.1rem',
                            backdropFilter: 'blur(8px)',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        ✕
                    </button>

                    {/* Badges on image */}
                    <div style={{ position: 'absolute', bottom: '14px', left: '18px', right: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div>
                            <span style={{
                                backgroundColor: 'var(--accent-orange)',
                                color: '#fff',
                                padding: '4px 10px',
                                borderRadius: '20px',
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                letterSpacing: '0.04em',
                                textTransform: 'uppercase',
                                display: 'inline-block',
                                marginBottom: '4px'
                            }}>
                                {dish.category}
                            </span>
                            <h3 style={{ color: '#fff', margin: 0, fontWeight: 800, fontSize: '1.35rem', textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>
                                {dish.name}
                            </h3>
                        </div>
                    </div>
                </div>

                {/* ── Body Content ── */}
                <div style={{ padding: '20px 22px', flex: 1 }}>

                    {/* Portion & Description */}
                    <div className="d-flex align-items-center gap-2 mb-2">
                        <span style={{
                            backgroundColor: '#fff3e0',
                            color: 'var(--accent-orange)',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            padding: '3px 10px',
                            borderRadius: '12px',
                            border: '1px solid #ffe0b2'
                        }}>
                            👥 {selectedVariant?.portion || 'Good for 1-2 persons'}
                        </span>
                        <span style={{ color: '#888', fontSize: '0.8rem' }}>• Freshly made to order</span>
                    </div>

                    {dish.description && (
                        <p style={{ color: '#666', fontSize: '0.88rem', lineHeight: 1.5, marginBottom: '18px' }}>
                            {dish.description}
                        </p>
                    )}

                    {/* ── Variant Picker (if available) ── */}
                    {variants.length > 1 && (
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--primary-brown)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '8px' }}>
                                Select Serving Size <span style={{ color: '#d35400' }}>*</span>
                            </label>
                            <div className="d-flex flex-column gap-2">
                                {variants.map(v => (
                                    <div
                                        key={v.id}
                                        onClick={() => setSelectedVariant(v)}
                                        style={{
                                            border: selectedVariant?.id === v.id ? '2px solid var(--accent-orange)' : '1.5px solid #eee',
                                            backgroundColor: selectedVariant?.id === v.id ? 'rgba(211,84,0,0.04)' : '#fff',
                                            borderRadius: '14px',
                                            padding: '10px 14px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <div className="d-flex align-items-center gap-2">
                                            <div style={{
                                                width: '18px',
                                                height: '18px',
                                                borderRadius: '50%',
                                                border: selectedVariant?.id === v.id ? '5px solid var(--accent-orange)' : '2px solid #ccc',
                                                backgroundColor: '#fff'
                                            }} />
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#333' }}>{v.label}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#888' }}>{v.portion}</div>
                                            </div>
                                        </div>
                                        <div style={{ fontWeight: 800, color: 'var(--accent-orange)', fontSize: '0.95rem' }}>
                                            ₱{v.price.toFixed(2)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Flavor Picker (if Milk Shakes) ── */}
                    {flavors.length > 0 && (
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--primary-brown)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '8px' }}>
                                Choose Flavor <span style={{ color: '#d35400' }}>*</span>
                            </label>
                            <select
                                value={selectedFlavor}
                                onChange={e => setSelectedFlavor(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '10px 14px',
                                    borderRadius: '12px',
                                    border: '1.5px solid #ddd',
                                    fontSize: '0.9rem',
                                    fontWeight: 600,
                                    outline: 'none',
                                    backgroundColor: '#fafafa'
                                }}
                            >
                                {flavors.map(f => (
                                    <option key={f} value={f}>{f}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* ── Delicious Add-ons ── */}
                    {!['Drinks', 'Milk Shakes'].includes(dish.category) && (
                        <div style={{ marginBottom: '20px' }}>
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <label style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--primary-brown)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                                    ✨ Delicious Add-ons
                                </label>
                                <span style={{ fontSize: '0.72rem', color: '#999' }}>Optional</span>
                            </div>
                            <div className="d-flex flex-column gap-2">
                                {ADD_ONS_LIST.map(addOn => {
                                    const isSelected = selectedAddOns.some(a => a.id === addOn.id);
                                    return (
                                        <div
                                            key={addOn.id}
                                            onClick={() => toggleAddOn(addOn)}
                                            style={{
                                                border: isSelected ? '1.5px solid var(--accent-orange)' : '1px solid #f0f0f0',
                                                backgroundColor: isSelected ? 'rgba(211,84,0,0.04)' : '#fafafa',
                                                borderRadius: '12px',
                                                padding: '9px 12px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                cursor: 'pointer',
                                                transition: 'all 0.15s ease'
                                            }}
                                        >
                                            <div className="d-flex align-items-center gap-2">
                                                <span style={{ fontSize: '1.1rem' }}>{addOn.emoji}</span>
                                                <span style={{ fontSize: '0.88rem', fontWeight: isSelected ? 700 : 500, color: '#333' }}>
                                                    {addOn.name}
                                                </span>
                                            </div>
                                            <div className="d-flex align-items-center gap-2">
                                                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: isSelected ? 'var(--accent-orange)' : '#777' }}>
                                                    +₱{addOn.price.toFixed(2)}
                                                </span>
                                                <div style={{
                                                    width: '18px',
                                                    height: '18px',
                                                    borderRadius: '4px',
                                                    border: isSelected ? 'none' : '1.5px solid #ccc',
                                                    backgroundColor: isSelected ? 'var(--accent-orange)' : 'transparent',
                                                    color: '#fff',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '0.75rem'
                                                }}>
                                                    {isSelected && '✓'}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ── Special Instructions ── */}
                    <div style={{ marginBottom: '18px' }}>
                        <label style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--primary-brown)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '6px' }}>
                            Special Instructions <span style={{ color: '#aaa', fontWeight: 400, textTransform: 'none' }}>(optional)</span>
                        </label>
                        <textarea
                            value={specialNotes}
                            onChange={e => setSpecialNotes(e.target.value)}
                            placeholder="e.g. Extra spicy, sauce on the side, well done..."
                            rows="2"
                            style={{
                                width: '100%',
                                padding: '10px 14px',
                                borderRadius: '12px',
                                border: '1.5px solid #eee',
                                fontSize: '0.85rem',
                                outline: 'none',
                                resize: 'none'
                            }}
                        />
                    </div>
                </div>

                {/* ── Sticky Footer with Quantity & Total ── */}
                <div style={{
                    padding: '16px 22px',
                    borderTop: '1px solid #f0ece8',
                    backgroundColor: '#fff',
                    borderBottomLeftRadius: '24px',
                    borderBottomRightRadius: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '14px'
                }}>
                    {/* Stepper */}
                    <div className="guest-stepper" style={{ height: '44px' }}>
                        <button
                            type="button"
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            disabled={quantity <= 1}
                            style={{ opacity: quantity <= 1 ? 0.4 : 1 }}
                        >
                            −
                        </button>
                        <span className="guest-count" style={{ minWidth: '40px', fontSize: '0.95rem' }}>
                            {quantity}
                        </span>
                        <button
                            type="button"
                            onClick={() => setQuantity(quantity + 1)}
                        >
                            +
                        </button>
                    </div>

                    {/* Add to Cart Button */}
                    <button
                        onClick={handleConfirm}
                        className="btn-brand"
                        style={{
                            flex: 1,
                            justifyContent: 'center',
                            padding: '12px 18px',
                            borderRadius: '50px',
                            fontSize: '0.95rem',
                            fontWeight: 800,
                            minHeight: '44px',
                            boxShadow: '0 4px 18px rgba(211,84,0,0.32)'
                        }}
                    >
                        <span>Add to Order</span>
                        <span>•</span>
                        <span>₱{finalTotal.toFixed(2)}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DishCustomizationModal;
