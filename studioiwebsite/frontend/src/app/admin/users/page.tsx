'use client';

import React, { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import { 
  Users, ShieldCheck, ShieldAlert, CheckCircle2, 
  XCircle, Search, RefreshCw, Lock, Unlock
} from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<any>('/admin/users');
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.users)
          ? data.users
          : [];
      setUsers(list);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleBlock = async (userId: string, currentBlocked: boolean) => {
    try {
      setActionLoading(true);
      await apiRequest(`/admin/users/${userId}/block`, {
        method: 'PATCH',
        body: JSON.stringify({
          isBlocked: !currentBlocked,
          reason: currentBlocked ? 'Admin unblocked user' : 'Policy compliance review',
        }),
      });
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to update user block status');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = (Array.isArray(users) ? users : []).filter((u) => {
    const isCoHost = (u.cohostPermissions && u.cohostPermissions.length > 0) || u.role === 'COHOST';
    if (selectedRole === 'COHOST' && !isCoHost) return false;
    if (selectedRole === 'HOST' && u.role !== 'HOST') return false;
    if (selectedRole === 'ADMIN' && u.role !== 'ADMIN') return false;
    if (selectedRole === 'USER' && (u.role !== 'USER' || isCoHost)) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            User Directory & Access Control
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Manage member accounts, administrative scopes, and security block statuses.
          </p>
        </div>

        <button
          onClick={fetchUsers}
          className="p-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl transition self-start sm:self-auto"
          title="Refresh users"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Search and Role Filter Bar */}
      <div className="bg-[#171717] p-4 rounded-2xl border border-neutral-800 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search users by name, email or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#0e4962]"
          />
        </div>

        {/* Role Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-neutral-800/80">
          <span className="text-[11px] font-bold uppercase text-neutral-500 mr-1">Filter Role:</span>
          {[
            { id: 'ALL', label: 'All Users' },
            { id: 'COHOST', label: 'Co-Hosts' },
            { id: 'HOST', label: 'Primary Hosts' },
            { id: 'USER', label: 'Regular Members' },
            { id: 'ADMIN', label: 'Admins' },
          ].map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedRole(r.id)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                selectedRole === r.id
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#171717] rounded-3xl border border-neutral-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-900/90 text-neutral-400 uppercase font-bold border-b border-neutral-800 tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-5">User</th>
                <th className="py-3.5 px-5">Contact</th>
                <th className="py-3.5 px-5">System Role</th>
                <th className="py-3.5 px-5">Account Status</th>
                <th className="py-3.5 px-5">Total Bookings</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
              {loading && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-neutral-500">
                    Loading users...
                  </td>
                </tr>
              )}

              {!loading && filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-neutral-500">
                    No users found matching query.
                  </td>
                </tr>
              )}

              {!loading &&
                filteredUsers.map((u) => {
                  const isAdmin = u.role === 'ADMIN';
                  const isHost = u.role === 'HOST';
                  const isCoHost = (u.cohostPermissions && u.cohostPermissions.length > 0) || u.role === 'COHOST';
                  const isBlocked = u.isBlocked;

                  return (
                    <tr key={u.id} className="hover:bg-neutral-800/30 transition">
                      <td className="py-4 px-5">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span>{u.name}</span>
                          {isAdmin && (
                            <span className="px-2 py-0.5 bg-[#0e4962]/20 text-[#0e4962] text-[10px] font-bold rounded-md">
                              Admin
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-neutral-400">{u.email}</div>
                      </td>

                      <td className="py-4 px-5 font-mono text-neutral-400">
                        {u.phone || 'N/A'}
                      </td>

                      <td className="py-4 px-5">
                        {isCoHost ? (
                          <div className="flex flex-col gap-0.5 items-start">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-950/90 text-purple-300 border border-purple-700 flex items-center gap-1">
                              <Users className="w-3 h-3 text-purple-400" />
                              CO-HOST
                            </span>
                            {u.cohostPermissions && u.cohostPermissions.length > 0 && (
                              <span className="text-[9px] text-purple-400 font-semibold pl-1">
                                {u.cohostPermissions.length} {u.cohostPermissions.length === 1 ? 'Workspace' : 'Workspaces'}
                              </span>
                            )}
                          </div>
                        ) : isHost ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-950/80 text-blue-300 border border-blue-700">
                            HOST
                          </span>
                        ) : isAdmin ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-pink-950/80 text-pink-300 border border-pink-700">
                            ADMIN
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-neutral-800 text-neutral-300">
                            MEMBER
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isBlocked
                              ? 'bg-red-950/80 text-red-400 border border-red-800'
                              : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                          }`}
                        >
                          {isBlocked ? 'Blocked' : 'Active'}
                        </span>
                      </td>

                      <td className="py-4 px-5 font-bold text-white">
                        {u._count?.bookings || 0}
                      </td>

                      <td className="py-4 px-5 text-right">
                        {!isAdmin ? (
                          <button
                            onClick={() => handleToggleBlock(u.id, isBlocked)}
                            disabled={actionLoading}
                            className={`px-3 py-1 text-[11px] font-bold rounded-lg transition ${
                              isBlocked
                                ? 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-400 border border-emerald-800'
                                : 'bg-red-950/80 hover:bg-red-900 text-red-400 border border-red-800'
                            }`}
                          >
                            {isBlocked ? 'Unblock Account' : 'Block Account'}
                          </button>
                        ) : (
                          <span className="text-[11px] text-neutral-500 italic">Protected Admin</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
