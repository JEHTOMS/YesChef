import React from 'react';
import { useModal, MODAL_TYPES } from '../context/ModalContext';
import Modal from './Modal';
import '../pages/Home.css';
import '../index.css';
import './Modal.css';

function UnsaveConfirmModal() {
    const { isModalOpen, modalData, confirmModal, closeModal } = useModal();

    if (!isModalOpen(MODAL_TYPES.UNSAVE_CONFIRM)) return null;

    const recipeName = modalData?.recipeName || 'this recipe';

    const content = (
        <div className="unsave-confirm-content">
            <div className="unsave-icon">
                <svg width="157" height="152" viewBox="0 0 157 152" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M41.2124 145.56C37.4587 147.943 32.6943 144.609 33.6486 140.266L42.8003 98.6201C43.1838 96.875 42.607 95.058 41.2873 93.8537L10.3728 65.641C7.16281 62.7116 8.96055 57.364 13.2883 56.9685L53.6745 53.2783C55.5439 53.1075 57.1601 51.904 57.8595 50.162L73.36 11.5563C75.0394 7.37361 80.9606 7.37362 82.64 11.5563L98.1405 50.162C98.8399 51.904 100.456 53.1075 102.326 53.2783L142.712 56.9685C147.039 57.364 148.837 62.7116 145.627 65.641L114.713 93.8537C113.393 95.058 112.816 96.875 113.2 98.6201L122.351 140.266C123.306 144.609 118.541 147.943 114.788 145.56L80.6802 123.902C79.0444 122.863 76.9556 122.863 75.3198 123.902L41.2124 145.56Z" fill="#ECECEC"/>
                    <path d="M7.64724 125.292L140.376 31.0002" stroke="#ECECEC" strokeWidth="10"/>
                    <path d="M15.6472 129.292L148.376 35.0002" stroke="white" strokeWidth="6"/>
                </svg>
            </div>
            <div className="unsave-text">
                <h3 className="text-subtitle">Unsave recipe?</h3>
                <p className="text-sm content-sec-color">
                    Are you sure you want to permanently delete &ldquo;<span className="content-pri-color">{recipeName}</span>&rdquo; from your collection?
                </p>
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
            <p className="text-sm content-sec-color" style={{ textAlign: 'center' }}>
                Credits will not be refunded.
            </p>
        </div>
    );

    return (
        <Modal
            title=""
            subtitle=""
            isOpen={true}
            onClose={closeModal}
            content={content}
        />
    );
}

export default UnsaveConfirmModal;
