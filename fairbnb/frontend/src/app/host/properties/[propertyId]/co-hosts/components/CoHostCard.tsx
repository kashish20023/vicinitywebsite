'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api-client';
import { PermissionSelector } from './PermissionSelector';
import { User, Shield, DollarSign, PauseCircle, PlayCircle, Trash2, Edit3, X, Check, AlertCircle } from 'lucide-react';

interface CoHostCardProps {
  coHost: any;
  onRefresh: () => void;
}

export function CoHostCard({ coHost, onRefresh }: CoHostCardProps) {
  const [showEditPermissionsModal, setShowEditPermissionsModal] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
    coHost.permissions?.map((p: any) => p.permission) || []
  );
  const [permissionLevel, setPermissionLevel] = useState(coHost.permissionLevel || 'CUSTOM');
  const [payoutType, setPayoutType] = useState(coHost.payoutRules?.[0]?.type || 'PERCENTAGE');
  const [percentage, setPercentage] = useState(coHost.payoutRules?.[0]?.percentage || 10);
  const [fixedAmount, setFixedAmount] = useState(coHost.payoutRules?.[0]?.fixedAmount || 500);

  const [showAllPermissions, setShowAllPermissions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const user = coHost.coHostUser;
  const payoutRule = coHost.payoutRules?.[0];

  const formatPermission = (code: string) => {
    return code
      .toLowerCase()
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleUpdatePermissions = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload: any = { permissionLevel };
      if (permissionLevel === 'CUSTOM') {
        payload.permissions = selectedPermissions;
      }
      await api.patch(`/co-hosts/${coHost.id}/permissions`, payload);
      setShowEditPermissionsModal(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to update permissions');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigurePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload: any = {
        type: payoutType,
        percentage: payoutType === 'PERCENTAGE' || payoutType === 'CLEANING_FEE_PLUS_PERCENTAGE' ? Number(percentage) : undefined,
        fixedAmount: payoutType === 'FIXED_AMOUNT' ? Number(fixedAmount) : undefined,
      };
      await api.patch(`/co-hosts/${coHost.id}/payout`, payload);
      setShowPayoutModal(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to configure payout');
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!confirm('Are you sure you want to suspend this co-host?')) return;
    try {
      await api.post(`/co-hosts/${coHost.id}/suspend`);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to suspend co-host');
    }
  };

  const handleReactivate = async () => {
    try {
      await api.post(`/co-hosts/${coHost.id}/reactivate`);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to reactivate co-host');
    }
  };

  const handleRemove = async () => {
    if (!confirm(coHost.isInvitation ? 'Are you sure you want to revoke this invitation?' : 'Are you sure you want to remove this co-host relationship?')) return;
    try {
      if (coHost.isInvitation) {
        await api.delete(`/co-hosts/invitations/${coHost.id}`);
      } else {
        await api.delete(`/co-hosts/${coHost.id}`);
      }
      onRefresh();
    } catch (err: any) {
      alert(err.message || (coHost.isInvitation ? 'Failed to revoke invitation' : 'Failed to remove co-host'));
    }
  };

  const isPending = coHost.status === 'PENDING_INVITE' || coHost.isInvitation;
  const permissionsList = coHost.permissions || [];
  const displayedPermissions = showAllPermissions ? permissionsList : permissionsList.slice(0, 6);

  return (
    <div
      className={`bg-white rounded-3xl p-6 shadow-xs hover:shadow-md transition-all duration-200 border ${isPending
        ? 'border-dashed border-sky-300 bg-sky-50/10'
        : coHost.status === 'SUSPENDED'
          ? 'border-rose-200 bg-rose-50/10'
          : 'border-neutral-200'
        } space-y-4`}
    >
      {/* USER INFO HEADER */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-neutral-100 to-neutral-200 flex items-center justify-center text-neutral-600 font-bold overflow-hidden border border-neutral-200/80 shadow-xs flex-shrink-0">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <User className="w-6 h-6 text-neutral-400" />
            )}
          </div>
          <div>
            <h4 className="font-bold text-neutral-900 text-body leading-snug">{user?.name || 'Co-Host Invitee'}</h4>
            <p className="text-caption text-neutral-500 font-medium">{user?.email}</p>
            {user?.phone && <p className="text-caption text-neutral-400 font-mono mt-0.5">{user.phone}</p>}
          </div>
        </div>

        {/* STATUS BADGE */}
        <div className="flex-shrink-0">
          {coHost.status === 'ACTIVE' ? (
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-caption font-semibold border border-emerald-200 inline-flex items-center gap-1.5 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active
            </span>
          ) : coHost.status === 'SUSPENDED' ? (
            <span className="px-3 py-1 bg-rose-50 text-rose-700 rounded-full text-caption font-semibold border border-rose-200 inline-flex items-center gap-1.5 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              Suspended
            </span>
          ) : (
            <span className="px-3 py-1 bg-sky-50 text-sky-700 rounded-full text-caption font-semibold border border-sky-200 inline-flex items-center gap-1.5 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-ping" />
              Pending Invite
            </span>
          )}
        </div>
      </div>

      {/* PERMISSIONS SUMMARY */}
      <div className="p-4 bg-neutral-50/80 rounded-2xl border border-neutral-100 space-y-2.5 text-caption">
        <div className="flex items-center justify-between font-semibold text-neutral-700">
          <span className="flex items-center gap-1.5 text-neutral-900 font-bold">
            <Shield className="w-4 h-4 text-rose-600" />
            Preset: <span className="px-2 py-0.5 bg-neutral-200/60 rounded-md font-mono text-neutral-800 text-overline uppercase tracking-wider">{coHost.permissionLevel}</span>
          </span>
          <button
            onClick={() => setShowEditPermissionsModal(true)}
            disabled={coHost.isInvitation}
            className={`font-semibold text-button flex items-center gap-1 cursor-pointer transition ${coHost.isInvitation ? 'text-neutral-400 cursor-not-allowed' : 'text-rose-600 hover:text-rose-700'
              }`}
          >
            <Edit3 className="w-3.5 h-3.5" /> Edit Access
          </button>
        </div>

        {/* HUMAN-READABLE PERMISSION PILLS */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {displayedPermissions.map((p: any) => (
            <span
              key={p.id || p.permission}
              className="px-2.5 py-1 bg-white border border-neutral-200/80 text-neutral-700 rounded-lg text-caption font-medium shadow-2xs"
            >
              {formatPermission(p.permission)}
            </span>
          ))}

          {permissionsList.length > 6 && (
            <button
              onClick={() => setShowAllPermissions(!showAllPermissions)}
              className="px-2.5 py-1 bg-neutral-200/70 hover:bg-neutral-300/70 text-neutral-800 rounded-lg text-caption font-semibold transition cursor-pointer"
            >
              {showAllPermissions ? 'Show Less' : `+${permissionsList.length - 6} More`}
            </button>
          )}
        </div>
      </div>

      {/* PAYOUT RULE SUMMARY */}
      <div className="p-3.5 bg-emerald-50/40 rounded-2xl border border-emerald-200/60 flex items-center justify-between text-caption">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-100/80 flex items-center justify-center text-emerald-700 font-bold flex-shrink-0">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-emerald-950">
              {payoutRule
                ? `Payout: ${payoutRule.type.replace('_', ' ')} ${payoutRule.percentage ? `(${payoutRule.percentage}%)` : ''} ${payoutRule.fixedAmount ? `(₹${payoutRule.fixedAmount})` : ''}`
                : 'No Payout Configured (Unpaid Co-Host)'}
            </p>
            {payoutRule && (
              <span className="text-caption text-emerald-700 font-medium">Status: {payoutRule.status}</span>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowPayoutModal(true)}
          disabled={coHost.isInvitation}
          className={`px-3 py-1.5 bg-white border border-emerald-200 rounded-xl text-caption font-bold shadow-2xs transition cursor-pointer ${coHost.isInvitation ? 'text-neutral-400 cursor-not-allowed opacity-50' : 'text-emerald-700 hover:bg-emerald-50'
            }`}
        >
          Configure
        </button>
      </div>

      {/* ACTIONS TOOLBAR */}
      <div className="pt-2 flex items-center justify-end gap-2 border-t border-neutral-100">
        {!coHost.isInvitation && (
          coHost.status === 'ACTIVE' ? (
            <button
              onClick={handleSuspend}
              className="px-3.5 py-1.5 text-caption font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <PauseCircle className="w-3.5 h-3.5" /> Suspend Access
            </button>
          ) : (
            <button
              onClick={handleReactivate}
              className="px-3.5 py-1.5 text-caption font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <PlayCircle className="w-3.5 h-3.5" /> Reactivate
            </button>
          )
        )}

        <button
          onClick={handleRemove}
          className="px-3.5 py-1.5 text-caption font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" /> {coHost.isInvitation ? 'Revoke Invite' : 'Remove'}
        </button>
      </div>

      {/* EDIT PERMISSIONS MODAL */}
      {showEditPermissionsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <h3 className="font-bold text-lg">Edit Co-Host Permissions</h3>
              <button onClick={() => setShowEditPermissionsModal(false)}>
                <X className="w-5 h-5 text-neutral-400 hover:text-neutral-900" />
              </button>
            </div>
            {error && <p className="text-xs text-rose-600 font-bold">{error}</p>}
            <form onSubmit={handleUpdatePermissions} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1">Preset Level</label>
                <select
                  value={permissionLevel}
                  onChange={(e) => setPermissionLevel(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-neutral-300 text-sm font-semibold"
                >
                  <option value="FULL_ACCESS">Full Access</option>
                  <option value="OPERATIONS">Operations</option>
                  <option value="CALENDAR_MESSAGING">Calendar + Messaging</option>
                  <option value="CALENDAR_ONLY">Calendar Only</option>
                  <option value="CUSTOM">Custom Permissions</option>
                </select>
              </div>

              {permissionLevel === 'CUSTOM' && (
                <PermissionSelector
                  selectedPermissions={selectedPermissions}
                  onChange={setSelectedPermissions}
                />
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-[#1a6585] text-white rounded-xl text-xs font-bold hover:bg-[#1a6585] transition"
              >
                {loading ? 'Saving...' : 'Save Permissions'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PAYOUT MODAL */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <h3 className="font-bold text-lg">Configure Payout Rule</h3>
              <button onClick={() => setShowPayoutModal(false)}>
                <X className="w-5 h-5 text-neutral-400 hover:text-neutral-900" />
              </button>
            </div>
            {error && <p className="text-xs text-rose-600 font-bold">{error}</p>}
            <form onSubmit={handleConfigurePayout} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1">Payout Type</label>
                <select
                  value={payoutType}
                  onChange={(e) => setPayoutType(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-neutral-300 text-sm font-semibold"
                >
                  <option value="PERCENTAGE">Percentage of Booking Revenue (%)</option>
                  <option value="FIXED_AMOUNT">Fixed Amount per Booking (₹)</option>
                  <option value="CLEANING_FEE">Cleaning Fee Only</option>
                  <option value="CLEANING_FEE_PLUS_PERCENTAGE">Cleaning Fee + Percentage</option>
                </select>
              </div>

              {(payoutType === 'PERCENTAGE' || payoutType === 'CLEANING_FEE_PLUS_PERCENTAGE') && (
                <div>
                  <label className="block text-xs font-bold mb-1">Percentage (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={percentage}
                    onChange={(e) => setPercentage(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-neutral-300 text-sm"
                  />
                </div>
              )}

              {payoutType === 'FIXED_AMOUNT' && (
                <div>
                  <label className="block text-xs font-bold mb-1">Fixed Amount (₹)</label>
                  <input
                    type="number"
                    min="1"
                    value={fixedAmount}
                    onChange={(e) => setFixedAmount(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-neutral-300 text-sm"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition"
              >
                {loading ? 'Saving...' : 'Save Payout Configuration'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
