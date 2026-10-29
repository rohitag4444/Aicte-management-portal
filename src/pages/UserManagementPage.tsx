import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { User, Institution } from '../types';
import { Users, Building2, Shield, CheckCircle2, XCircle, Search, ToggleLeft, ToggleRight } from 'lucide-react';

export const UserManagementPage: React.FC<{ onNavigate: (page: string) => void }> = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'institutions'>('users');
  const [search, setSearch] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [uRes, iRes] = await Promise.all([api.getUsers(), api.getInstitutions()]);
      setUsers(uRes.users || []);
      setInstitutions(iRes.institutions || []);
    } catch (err) {
      console.error('Failed to load user management:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleToggleUser = async (id: string) => {
    try {
      await api.toggleUserStatus(id);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q) ||
      (u.institutionName && u.institutionName.toLowerCase().includes(q))
    );
  });

  const filteredInstitutions = institutions.filter((i) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      i.name.toLowerCase().includes(q) ||
      i.aicteCode.toLowerCase().includes(q) ||
      i.state.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-700" />
            Module 3C · System Administration Console
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">User & Institutional Account Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Maintain authorized institutional representatives, scrutiny officers, and account statuses
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'users' ? 'bg-white text-slate-900 font-semibold shadow-sm' : 'text-slate-600'
            }`}
          >
            Authorized Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('institutions')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'institutions' ? 'bg-white text-slate-900 font-semibold shadow-sm' : 'text-slate-600'
            }`}
          >
            Registered Institutions ({institutions.length})
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder={
              activeTab === 'users'
                ? 'Search users by name, email, or role...'
                : 'Search institutions by name, AICTE code, or state...'
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading accounts...
          </div>
        ) : activeTab === 'users' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold uppercase text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Email Address</th>
                  <th className="py-3 px-4">Role Assigned</th>
                  <th className="py-3 px-4">Designation & Scope</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Account Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{u.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">ID: {u.id}</div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">{u.email}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-900 border border-blue-200">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-900 font-medium">{u.designation}</div>
                      {u.institutionName && (
                        <div className="text-[10px] text-slate-400">{u.institutionName}</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {u.isActive ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          <XCircle className="w-3 h-3 text-rose-600" /> Deactivated
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {u.id !== user?.id && (
                        <button
                          onClick={() => handleToggleUser(u.id)}
                          className={`px-2.5 py-1 text-xs font-semibold rounded border transition-colors ${
                            u.isActive
                              ? 'text-rose-700 hover:bg-rose-50 border-rose-200'
                              : 'text-emerald-700 hover:bg-emerald-50 border-emerald-200'
                          }`}
                        >
                          {u.isActive ? 'Deactivate' : 'Reactivate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold uppercase text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">AICTE Code</th>
                  <th className="py-3 px-4">Institution Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">State & Location</th>
                  <th className="py-3 px-4">Active FDRs</th>
                  <th className="py-3 px-4">Total Corpus</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredInstitutions.map((inst) => (
                  <tr key={inst.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-900">{inst.aicteCode}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{inst.name}</div>
                      <div className="text-[10px] text-slate-400">Trust: {inst.trustName}</div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">{inst.category}</td>
                    <td className="py-3 px-4">
                      <div>{inst.city}, {inst.state}</div>
                      <div className="text-[10px] text-slate-400">Est. {inst.establishedYear}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-blue-900">
                      {inst.totalApprovedFDRs} Approved
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      ₹{(inst.totalDepositAmountINR || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {inst.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
