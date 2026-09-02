import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { deliveryAPI } from '../services/api';
import { 
  Bell, User, RefreshCw, ChevronLeft, Phone, MapPin, Clock, Info, Check, 
  Package, Bike, CheckCircle2, Cross, HelpCircle, Home, Receipt, Map, AlertTriangle 
} from 'lucide-react';

const RiderDashboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);

  // 4-digit PIN State (image_8.png)
  const [pinDigits, setPinDigits] = useState(['', '', '', '']);
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState(false);
  const [submittingPin, setSubmittingPin] = useState(false);
  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  useEffect(() => {
    fetchAssignedTasks();
  }, [id]);

  const fetchAssignedTasks = async () => {
    setLoading(true);
    try {
      const res = await deliveryAPI.getDeliveries();
      const data = res.data.results || res.data;
      setDeliveries(data);

      if (id) {
        const found = data.find((d) => d.id === id || d.order_number.replace('#PD-', '') === id);
        if (found) setSelectedTask(found);
      }
    } catch (err) {
      console.error('Failed to fetch rider deliveries:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartPickup = async (task) => {
    try {
      await deliveryAPI.updateStatus(task.id, 'PICKED_UP');
      await deliveryAPI.updateStatus(task.id, 'OUT_FOR_DELIVERY');
      fetchAssignedTasks();
    } catch (err) {
      console.error('Status update failed:', err);
      alert(err.response?.data?.error || 'Failed to update status');
    }
  };

  const handleOpenPinModal = (task) => {
    setSelectedTask(task);
    setPinDigits(['', '', '', '']);
    setPinError('');
    setPinSuccess(false);
  };

  const handlePinChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1);
    const newDigits = [...pinDigits];
    newDigits[index] = value;
    setPinDigits(newDigits);

    // Auto-advance focus to next input
    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pinDigits[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleConfirmPIN = async () => {
    const fullPin = pinDigits.join('');
    if (fullPin.length !== 4) {
      setPinError('Please enter all 4 digits of the code.');
      return;
    }

    setSubmittingPin(true);
    setPinError('');

    try {
      const res = await deliveryAPI.confirmDelivery(selectedTask.id, fullPin);
      setPinSuccess(true);
      setTimeout(() => {
        setSelectedTask(null);
        fetchAssignedTasks();
      }, 1500);
    } catch (err) {
      console.error('PIN verification error:', err);
      const errData = err.response?.data;
      if (errData?.is_locked) {
        setPinError('ORDER LOCKED! 3 failed code attempts. Dispatcher review required.');
      } else {
        setPinError(errData?.error || `Incorrect code. Attempt ${errData?.failed_attempts || '?'}/3 failed.`);
      }
    } finally {
      setSubmittingPin(false);
    }
  };

  const activeTasks = deliveries.filter((d) => d.status !== 'DELIVERED' && d.status !== 'CANCELLED');

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#F9FAFB] flex flex-col justify-between font-sans border-x border-slate-200 shadow-xl relative pb-20">
      
      {/* SCREEN 1: 4-DIGIT PIN CONFIRMATION MODAL / PAGE (image_8.png) */}
      {selectedTask ? (
        <div className="flex-1 p-6 flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between py-2 mb-6">
              <button
                onClick={() => setSelectedTask(null)}
                className="p-2 text-slate-700 hover:bg-slate-200/60 rounded-full transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h1 className="text-xl font-bold text-[#005C53]">Confirm Delivery</h1>
              <div className="w-8" />
            </div>

            {/* Top Center Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-slate-200/70 flex items-center justify-center text-[#005C53]">
                <Cross className="w-10 h-10 stroke-[2.5]" />
              </div>
            </div>

            {/* Verification Required Banner */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-extrabold text-slate-900 mb-2">
                Verification Required
              </h2>
              <p className="text-sm text-slate-500 max-w-xs mx-auto">
                Ask the customer for their 4-digit confirmation code.
              </p>
            </div>

            {/* Order Info Card */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    Order {selectedTask.order_number}
                  </h4>
                  <p className="text-xs text-slate-400">Awaiting Handover</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-teal-50 text-teal-800 font-bold text-xs rounded-full border border-teal-100">
                ARRIVED
              </span>
            </div>

            {/* 4-Box PIN Input (Matching image_8.png mockup) */}
            <div className="flex justify-center space-x-3 mb-6">
              {pinDigits.map((digit, index) => (
                <input
                  key={index}
                  ref={inputRefs[index]}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className={`w-14 h-16 text-center text-2xl font-black rounded-2xl border-2 outline-none transition-all ${
                    pinError
                      ? 'border-red-400 bg-red-50 text-red-900'
                      : digit
                      ? 'border-[#005C53] bg-teal-50/50 text-slate-900'
                      : index === 0
                      ? 'border-red-400 ring-2 ring-red-100 bg-white'
                      : 'border-slate-300 bg-white'
                  }`}
                />
              ))}
            </div>

            {/* PIN Error / Success Notifications */}
            {pinError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold text-center flex items-center justify-center space-x-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{pinError}</span>
              </div>
            )}

            {pinSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold text-center flex items-center justify-center space-x-1.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Code Verified! Order Delivered.</span>
              </div>
            )}

            {/* Help Link */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => alert("Ask customer to open PharmaDrop app to view their 4-digit code under Order Details.")}
                className="text-xs font-bold text-[#005C53] inline-flex items-center space-x-1 hover:underline"
              >
                <HelpCircle className="w-4 h-4" />
                <span>Customer doesn't have a code</span>
              </button>
            </div>
          </div>

          {/* Bottom Action Button */}
          <button
            onClick={handleConfirmPIN}
            disabled={submittingPin || pinSuccess}
            className="w-full py-4 bg-[#005C53] hover:bg-[#004D40] text-white font-bold text-base rounded-2xl flex items-center justify-center space-x-2 transition-colors shadow-md mt-8 disabled:opacity-50"
          >
            <Check className="w-5 h-5 stroke-[3]" />
            <span>{submittingPin ? 'Verifying...' : 'Confirm Delivery'}</span>
          </button>
        </div>
      ) : (

        /* SCREEN 2: RIDER ACTIVE TASKS LIST (image_6.png) */
        <div className="flex-1 p-4">
          {/* Header */}
          <div className="flex items-center justify-between py-3 mb-4">
            <h1 className="text-2xl font-black text-[#005C53] tracking-tight">
              PharmaDrop
            </h1>
            <div className="flex items-center space-x-3">
              <button className="p-2 text-slate-600 hover:bg-slate-200/60 rounded-full relative">
                <Bell className="w-6 h-6" />
              </button>
              <button className="p-2 text-slate-600 hover:bg-slate-200/60 rounded-full">
                <User className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">My Deliveries</h2>
              <p className="text-xs text-slate-500">{activeTasks.length} Active Tasks</p>
            </div>
            <button
              onClick={fetchAssignedTasks}
              className="p-2 text-[#005C53] hover:bg-teal-50 border border-teal-200 rounded-full transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>

          {/* Task Cards List */}
          <div className="space-y-5">
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-sm">Loading tasks...</div>
            ) : activeTasks.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-400 text-sm">
                No active delivery tasks assigned to you.
              </div>
            ) : (
              activeTasks.map((task) => {
                const rawNum = task.order_number.replace('#PD-', '');
                return (
                  <div
                    key={task.id}
                    className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden space-y-4"
                  >
                    {/* Big Watermark ID (image_6.png) */}
                    <span className="absolute right-4 top-2 text-6xl font-black text-slate-900/10 pointer-events-none tracking-tight select-none">
                      {rawNum}
                    </span>

                    {/* Status Pill Header */}
                    <div className="flex items-center justify-between pr-20">
                      {task.status === 'ASSIGNED' ? (
                        <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-teal-50 text-teal-800 font-bold text-xs rounded-full border border-teal-100">
                          <Package className="w-3.5 h-3.5" />
                          <span>ASSIGNED</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-[#005C53] text-white font-bold text-xs rounded-full shadow-sm">
                          <Bike className="w-3.5 h-3.5" />
                          <span>OUT FOR DELIVERY</span>
                        </span>
                      )}
                    </div>

                    {/* Route Steps Timeline (Pickup -> Dropoff) */}
                    <div className="space-y-3 pt-1">
                      {task.status === 'ASSIGNED' && (
                        <div className="flex items-start space-x-3">
                          <div className="w-3 h-3 rounded-full border-2 border-teal-700 bg-white mt-1 shrink-0" />
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              PICKUP
                            </span>
                            <h4 className="text-sm font-bold text-slate-900">{task.pickup_address}</h4>
                          </div>
                        </div>
                      )}

                      <div className="flex items-start space-x-3">
                        <div className="w-3 h-3 rounded-full bg-teal-700 mt-1 shrink-0" />
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            DROPOFF
                          </span>
                          <h4 className="text-sm font-bold text-slate-900">{task.delivery_address}</h4>
                        </div>
                      </div>
                    </div>

                    {/* Customer Note Callout Box (image_6.png) */}
                    {task.customer_note && (
                      <div className="p-3 bg-slate-100/80 rounded-xl border border-slate-200/80 flex items-start space-x-2 text-xs text-slate-700">
                        <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                        <p className="italic">{task.customer_note}</p>
                      </div>
                    )}

                    {/* Meta info & Action Buttons */}
                    <div className="pt-2 border-t border-slate-100">
                      {task.status === 'ASSIGNED' ? (
                        <div>
                          <div className="flex items-center space-x-4 text-xs font-semibold text-slate-600 mb-3">
                            <span className="text-red-600 flex items-center space-x-1">
                              <Clock className="w-3.5 h-3.5" />
                              <span>12 mins away</span>
                            </span>
                            <span>4.2 km</span>
                          </div>

                          <button
                            onClick={() => handleStartPickup(task)}
                            className="w-full py-3 bg-[#004D40] hover:bg-[#00382E] text-white font-bold text-sm rounded-xl flex items-center justify-center space-x-2 transition-colors shadow-sm"
                          >
                            <Bike className="w-4 h-4" />
                            <span>Start Pickup</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-3">
                          <a
                            href={`tel:${task.customer_phone || '+254712345678'}`}
                            className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-colors"
                          >
                            <Phone className="w-4 h-4" />
                            <span>Call</span>
                          </a>

                          <button
                            onClick={() => handleOpenPinModal(task)}
                            className="flex-2 py-3 bg-[#004D40] hover:bg-[#00382E] text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-colors shadow-sm"
                          >
                            <Check className="w-4 h-4 stroke-[3]" />
                            <span>Mark Delivered</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
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

export default RiderDashboard;
