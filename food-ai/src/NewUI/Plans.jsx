import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import '../pages/Home.css';
import '../index.css';
import NewNavbar from "./NewNavbar.jsx";
import '../pages/FoodO.css';
import '../pages/FoodInfo.css';
import './Plans.css';
import '../components/Shimmer.css';
import Modal from './Modal.jsx';
import { useUser } from '../context/UserContext';
import { API_ENDPOINTS } from '../config';

function Plans() {
    const { session, credits, isPro, subscriptionTier, cancelAtPeriodEnd, currentPeriodEnd, refreshProfile, loading: userLoading } = useUser();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const [billingPeriod, setBillingPeriod] = useState('monthly');
    const [openFaqs, setOpenFaqs] = useState(new Set());
    const [isCreditsModalOpen, setIsCreditsModalOpen] = useState(false);
    const [creditsToAdd, setCreditsToAdd] = useState('10');
    const [costAmount, setCostAmount] = useState('2.00');
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [pendingPlanChange, setPendingPlanChange] = useState(null);
    const [liveCancelAt, setLiveCancelAt] = useState(null);
    const [liveCancelAtPeriodEnd, setLiveCancelAtPeriodEnd] = useState(null);
    const [liveCurrentPeriodEnd, setLiveCurrentPeriodEnd] = useState(null);

    // Handle return from Stripe Checkout
    useEffect(() => {
        if (searchParams.get('success') === 'true') {
            refreshProfile();
            setSuccessMessage('Payment successful! Your account has been updated.');
            // Clear the URL params
            setSearchParams({}, { replace: true });
            // Auto-dismiss after 5 seconds
            const timer = setTimeout(() => setSuccessMessage(''), 5000);
            return () => clearTimeout(timer);
        }
        if (searchParams.get('canceled') === 'true') {
            setSearchParams({}, { replace: true });
        }
    }, [searchParams, refreshProfile, setSearchParams]);

    // Fetch pending plan changes from Stripe (Pro users only)
    useEffect(() => {
        if (!isPro || !session?.user?.id) return;

        const fetchSubStatus = async () => {
            try {
                const res = await fetch(API_ENDPOINTS.STRIPE_SUBSCRIPTION_STATUS, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: session.user.id }),
                });
                const data = await res.json();
                setPendingPlanChange(data.pendingPlanChange || null);
                setLiveCancelAt(data.cancelAt || null);
                setLiveCancelAtPeriodEnd(data.cancelAtPeriodEnd || false);
                setLiveCurrentPeriodEnd(data.currentPeriodEnd || null);
            } catch (err) {
                console.error('Failed to fetch subscription status:', err);
            }
        };

        fetchSubStatus();
    }, [isPro, session?.user?.id]);

    // Use live Stripe data if available, fall back to DB values
    // Stripe may set cancel_at without cancel_at_period_end, so check both
    const isCancelling = liveCancelAtPeriodEnd || !!liveCancelAt || cancelAtPeriodEnd;
    const cancellationDate = liveCancelAt || liveCurrentPeriodEnd || currentPeriodEnd;

    // Format date as "26 February, 2027"
    const formatDate = (isoDate) => {
        return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(isoDate));
    };

    // Conversion: 10 credits = $2.00
    const creditsToCost = (credits) => (credits * 0.2).toFixed(2);
    const costToCredits = (cost) => Math.round(cost * 5);

    const decreaseCredits = () => {
        const current = parseInt(creditsToAdd, 10) || 10;
        const newCredits = Math.max(10, current - 10);
        setCreditsToAdd(String(newCredits));
        setCostAmount(creditsToCost(newCredits));
    };

    const increaseCredits = () => {
        const current = parseInt(creditsToAdd, 10);
        if (isNaN(current) || current < 10) {
            setCreditsToAdd('10');
            setCostAmount('2.00');
        } else {
            const newCredits = current + 10;
            setCreditsToAdd(String(newCredits));
            setCostAmount(creditsToCost(newCredits));
        }
    };

    const handleCreditsChange = (e) => {
        const value = e.target.value;
        setCreditsToAdd(value);
        const credits = parseInt(value, 10);
        if (!isNaN(credits) && credits > 0) {
            setCostAmount(creditsToCost(credits));
        } else {
            setCostAmount('2.00');
        }
    };

    const handleCreditsBlur = () => {
        const value = parseInt(creditsToAdd, 10);
        if (isNaN(value) || value < 10) {
            setCreditsToAdd('10');
            setCostAmount('2.00');
        }
    };

    const handleCostChange = (e) => {
        const value = e.target.value;
        setCostAmount(value);
        const cost = parseFloat(value);
        if (!isNaN(cost) && cost > 0) {
            setCreditsToAdd(String(costToCredits(cost)));
        }
    };

    const handleCostBlur = () => {
        const value = parseFloat(costAmount);
        if (isNaN(value) || value < 2) {
            setCostAmount('2.00');
            setCreditsToAdd('10');
        } else {
            // Round to nearest valid cost (multiples of 2)
            const roundedCost = Math.max(2, Math.round(value / 2) * 2);
            setCostAmount(roundedCost.toFixed(2));
            setCreditsToAdd(String(costToCredits(roundedCost)));
        }
    };

    const handleBillingChange = (period) => {
        setBillingPeriod(period);
    };

    const toggleFaq = (index) => {
        setOpenFaqs(prev => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    };

    const handleBuyCredits = async (e) => {
        e.preventDefault();
        if (!session) return;
        setCheckoutLoading(true);
        try {
            const res = await fetch(API_ENDPOINTS.STRIPE_CHECKOUT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'credits',
                    credits: parseInt(creditsToAdd, 10),
                    userId: session.user.id,
                    email: session.user.email,
                }),
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            }
        } catch (err) {
            console.error('Checkout error:', err);
        } finally {
            setCheckoutLoading(false);
        }
    };

    const handleUpgradeToPro = async () => {
        if (!session) return;
        setCheckoutLoading(true);
        try {
            const res = await fetch(API_ENDPOINTS.STRIPE_CHECKOUT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'subscription',
                    billingPeriod,
                    userId: session.user.id,
                    email: session.user.email,
                }),
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            }
        } catch (err) {
            console.error('Checkout error:', err);
        } finally {
            setCheckoutLoading(false);
        }
    };

    const handleManageSubscription = async () => {
        if (!session) return;
        setCheckoutLoading(true);
        try {
            const res = await fetch(API_ENDPOINTS.STRIPE_PORTAL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: session.user.id }),
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            }
        } catch (err) {
            console.error('Portal session error:', err);
        } finally {
            setCheckoutLoading(false);
        }
    };

    // Determine button(s) based on subscription tier and selected billing tab
    // Returns { primary, secondary? } where each has { text, action, disabled, style }
    const getUpgradeButtons = () => {
        if (!isPro) {
            return { primary: { text: 'Upgrade to Pro', action: handleUpgradeToPro, disabled: false, style: 'pri' } };
        }

        const cancelText = isCancelling ? 'Reactivate' : 'Cancel plan';

        if (subscriptionTier === 'monthly') {
            if (billingPeriod === 'monthly') return {
                secondary: { text: cancelText, action: handleManageSubscription, disabled: false, style: 'sec' },
                primary: { text: 'Be a lifetime member', action: handleUpgradeToPro, disabled: false, style: 'pri' },
            };
            if (billingPeriod === 'annual') return {
                primary: { text: 'Switch to annual', action: handleManageSubscription, disabled: false, style: 'pri' },
            };
            if (billingPeriod === 'lifetime') return {
                primary: { text: 'Be a lifetime member', action: handleUpgradeToPro, disabled: false, style: 'pri' },
            };
        }

        if (subscriptionTier === 'annual') {
            if (billingPeriod === 'monthly') return {
                primary: { text: cancelText, action: handleManageSubscription, disabled: false, style: 'sec' },
            };
            if (billingPeriod === 'annual') return {
                secondary: { text: cancelText, action: handleManageSubscription, disabled: false, style: 'sec' },
                primary: { text: 'Switch to monthly', action: handleManageSubscription, disabled: false, style: 'pri' },
            };
            if (billingPeriod === 'lifetime') return {
                primary: { text: 'Be a lifetime member', action: handleUpgradeToPro, disabled: false, style: 'pri' },
            };
        }

        return { primary: { text: 'Current plan', action: null, disabled: true, style: 'sec' } };
    };

    const buttons = getUpgradeButtons();

    // Plan info text based on subscription status
    const getPlanInfoText = () => {
        if (subscriptionTier === 'lifetime') {
            return { label: 'Lifetime Pro', description: "You're a Lifetime Pro member. Enjoy unlimited recipe saves forever!" };
        }
        if (isPro) {
            return { label: `Pro (${subscriptionTier})`, description: 'Unlimited recipe saves. Enjoy cooking without limits!' };
        }
        return { label: 'Free', description: 'Generate recipes for free. Credits are only used when you save.' };
    };

    const planInfo = getPlanInfoText();

    if (userLoading) {
        return (
            <div className="page">
                <NewNavbar
                    showBackButton
                    onBackClick={() => navigate('/menu')}
                    onLogoClick={() => navigate('/')}
                />
                <div className="main-content">
                    <div className="container layout-sm">
                        <div className="shimmer-line" style={{ width: '100px', height: '32px', borderRadius: '8px', marginBottom: '16px' }} />
                        <div className="shimmer-card" style={{ height: '80px', borderRadius: '16px' }} />
                        <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div className="shimmer-line" style={{ width: '140px', height: '24px' }} />
                                <div className="shimmer-line" style={{ width: '200px', height: '36px', borderRadius: '200px' }} />
                            </div>
                            <div className="shimmer-card" style={{ height: '320px', borderRadius: '24px' }} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <NewNavbar
                showBackButton
                onBackClick={() => navigate('/menu')}
                onLogoClick={() => navigate('/')}
            />
            <div className="main-content">
                <div className="container layout-sm">
                    {successMessage && (
                        <div className="success-banner text-lg" style={{
                            background: '#E8F5E9', color: '#2E7D32', padding: '12px 16px',
                            borderRadius: '12px', marginBottom: '16px', textAlign: 'center'
                        }}>
                            {successMessage}
                        </div>
                    )}
                    <div className="page-title text-title">Plans</div>
                    {!isPro && (
                    <div className="credit-balance-card">
                        <div className="credit-balance-info">
                        <div className="credit-balance-title">
                        <h3 className="text-lg">Credit balance</h3>
                        <div className="tooltip">
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <g clipPath="url(#clip0_618_16710)">
                                    <path d="M6.99984 9.33335V7.00002M6.99984 4.66669H7.00567M12.8332 7.00002C12.8332 10.2217 10.2215 12.8334 6.99984 12.8334C3.77818 12.8334 1.1665 10.2217 1.1665 7.00002C1.1665 3.77836 3.77818 1.16669 6.99984 1.16669C10.2215 1.16669 12.8332 3.77836 12.8332 7.00002Z" stroke="#1E1E1E" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
                                </g>
                                <defs>
                                    <clipPath id="clip0_618_16710">
                                        <rect width="14" height="14" fill="white"/>
                                    </clipPath>
                                </defs>
                            </svg>
                            <span className="tooltiptext text-sm">Credits are used to save recipes</span>
                        </div>
                        </div>
                        <div className="credit-amount title"><span id="credit-amount">{credits ?? '...'}</span> cr.</div>
                    </div>
                    <img src="/COIN-ILLO.svg" alt="Credit Coin" className="credit-coin" />
                    <div className="credit-action">
                        <button className="md-button text-lg" id="add-credits" onClick={() => setIsCreditsModalOpen(true)}>Add credits</button>
                        </div>
                    </div>
                    )}
                    <button className="current-plan-card" onClick={() => navigate(location.state?.origin || '/')} style={{border: 'none', cursor: 'pointer', textAlign: 'left'}}>
                        <div className="current-plan-details">
                        <h3 className="plan-info text-lg">You're currently on <span className="current-plan">{planInfo.label}</span></h3>
                        <p className="text-sm" style={{color: '#737373'}}>
                            {planInfo.description}
                        </p>
                        </div>
                        <div className="plan-action">
                            <button className="text-sm" id="start-cooking">Start cooking <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3.3335 8.00016H12.6668M12.6668 8.00016L8.00016 3.3335M12.6668 8.00016L8.00016 12.6668" stroke="#F04DCC" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            </button>
                        </div>
                    </button>
                    {subscriptionTier !== 'lifetime' && (
                    <div className="membership-section">
                        <div className="section-header">
                            <h2 className="section-title text-subtitle">Membership</h2>
                            <div className="segmented-controls billing-controls" data-active={billingPeriod}>
                                <input
                                    id="monthly"
                                    name="billing"
                                    type="radio"
                                    checked={billingPeriod === 'monthly'}
                                    onChange={() => handleBillingChange('monthly')}
                                />
                                <label htmlFor="monthly">Monthly</label>
                                <input
                                    id="annual"
                                    name="billing"
                                    type="radio"
                                    checked={billingPeriod === 'annual'}
                                    onChange={() => handleBillingChange('annual')}
                                />
                                <label htmlFor="annual">Annual</label>
                                <input
                                    id="lifetime"
                                    name="billing"
                                    type="radio"
                                    checked={billingPeriod === 'lifetime'}
                                    onChange={() => handleBillingChange('lifetime')}
                                />
                                <label htmlFor="lifetime">Lifetime</label>
                            </div>
                        </div>
                        {isCancelling && cancellationDate && (
                            <div className="validation-box text-lg">
                                Your subscription will be cancelled on {formatDate(cancellationDate)}.
                            </div>
                        )}
                        {!isCancelling && pendingPlanChange && (
                            <div className="validation-box text-lg">
                                Your membership will be updated to {pendingPlanChange.newPrice} on {formatDate(pendingPlanChange.effectiveDate)}.
                            </div>
                        )}
                        <div className="plan-card">
                            <div className="plan-name">
                                <h2 className="text-subtitle">Pro</h2>
                                <p className="text-lg" style={{color: "#737373"}}>For people who enjoy trying and learning new recipes without limits.</p>
                            </div>
                            <div className="plan-pricing">
                                {billingPeriod === 'monthly' && <div className="price text-title">$4.99 / month</div>}
                                {billingPeriod === 'annual' && <div className="price text-title">$39.99 / year</div>}
                                {billingPeriod === 'lifetime' && <div className="price text-title">$59.99</div>}
                            </div>
                            <div className="plan-benefits">
                                <ul className="benefits-list">
                                    <li className="benefits text-lg"> <svg width="27" height="27" viewBox="0 0 27 27" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <rect width="27" height="27" rx="13.5" fill="#FFD5F6"/>
                                        <path d="M19.5 9L11.25 17.25L7.5 13.5" stroke="#F04DCC" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                                        </svg> Everything in Free</li>
                                    <li className="benefits text-lg"> <svg width="27" height="27" viewBox="0 0 27 27" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <rect width="27" height="27" rx="13.5" fill="#FFD5F6"/>
                                        <path d="M19.5 9L11.25 17.25L7.5 13.5" stroke="#F04DCC" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                                        </svg> Unlimited recipe saves</li>
                                    <li className="benefits text-lg"> <svg width="27" height="27" viewBox="0 0 27 27" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <rect width="27" height="27" rx="13.5" fill="#FFD5F6"/>
                                        <path d="M19.5 9L11.25 17.25L7.5 13.5" stroke="#F04DCC" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                                        </svg> Access to speech features</li>
                                    <li className="benefits text-lg"><svg width="27" height="27" viewBox="0 0 27 27" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <rect width="27" height="27" rx="13.5" fill="#FFD5F6"/>
                                        <path d="M19.5 9L11.25 17.25L7.5 13.5" stroke="#F04DCC" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                                        </svg> Early access to new features</li>
                                </ul>
                            </div>
                            <div className="plan-action" style={{ display: 'flex', gap: '8px' }}>
                                {buttons.secondary && (
                                    <button
                                        className="sec-button text-lg"
                                        style={{ flex: 1 }}
                                        onClick={buttons.secondary.action}
                                        disabled={checkoutLoading || buttons.secondary.disabled}
                                    >
                                        {checkoutLoading ? 'Loading...' : buttons.secondary.text}
                                    </button>
                                )}
                                <button
                                    className={`${buttons.primary.style === 'pri' ? 'pri-button' : 'sec-button'} text-lg`}
                                    id="upgrade-button"
                                    style={buttons.secondary ? { flex: 1 } : undefined}
                                    onClick={buttons.primary.action}
                                    disabled={checkoutLoading || buttons.primary.disabled}
                                >
                                    {checkoutLoading ? 'Loading...' : buttons.primary.text}
                                </button>
                            </div>
                        </div>
                    </div>
                    )}
                    <div className='faq'>
                        <h2 className="text-subtitle">Frequently Asked Questions</h2>
                        <div className="faq-list">
                        <div className={`faq-item ${openFaqs.has(0) ? 'open' : ''}`} onClick={() => toggleFaq(0)}>
                            <div className='faq-wrapper'><h3 className="faq-question text-lg">What does "saving a recipe" mean?</h3><svg className="faq-icon" width="29" height="29" viewBox="0 0 29 29" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M19.5 17L14.5 12L9.5 17" stroke="#757575" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            </div>
                            <p className="faq-answer text-lg" style={{color: '#737373'}}>Saving adds the recipe to your personal YesCheff collection so you can come back to it anytime.</p>
                        </div>
                        <div className={`faq-item ${openFaqs.has(3) ? 'open' : ''}`} onClick={() => toggleFaq(3)}>
                            <div className='faq-wrapper'><h3 className="faq-question text-lg">What happens when I run out of credits?</h3><svg className="faq-icon" width="29" height="29" viewBox="0 0 29 29" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M19.5 17L14.5 12L9.5 17" stroke="#757575" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            </div>
                            <p className="faq-answer text-lg" style={{color: '#737373'}}>When you run out of credits, you won't be able to save new recipes until you either purchase more credits or upgrade to become a member. You'll still have access to all your saved recipes.</p>
                        </div>
                        <div className={`faq-item ${openFaqs.has(1) ? 'open' : ''}`} onClick={() => toggleFaq(1)}>
                            <div className='faq-wrapper'><h3 className="faq-question text-lg">Do I need a subscription to use YesCheff?</h3><svg className="faq-icon" width="29" height="29" viewBox="0 0 29 29" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M19.5 17L14.5 12L9.5 17" stroke="#757575" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            </div>
                            <p className="faq-answer text-lg" style={{color: '#737373'}}>No. You can use YesCheff without a subscription to generated unlimited recipes. Subscriptions simply unlock the ability to save unlimited recipes.</p>
                        </div>
                        <div className={`faq-item ${openFaqs.has(2) ? 'open' : ''}`} onClick={() => toggleFaq(2)}>
                            <div className='faq-wrapper'><h3 className="faq-question text-lg">Can I switch plans later?</h3><svg className="faq-icon" width="29" height="29" viewBox="0 0 29 29" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M19.5 17L14.5 12L9.5 17" stroke="#757575" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            </div>
                            <p className="faq-answer text-lg" style={{color: '#737373'}}>Yes. You can join or cancel your membership at any time.</p>
                        </div>
                        <div className={`faq-item ${openFaqs.has(4) ? 'open' : ''}`} onClick={() => toggleFaq(4)}>
                            <div className='faq-wrapper'><h3 className="faq-question text-lg">How can I unsubscribe?</h3><svg className="faq-icon" width="29" height="29" viewBox="0 0 29 29" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M19.5 17L14.5 12L9.5 17" stroke="#757575" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            </div>
                            <p className="faq-answer text-lg" style={{color: '#737373'}}>You can cancel your subscription at any time by clicking "Cancel subscription" within your membership bucket. Your membership will remain active until the end of your current billing period, and you won't be charged again.</p>
                        </div>
                        </div>
                    </div>
                    <Modal
                        title={"Add credits"}
                        subtitle={"Purchase additional credits to save more recipes."}
                        isOpen={isCreditsModalOpen}
                        onClose={() => setIsCreditsModalOpen(false)}
                        content={ <form className='form' onSubmit={handleBuyCredits}>
                                <div className='addcredits-container'>
                                    <label className="addcr-header" htmlFor="credits-input" id="credits-label">
                                        <p className='text-lg'>Credits to add</p>
                                        <p className='text-sm content-sec-color'>Min. 10 credits</p>
                                    </label>
                                    <div className='credit-controls' role="group" aria-labelledby="credits-label">
                                        <button
                                            type="button"
                                            className="servings-button icon-button"
                                            id="decrease-credit"
                                            onClick={decreaseCredits}
                                            onMouseDown={(e) => e.preventDefault()}
                                            disabled={parseInt(creditsToAdd, 10) <= 10}
                                            aria-label="Decrease credits by 10"
                                        >
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M6 13V11H18V13H6Z" fill="#1D1B20"/>
                                            </svg>
                                        </button>
                                        <div className='creditinput-wrapper'>
                                            <p className='cr-symbol text-lg content-sec-color' aria-hidden="true">cr.</p>
                                            <input
                                                type='number'
                                                id="credits-input"
                                                min="10"
                                                step="10"
                                                value={creditsToAdd}
                                                onChange={handleCreditsChange}
                                                onBlur={handleCreditsBlur}
                                                className='text-input text-subtitle'
                                                style={{textAlign: "center"}}
                                                aria-describedby="credits-label"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            className="servings-button icon-button"
                                            id="increase-credits"
                                            onClick={increaseCredits}
                                            onMouseDown={(e) => e.preventDefault()}
                                            aria-label="Increase credits by 10"
                                        >
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M11 13H5V11H11V5H13V11H19V13H13V19H11V13Z" fill="#1D1B20"/>
                                            </svg>
                                        </button>
                                    </div> </div>
                                    <div className='addcredits-container'>
                                    <label className="addcr-header" htmlFor="cost-input" id="cost-label">
                                        <p className='text-lg'>Cost</p>
                                        <p className='text-sm content-sec-color'>Min. $2.00</p>
                                    </label>
                                    <div className='credit-controls' role="group" aria-labelledby="cost-label">
                                        <div className='creditinput-wrapper'>
                                            <p className='dollar-symbol text-subtitle' aria-hidden="true">$</p>
                                            <input
                                                type='number'
                                                id="cost-input"
                                                min="2"
                                                step="2"
                                                value={costAmount}
                                                onChange={handleCostChange}
                                                onBlur={handleCostBlur}
                                                className='text-input text-subtitle'
                                                style={{textAlign: "right"}}
                                                aria-describedby="cost-label"
                                            />
                                        </div>
                                </div>
                                </div>
                                 <div className="form-footer" style={{alignItems: "center"}}>
                            <input
                                className="pri-button text-lg"
                                type="submit"
                                value={checkoutLoading ? "Loading..." : "Buy credits"}
                                disabled={checkoutLoading}
                            />
                            <p className='text-sm content-sec-color'>Secure checkout powered by Stripe</p>
                        </div>
                                </form>
                        }
                    />
                </div>
            </div>
        </div>
    );
}

export default Plans;
