import React, { useState, useEffect } from 'react';
import { deliveryAPI } from '../services/api';
import { 
  Cross, LayoutDashboard, Truck, Package, Bike, BarChart2, Settings, HelpCircle, 
  Plus, Search, Filter, Send, UserPlus, AlertCircle, CheckCircle, ChevronLeft, ChevronRight 
} from 'lucide-react';

const PharmacyDashboard = () => {
  const [activeTab, setActiveTab] = useState('new'); // 'new' | 'list'
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState(null);

  // Form State
  const [patientSearch, setPatientSearch] = useState('');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [priority, setPriority] = useState('Standard (4 Hours)');
  const [paymentCollection, setPaymentCollection] = useState('Pre-paid');
  const [isColdChain, setIsColdChain] = useState(false);
  const [customerNote, setCustomerNote] = useState('');

  useEffect(() => {
    fetchMyDeliveries();
  }, []);

  const fetchMyDeliveries = async () => {
    setLoading(true);
    try {
      const res = await deliveryAPI.getDeliveries();
      setDeliveries(res.data.results || res.data);
    } catch (err) {
      console.error('Failed to fetch pharmacy deliveries:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDelivery = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (!deliveryAddress || !itemDescription) {
      setMessage({ type: 'error', text: 'Delivery Address and Prescription Description are required.' });
      return;
    }

    try {
      const payload = {
        new_customer_name: newCustomerName || patientSearch || 'Esther Wanjiku',
        new_customer_phone: newCustomerPhone || '+254712345678',
        delivery_address: deliveryAddress,
        item_description: itemDescription,
        priority,
        payment_collection: paymentCollection,
        is_cold_chain: isColdChain,
        customer_note: customerNote
      };

      const res = await deliveryAPI.createDelivery(payload);
      setMessage({
        type: 'success',
        text: `Delivery created successfully! Order ${res.data.order_number} generated confirmation code: ${res.data.confirmation_code}`
      });

      // Reset form
      setPatientSearch('');
      setNewCustomerName('');
      setNewCustomerPhone('');
      setDeliveryAddress('');
      setItemDescription('');
      setCustomerNote('');
      setIsColdChain(false);

      fetchMyDeliveries();
    } catch (err) {
      console.error('Creation error:', err);
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to create delivery.' });
    }
  };

  const filteredDeliveries = deliveries.filter((d) => 
    d.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.item_description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-800">
      
      {/* LEFT SIDEBAR NAVIGATION (Matching image_3.png & image_4.png) */}
      <aside className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col justify-between p-4 shrink-0">
        <div>
          {/* Logo Header */}
          <div className="flex items-center space-x-2 px-2 py-3 mb-6">
            <Cross className="w-6 h-6 text-[#005C53] stroke-[3]" />
            <span className="text-xl font-bold tracking-tight text-[#005C53]">PharmaDrop</span>
          </div>

          {/* Station / User info */}
          <div className="flex items-center space-x-3 px-2 mb-6">
            <img
              src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=100&q=80"
              alt="Pharmacy Staff"
              className="w-10 h-10 rounded-full object-cover border border-slate-200"
            />
            <div>
              <h4 className="text-xs font-bold text-slate-900">Dispatcher Hub</h4>
              <p className="text-[11px] text-slate-500">Nairobi Central</p>
            </div>
          </div>

          {/* New Dispatch Action Button */}
          <button
            onClick={() => setActiveTab('new')}
            className="w-full py-2.5 px-4 bg-[#004D40] hover:bg-[#00382E] text-white font-semibold text-xs rounded-lg flex items-center justify-center space-x-2 transition-colors shadow-sm mb-6"
          >
            <Plus className="w-4 h-4" />
            <span>New Dispatch</span>
          </button>

          {/* Main Navigation Links */}
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('new')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'new'
                  ? 'bg-[#005C53] text-white font-semibold shadow-sm'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('list')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'list'
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

        {/* Bottom Sidebar Links */}
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
      <main className="flex-1 p-8 overflow-y-auto">
        
        {/* VIEW 1: NEW DELIVERY FORM (image_3.png) */}
        {activeTab === 'new' ? (
          <div className="max-w-3xl">
            <h1 className="text-3xl font-bold text-slate-900 mb-1">New Delivery</h1>
            <p className="text-sm text-slate-500 mb-8">Enter patient and prescription details to dispatch a rider.</p>

            {message && (
              <div className={`mb-6 p-4 rounded-xl text-xs font-medium flex items-center space-x-2 ${
                message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {message.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" /> : <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />}
                <span>{message.text}</span>
              </div>
            )}

            <form onSubmit={handleCreateDelivery} className="space-y-6">
              
              {/* Box 1: Patient Details */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm">Patient Details</h3>
                  <button type="button" className="text-xs font-bold text-[#005C53] flex items-center space-x-1 hover:underline">
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>New Patient</span>
                  </button>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    placeholder="Search by name, phone, or ID... (e.g. Esther Wanjiku)"
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#005C53] focus:bg-white"
                  />
                </div>
              </div>

              {/* Box 2: Delivery Information */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 text-sm">Delivery Information</h3>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Delivery Address</label>
                  <textarea
                    rows={3}
                    required
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Enter full address, ward, or notable landmarks..."
                    className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#005C53] focus:bg-white resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Prescription / Item Description</label>
                  <textarea
                    rows={3}
                    required
                    value={itemDescription}
                    onChange={(e) => setItemDescription(e.target.value)}
                    placeholder="e.g., 2x Amoxicillin 500mg, 1x Paracetamol..."
                    className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#005C53] focus:bg-white resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#005C53]"
                    >
                      <option value="Standard (4 Hours)">Standard (4 Hours)</option>
                      <option value="Express (2 Hours)">Express (2 Hours)</option>
                      <option value="Emergency (30 Mins)">Emergency (30 Mins)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Payment Collection</label>
                    <select
                      value={paymentCollection}
                      onChange={(e) => setPaymentCollection(e.target.value)}
                      className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#005C53]"
                    >
                      <option value="Pre-paid">Pre-paid</option>
                      <option value="Cash on Delivery">Cash on Delivery</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <input
                    type="checkbox"
                    id="coldChain"
                    checked={isColdChain}
                    onChange={(e) => setIsColdChain(e.target.checked)}
                    className="w-4 h-4 text-[#005C53] rounded border-slate-300 focus:ring-[#005C53]"
                  />
                  <label htmlFor="coldChain" className="text-xs font-semibold text-slate-700">
                    Cold Chain Required (Refrigerated storage)
                  </label>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                className="w-full py-4 bg-[#004D40] hover:bg-[#00382E] text-white font-bold text-base rounded-2xl flex items-center justify-center space-x-3 transition-colors shadow-md"
              >
                <Send className="w-5 h-5" />
                <span>Create Delivery & Generate Code</span>
              </button>
            </form>
          </div>
        ) : (

          /* VIEW 2: MY CREATED DELIVERIES TABLE (image_4.png) */
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 mb-1">My Created Deliveries</h1>
                <p className="text-xs text-slate-500">Manage and track all logistics records created by your station.</p>
              </div>

              <div className="flex items-center space-x-3">
                <div className="relative w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search orders, customers..."
                    className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#005C53]"
                  />
                </div>
                <button className="flex items-center space-x-1.5 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50">
                  <Filter className="w-3.5 h-3.5" />
                  <span>Filter</span>
                </button>
              </div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">ORDER ID</th>
                    <th className="py-3.5 px-4">CUSTOMER NAME</th>
                    <th className="py-3.5 px-4">ITEM DESCRIPTION</th>
                    <th className="py-3.5 px-4">STATUS</th>
                    <th className="py-3.5 px-4">CREATED TIME</th>
                    <th className="py-3.5 px-4 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredDeliveries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No deliveries found. Click "New Dispatch" to create one.
                      </td>
                    </tr>
                  ) : (
                    filteredDeliveries.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-4 font-bold text-[#005C53]">
                          {order.order_number}
                        </td>
                        <td className="py-4 px-4 font-semibold text-slate-900">
                          {order.customer_name}
                        </td>
                        <td className="py-4 px-4 text-slate-600 max-w-xs truncate">
                          {order.item_description}
                          {order.is_cold_chain && (
                            <span className="ml-2 px-1.5 py-0.5 bg-sky-100 text-sky-800 text-[10px] font-bold rounded">Cold Chain</span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${
                            order.status === 'DELIVERED'
                              ? 'bg-cyan-100 text-cyan-800'
                              : order.status === 'OUT_FOR_DELIVERY' || order.status === 'ASSIGNED'
                              ? 'bg-blue-100 text-blue-800'
                              : order.status === 'PENDING'
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {order.status === 'OUT_FOR_DELIVERY' ? 'In Transit' : order.status === 'PENDING' ? 'Pending Pickup' : order.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-slate-500">
                          {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-4 px-4 text-right font-medium">
                          <span className="text-[#005C53] font-bold cursor-pointer hover:underline">View PIN Code</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Table Footer Pagination */}
              <div className="py-3 px-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                <span>Showing 1 to {filteredDeliveries.length} of {filteredDeliveries.length} entries</span>
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
          </div>
        )}
      </main>
    </div>
  );
};

export default PharmacyDashboard;
