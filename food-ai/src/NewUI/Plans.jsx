import React, { useState } from 'react';
import '../pages/Home.css';
import '../index.css';
import NewNavbar from "./NewNavbar.jsx";
import '../pages/FoodO.css';
import '../pages/FoodInfo.css';
import './Plans.css';

function Plans() {
    const [billingPeriod, setBillingPeriod] = useState('monthly');
    const [openFaqs, setOpenFaqs] = useState(new Set());

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

    return (
        <div className="page">
            <NewNavbar 
                showBackButton
                onBackClick={() => window.history.back()}
                onLogoClick={() => window.location.href = '/home2'}
            />
            <div className="main-content">
                <div className="container layout-sm">
                    <div className="page-title text-title">Plans</div>
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
                        <div className="credit-amount title"><span id="credit-amount">20</span> cr.</div>
                    </div>
                    <img src="/COIN-ILLO.svg" alt="Credit Coin" className="credit-coin" />
                    <div className="credit-action">
                        <button className="md-button text-lg" id="add-credits">Add credits</button>
                        </div>
                    </div>
                    <a className="current-plan-card" href="./home2">
                        <div className="current-plan-details">
                        <h3 className="plan-info text-lg">You're currently on <span className="current-plan">Free</span></h3>
                        <p className="text-sm" style={{color: '#737373'}}>Generate recipes for free. Credits are only used when you save.</p>
                        </div>
                        <div className="plan-action">
                            <button className="text-sm" id="start-cooking">Start cooking <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3.3335 8.00016H12.6668M12.6668 8.00016L8.00016 3.3335M12.6668 8.00016L8.00016 12.6668" stroke="#F04DCC" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            </button>
                        </div>
                    </a>
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
                            <div className="plan-action">
                                <button className="pri-button text-lg" id="upgrade-button">Upgrade to Pro</button>
                            </div>
                        </div>
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
                                <p className="faq-answer text-lg" style={{color: '#737373'}}>When you run out of credits, you won’t be able to save new recipes until you either purchase more credits or upgrade to become a member. You’ll still have access to all your saved recipes.</p>
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
                            
                        </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Plans;