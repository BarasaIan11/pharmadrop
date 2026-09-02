import React from 'react';
import { useAuth } from '../context/AuthContext';
import { UserCheck, Shield, Truck, Stethoscope, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RoleSwitcherBar = () => {
  const { user, quickLogin, logout } = useAuth();
  const navigate = useNavigate();

  const handleRoleSwitch = async (role) => {
    try {
      const newUser = await quickLogin(role);
      if (newUser.role === 'CUSTOMER') navigate('/customer/orders');
      else if (newUser.role === 'PHARMACY_STAFF') navigate('/pharmacy/new-delivery');
      else if (newUser.role === 'DISPATCHER') navigate('/dispatcher/unassigned');
      else if (newUser.role === 'RIDER') navigate('/rider/deliveries');
    } catch (err) {
      console.error('Role switch error:', err);
    }
  };

  const roles = [
    { key: 'CUSTOMER', label: 'Customer', icon: UserCheck, route: '/customer/orders' },
    { key: 'PHARMACY_STAFF', label: 'Pharmacy Staff', icon: Stethoscope, route: '/pharmacy/new-delivery' },
    { key: 'DISPATCHER', label: 'Dispatcher', icon: Shield, route: '/dispatcher/unassigned' },
    { key: 'RIDER', label: 'Rider', icon: Truck, route: '/rider/deliveries' },
  ];

  return (
    <div className="bg-slate-900 text-slate-200 text-xs py-1.5 px-4 flex flex-wrap items-center justify-between border-b border-slate-800 shadow-sm z-50">
      <div className="flex items-center space-x-2 font-medium">
        <span className="bg-teal-500/20 text-teal-300 font-semibold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">
          Demo Mode
        </span>
        <span className="hidden sm:inline text-slate-400">Quick Switch Role:</span>
      </div>

      <div className="flex items-center space-x-1.5 overflow-x-auto">
        {roles.map((r) => {
          const Icon = r.icon;
          const isActive = user?.role === r.key;
          return (
            <button
              key={r.key}
              onClick={() => handleRoleSwitch(r.key)}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-md transition-all font-medium ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{r.label}</span>
            </button>
          );
        })}

        {user && (
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="flex items-center space-x-1 px-2 py-1 ml-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
            title="Logout"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Logout</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default RoleSwitcherBar;
