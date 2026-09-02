import React, { useState, useEffect, useCallback } from 'react';
import { deliveryAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { usePusherDelivery } from '../hooks/usePusherDelivery';
import {
  Bell, Cross, Users, Bike, ChevronDown, Search, MapPin, Clock,
  AlertTriangle, CheckCircle2, PackageCheck, Thermometer, RefreshCw, X, UserCheck
} from 'lucide-react';

const statusColors = {
  PENDING: 'bg-amber-50 text-amber-800 border border-amber-200',
  ASSIGNED: 'bg-teal-50 text-teal-800 border border-teal-200',
  PICKED_UP: 'bg-blue-50 text-blue-800 border border-blue-200',
  OUT_FOR_DELIVERY: 'bg-violet-50 text-violet-800 border border-violet-200',
  DELIVERED: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
  CANCELLED: 'bg-red-50 text-red-800 border border-red-200',
};

const DispatcherDashboard = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(null);
  const [selectedRider, setSelectedRider] = useState({});
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [deliveriesRes, ridersRes] = await Promise.all([
        deliveryAPI.getDeliveries(statusFilter !== 'all' ? { status: statusFilter } : {}),
        deliveryAPI.getAvailableRiders(),
      ]);
      const deliveriesData = deliveriesRes.data.results || deliveriesRes.data;
      const ridersData = ridersRes.data.results || ridersRes.data;
      setDeliveries(Array.isArray(deliveriesData) ? deliveriesData : []);
      setRiders(Array.isArray(ridersData) ? ridersData : []);
    } catch (e) {
      console.error('Fetch dispatcher data error:', e);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Pusher real-time: merge changed delivery into local state immediately
  usePusherDelivery({
    pharmacyId: user?.pharmacy,
    onUpdate: useCallback((updatedDelivery) => {
      setDeliveries((prev) => {
        const exists = prev.find((d) => d.id === updatedDelivery.id);
        if (exists) {
          return prev.map((d) => d.id === updatedDelivery.id ? { ...d, ...updatedDelivery } : d);
        }
        return [updatedDelivery, ...prev]; // new delivery from another staff member
      });
    }, []),
  });

  const handleAssign = async (deliveryId) => {
    const riderId = selectedRider[deliveryId];
    if (!riderId) return;
    setAssigning(deliveryId);
    try {
      await deliveryAPI.assignRider(deliveryId, riderId);
      await fetchData();
    } catch (e) {
      console.error('Assign rider error:', e);
    } finally {
      setAssigning(null);
      setSelectedRider((prev) => ({ ...prev, [deliveryId]: '' }));
    }
  };

  const handleCancel = async (deliveryId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      await deliveryAPI.cancelDelivery(deliveryId, 'Cancelled by dispatcher');
      fetchData();
    } catch (e) {
      console.error('Cancel delivery error:', e);
    }
  };

  const filtered = deliveries.filter(d =>
    d.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.item_description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingCount = deliveries.filter(d => d.status === 'PENDING').length;
  const assignedCount = deliveries.filter(d => d.status === 'ASSIGNED').length;
  const inTransitCount = deliveries.filter(d => d.status === 'OUT_FOR_DELIVERY').length;
  const availableRidersCount = riders.filter(r => r.is_available).length;

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
            <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">Dispatcher Portal</span>
          </div>
        </div>

        <div className="hidden md:flex items-center space-x-2">
          <span className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-bold">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{pendingCount} Unassigned</span>
          </span>
          <span className="flex items-center space-x-1.5 px-3 py-1.5 bg-teal-50 text-teal-800 border border-teal-200 rounded-full text-xs font-bold">
            <Bike className="w-3.5 h-3.5" />
            <span>{availableRidersCount} Riders Available</span>
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <button onClick={fetchData} className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <RefreshCw className="w-4.5 h-4.5" />
          </button>
          <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-full relative">
            <Bell className="w-5 h-5" />
            {pendingCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />}
          </button>
          <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-violet-700 text-white flex items-center justify-center font-bold text-xs">DS</div>
            <span className="hidden md:inline text-xs font-bold text-slate-800">Dispatcher</span>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8">
        <div className="mb-8">
          <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">Dispatch Control</h2>
          <p className="text-xs lg:text-sm text-slate-500 mt-1">Assign riders to pending orders and monitor the live delivery queue.</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Unassigned Queue', value: pendingCount, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', Icon: AlertTriangle },
            { label: 'Assigned to Rider', value: assignedCount, color: 'text-teal-700', bg: 'bg-teal-50', border: 'border-teal-200', Icon: UserCheck },
            { label: 'Out for Delivery', value: inTransitCount, color: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-200', Icon: PackageCheck },
            { label: 'Riders Available', value: availableRidersCount, color: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200', Icon: Bike },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} border ${s.border} rounded-2xl p-5 flex items-center space-x-4`}>
              <s.Icon className={`w-7 h-7 ${s.color}`} />
              <div>
                <p className="text-2xl font-extrabold text-slate-900">{s.value}</p>
                <p className="text-xs font-semibold text-slate-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          {/* LEFT: Delivery Queue Panel */}
          <div className="xl:col-span-8">
            {/* Filters + Search */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by order, patient, or medication..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
              <div className="flex space-x-2">
                {['PENDING', 'ASSIGNED', 'all'].map((s) => (
                  <button key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors border ${
                      statusFilter === s ? 'bg-[#004D40] text-white border-[#004D40]' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}>
                    {s === 'all' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {loading ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-400 text-xs">Loading queue...</div>
              ) : filtered.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-400 text-xs">No deliveries found in queue.</div>
              ) : (
                filtered.map((delivery) => (
                  <div key={delivery.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center flex-wrap gap-2 mb-2">
                          <span className="text-base font-bold text-slate-900">{delivery.order_number}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${statusColors[delivery.status]}`}>
                            {delivery.status?.replace(/_/g, ' ')}
                          </span>
                          {delivery.is_cold_chain && (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-md border border-blue-200">
                              <Thermometer className="w-3 h-3" />
                              <span>COLD CHAIN</span>
                            </span>
                          )}
                        </div>

                        <p className="text-sm font-semibold text-slate-700 mb-1">{delivery.item_description}</p>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span className="font-semibold text-slate-800">{delivery.customer_name}</span>
                          <span>•</span>
                          <span>{delivery.customer_phone}</span>
                          <span className="flex items-center space-x-1">
                            <MapPin className="w-3 h-3" />
                            <span className="line-clamp-1">{delivery.delivery_address}</span>
                          </span>
                        </div>

                        {delivery.assigned_rider_detail?.full_name && (
                          <div className="mt-2 flex items-center space-x-1.5 text-xs text-teal-800 bg-teal-50 px-2.5 py-1 rounded-full w-fit border border-teal-100">
                            <Bike className="w-3.5 h-3.5" />
                            <span className="font-bold">{delivery.assigned_rider_detail.full_name}</span>
                          </div>
                        )}
                      </div>

                      {/* Assign Panel */}
                      {delivery.status !== 'DELIVERED' && delivery.status !== 'CANCELLED' && (
                        <div className="flex items-center space-x-2 shrink-0 w-full sm:w-auto">
                          <select
                            value={selectedRider[delivery.id] || ''}
                            onChange={(e) => setSelectedRider((prev) => ({ ...prev, [delivery.id]: e.target.value }))}
                            className="flex-1 sm:w-48 px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white outline-none focus:ring-2 focus:ring-teal-500"
                          >
                            <option value="">
                              {delivery.status === 'ASSIGNED' ? 'Reassign rider...' : 'Select rider...'}
                            </option>
                            {riders.map((r) => (
                              <option key={r.id} value={r.user?.id}>
                                {r.user?.full_name || r.user?.username} ({r.active_tasks_count} tasks · ⭐{r.rating})
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleAssign(delivery.id)}
                            disabled={!selectedRider[delivery.id] || assigning === delivery.id}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                              selectedRider[delivery.id]
                                ? 'bg-[#004D40] hover:bg-[#00382E] text-white shadow-sm'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            {assigning === delivery.id ? '...' : delivery.status === 'ASSIGNED' ? 'Reassign' : 'Assign'}
                          </button>
                          <button
                            onClick={() => handleCancel(delivery.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                            title="Cancel Order"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* RIGHT: Rider Fleet Panel */}
          <div className="xl:col-span-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="font-bold text-slate-900 text-base mb-4 flex items-center space-x-2">
                <Users className="w-5 h-5 text-[#005C53]" />
                <span>Rider Fleet</span>
                <span className="ml-auto text-xs font-semibold text-slate-400">{riders.length} total</span>
              </h3>
              <div className="space-y-3">
                {riders.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">No riders found.</p>
                ) : (
                  riders.map((rider) => (
                    <div key={rider.id} className="flex items-center space-x-3 p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                      <div className="w-9 h-9 rounded-full bg-[#005C53] text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {(rider.user?.full_name || rider.user?.username || '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 text-xs truncate">
                          {rider.user?.full_name || rider.user?.username}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {rider.vehicle_type} · {rider.active_tasks_count} active task{rider.active_tasks_count !== 1 ? 's' : ''} · ⭐{rider.rating}
                        </p>
                      </div>
                      <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        rider.is_available
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {rider.is_available ? 'Available' : 'Busy'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DispatcherDashboard;
