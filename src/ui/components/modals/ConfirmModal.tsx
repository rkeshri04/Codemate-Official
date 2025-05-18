import React from 'react';
import { FiX, FiAlertTriangle } from 'react-icons/fi';
import './ConfirmModal.css';


const ConfirmModal: React.FC<ConfirmModalProps> = (props) => {
  if (!props.isOpen) return null;

  return (
    <div className="modal-overlay" onClick={(e) => {
      if (e.target === e.currentTarget) props.onCancel();
    }}>
      <div className="confirm-delete-modal">
        <div className="confirm-delete-icon">
          <FiAlertTriangle size={48} />
        </div>
        <h3>Delete {props.itemName}?</h3>
        <p>This action cannot be undone. The workflow and all associated actions and analytics data will be permanently deleted.</p>
        <div className="confirm-delete-buttons">
          <button className="cancel-btn" onClick={props.onCancel}>
            Cancel
          </button>
          <button className="delete-btn" onClick={props.onConfirm}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
