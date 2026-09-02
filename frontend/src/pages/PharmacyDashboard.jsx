import React, { useState, useEffect, useCallback } from 'react';
import { deliveryAPI } from '../services/api';
import {
  Plus, Search, Filter, ChevronDown, Bell, Building, Cross,
  Thermometer, CreditCard, MapPin, Clock, AlertTriangle, CheckCircle2, PackageCheck, TrendingUp
} from 'lucide-react';

const PRIORITIES = ['Standard (4 Hours)', 'Express (2 Hours)', 'Urgent (1 Hour)', 'Overnight'];
const PAYMENT_OPTIONS = ['Pre-paid', 'Cash on Delivery', 'Insurance', 'NHIF'];

const statusColors = {
  PENDING: 'bg-amber-50 text-amber-800 border border-amber-200',
  ASSIGNED: 'bg-teal-50 text-teal-800 border border-teal-200',
  PICKED_UP: 'bg-blue-50 text-blue-800 border border-blue-200',
  OUT_FOR_DELIVERY: 'bg-violet-50 text-violet-800 border border-violet-200',
  DELIVERED: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
  CANCELLED: 'bg-red-50 text-red-800 border border-red-200',
};

const PharmacyDashboard = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');

  const [form, setForm] = useState({
    new_customer_name: '',
    new_customer_phone: '',
    item_description: '',
    delivery_address: '',
    pickup_address: 'Aga Khan Univ Hospital, Pharmacy Dept, 3rd Ave Parklands',
    priority: 'Standard (4 Hours)',
    payment_collection: 'Pre-paid',
    is_cold_chain: false,
    customer_note: '',
  });

  const fetchDeliveries = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await deliveryAPI.getDeliveries(params);
      const data = res.data.results || res.data;
      setDeliveries(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Fetch deliveries error:', e);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchDeliveries();
    const interval = setInterval(fetchDeliveries, 30000);
    return () => clearInterval(interval);
  }, [fetchDeliveries]);

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError('');
    setFormSuccess('');
    try {
      await deliveryAPI.createDelivery(form);
      setFormSuccess('Delivery request created successfully!');
      setForm({
        new_customer_name: '', new_customer_phone: '', item_description: '',
        delivery_address: '', pickup_address: 'Aga Khan Univ Hospital, Pharmacy Dept, 3rd Ave Parklands',
        priority: 'Standard (4 Hours)', payment_collection: 'Pre-paid', is_cold_chain: false, customer_note: ''
      });
      fetchDeliveries();
      setTimeout(() => { setShowForm(false); setFormSuccess(''); }, 2000);
    } catch (e) {
      setFormError(e?.response?.data?.detail || 'Failed to create delivery. Try again.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const filtered = deliveries.filter(d =>
    d.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.item_description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.delivery_address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const counts = {
    all: deliveries.length,
    pending: deliveries.filter(d => d.status === 'PENDING').length,
    assigned: deliveries.filter(d => d.status === 'ASSIGNED').length,
    out_for_delivery: deliveries.filter(d => d.status === 'OUT_FOR_DELIVERY').length,
    delivered: deliveries.filter(d => d.status === 'DELIVERED').length,
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-800">
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 lg:px-12 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-[#005C53] text-white flex items-center justify-center shadow-sm">
            <Cross className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#005C53] leading-none">PharmaDrop</h1>
            <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">Pharmacy Staff Portal</span>
          </div>
        </div>

        <div className="hidden md:flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-amber-50 text-amber-800 px-3 py-1.5 rounded-full border border-amber-200 text-xs font-bold">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{counts.pending} Pending</span>
          </div>
          <div className="flex items-center space-x-2 bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-full border border-emerald-200 text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{counts.delivered} Delivered</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-full relative">
            <Bell className="w-5 h-5" />
            {counts.pending > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />}
          </button>
          <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-[#005C53] text-white flex items-center justify-center font-bold text-xs">PH</div>
            <span className="hidden md:inline text-xs font-bold text-slate-800">Pharmacy Staff</span>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8">
        {/* Page Title + CTA Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">Dispatch Management</h2>
            <p className="text-xs lg:text-sm text-slate-500 mt-1">Create delivery requests and monitor the status of all pharmacy orders.</p>
          </div>
          <button
            onClick={() => { setShowForm(true); setFormError(''); setFormSuccess(''); }}
            className="inline-flex items-center space-x-2 px-5 py-3 bg-[#004D40] hover:bg-[#00382E] text-white font-bold rounded-xl text-sm transition-colors shadow-md shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Delivery</span>
          </button>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Orders', value: counts.all, icon: PackageCheck, color: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200' },
            { label: 'Pending Dispatch', value: counts.pending, icon: Clock, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
            { label: 'In Transit', value: counts.out_for_delivery, icon: TrendingUp, color: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-200' },
            { label: 'Delivered Today', value: counts.delivered, icon: CheckCircle2, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
          ].map((stat) => (
            <div key={stat.label} className={`${stat.bg} border ${stat.border} rounded-2xl p-5 flex items-center space-x-4`}>
              <div className={`p-2.5 ${stat.bg} rounded-xl`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-slate-900">{stat.value}</p>
                <p className="text-xs font-semibold text-slate-500">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by order number, patient, address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>
          <div className="flex items-center space-x-2">
            {['all', 'pending', 'assigned', 'out_for_delivery', 'delivered'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-2 rounded-xl text-xs font-bold capitalize transition-colors border ${
                  statusFilter === s
                    ? 'bg-[#004D40] text-white border-[#004D40]'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                {s.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Delivery Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-6 py-3.5 font-bold text-xs text-slate-500 uppercase tracking-wider">Order #</th>
                  <th className="text-left px-6 py-3.5 font-bold text-xs text-slate-500 uppercase tracking-wider">Patient</th>
                  <th className="text-left px-6 py-3.5 font-bold text-xs text-slate-500 uppercase tracking-wider hidden md:table-cell">Items</th>
                  <th className="text-left px-6 py-3.5 font-bold text-xs text-slate-500 uppercase tracking-wider hidden lg:table-cell">Destination</th>
                  <th className="text-left px-6 py-3.5 font-bold text-xs text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-3.5 font-bold text-xs text-slate-500 uppercase tracking-wider hidden md:table-cell">Rider</th>
                  <th className="text-left px-6 py-3.5 font-bold text-xs text-slate-500 uppercase tracking-wider hidden lg:table-cell">PIN Code</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="py-16 text-center text-slate-400 text-xs">Loading deliveries...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className="py-16 text-center text-slate-400 text-xs">No deliveries found.</td></tr>
                ) : (
                  filtered.map((d) => (
                    <tr key={d.id} className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{d.order_number}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {new Date(d.created_at).toLocaleDateString('en-KE', { day: '2-digit', month: 'short' })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{d.customer_name}</div>
                        <div className="text-[11px] text-slate-500">{d.customer_phone}</div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell max-w-[180px]">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-slate-700 line-clamp-1">{d.item_description}</span>
                          {d.is_cold_chain && (
                            <span className="shrink-0 inline-flex items-center space-x-1 px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-md border border-blue-200">
                              <Thermometer className="w-2.5 h-2.5" />
                              <span>Cold</span>
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{d.priority}</div>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <div className="flex items-start space-x-1.5 max-w-[200px]">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span className="text-xs text-slate-700 line-clamp-2">{d.delivery_address}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${statusColors[d.status] || 'bg-slate-100 text-slate-700'}`}>
                          {d.status?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        {d.assigned_rider_detail?.full_name ? (
                          <span className="text-xs font-semibold text-slate-700">{d.assigned_rider_detail.full_name}</span>
                        ) : (
                          <span className="text-xs text-slate-400">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <span className="font-mono font-black text-base text-slate-800 tracking-widest">
                          {d.confirmation_code || '****'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* NEW DELIVERY MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-bold text-slate-900">New Delivery Request</h3>
                <p className="text-xs text-slate-500 mt-0.5">Create a prescription handoff for a patient</p>
              </div>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500 font-bold">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {formSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Patient Name *</label>
                  <input name="new_customer_name" required value={form.new_customer_name} onChange={handleFormChange}
                    placeholder="e.g. Jane Wanjiku"
                    className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl bg-white outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Patient Phone *</label>
                  <input name="new_customer_phone" required value={form.new_customer_phone} onChange={handleFormChange}
                    placeholder="+254712345678"
                    className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl bg-white outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Item Description *</label>
                <input name="item_description" required value={form.item_description} onChange={handleFormChange}
                  placeholder="e.g. Amoxicillin 500mg, Vitamin C, Paracetamol"
                  className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl bg-white outline-none focus:ring-2 focus:ring-teal-500" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Delivery Address *</label>
                <input name="delivery_address" required value={form.delivery_address} onChange={handleFormChange}
                  placeholder="e.g. Westlands, Waiyaki Way, Nairobi"
                  className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl bg-white outline-none focus:ring-2 focus:ring-teal-500" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pickup Address</label>
                <input name="pickup_address" value={form.pickup_address} onChange={handleFormChange}
                  className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl bg-slate-50 outline-none text-slate-600" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Priority</label>
                  <select name="priority" value={form.priority} onChange={handleFormChange}
                    className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl bg-white outline-none">
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payment Method</label>
                  <select name="payment_collection" value={form.payment_collection} onChange={handleFormChange}
                    className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl bg-white outline-none">
                    {PAYMENT_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Patient Note (Optional)</label>
                <textarea name="customer_note" rows={2} value={form.customer_note} onChange={handleFormChange}
                  placeholder='e.g. "Please call when at gate, do not ring bell"'
                  className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl bg-white outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
              </div>

              <label className="flex items-center space-x-3 cursor-pointer select-none">
                <input type="checkbox" name="is_cold_chain" checked={form.is_cold_chain} onChange={handleFormChange} className="w-4 h-4 rounded accent-teal-700" />
                <div>
                  <span className="text-sm font-bold text-slate-900">Cold Chain Required</span>
                  <p className="text-xs text-slate-500">Requires refrigerated transport (insulin, biologics, etc.)</p>
                </div>
              </label>

              <div className="flex items-center space-x-4 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={formSubmitting}
                  className="flex-1 py-3 bg-[#004D40] hover:bg-[#00382E] text-white font-bold rounded-xl text-sm transition-colors shadow-md">
                  {formSubmitting ? 'Creating...' : 'Create Delivery'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PharmacyDashboard;
