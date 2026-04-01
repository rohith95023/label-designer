import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../../services/api';
import AppLayout from '../../components/common/AppLayout';
import { useToast } from '../../components/common/ToastContext';
import './LabelStocks.css';

const PhrasesTranslations = () => {
  const initialized = useRef(false);
  const [phrases, setPhrases] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [translations, setTranslations] = useState({}); // { phraseId: { langCode: text } }
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ id: null, phraseKey: '', defaultText: '' });
  const [searchQuery, setSearchQuery] = useState('');

  const { success, error: toastError } = useToast();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [phData, lnData, trData] = await Promise.all([
        api.getPhrases(),
        api.getLanguages(),
        api.getTranslations()
      ]);
      setPhrases(phData);
      setLanguages(lnData.filter(l => l.status === 'ACTIVE'));
      
      const trMap = {};
      trData.forEach(t => {
        if (!trMap[t.phrase.id]) trMap[t.phrase.id] = {};
        trMap[t.phrase.id][t.language.code] = { id: t.id, text: t.translatedText };
      });
      setTranslations(trMap);
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to load phrases and translations.');
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    if (!initialized.current) {
      fetchData();
      initialized.current = true;
    }
  }, [fetchData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openAddModal = () => {
    setIsEditing(false);
    setFormData({ id: null, phraseKey: '', defaultText: '' });
    setShowModal(true);
  };

  const openEditModal = (ph) => {
    setIsEditing(true);
    setFormData(ph);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      if (isEditing) {
        const updated = await api.updatePhrase(formData.id, formData);
        setPhrases(prev => prev.map(p => p.id === updated.id ? updated : p));
        success(`Phrase "${formData.phraseKey}" updated.`);
      } else {
        const created = await api.createPhrase(formData);
        setPhrases(prev => [...prev, created]);
        success(`Phrase "${formData.phraseKey}" created.`);
      }
      closeModal();
    } catch (err) {
      toastError('Failed to save phrase.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTranslationChange = async (phraseId, langId, langCode, value) => {
    try {
      const existing = translations[phraseId]?.[langCode];
      if (existing) {
        const updated = await api.updateTranslation(existing.id, {
          phrase: { id: phraseId },
          language: { id: langId },
          translatedText: value
        });
        setTranslations(prev => ({
          ...prev,
          [phraseId]: {
            ...prev[phraseId],
            [langCode]: { id: updated.id, text: updated.translatedText }
          }
        }));
      } else {
        const created = await api.createTranslation({
          phrase: { id: phraseId },
          language: { id: langId },
          translatedText: value
        });
        setTranslations(prev => ({
          ...prev,
          [phraseId]: {
            ...prev[phraseId],
            [langCode]: { id: created.id, text: created.translatedText }
          }
        }));
      }
      success('Translation updated.');
    } catch (err) {
      toastError('Failed to update translation.');
    }
  };

  const filtered = phrases.filter(p => 
    p.phraseKey.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.defaultText.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout activePage="masters">
      <div className="um-container animate-fade-in">
        <div className="um-header">
          <div className="um-header-left">
            <div className="um-header-icon" style={{ background: 'var(--um-secondary-container)' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--um-secondary)' }}>language</span>
            </div>
            <div>
              <h1>Phrases & Translations</h1>
              <p>Manage multi-language static text for label templates</p>
            </div>
          </div>
          <button className="um-add-btn" onClick={openAddModal}>
            <span className="material-symbols-outlined">add</span>
            New Phrase
          </button>
        </div>

        <div className="um-filter-bar">
          <div className="um-search-wrap">
            <span className="um-search-icon material-symbols-outlined">search</span>
            <input
              type="text"
              className="um-search-input"
              placeholder="Search phrases..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="um-table-card overflow-x-auto">
          {loading ? (
            <div className="um-loading-state"><div className="um-spinner" /></div>
          ) : (
            <table className="um-table min-w-[3000px]">
              <thead>
                <tr>
                  <th className="sticky left-0 bg-white z-10 w-64 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">Phrase Key / Default</th>
                  {languages.map(lang => (
                    <th key={lang.id} className="min-w-[200px]">{lang.name} ({lang.code})</th>
                  ))}
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(ph => (
                  <tr key={ph.id} className="um-row">
                    <td className="sticky left-0 bg-white z-10 w-64 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-xs bg-slate-100 px-2 py-0.5 rounded self-start">{ph.phraseKey}</span>
                        <span className="text-sm">{ph.defaultText}</span>
                      </div>
                    </td>
                    {languages.map(lang => (
                      <td key={lang.id}>
                        <textarea 
                          className="w-full text-xs p-2 border border-slate-200 rounded-lg outline-none focus:border-primary resize-none h-16"
                          placeholder={`Enter ${lang.name} translation...`}
                          defaultValue={translations[ph.id]?.[lang.code]?.text || ''}
                          onBlur={(e) => {
                            if (e.target.value !== (translations[ph.id]?.[lang.code]?.text || '')) {
                              handleTranslationChange(ph.id, lang.id, lang.code, e.target.value);
                            }
                          }}
                        />
                      </td>
                    ))}
                    <td>
                      <div className="um-actions" style={{ justifyContent: 'flex-end' }}>
                        <button className="um-action-btn" onClick={() => openEditModal(ph)}>
                          <span className="material-symbols-outlined">edit</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="um-modal-header">
              <h2>{isEditing ? 'Edit Phrase' : 'Add New Phrase'}</h2>
              <button className="um-modal-close" onClick={closeModal}><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Phrase Key *</label>
                  <input type="text" name="phraseKey" value={formData.phraseKey} onChange={handleInputChange} required placeholder="e.g., STATIC_WARNING_1" />
                </div>
                <div className="form-group">
                  <label>Default Text (English) *</label>
                  <textarea name="defaultText" value={formData.defaultText} onChange={handleInputChange} required rows="3" placeholder="Reference English text..." />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={closeModal}>Cancel</button>
                <button type="submit" className="um-add-btn" disabled={actionLoading}>
                  {actionLoading ? 'Saving...' : (isEditing ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default PhrasesTranslations;
