import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { deliveryAPI } from '../services/api';
import StatusTimeline from '../components/StatusTimeline';
import { 
  Bell, User, ChevronLeft, HelpCircle, Phone, MapPin, Clock, 
  ChevronDown, Home, Receipt, Map, UserCheck, Bike, Truck, CheckCircle2 
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
        else fetchSingleDelivery(id);
      } else if (data.length > 0) {
        // Default select first active delivery if available
        setSelectedDelivery(null);
      }
    } catch (err) {
      console.error('Failed to fetch deliveries:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSingleDelivery = async (deliveryId) => {
    try {
      const res = await deliveryAPI.getDeliveryById(deliveryId);
      setSelectedDelivery(res.data);
    } catch (err) {
      console.error('Error fetching detail:', err);
    }
  };

  const activeDeliveries = deliveries.filter((d) => d.status !== 'DELIVERED' && d.status !== 'CANCELLED');
  const pastDeliveries = deliveries.filter((d) => d.status === 'DELIVERED' || d.status === 'CANCELLED');

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#F9FAFB] flex flex-col justify-between font-sans border-x border-slate-200 shadow-xl relative pb-20">
      
      {/* SCREEN 1: ORDER DETAIL VIEW (image_1.png) */}
      {selectedDelivery ? (
        <div className="flex-1 p-4">
          {/* Header */}
          <div className="flex items-center justify-between py-3 mb-2">
            <button
              onClick={() => { setSelectedDelivery(null); navigate('/customer/orders'); }}
              className="p-2 text-slate-700 hover:bg-slate-200/60 rounded-full transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold text-[#005C53]">
              Order {selectedDelivery.order_number}
            </h1>
            <button className="p-2 text-slate-600 hover:bg-slate-200/60 rounded-full">
              <HelpCircle className="w-6 h-6" />
            </button>
          </div>

          {/* Status Step Indicator Timeline */}
          <StatusTimeline currentStatus={selectedDelivery.status} events={selectedDelivery.status_events} />

          {/* Prominent Pink Delivery PIN Code Box (Matching image_1.png) */}
          <div className="bg-[#FFE4E6] border border-pink-200 rounded-3xl p-6 text-center my-5 shadow-sm">
            <span className="text-xs font-bold text-red-900 tracking-widest uppercase block mb-1">
              DELIVERY CODE
            </span>
            <div className="text-5xl font-black text-red-700 tracking-widest my-2 font-mono">
              {selectedDelivery.confirmation_code}
            </div>
            <p className="text-xs font-medium text-red-800/90 max-w-xs mx-auto leading-relaxed mt-2">
              Share this code with your rider only when your delivery arrives
            </p>
          </div>

          {/* Rider & Delivery Info Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            {/* Rider Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
                  alt="Rider Avatar"
                  className="w-12 h-12 rounded-full object-cover border border-slate-200"
                />
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {selectedDelivery.assigned_rider_detail?.full_name || 'David Kamau'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    ⭐ 4.9 (120+ deliveries)
                  </p>
                </div>
              </div>
              <a
                href={`tel:${selectedDelivery.assigned_rider_detail?.phone_number || '+254799111222'}`}
                className="w-10 h-10 rounded-full bg-[#005C53] text-white flex items-center justify-center shadow-sm hover:bg-[#004D40]"
              >
                <Phone className="w-5 h-5 fill-current" />
              </a>
            </div>

            {/* Destination */}
            <div className="flex items-start space-x-3 pt-1">
              <div className="p-2 bg-teal-50 text-[#005C53] rounded-full shrink-0 mt-0.5">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  DESTINATION
                </span>
                <p className="text-sm font-semibold text-slate-800 leading-snug">
                  {selectedDelivery.delivery_address}
                </p>
              </div>
            </div>

            {/* Estimated Arrival */}
            <div className="flex items-start space-x-3 pt-2">
              <div className="p-2 bg-teal-50 text-[#005C53] rounded-full shrink-0 mt-0.5">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  ESTIMATED ARRIVAL
                </span>
                <p className="text-sm font-extrabold text-slate-900">
                  14:30 - 14:45
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 mt-6">
            <button className="w-full py-3.5 bg-[#004D40] hover:bg-[#00382E] text-white font-bold rounded-xl text-sm transition-colors shadow-sm">
              Track on Map
            </button>
            <button className="w-full py-3 bg-white border border-slate-300 text-red-700 font-bold rounded-xl text-sm hover:bg-red-50 transition-colors">
              Report Issue
            </button>
          </div>
        </div>
      ) : (

        /* SCREEN 2: ACTIVE ORDERS LIST (image_2.png) */
        <div className="flex-1 p-4">
          {/* Header */}
          <div className="flex items-center justify-between py-3 mb-4">
            <h1 className="text-2xl font-black text-[#005C53] tracking-tight">
              PharmaDrop
            </h1>
            <div className="flex items-center space-x-3">
              <button className="p-2 text-slate-600 hover:bg-slate-200/60 rounded-full relative">
                <Bell className="w-6 h-6" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              </button>
              <button className="p-2 text-slate-600 hover:bg-slate-200/60 rounded-full">
                <User className="w-6 h-6" />
              </button>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-4">My Orders</h2>

          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-800 mb-3">Active Orders</h3>

            {loading ? (
              <div className="p-8 text-center text-slate-400 text-sm">Loading your orders...</div>
            ) : activeDeliveries.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center border border-slate-200 text-slate-500 text-sm">
                No active orders at the moment.
              </div>
            ) : (
              <div className="space-y-4">
                {activeDeliveries.map((order) => {
                  const rawNum = order.order_number.replace('#PD-', '');
                  return (
                    <div
                      key={order.id}
                      onClick={() => setSelectedDelivery(order)}
                      className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden cursor-pointer hover:border-teal-500 transition-all group"
                    >
                      {/* Big Watermark Order Number (Matching image_2.png) */}
                      <span className="absolute right-4 top-2 text-5xl font-black text-teal-900/10 pointer-events-none tracking-tight select-none">
                        {rawNum}
                      </span>

                      <span className="text-xs font-medium text-slate-400 block mb-1">
                        Order {order.order_number}
                      </span>

                      <h4 className="text-base font-bold text-slate-900 mb-2 pr-16 line-clamp-1">
                        {order.item_description}
                      </h4>

                      <div className="flex items-center space-x-1.5 text-xs text-slate-600 mb-4">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="line-clamp-1">{order.delivery_address}</span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        {order.status === 'ASSIGNED' ? (
                          <span className="inline-flex items-center space-x-1 px-3 py-1 bg-teal-50 text-teal-800 font-semibold text-xs rounded-full">
                            <Bike className="w-3.5 h-3.5" />
                            <span>Assigned</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-3 py-1 bg-rose-100 text-rose-800 font-semibold text-xs rounded-full">
                            <Truck className="w-3.5 h-3.5" />
                            <span>Out for Delivery</span>
                          </span>
                        )}
                        <span className="text-xs font-medium text-slate-400">
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
              className="w-full p-4 flex items-center justify-between font-bold text-slate-800 hover:bg-slate-50 transition-colors"
            >
              <span className="text-lg">Past deliveries</span>
              <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform ${pastOpen ? 'rotate-180' : ''}`} />
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
      )}

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-slate-200 py-2 px-6 flex justify-between items-center shadow-lg z-40">
        <button className="flex flex-col items-center text-slate-500 hover:text-teal-700">
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-1">Home</span>
        </button>

        <button className="flex flex-col items-center">
          <div className="bg-[#005C53] text-white px-5 py-1.5 rounded-full flex items-center space-x-1 shadow-sm">
            <Receipt className="w-4 h-4" />
            <span className="text-xs font-bold">Orders</span>
          </div>
        </button>

        <button className="flex flex-col items-center text-slate-500 hover:text-teal-700">
          <Map className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-1">Track</span>
        </button>

        <button className="flex flex-col items-center text-slate-500 hover:text-teal-700">
          <User className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-1">Profile</span>
        </button>
      </div>
    </div>
  );
};

export default CustomerDashboard;
