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
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-700';
      case 'PENDING': return 'bg-amber-100 text-amber-700';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-700';
      case 'FAILED': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <AppLayout activePage="print">
      <div className="p-6 lg:p-10 pb-24 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
              <span className="material-symbols-outlined text-[28px]">print</span>
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Print Center</h1>
              <p className="text-slate-500 font-medium text-sm">Industrial label queue & fulfillment</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-xl shadow-indigo-500/20 transition-all font-black uppercase tracking-widest text-[11px] active:scale-95"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          New Request
        </button>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {[
          { label: 'Pending Jobs', value: requests.filter(r => r.status === 'PENDING').length, icon: 'pending_actions', color: 'text-indigo-500', bg: 'bg-indigo-50', border: 'border-indigo-100' },
          { label: 'Completed Today', value: requests.filter(r => r.status === 'COMPLETED').length, icon: 'check_circle', color: 'text-indigo-500', bg: 'bg-indigo-50', border: 'border-indigo-100' },
          { label: 'Active Printers', value: 2, icon: 'print_connect', color: 'text-indigo-500', bg: 'bg-indigo-50', border: 'border-indigo-100' }
        ].map((stat, i) => (
          <div key={i} className={`${stat.bg} p-6 rounded-3xl border ${stat.border} shadow-sm transition-all hover:shadow-md`}>
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{stat.label}</span>
                <span className="text-3xl font-black text-slate-800 tabular-nums">{stat.value}</span>
              </div>
              <span className={`material-symbols-outlined text-[32px] ${stat.color} opacity-60`}>{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
           <h3 className="text-[12px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
             <span className="material-symbols-outlined text-[18px]">history</span>
             Recent Requests
           </h3>
           <button onClick={fetchData} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all">
             <span className="material-symbols-outlined text-[18px]">refresh</span>
           </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Request ID / Date</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Label Design</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Stock Media</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Qty</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center opacity-30">
                       <span className="material-symbols-outlined text-[48px] mb-2">print_disabled</span>
                       <span className="text-sm font-bold uppercase tracking-widest">No print requests found</span>
                    </div>
                  </td>
                </tr>
              ) : requests.map(req => (
                <tr key={req.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-mono font-bold text-slate-400 mb-1">#{req.id.slice(0, 8)}</span>
                      <span className="text-[12px] font-bold text-slate-700">
                        {format(new Date(req.requestedAt), 'MMM dd, HH:mm')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                        <span className="material-symbols-outlined text-[16px]">sticky_note_2</span>
                      </div>
                      <span className="text-sm font-black text-slate-800 uppercase tracking-tight">{req.label.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-[12px] font-bold text-slate-700">{req.labelStock.name}</span>
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">{req.labelStock.stockId}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-3 py-1 bg-slate-100 rounded-lg text-sm font-black tabular-nums">{req.quantity}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${getStatusColor(req.status)}`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 rounded-lg text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 transition-all opacity-0 group-hover:opacity-100">
                      <span className="material-symbols-outlined text-[20px]">info</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
              className="relative w-full max-w-xl bg-white rounded-[32px] shadow-2xl border border-white/20 overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex flex-col">
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">New Print Job</h2>
                    <p className="text-sm text-slate-500 font-medium tracking-tight">Specify design and media requirements</p>
                  </div>
                  <button onClick={() => setShowCreateModal(false)} className="w-10 h-10 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Design Selection */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">1. Select Label Design</label>
                    <select
                      value={formData.labelId}
                      onChange={e => setFormData({ ...formData, labelId: e.target.value })}
                      className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-5 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none"
                    >
                      <option value="">-- Choose Label --</option>
                      {labels.map(l => (
                        <option key={l.id} value={l.id}>{l.name} ({l.category || 'Clinical'})</option>
                      ))}
                    </select>
                  </div>

                  {/* Stock Selection */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">2. Select Stock Media</label>
                    <select
                      value={formData.labelStockId}
                      onChange={e => setFormData({ ...formData, labelStockId: e.target.value })}
                      className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-5 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none"
                    >
                      <option value="">-- Choose Material --</option>
                      {stocks.map(s => (
                        <option key={s.id} value={s.id}>{s.name} [{s.breadth}x{s.height}mm] {s.quantityOnHand <= s.reorderLevel ? '⚠️ LOW' : ''}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Quantity */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">3. Print Quantity</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.quantity}
                        onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                        className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-5 text-sm font-black outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                      />
                    </div>
                    {/* Printer */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">4. Target Printer</label>
                      <select
                        value={formData.printerName}
                        onChange={e => setFormData({ ...formData, printerName: e.target.value })}
                        className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-5 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none"
                      >
                        <option value="ZEBRA-ZT411-MAIN">ZEBRA-ZT411 (Main)</option>
                        <option value="SATO-CL4NX-LAB">SATO-CL4NX (Lab)</option>
                        <option value="BROTHER-TD4D-EXP">BROTHER (Exp)</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-16 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-2xl shadow-indigo-500/30 flex items-center justify-center gap-3 transition-all font-black uppercase tracking-[0.15em] text-[12px] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined">send_to_mobile</span>
                          Finalize & Queue Job
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
