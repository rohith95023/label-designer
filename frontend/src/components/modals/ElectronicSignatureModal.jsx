import React, { useState } from 'react';
import './ElectronicSignatureModal.css';

const ElectronicSignatureModal = ({ isOpen, onClose, onSign, actionType }) => {
  const [password, setPassword] = useState('');
  const [reason, setReason] = useState('Standard process compliance');
  const [meaning, setMeaning] = useState('APPROVED_FOR_RELEASE');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!password) {
      setError('Password is required for electronic signature.');
      return;
    }
    onSign({ password, reason, meaning });
    setPassword('');
    onClose();
  };

  const meanings = [
    { value: 'APPROVED_FOR_RELEASE', label: 'Approved for Release' },
    { value: 'REVIEW_COMPLETE', label: 'Review Complete' },
    { value: 'REJECTED', label: 'Rejected / Revision Required' },
    { value: 'MARKED_COMPLETE', label: 'Marked as Complete' }
  ];

  return (
    <div className="modal-overlay">
      <div className="esign-modal">
        <div className="esign-header">
          <h2>Electronic Signature</h2>
          <p>Action: {actionType}</p>
        </div>

        <form onSubmit={handleSubmit} className="esign-form">
          <div className="legal-notice">
            By signing this record, I acknowledge that this electronic signature 
            is the legally binding equivalent of my traditional handwritten signature.
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="esign-field">
            <label>Meaning of Signature</label>
            <select value={meaning} onChange={(e) => setMeaning(e.target.value)}>
              {meanings.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <div className="esign-field">
            <label>Reason for Action</label>
            <textarea 
              value={reason} 
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for this action..."
            />
          </div>

          <div className="esign-field">
            <label>Verify Identity (Password)</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your system password"
              autoFocus
            />
          </div>

          <div className="esign-actions">
            <button type="button" onClick={onClose} className="btn-cancel">Cancel</button>
            <button type="submit" className="btn-sign">Sign & Authenticate</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ElectronicSignatureModal;
