import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  UserCheck, Shield, Truck, Stethoscope, LogOut, Building, ChevronDown, Zap
} from 'lucide-react';

const ROLES = [
  {
    key: 'CUSTOMER',
    label: 'Customer',
    sublabel: 'Esther Wanjiku',
    icon: UserCheck,
    route: '/customer/orders',
    color: 'bg-sky-600',
    hoverBg: 'hover:bg-sky-700',
    activeBg: 'bg-sky-600',
    demo: 'customer1',
  },
  {
    key: 'PHARMACY_STAFF',
    label: 'Pharmacy Staff',
    sublabel: 'Nairobi Central',
    icon: Stethoscope,
    route: '/pharmacy/new-delivery',
    color: 'bg-teal-700',
    hoverBg: 'hover:bg-teal-800',
    activeBg: 'bg-teal-700',
    demo: 'staff1',
  },
  {
    key: 'DISPATCHER',
    label: 'Dispatcher',
    sublabel: 'Nairobi Central',
    icon: Shield,
    route: '/dispatcher/unassigned',
    color: 'bg-violet-700',
    hoverBg: 'hover:bg-violet-800',
    activeBg: 'bg-violet-700',
    demo: 'dispatcher1',
  },
  {
    key: 'RIDER',
    label: 'Rider',
    sublabel: 'David Kamau',
    icon: Truck,
    route: '/rider/deliveries',
    color: 'bg-emerald-700',
    hoverBg: 'hover:bg-emerald-800',
    activeBg: 'bg-emerald-700',
    demo: 'rider1',
  },
];

const RoleSwitcherBar = () => {
  const { user, quickLogin, logout, pharmacyName, pharmacyCode } = useAuth();
  const navigate = useNavigate();
  const [switching, setSwitching] = useState(null);

  const handleRoleSwitch = async (role) => {
    if (switching) return;
    setSwitching(role.key);
    try {
      const newUser = await quickLogin(role.key);
      navigate(role.route);
    } catch (err) {
      console.error('Role switch error:', err);
    } finally {
      setSwitching(null);
    }
  };

  const activeRole = ROLES.find((r) => r.key === user?.role);

  return (
    <div className="bg-slate-950 text-slate-300 text-[11px] py-2 px-4 lg:px-6 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 shadow-sm z-50 sticky top-0">
      {/* Left: Demo badge + active user info */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-1.5 bg-amber-500/15 border border-amber-500/30 text-amber-400 px-2.5 py-1 rounded-full">
          <Zap className="w-3 h-3" />
          <span className="font-bold tracking-wide uppercase text-[10px]">Demo Mode</span>
        </div>

        {user && (
          <div className="hidden sm:flex items-center space-x-2 text-slate-400">
            {activeRole && (
              <div className={`w-5 h-5 rounded-full ${activeRole.color} flex items-center justify-center`}>
                <activeRole.icon className="w-2.5 h-2.5 text-white" />
              </div>
            )}
            <span className="font-semibold text-slate-200">{user.full_name || user.username}</span>
            {pharmacyName && (
              <span className="flex items-center space-x-1 text-slate-500">
                <Building className="w-3 h-3" />
                <span>{pharmacyName}</span>
                {pharmacyCode && <span className="text-slate-600">({pharmacyCode})</span>}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Right: Role switcher buttons + logout */}
      <div className="flex items-center space-x-1 overflow-x-auto">
        <span className="text-slate-600 font-medium mr-1.5 hidden md:inline shrink-0">Switch role:</span>

        {ROLES.map((role) => {
          const Icon = role.icon;
          const isActive = user?.role === role.key;
          const isLoading = switching === role.key;

          return (
            <button
              key={role.key}
              onClick={() => handleRoleSwitch(role)}
              disabled={!!switching}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all font-semibold shrink-0 ${
                isActive
                  ? `${role.activeBg} text-white shadow-sm`
                  : `bg-slate-800 text-slate-400 ${role.hoverBg} hover:text-white`
              } ${switching && !isLoading ? 'opacity-50' : ''}`}
              title={`${role.label} — ${role.sublabel}`}
            >
              {isLoading ? (
                <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <Icon className="w-3 h-3" />
              )}
              <span>{role.label}</span>
            </button>
          );
        })}

        {/* Divider */}
        <div className="w-px h-5 bg-slate-700 mx-1.5 shrink-0" />

        {user && (
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800/80 rounded-lg transition-colors shrink-0"
            title="Logout"
          >
            <LogOut className="w-3 h-3" />
            <span className="hidden md:inline">Logout</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default RoleSwitcherBar;
