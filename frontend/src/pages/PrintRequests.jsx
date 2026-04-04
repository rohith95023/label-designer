import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { useToast } from '../components/common/ToastContext';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import AppLayout from '../components/common/AppLayout';

const PrintRequests = () => {
  const [requests, setRequests] = useState([]);
  const [labels, setLabels] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { addToast: showToast } = useToast();
  const { user } = useAuth();

  // Form State
  const [formData, setFormData] = useState({
    labelId: '',
    labelStockId: '',
    quantity: 1,
    printerName: 'Default Printer'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reqData, labelData, stockData] = await Promise.all([
        api.getMyPrintRequests(),
        api.getLabels('ACTIVE'),
        api.getLabelStocks()
      ]);
      setRequests(reqData);
      setLabels(labelData);
      setStocks(stockData.filter(s => s.status === 'ACTIVE'));
    } catch (err) {
      console.error('Fetch failed', err);
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.labelId || !formData.labelStockId) {
      showToast('Please select both label and stock', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.createPrintRequest({
        label: { id: formData.labelId },
        labelStock: { id: formData.labelStockId },
        quantity: formData.quantity,
        printerName: formData.printerName
      });
      showToast('Print request submitted ✓', 'success');
      setShowCreateModal(false);
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit request';
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED': return 'bg-[var(--color-success-container)] text-[var(--color-success)] border border-[var(--color-success)]/10';
      case 'PENDING': return 'bg-[var(--color-primary-light)] text-[var(--color-primary-dark)] border border-[var(--color-primary-dark)]/10';
      case 'IN_PROGRESS': return 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20';
      case 'FAILED': return 'bg-[var(--color-error-container)] text-[var(--color-error)] border border-[var(--color-error)]/10';
      default: return 'bg-white text-[var(--color-on-surface-variant)] border border-[var(--color-secondary)]/10';
    }
  };

  return (
    <AppLayout activePage="print">
      <div className="p-6 lg:p-10 pb-24 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <motion.div 
        className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-[24px] bg-[var(--color-primary-dark)] flex items-center justify-center text-white shadow-2xl shadow-[var(--color-primary-dark)]/20 border border-white/10">
              <span className="material-symbols-outlined text-[32px]">print</span>
            </div>
            <div>
              <p className="text-[var(--color-primary)] font-black text-[10px] uppercase tracking-[0.3em] mb-1 opacity-60">Logistics & Compliance</p>
              <h1 className="text-3xl md:text-4xl font-black text-[var(--color-primary-dark)] tracking-tighter">Print Center</h1>
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-3 px-8 py-4 bg-[var(--color-primary-dark)] hover:bg-[var(--color-primary)] text-white rounded-2xl shadow-xl shadow-[var(--color-primary-dark)]/10 transition-all font-black uppercase tracking-widest text-[11px] active:scale-95 group"
        >
          <span className="material-symbols-outlined text-[20px] group-hover:rotate-90 transition-transform">add</span>
          Initialize Print Job
        </button>
      </motion.div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {[
          { label: 'Pending Queue', value: requests.filter(r => r.status === 'PENDING').length, icon: 'pending_actions', color: 'text-[var(--color-primary)]', bg: 'bg-[var(--color-primary-light)]/40', border: 'border-[var(--color-primary-dark)]/5' },
          { label: 'Fulfilled Jobs', value: requests.filter(r => r.status === 'COMPLETED').length, icon: 'verified', color: 'text-[var(--color-primary-dark)]', bg: 'bg-[var(--color-primary-light)]/40', border: 'border-[var(--color-primary-dark)]/5' },
          { label: 'Active Channels', value: 2, icon: 'print_connect', color: 'text-[var(--color-primary)]', bg: 'bg-[var(--color-primary-light)]/40', border: 'border-[var(--color-primary-dark)]/5' }
        ].map((stat, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`${stat.bg} p-8 rounded-[32px] border ${stat.border} shadow-sm backdrop-blur-md transition-all hover:shadow-2xl hover:shadow-[var(--color-primary-dark)]/5 group`}
          >
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--color-on-surface-variant)]/40 mb-2">{stat.label}</span>
                <span className="text-4xl font-black text-[var(--color-primary-dark)] tabular-nums">{stat.value}</span>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500">
                <span className={`material-symbols-outlined text-[28px] ${stat.color}`}>{stat.icon}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Requests Table */}
      <motion.div 
        className="bg-white/60 backdrop-blur-xl border border-[var(--color-secondary)]/10 rounded-[32px] overflow-hidden shadow-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="p-8 border-b border-[var(--color-secondary)]/5 bg-[var(--color-primary-dark)] flex items-center justify-between">
           <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white flex items-center gap-3">
             <span className="material-symbols-outlined text-[20px]">history</span>
             Global Print Queue Integrity
           </h3>
           <button onClick={fetchData} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-all group">
             <span className="material-symbols-outlined text-[20px] group-active:rotate-180 transition-transform duration-500">refresh</span>
           </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-secondary)]/5">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Reference / Integrity</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Clinical Asset</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Media Substrate</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Batch Size</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Monitoring</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-secondary)]/5">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-8 py-32 text-center">
                    <div className="flex flex-col items-center opacity-20">
                       <span className="material-symbols-outlined text-[64px] mb-4">print_disabled</span>
                       <span className="text-[12px] font-black uppercase tracking-[0.3em]">No active print jobs in queue</span>
                    </div>
                  </td>
                </tr>
              ) : requests.map((req, idx) => (
                <motion.tr 
                  key={req.id} 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 + 0.4 }}
                  className="hover:bg-[var(--color-primary-light)]/40 transition-all cursor-default group"
                >
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-[var(--color-primary)] uppercase tracking-tighter mb-0.5">#{req.id.slice(0, 8)}</span>
                      <span className="text-[13px] font-black text-[var(--color-primary-dark)]">
                        {format(new Date(req.requestedAt), 'MMM dd | HH:mm')}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-dark)] flex items-center justify-center text-white/20 group-hover:bg-[var(--color-primary)] group-hover:text-white transition-all shadow-lg shadow-black/5">
                        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
                      </div>
                      <span className="text-[14px] font-black text-[var(--color-primary-dark)] uppercase tracking-tight">{req.label.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-[13px] font-black text-[var(--color-primary-dark)]">{req.labelStock.name}</span>
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{req.labelStock.stockId}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="inline-block px-4 py-1 bg-[var(--color-secondary)]/5 rounded-full text-[12px] font-black tabular-nums text-[var(--color-primary-dark)]">{req.quantity} Labels</span>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${getStatusColor(req.status)}`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button className="w-10 h-10 rounded-xl text-[var(--color-on-surface-variant)]/40 hover:text-[var(--color-primary)] hover:bg-white transition-all opacity-0 group-hover:opacity-100 shadow-sm flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]">analytics</span>
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
              onClick={() => setShowCreateModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-[var(--color-background)] rounded-[40px] shadow-[0_32px_120px_rgba(56,36,13,0.3)] border border-white/40 overflow-hidden"
            >
              <div className="p-10">
                <div className="flex items-center justify-between mb-10">
                  <div className="flex flex-col">
                    <p className="text-[var(--color-primary)] font-black text-[10px] uppercase tracking-[0.3em] mb-1 opacity-60">Job Initialization</p>
                    <h2 className="text-2xl font-black text-[var(--color-primary-dark)] tracking-tighter">Queue New Print</h2>
                  </div>
                  <button onClick={() => setShowCreateModal(false)} className="w-12 h-12 rounded-2xl flex items-center justify-center text-[var(--color-primary-dark)]/40 hover:bg-[var(--color-primary-dark)]/5 hover:text-[var(--color-primary-dark)] transition-all">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Design Selection */}
                  <div className="flex flex-col gap-3">
                    <label className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--color-on-surface-variant)] opacity-40">1. Required Label Design</label>
                    <div className="relative group">
                      <select
                        value={formData.labelId}
                        onChange={e => setFormData({ ...formData, labelId: e.target.value })}
                        className="w-full h-16 bg-white border border-[var(--color-secondary)]/10 rounded-2xl px-6 text-[14px] font-black text-[var(--color-primary-dark)] outline-none focus:ring-4 focus:ring-[var(--color-primary)]/10 focus:border-[var(--color-primary)] transition-all appearance-none cursor-pointer"
                      >
                        <option value="">-- Choose Medically Validated Design --</option>
                        {labels.map(l => (
                          <option key={l.id} value={l.id}>{l.name} | {l.category || 'Standard'}</option>
                        ))}
                      </select>
                      <span className="material-symbols-outlined absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">expand_more</span>
                    </div>
                  </div>

                  {/* Stock Selection */}
                  <div className="flex flex-col gap-3">
                    <label className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--color-on-surface-variant)] opacity-40">2. Select Primary Media Substrate</label>
                    <div className="relative group">
                      <select
                        value={formData.labelStockId}
                        onChange={e => setFormData({ ...formData, labelStockId: e.target.value })}
                        className="w-full h-16 bg-white border border-[var(--color-secondary)]/10 rounded-2xl px-6 text-[14px] font-black text-[var(--color-primary-dark)] outline-none focus:ring-4 focus:ring-[var(--color-primary)]/10 focus:border-[var(--color-primary)] transition-all appearance-none cursor-pointer"
                      >
                        <option value="">-- Choose Approved Material --</option>
                        {stocks.map(s => (
                          <option key={s.id} value={s.id}>{s.name} | {s.breadth}x{s.height}mm | {s.quantityOnHand} Left</option>
                        ))}
                      </select>
                      <span className="material-symbols-outlined absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">expand_more</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    {/* Quantity */}
                    <div className="flex flex-col gap-3">
                      <label className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--color-on-surface-variant)] opacity-40">3. Print Quantity</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.quantity}
                        onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                        className="w-full h-16 bg-white border border-[var(--color-secondary)]/10 rounded-2xl px-6 text-[16px] font-black text-[var(--color-primary-dark)] outline-none focus:ring-4 focus:ring-[var(--color-primary)]/10 focus:border-[var(--color-primary)] transition-all tabular-nums"
                      />
                    </div>
                    {/* Printer */}
                    <div className="flex flex-col gap-3">
                      <label className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--color-on-surface-variant)] opacity-40">4. Print Fulfillment Node</label>
                      <div className="relative group">
                        <select
                          value={formData.printerName}
                          onChange={e => setFormData({ ...formData, printerName: e.target.value })}
                          className="w-full h-16 bg-white border border-[var(--color-secondary)]/10 rounded-2xl px-6 text-[14px] font-black text-[var(--color-primary-dark)] outline-none focus:ring-4 focus:ring-[var(--color-primary)]/10 focus:border-[var(--color-primary)] transition-all appearance-none cursor-pointer"
                        >
                          <option value="ZEBRA-ZT411-MAIN">Main Factory Node (Zebra)</option>
                          <option value="SATO-CL4NX-LAB">R&D Lab Node (Sato)</option>
                          <option value="BROTHER-TD4D-EXP">External Logistics (Brother)</option>
                        </select>
                        <span className="material-symbols-outlined absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">expand_more</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-20 bg-[var(--color-primary-dark)] hover:bg-[var(--color-primary)] text-white rounded-[24px] shadow-2xl shadow-[var(--color-primary-dark)]/20 flex items-center justify-center gap-4 transition-all font-black uppercase tracking-[0.2em] text-[12px] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none group"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-6 h-6 rounded-full border-4 border-white/20 border-t-white animate-spin"></div>
                          <span className="opacity-60">Synchronizing...</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">send_to_mobile</span>
                          Finalize Design & Queue Production
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>
    </AppLayout>
  );
};

export default PrintRequests;
