import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { deliveryAPI } from '../services/api';
import StatusTimeline from '../components/StatusTimeline';
import { 
  Bell, User, ChevronLeft, HelpCircle, Phone, MapPin, Clock, 
  ChevronDown, Home, Receipt, Map, Bike, Truck, CheckCircle2, Cross, PackageCheck, AlertCircle 
} from 'lucide-react';

const CustomerDashboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [deliveries, setDeliveries] = useState([]);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pastOpen, setPastOpen] = useState(false);

  useEffect(() => {
    fetchDeliveries();
  }, [id]);

  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      const res = await deliveryAPI.getDeliveries();
      const data = res.data.results || res.data;
      setDeliveries(data);

      if (id) {
        const found = data.find((d) => d.id === id || d.order_number.replace('#PD-', '') === id);
        if (found) setSelectedDelivery(found);
      } else if (data.length > 0) {
        setSelectedDelivery(data[0]);
      }
    } catch (err) {
      console.error('Failed to fetch deliveries:', err);
    } finally {
      setLoading(false);
    }
  };

  const activeDeliveries = deliveries.filter((d) => d.status !== 'DELIVERED' && d.status !== 'CANCELLED');
  const pastDeliveries = deliveries.filter((d) => d.status === 'DELIVERED' || d.status === 'CANCELLED');

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-800">
      
      {/* TOP DESKTOP HEADER BAR */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 lg:px-12 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-[#005C53] text-white flex items-center justify-center font-bold shadow-sm">
            <Cross className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#005C53] leading-none">PharmaDrop</h1>
            <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">Customer Portal</span>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <div className="hidden md:flex items-center space-x-6 text-xs text-slate-600 font-medium">
            <div className="flex items-center space-x-2 bg-teal-50 text-teal-800 px-3 py-1.5 rounded-full border border-teal-100">
              <PackageCheck className="w-4 h-4 text-[#005C53]" />
              <span><strong>{activeDeliveries.length}</strong> Active Orders</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-full relative transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-teal-700 text-white flex items-center justify-center font-bold text-xs">
                EW
              </div>
              <span className="hidden md:inline text-xs font-bold text-slate-800">Esther Wanjiku</span>
            </div>
          </div>
        </div>
      </header>

      {/* RESPONSIVE DESKTOP-FIRST MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8">
        <div className="mb-6">
          <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">My Deliveries</h2>
          <p className="text-xs lg:text-sm text-slate-500 mt-1">Track active prescription handoffs and view 4-digit verification codes.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: ACTIVE ORDERS LIST & PAST DELIVERIES (lg:col-span-5) */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center justify-between">
                <span>Active Orders</span>
                <span className="text-xs font-semibold text-slate-500">{activeDeliveries.length} items</span>
              </h3>

              {loading ? (
                <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-slate-400 text-xs">
                  Loading your orders...
                </div>
              ) : activeDeliveries.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-slate-500 text-xs">
                  No active orders at the moment.
                </div>
              ) : (
                <div className="space-y-4">
                  {activeDeliveries.map((order) => {
                    const rawNum = order.order_number.replace('#PD-', '');
                    const isSelected = selectedDelivery?.id === order.id;
                    return (
                      <div
                        key={order.id}
                        onClick={() => setSelectedDelivery(order)}
                        className={`bg-white rounded-2xl p-5 border shadow-sm relative overflow-hidden cursor-pointer transition-all ${
                          isSelected
                            ? 'border-[#005C53] ring-2 ring-teal-600/20 shadow-md bg-teal-50/10'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {/* Watermark Order Number */}
                        <span className="absolute right-4 top-2 text-5xl font-black text-slate-900/10 pointer-events-none tracking-tight select-none">
                          {rawNum}
                        </span>

                        <div className="flex items-center space-x-2 text-xs font-semibold text-[#005C53] mb-1">
                          <span>Order {order.order_number}</span>
                          {order.pharmacy_detail && (
                            <span className="text-slate-400">• {order.pharmacy_detail.name}</span>
                          )}
                        </div>

                        <h4 className="text-base font-bold text-slate-900 mb-2 pr-16 line-clamp-1">
                          {order.item_description}
                        </h4>

                        <div className="flex items-center space-x-1.5 text-xs text-slate-600 mb-4">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="line-clamp-1">{order.delivery_address}</span>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                          {order.status === 'ASSIGNED' ? (
                            <span className="inline-flex items-center space-x-1 px-3 py-1 bg-teal-50 text-teal-800 font-bold text-xs rounded-full border border-teal-100">
                              <Bike className="w-3.5 h-3.5" />
                              <span>Assigned</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-3 py-1 bg-rose-100 text-rose-800 font-bold text-xs rounded-full">
                              <Truck className="w-3.5 h-3.5" />
                              <span>Out for Delivery</span>
                            </span>
                          )}

                          <span className="text-xs font-semibold text-slate-400">
                            {order.status === 'ASSIGNED' ? 'Assigned 12 min ago' : 'Arriving in ~15 mins'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Past Deliveries Accordion */}
            <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-sm">
              <button
                onClick={() => setPastOpen(!pastOpen)}
                className="w-full p-4 flex items-center justify-between font-bold text-slate-800 hover:bg-slate-50 transition-colors text-sm"
              >
                <span>Past Deliveries</span>
                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${pastOpen ? 'rotate-180' : ''}`} />
              </button>

              {pastOpen && (
                <div className="p-4 pt-0 border-t border-slate-100 space-y-3">
                  {pastDeliveries.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-2">No past deliveries found.</p>
                  ) : (
                    pastDeliveries.map((past) => (
                      <div key={past.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs flex justify-between items-center">
                        <div>
                          <span className="font-bold text-slate-800 block">{past.order_number}</span>
                          <span className="text-slate-500">{past.item_description}</span>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          past.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {past.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: SELECTED ORDER DETAIL VIEW & PIN BADGE (lg:col-span-7) */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 lg:p-8 shadow-sm">
            {selectedDelivery ? (
              <div>
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">
                      Delivery Tracking
                    </span>
                    <h3 className="text-2xl font-bold text-slate-900">
                      Order {selectedDelivery.order_number}
                    </h3>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      selectedDelivery.status === 'DELIVERED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : selectedDelivery.status === 'OUT_FOR_DELIVERY'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-teal-50 text-teal-800 border border-teal-100'
                    }`}>
                      {selectedDelivery.status}
                    </span>
                  </div>
                </div>

                {/* Status Timeline Bar (Matching image_1.png) */}
                <StatusTimeline currentStatus={selectedDelivery.status} events={selectedDelivery.status_events} />

                {/* Prominent Pink Delivery PIN Code Box (Matching image_1.png mockup) */}
                <div className="bg-[#FFE4E6] border border-pink-200 rounded-3xl p-6 text-center my-6 shadow-sm">
                  <span className="text-xs font-bold text-red-900 tracking-widest uppercase block mb-1">
                    DELIVERY CODE
                  </span>
                  <div className="text-5xl lg:text-6xl font-black text-red-700 tracking-widest my-2 font-mono">
                    {selectedDelivery.confirmation_code || '****'}
                  </div>
                  <p className="text-xs font-medium text-red-800/90 max-w-sm mx-auto leading-relaxed mt-2">
                    Share this 4-digit code with your rider only when your medicine delivery arrives
                  </p>
                </div>

                {/* Rider Details & Delivery Info Card */}
                <div className="bg-slate-50/70 rounded-2xl p-6 border border-slate-200/80 space-y-4 mb-6">
                  {/* Rider Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                    <div className="flex items-center space-x-4">
                      <img
                        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
                        alt="Rider Avatar"
                        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                      />
                      <div>
                        <h4 className="font-bold text-slate-900 text-base">
                          {selectedDelivery.assigned_rider_detail?.full_name || 'David Kamau'}
                        </h4>
                        <p className="text-xs text-slate-500 font-semibold">
                          ⭐ 4.9 (120+ deliveries) • Assigned Rider
                        </p>
                      </div>
                    </div>
                    <a
                      href={`tel:${selectedDelivery.assigned_rider_detail?.phone_number || '+254799111222'}`}
                      className="w-11 h-11 rounded-full bg-[#005C53] text-white flex items-center justify-center shadow-md hover:bg-[#004D40] transition-colors"
                    >
                      <Phone className="w-5 h-5 fill-current" />
                    </a>
                  </div>

                  {/* Destination & Time info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-teal-100/60 text-[#005C53] rounded-xl shrink-0 mt-0.5">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                          DESTINATION
                        </span>
                        <p className="text-xs font-semibold text-slate-800 mt-0.5 leading-snug">
                          {selectedDelivery.delivery_address}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-teal-100/60 text-[#005C53] rounded-xl shrink-0 mt-0.5">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                          ESTIMATED ARRIVAL
                        </span>
                        <p className="text-xs font-extrabold text-slate-900 mt-0.5">
                          14:30 - 14:45
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
                  <button className="w-full sm:flex-1 py-3.5 bg-[#004D40] hover:bg-[#00382E] text-white font-bold rounded-xl text-xs transition-colors shadow-sm">
                    Track on Map
                  </button>
                  <button className="w-full sm:flex-1 py-3.5 bg-white border border-slate-300 text-red-700 font-bold rounded-xl text-xs hover:bg-red-50 transition-colors">
                    Report Issue
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-slate-400 text-sm">
                Select an active order on the left to view details and confirmation PIN.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CustomerDashboard;
