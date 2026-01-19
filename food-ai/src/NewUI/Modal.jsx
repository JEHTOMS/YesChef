import React, { useEffect, useRef } from "react";
import '../pages/Home.css';
import '../index.css';
import './Modal.css';

function Modal({ title, subtitle, content, isOpen, onClose }){
    const scrollYRef = useRef(0);

    // Disable body scroll when modal is open (mobile-friendly)
    useEffect(() => {
        if (isOpen) {
            // Save current scroll position
            scrollYRef.current = window.scrollY;
            
            // Apply styles to prevent scrolling on both html and body
            document.documentElement.style.overflow = 'hidden';
            document.documentElement.style.height = '100%';
            document.body.style.overflow = 'hidden';
            document.body.style.height = '100%';
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollYRef.current}px`;
            document.body.style.left = '0';
            document.body.style.right = '0';
            document.body.style.bottom = '0';
            
            // Prevent touchmove on document
            const preventTouchMove = (e) => {
                if (!e.target.closest('.modal-container')) {
                    e.preventDefault();
                }
            };
            document.addEventListener('touchmove', preventTouchMove, { passive: false });
            
            return () => {
                // Restore scroll position and styles
                document.documentElement.style.overflow = '';
                document.documentElement.style.height = '';
                document.body.style.overflow = '';
                document.body.style.height = '';
                document.body.style.position = '';
                document.body.style.top = '';
                document.body.style.left = '';
                document.body.style.right = '';
                document.body.style.bottom = '';
                window.scrollTo(0, scrollYRef.current);
                document.removeEventListener('touchmove', preventTouchMove);
            };
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose?.();
        }
    };

    return(
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className="modal-container">
                <div className="modal-header">
                    <div className="modal-header-text"><div className="modal-title text-subtitle">{title}</div>
                    <p className="modal-subtitle text-sm content-sec-color">{subtitle}</p>
                    </div>
                    <button className="icon-button" id="close-modal" onClick={onClose}><svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20.75 7.25L7.25 20.75M7.25 7.25L20.75 20.75" stroke="#1E1E1E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    </button>
                </div>
                <div className="modal-content-wrapper">
                    <div className="modal-content">
                        {content}
                </div>
                </div>
            </div>
        </div>
    )
}

export default Modal;