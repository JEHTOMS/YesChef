import React from 'react';
import { useModal, MODAL_TYPES } from '../context/ModalContext';
import '../pages/Home.css';
import '../index.css';
import './Modal.css';

function UnsaveConfirmModal() {
    const { isModalOpen, modalData, confirmModal, closeModal } = useModal();

    if (!isModalOpen(MODAL_TYPES.UNSAVE_CONFIRM)) return null;

    const recipeName = modalData?.recipeName || 'this recipe';

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            closeModal();
        }
    };

    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className="unsave-confirm-container">
                <div className="unsave-confirm-content">
                    <div className="unsave-icon">
                        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect width="48" height="48" rx="24" fill="#FFF0FB"/>
                            <path d="M18.1654 34.5142C17.79 34.7525 17.3136 34.4191 17.409 33.9848L18.7142 28.0455C18.7526 27.871 18.6949 27.6893 18.5629 27.5688L14.1635 23.5539C13.8425 23.2609 14.0222 22.7262 14.455 22.6866L20.2216 22.1597C20.4086 22.1426 20.5702 22.0223 20.6401 21.8481L22.8622 16.3138C23.0301 15.8955 23.6222 15.8955 23.7902 16.3138L26.0122 21.8481C26.0822 22.0223 26.2438 22.1426 26.4307 22.1597L32.1973 22.6866C32.6301 22.7262 32.8099 23.2609 32.4889 23.5539L28.0894 27.5688C27.9575 27.6893 27.8998 27.871 27.9381 28.0455L29.2433 33.9848C29.3387 34.4191 28.8623 34.7525 28.4869 34.5142L23.5942 31.4073C23.4306 31.3035 23.2217 31.3035 23.0582 31.4073L18.1654 34.5142Z" stroke="#F04DCC" strokeWidth="2" fill="none"/>
                        </svg>
                    </div>
                    <div className="unsave-text">
                        <h3 className="text-subtitle">Unsave recipe?</h3>
                        <p className="text-sm content-sec-color">
                            Are you sure you want to unsave <strong>"{recipeName}"</strong>? 
                            You can always save it again later.
                        </p>
                    </div>
                </div>
                <div className="unsave-actions">
                    <button 
                        className="md2-button-sec text-lg cancel-btn"
                        onClick={closeModal}
                    >
                        Cancel
                    </button>
                    <button 
                        className="md2-button-pri text-lg unsave-btn"
                        onClick={confirmModal}
                    >
                        Unsave
                    </button>
                </div>
            </div>
        </div>
    );
}

export default UnsaveConfirmModal;
