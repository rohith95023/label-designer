import React from 'react';

const ConfirmDeleteModal = ({ user, onConfirm, onCancel, loading }) => {
  if (!user) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="confirm-delete-modal"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-delete-title"
      >
        {/* Danger Header */}
        <div className="confirm-delete-header">
          <div className="danger-icon-wrap">
            <span className="material-symbols-outlined danger-icon">person_remove</span>
          </div>
          <h2 id="confirm-delete-title">Remove User Account</h2>
          <p>This action will deactivate the user and revoke all system access.</p>
        </div>

        {/* User Card */}
        <div className="confirm-user-card">
          <div className="confirm-user-avatar">
            {user.username?.charAt(0).toUpperCase()}
          </div>
          <div className="confirm-user-info">
            <span className="confirm-username">{user.username}</span>
            <span className="confirm-email">{user.email}</span>
            <span className={`role-badge role-${user.role?.toLowerCase()}`}>{user.role}</span>
          </div>
        </div>

        {/* Compliance Note */}
        <div className="confirm-compliance-note">
          <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--color-warning, #d97706)' }}>
            gpp_maybe
          </span>
          <p>
            Per <strong>FDA 21 CFR Part 11</strong>, this action will be recorded in the immutable audit trail. 
            Audit history and e-signature records are preserved.
          </p>
        </div>

        {/* Actions */}
        <div className="confirm-delete-actions">
          <button
            className="secondary-btn"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="danger-btn"
            onClick={() => onConfirm(user.id)}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="um-spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                <span>Removing...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">person_remove</span>
                Remove User
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;
