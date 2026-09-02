import React, { useState, useEffect } from 'react';
import { deliveryAPI } from '../services/api';
import { 
  Cross, LayoutDashboard, Truck, Package, Bike, BarChart2, Settings, HelpCircle, 
  Search, Bell, User, Clock, MapPin, ArrowRight, X, Check, ChevronRight, ChevronLeft, Filter 
} from 'lucide-react';

const DispatcherDashboard = () => {
  const [activeTab, setActiveTab] = useState('unassigned'); // 'unassigned' | 'all'
  const [statusFilter, setStatusFilter] = useState('All');
  const [deliveries, setDeliveries] = useState([]);
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [riderFilter, setRiderFilter] = useState('');

  // Assign Modal State
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [selectedRiderId, setSelectedRiderId] = useState('');
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [delRes, riderRes] = await Promise.all([
        deliveryAPI.getDeliveries(),
        deliveryAPI.getAvailableRiders()
      ]);
      setDeliveries(delRes.data.results || delRes.data);
      setRiders(riderRes.data || []);
    } catch (err) {
      console.error('Failed to fetch dispatcher data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAssignModal = (delivery) => {
    setSelectedDelivery(delivery);
    setSelectedRiderId(riders[0]?.user?.id || '');
    setAssignModalOpen(true);
  };

  const handleConfirmAssignment = async () => {
    if (!selectedDelivery || !selectedRiderId) return;
    setAssigning(true);
    try {
      await deliveryAPI.assignRider(selectedDelivery.id, selectedRiderId);
      setAssignModalOpen(false);
      setSelectedDelivery(null);
      fetchData();
    } catch (err) {
      console.error('Assignment error:', err);
      alert(err.response?.data?.error || 'Failed to assign rider');
    } finally {
      setAssigning(false);
    }
  };

  const unassignedQueue = deliveries.filter((d) => d.status === 'PENDING');
  
  const filteredAllDeliveries = deliveries.filter((d) => {
    const matchesSearch = 
      d.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.delivery_address.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === 'All') return matchesSearch;
    if (statusFilter === 'Pending') return matchesSearch && d.status === 'PENDING';
    if (statusFilter === 'Assigned') return matchesSearch && d.status === 'ASSIGNED';
    if (statusFilter === 'Picked Up') return matchesSearch && d.status === 'PICKED_UP';
    if (statusFilter === 'In Transit') return matchesSearch && d.status === 'OUT_FOR_DELIVERY';
    if (statusFilter === 'Delivered') return matchesSearch && d.status === 'DELIVERED';
    return matchesSearch;
  });

  const filteredRiders = riders.filter((r) => 
    r.user?.full_name?.toLowerCase().includes(riderFilter.toLowerCase()) ||
    r.user?.username?.toLowerCase().includes(riderFilter.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-800">
      
      {/* SIDEBAR NAVIGATION (Matching image_5.png & image_7.png) */}
      <aside className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col justify-between p-4 shrink-0">
        <div>
          <div className="flex items-center space-x-2 px-2 py-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-[#005C53] text-white flex items-center justify-center font-bold text-sm">
              D
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 leading-tight">Dispatcher Hub</h4>
              <p className="text-[11px] text-slate-500">Nairobi Central</p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('unassigned')}
            className="w-full py-2.5 px-4 bg-[#004D40] hover:bg-[#00382E] text-white font-semibold text-xs rounded-lg flex items-center justify-center space-x-2 transition-colors shadow-sm mb-6"
          >
            <span>+ New Dispatch</span>
          </button>

          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('unassigned')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'unassigned'
                  ? 'bg-[#005C53] text-white font-semibold shadow-sm'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('all')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'all'
                  ? 'bg-[#005C53] text-white font-semibold shadow-sm'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>Active Orders</span>
            </button>

            <button className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-200/60">
              <Package className="w-4 h-4" />
              <span>Inventory</span>
            </button>

            <button className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-200/60">
              <Bike className="w-4 h-4" />
              <span>Rider Network</span>
            </button>

            <button className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-200/60">
              <BarChart2 className="w-4 h-4" />
              <span>Reports</span>
            </button>
          </nav>
        </div>

        <div className="space-y-1 pt-4 border-t border-slate-200">
          <button className="w-full flex items-center space-x-3 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200/60 rounded-lg">
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>
          <button className="w-full flex items-center space-x-3 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200/60 rounded-lg">
            <HelpCircle className="w-4 h-4" />
            <span>Support</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* TOP HEADER BAR */}
        <header className="bg-white border-b border-slate-200 py-3 px-8 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#005C53]">PharmaDrop</h2>

          <div className="flex items-center space-x-4">
            <div className="relative w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search orders..."
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#005C53]"
              />
            </div>
            <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-full relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <button className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-full">
              <User className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* VIEW 1: UNASSIGNED QUEUE & AVAILABLE RIDERS SPLIT SCREEN (image_5.png) */}
        {activeTab === 'unassigned' ? (
          <main className="flex-1 p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left 2 Columns: Unassigned Queue */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center space-x-3 mb-4">
                <h1 className="text-2xl font-bold text-slate-900">Unassigned Queue</h1>
                <span className="px-3 py-0.5 bg-slate-200 text-slate-700 text-xs font-bold rounded-full">
                  {unassignedQueue.length} Pending
                </span>
              </div>

              {unassignedQueue.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-400 text-sm">
                  No unassigned deliveries in queue.
                </div>
              ) : (
                unassignedQueue.map((item) => {
                  const rawNum = item.order_number.replace('#PD-', '');
                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden space-y-4 hover:border-teal-500 transition-all"
                    >
                      {/* Big Watermark ID (image_5.png) */}
                      <span className="absolute right-6 top-3 text-6xl font-black text-slate-900/10 pointer-events-none tracking-tight select-none">
                        {rawNum}
                      </span>

                      {/* Header */}
                      <div className="flex items-center justify-between pr-20">
                        <div>
                          <h3 className="text-xl font-bold text-slate-900">{item.customer_name}</h3>
                          <p className="text-xs text-slate-500 flex items-center space-x-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>{item.delivery_address}</span>
                          </p>
                        </div>

                        <div className="flex items-center space-x-1 text-red-600 text-xs font-bold">
                          <Clock className="w-4 h-4" />
                          <span>14m waiting</span>
                        </div>
                      </div>

                      {/* Package contents section */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                            PACKAGE CONTENTS
                          </span>
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-semibold text-slate-800">{item.item_description}</p>
                            {item.is_cold_chain && (
                              <span className="px-2 py-0.5 bg-sky-100 text-sky-800 text-[10px] font-bold rounded">
                                Cold Chain
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => handleOpenAssignModal(item)}
                          className="py-2.5 px-5 bg-[#004D40] hover:bg-[#00382E] text-white font-bold text-xs rounded-xl flex items-center space-x-2 transition-colors shadow-sm"
                        >
                          <span>Assign Rider</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Right Column: Available Riders Sidebar (image_5.png) */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm h-fit space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">Available Riders</h3>
                <span className="px-2.5 py-0.5 bg-teal-100 text-teal-800 text-xs font-bold rounded-full">
                  {riders.length} Online
                </span>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={riderFilter}
                  onChange={(e) => setRiderFilter(e.target.value)}
                  placeholder="Filter riders..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#005C53]"
                />
              </div>

              {/* Rider List */}
              <div className="space-y-3 pt-1">
                {filteredRiders.map((r) => (
                  <div key={r.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between hover:bg-slate-100/80 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-teal-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {r.user?.first_name?.[0] || 'R'}{r.user?.last_name?.[0] || '1'}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{r.user?.full_name || r.user?.username}</h4>
                        <p className="text-[11px] text-slate-500 flex items-center space-x-1">
                          <Bike className="w-3 h-3 text-slate-400" />
                          <span>{r.vehicle_type} • {r.distance_km}km away</span>
                        </p>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                      r.active_tasks_count > 0 ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {r.active_tasks_count} active
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </main>
        ) : (

          /* VIEW 2: ALL DELIVERIES TABLE (image_7.png) */
          <main className="flex-1 p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 mb-1">All Deliveries</h1>
                <p className="text-xs text-slate-500">Live oversight of regional operations.</p>
              </div>

              <div className="flex items-center space-x-3">
                <div className="relative w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search ID, Rider, Clinic..."
                    className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#005C53]"
                  />
                </div>
                <button className="flex items-center space-x-1.5 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50">
                  <Filter className="w-3.5 h-3.5" />
                  <span>Filter</span>
                </button>
              </div>
            </div>

            {/* Filter Tabs (image_7.png) */}
            <div className="flex border-b border-slate-200 mb-6 space-x-6">
              {['All', 'Pending', 'Assigned', 'Picked Up', 'In Transit', 'Delivered'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`pb-3 font-semibold text-xs transition-all border-b-2 ${
                    statusFilter === tab
                      ? 'border-[#005C53] text-[#005C53] font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab} ({deliveries.filter(d => tab === 'All' ? true : d.status.toLowerCase().includes(tab.toLowerCase().replace(' ', '_'))).length})
                </button>
              ))}
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">ORDER ID</th>
                    <th className="py-3.5 px-4">DESTINATION</th>
                    <th className="py-3.5 px-4">RIDER</th>
                    <th className="py-3.5 px-4">STATUS</th>
                    <th className="py-3.5 px-4">CREATED</th>
                    <th className="py-3.5 px-4 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredAllDeliveries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No matching deliveries found.
                      </td>
                    </tr>
                  ) : (
                    filteredAllDeliveries.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-4 font-bold text-[#005C53]">
                          {order.order_number}
                        </td>
                        <td className="py-4 px-4 font-semibold text-slate-900">
                          {order.delivery_address}
                        </td>
                        <td className="py-4 px-4">
                          {order.assigned_rider_detail ? (
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                                {order.assigned_rider_detail.first_name?.[0]}{order.assigned_rider_detail.last_name?.[0]}
                              </div>
                              <span className="font-semibold text-slate-800">{order.assigned_rider_detail.full_name}</span>
                            </div>
                          ) : (
                            <span className="text-red-500 italic font-medium">Unassigned</span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${
                            order.status === 'DELIVERED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : order.status === 'OUT_FOR_DELIVERY'
                              ? 'bg-[#005C53]/15 text-[#005C53]'
                              : order.status === 'PICKED_UP'
                              ? 'bg-cyan-100 text-cyan-800'
                              : order.status === 'PENDING'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-[#005C53]/10 text-teal-800'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-slate-500">
                          {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <button className="p-1 text-slate-400 hover:text-slate-700">
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              <div className="py-3 px-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                <span>Showing 1-5 of {filteredAllDeliveries.length} deliveries</span>
                <div className="flex items-center space-x-2">
                  <button className="p-1 text-slate-400 hover:text-slate-600 border rounded">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button className="p-1 text-slate-400 hover:text-slate-600 border rounded">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </main>
        )}
      </div>

      {/* ASSIGN RIDER MODAL */}
      {assignModalOpen && selectedDelivery && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                Assign Rider to Order {selectedDelivery.order_number}
              </h3>
              <button onClick={() => setAssignModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Select an available rider to deliver <strong>{selectedDelivery.item_description}</strong> to {selectedDelivery.delivery_address}.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Available Rider</label>
              <select
                value={selectedRiderId}
                onChange={(e) => setSelectedRiderId(e.target.value)}
                className="w-full p-3 text-sm border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-[#005C53] bg-white"
              >
                {riders.map((r) => (
                  <option key={r.user.id} value={r.user.id}>
                    {r.user.full_name || r.user.username} ({r.vehicle_type} • {r.distance_km}km away • {r.active_tasks_count} active tasks)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setAssignModalOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAssignment}
                disabled={assigning}
                className="px-5 py-2 bg-[#004D40] hover:bg-[#00382E] text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
              >
                {assigning ? 'Assigning...' : 'Confirm Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DispatcherDashboard;
