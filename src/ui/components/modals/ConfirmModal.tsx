import React from 'react';
import { FiX, FiAlertTriangle } from 'react-icons/fi';
import './ConfirmModal.css';


const ConfirmModal: React.FC<ConfirmModalProps> = (props) => {
  if (!props.isOpen) return null;

  if (props.type === 'logout') {
    return (
      <div className="modal-overlay" onClick={(e) => {
        if (e.target === e.currentTarget) props.onCancel();
      }}>
        <div className="modal-content logout-modal">
          <div className="modal-header">
            <h2>
              <FiAlertTriangle className="alert-icon" />
              Confirm Logout
            </h2>
            <button className="close-modal-btn" onClick={props.onCancel}>
              <FiX size={20} />
            </button>
          </div>
          <div className="modal-body">
            <p>Are you sure you want to log out? Your session will end.</p>
          </div>
          <div className="modal-footer">
            <button className="cancel-btn" onClick={props.onCancel}>
              Cancel
            </button>
            <button className="logout-confirm-btn" onClick={props.onConfirm}>
              Yes, Log Out
            </button>
          </div>
        </div>
      </div>
    );
  }

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
