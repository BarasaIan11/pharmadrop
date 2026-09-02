import React, { useState, useEffect, useCallback } from 'react';
import { deliveryAPI } from '../services/api';
import {
  Bell, Cross, MapPin, Phone, CheckCircle2, AlertTriangle,
  Bike, Clock, ArrowRight, KeyRound, RefreshCw, PackageCheck
} from 'lucide-react';

const statusColors = {
  ASSIGNED: 'bg-teal-50 text-teal-800 border border-teal-200',
  PICKED_UP: 'bg-blue-50 text-blue-800 border border-blue-200',
  OUT_FOR_DELIVERY: 'bg-violet-50 text-violet-800 border border-violet-200',
};

const VALID_TRANSITIONS = {
  ASSIGNED: { next: 'PICKED_UP', label: 'Mark as Picked Up' },
  PICKED_UP: { next: 'OUT_FOR_DELIVERY', label: 'Mark as Out for Delivery' },
  OUT_FOR_DELIVERY: { next: null, label: 'Confirm Delivery (requires PIN)' },
};

const RiderDashboard = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [pinCode, setPinCode] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState('');

  const fetchDeliveries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await deliveryAPI.getDeliveries();
      const data = res.data.results || res.data;
      const active = Array.isArray(data)
        ? data.filter(d => ['ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(d.status))
        : [];
      setDeliveries(active);
      if (active.length > 0 && !selectedDelivery) {
        setSelectedDelivery(active[0]);
      }
    } catch (e) {
      console.error('Rider fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [selectedDelivery]);

  useEffect(() => {
    fetchDeliveries();
    const interval = setInterval(fetchDeliveries, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (delivery, nextStatus) => {
    setUpdating(true);
    try {
      await deliveryAPI.updateDeliveryStatus(delivery.id, nextStatus);
      await fetchDeliveries();
      const updated = deliveries.find(d => d.id === delivery.id);
      if (updated) setSelectedDelivery({ ...updated, status: nextStatus });
    } catch (e) {
      console.error('Status update error:', e);
    } finally {
      setUpdating(false);
    }
  };

  const handleConfirmDelivery = async (deliveryId) => {
    if (!pinCode || pinCode.length !== 4) {
      setPinError('Please enter a 4-digit PIN code');
      return;
    }
    setPinError('');
    setUpdating(true);
    try {
      await deliveryAPI.confirmDelivery(deliveryId, pinCode);
      setPinSuccess('Delivery confirmed! ✅');
      setPinCode('');
      await fetchDeliveries();
      setTimeout(() => setPinSuccess(''), 3000);
    } catch (e) {
      const errMsg = e?.response?.data?.error || 'Incorrect code. Try again.';
      setPinError(errMsg);
      const updatedDeliveries = await deliveryAPI.getDeliveries();
      const data = updatedDeliveries.data.results || updatedDeliveries.data;
      const updated = Array.isArray(data) ? data.find(d => d.id === deliveryId) : null;
      if (updated) setSelectedDelivery(updated);
    } finally {
      setUpdating(false);
    }
  };

  const completedCount = 5; // placeholder — could come from separate API call

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
            <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">Rider Portal</span>
          </div>
        </div>

        <div className="hidden md:flex items-center space-x-2">
          <span className="flex items-center space-x-1.5 px-3 py-1.5 bg-teal-50 text-teal-800 border border-teal-200 rounded-full text-xs font-bold">
            <Bike className="w-3.5 h-3.5" />
            <span>{deliveries.length} Active Task{deliveries.length !== 1 ? 's' : ''}</span>
          </span>
          <span className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{completedCount} Completed Today</span>
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <button onClick={fetchDeliveries} className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <RefreshCw className="w-4.5 h-4.5" />
          </button>
          <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-full relative">
            <Bell className="w-5 h-5" />
            {deliveries.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />}
          </button>
          <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs">DK</div>
            <span className="hidden md:inline text-xs font-bold text-slate-800">David Kamau</span>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8">
        <div className="mb-8">
          <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">My Deliveries</h2>
          <p className="text-xs lg:text-sm text-slate-500 mt-1">Manage active tasks, update progress, and confirm handoff with the patient PIN.</p>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl p-16 text-center border border-slate-200 text-slate-400 text-sm">
            Loading your delivery tasks...
          </div>
        ) : deliveries.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center border border-slate-200">
            <PackageCheck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-700 font-bold text-lg">No Active Deliveries</p>
            <p className="text-xs text-slate-400 mt-2">You're all caught up! New tasks will appear here when the dispatcher assigns them.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT: Task List (lg:col-span-5) */}
            <div className="lg:col-span-5 space-y-4">
              <h3 className="font-bold text-slate-900 text-base mb-2">Active Tasks ({deliveries.length})</h3>
              {deliveries.map((delivery) => {
                const isSelected = selectedDelivery?.id === delivery.id;
                return (
                  <div
                    key={delivery.id}
                    onClick={() => { setSelectedDelivery(delivery); setPinCode(''); setPinError(''); setPinSuccess(''); }}
                    className={`bg-white rounded-2xl border p-5 cursor-pointer transition-all shadow-sm ${
                      isSelected
                        ? 'border-[#005C53] ring-2 ring-teal-600/20 shadow-md'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-base font-bold text-slate-900">{delivery.order_number}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${statusColors[delivery.status] || 'bg-slate-100 text-slate-700'}`}>
                        {delivery.status?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-700 mb-2">{delivery.item_description}</p>
                    <div className="flex items-start space-x-1.5 text-xs text-slate-500">
                      <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
                      <span className="line-clamp-2">{delivery.delivery_address}</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-xs text-slate-500 mt-1.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{delivery.customer_phone}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* RIGHT: Task Detail & Action Panel (lg:col-span-7) */}
            <div className="lg:col-span-7">
              {selectedDelivery ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-6 lg:p-8 shadow-sm">
                  {/* Detail Header */}
                  <div className="pb-5 mb-6 border-b border-slate-100">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Current Task</span>
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-bold text-slate-900">{selectedDelivery.order_number}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColors[selectedDelivery.status] || 'bg-slate-100 text-slate-700'}`}>
                        {selectedDelivery.status?.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Item + Address */}
                  <div className="space-y-4 mb-6">
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Medication</p>
                      <p className="text-base font-bold text-slate-900">{selectedDelivery.item_description}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="p-2 bg-teal-100/60 text-[#005C53] rounded-xl shrink-0">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">DELIVER TO</p>
                          <p className="text-xs font-semibold text-slate-800 leading-snug">{selectedDelivery.delivery_address}</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="p-2 bg-teal-100/60 text-[#005C53] rounded-xl shrink-0">
                          <Phone className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">CONTACT</p>
                          <p className="text-sm font-bold text-slate-900">{selectedDelivery.customer_phone}</p>
                          <p className="text-xs text-slate-500">{selectedDelivery.customer_name}</p>
                        </div>
                      </div>
                    </div>

                    {selectedDelivery.customer_note && (
                      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                        <p className="text-xs font-bold text-amber-800 mb-1">⚠ Patient Note</p>
                        <p className="text-xs text-amber-900">{selectedDelivery.customer_note}</p>
                      </div>
                    )}
                  </div>

                  {/* Status Progression Button */}
                  {VALID_TRANSITIONS[selectedDelivery.status] && selectedDelivery.status !== 'OUT_FOR_DELIVERY' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedDelivery, VALID_TRANSITIONS[selectedDelivery.status].next)}
                      disabled={updating}
                      className="w-full py-4 bg-[#004D40] hover:bg-[#00382E] text-white font-bold rounded-2xl text-sm flex items-center justify-center space-x-2 transition-colors shadow-md mb-4"
                    >
                      <span>{updating ? 'Updating...' : VALID_TRANSITIONS[selectedDelivery.status].label}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}

                  {/* PIN CONFIRMATION PANEL */}
                  {selectedDelivery.status === 'OUT_FOR_DELIVERY' && (
                    <div className="bg-[#FFF0F3] border border-pink-200 rounded-3xl p-6 mt-2">
                      <div className="flex items-center space-x-2 mb-4">
                        <KeyRound className="w-5 h-5 text-rose-700" />
                        <h4 className="font-bold text-rose-900 text-base">Enter Customer's 4-Digit Code</h4>
                      </div>
                      <p className="text-xs text-rose-800/90 mb-4">
                        Ask the customer for the 4-digit code visible in their PharmaDrop app to confirm handoff.
                      </p>

                      <div className="flex items-center space-x-3">
                        <input
                          type="text"
                          maxLength={4}
                          value={pinCode}
                          onChange={(e) => { setPinCode(e.target.value.replace(/\D/g, '')); setPinError(''); }}
                          placeholder="_ _ _ _"
                          className="flex-1 text-center text-3xl font-black tracking-[0.5em] py-3 border-2 border-pink-300 rounded-2xl bg-white focus:ring-2 focus:ring-rose-500 outline-none text-rose-800 font-mono"
                        />
                        <button
                          onClick={() => handleConfirmDelivery(selectedDelivery.id)}
                          disabled={updating || pinCode.length !== 4}
                          className={`px-6 py-4 rounded-2xl font-bold text-sm transition-colors ${
                            pinCode.length === 4
                              ? 'bg-rose-700 hover:bg-rose-800 text-white shadow-md'
                              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          {updating ? '...' : 'Confirm'}
                        </button>
                      </div>

                      {pinError && (
                        <div className="mt-3 flex items-center space-x-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>{pinError}</span>
                          {selectedDelivery.failed_code_attempts > 0 && (
                            <span className="ml-auto font-bold">
                              {selectedDelivery.failed_code_attempts}/3 attempts
                            </span>
                          )}
                        </div>
                      )}

                      {pinSuccess && (
                        <div className="mt-3 flex items-center space-x-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>{pinSuccess}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center text-slate-400 text-sm shadow-sm">
                  Select a delivery task on the left to view details and take action.
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default RiderDashboard;
