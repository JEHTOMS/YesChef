import React, { createContext, useContext, useState, useCallback } from 'react';

const ModalContext = createContext();

export const useModal = () => {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error('useModal must be used within a ModalProvider');
    }
    return context;
};

// Modal types
export const MODAL_TYPES = {
    UNSAVE_CONFIRM: 'UNSAVE_CONFIRM',
    AUTH: 'AUTH',
    // Add more modal types as needed
};

export const ModalProvider = ({ children }) => {
    const [activeModal, setActiveModal] = useState(null);
    const [modalData, setModalData] = useState(null);
    const [modalCallbacks, setModalCallbacks] = useState({});

    // Open a modal with optional data and callbacks
    const openModal = useCallback((modalType, data = null, callbacks = {}) => {
        setActiveModal(modalType);
        setModalData(data);
        setModalCallbacks(callbacks);
    }, []);

    // Close the current modal
    const closeModal = useCallback(() => {
        setActiveModal(null);
        setModalData(null);
        setModalCallbacks({});
    }, []);

    // Helper to open unsave confirmation modal
    const openUnsaveConfirmModal = useCallback((recipeName, recipeId, onConfirm) => {
        openModal(MODAL_TYPES.UNSAVE_CONFIRM, { recipeName, recipeId }, { onConfirm });
    }, [openModal]);

    // Helper to open auth modal
    const openAuthModal = useCallback((mode = 'signin', callbacks = {}) => {
        openModal(MODAL_TYPES.AUTH, { mode }, callbacks);
    }, [openModal]);

    // Confirm action for current modal
    const confirmModal = useCallback(() => {
        if (modalCallbacks.onConfirm) {
            modalCallbacks.onConfirm(modalData);
        }
        closeModal();
    }, [modalCallbacks, modalData, closeModal]);

    // Check if a specific modal is open
    const isModalOpen = useCallback((modalType) => {
        return activeModal === modalType;
    }, [activeModal]);

    const value = {
        activeModal,
        modalData,
        modalCallbacks,
        openModal,
        closeModal,
        confirmModal,
        isModalOpen,
        // Convenience methods
        openUnsaveConfirmModal,
        openAuthModal,
    };

    return (
        <ModalContext.Provider value={value}>
            {children}
        </ModalContext.Provider>
    );
};

export default ModalContext;
