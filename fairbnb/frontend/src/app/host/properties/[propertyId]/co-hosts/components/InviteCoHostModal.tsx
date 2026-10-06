'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api-client';
import { useToast } from '@/context/toast-context';
import { PermissionSelector } from './PermissionSelector';
import { FormField } from '@/components/ui/FormField';
import { TextInput } from '@/components/ui/TextInput';
import { SelectField } from '@/components/ui/SelectField';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { X, Mail, Copy, Check, Shield, DollarSign, AlertCircle, Phone } from 'lucide-react';

interface InviteCoHostModalProps {
  propertyId: string;
  propertyTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function InviteCoHostModal({
  propertyId,
  propertyTitle,
  isOpen,
  onClose,
  onSuccess,
}: InviteCoHostModalProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [permissionLevel, setPermissionLevel] = useState('FULL_ACCESS');
  const [customPermissions, setCustomPermissions] = useState<string[]>([]);
  const [enablePayout, setEnablePayout] = useState(false);
  const [payoutType, setPayoutType] = useState('PERCENTAGE');
  const [percentage, setPercentage] = useState(10);
  const [fixedAmount, setFixedAmount] = useState(500);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteResult, setInviteResult] = useState<{ inviteToken: string } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload: any = {
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        permissionLevel,
      };

      if (permissionLevel === 'CUSTOM') {
        payload.permissions = customPermissions;
      }

      if (enablePayout) {
        payload.payoutConfig = {
          type: payoutType,
          percentage: payoutType === 'PERCENTAGE' || payoutType === 'CLEANING_FEE_PLUS_PERCENTAGE' ? Number(percentage) : undefined,
          fixedAmount: payoutType === 'FIXED_AMOUNT' ? Number(fixedAmount) : undefined,
        };
      }

      const res = await api.post<{ inviteToken: string }>(
        `/properties/${propertyId}/co-hosts/invite`,
        payload
      );

      setInviteResult(res);
      toast.success('Co-host invitation generated successfully!');
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to send invitation');
      toast.error(err.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const shareableUrl = inviteResult
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/co-hosts/invitations/${inviteResult.inviteToken}`
    : '';

  const handleCopy = () => {
    if (shareableUrl) {
      navigator.clipboard.writeText(shareableUrl);
      setCopied(true);
      toast.success('Invitation link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-neutral-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* HEADER */}
        <div className="px-6 py-5 bg-neutral-900 text-white flex items-center justify-between">
          <div>
            <span className="text-overline font-semibold uppercase tracking-wider text-rose-400">
              Co-Host Governance
            </span>
            <h3 className="text-h3 font-bold tracking-tight">Invite Co-Host</h3>
            <p className="text-caption text-neutral-400">Target Listing: {propertyTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-800 text-sm">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Invitation Error</p>
                <p className="text-xs text-rose-700 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {inviteResult ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-4">
              <div className="flex items-center gap-3 text-emerald-900">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
                  ✓
                </div>
                <div>
                  <h4 className="text-body-lg font-bold">Invitation Created Successfully!</h4>
                  <p className="text-caption text-emerald-700">
                    Share this unique invitation link directly with your co-host.
                  </p>
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-emerald-200 flex items-center justify-between gap-3">
                <span className="text-xs font-mono text-neutral-700 truncate select-all">{shareableUrl}</span>
                <button
                  onClick={handleCopy}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy Link'}
                </button>
              </div>

              <button
                onClick={onClose}
                className="w-full py-2.5 bg-[#0e4962] text-white rounded-xl text-xs font-bold hover:bg-[#1a6585] transition cursor-pointer"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* CONTACT DETAILS */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-amber-600" /> Invitee Contact Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField label="Email Address" required>
                    <TextInput
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="cohost@example.com"
                      leadingIcon={<Mail className="w-4 h-4" />}
                    />
                  </FormField>

                  <FormField label="Phone Number" optional>
                    <TextInput
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+919876543210"
                      leadingIcon={<Phone className="w-4 h-4" />}
                    />
                  </FormField>
                </div>
              </div>

              {/* PERMISSION PRESET */}
              <div className="space-y-3 pt-4 border-t border-neutral-200">
                <h4 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-600" /> Permission Level Preset
                </h4>
                <SelectField
                  value={permissionLevel}
                  onChange={(e) => setPermissionLevel(e.target.value)}
                  options={[
                    { value: 'FULL_ACCESS', label: 'Full Access (All Management Rights)' },
                    { value: 'OPERATIONS', label: 'Operations (Calendar, Bookings, Maintenance, Cleaning)' },
                    { value: 'CALENDAR_MESSAGING', label: 'Calendar + Guest Messaging' },
                    { value: 'CALENDAR_ONLY', label: 'Calendar View Only' },
                    { value: 'CUSTOM', label: 'Custom Permissions (Select Granular Permissions)' },
                  ]}
                />

                {permissionLevel === 'CUSTOM' && (
                  <div className="pt-3">
                    <PermissionSelector
                      selectedPermissions={customPermissions}
                      onChange={setCustomPermissions}
                    />
                  </div>
                )}
              </div>

              {/* PAYOUT CONFIGURATION */}
              <div className="space-y-3 pt-4 border-t border-neutral-200">
                <label className="flex items-center justify-between p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200 cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="text-sm font-bold text-neutral-900">Configure Co-Host Payout Rule</p>
                      <p className="text-xs text-neutral-500">Max 1 paid co-host allowed per listing (India Scope)</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={enablePayout}
                    onChange={(e) => setEnablePayout(e.target.checked)}
                    className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 border-neutral-300"
                  />
                </label>

                {enablePayout && (
                  <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-3">
                    <FormField label="Payout Arrangement Type">
                      <SelectField
                        value={payoutType}
                        onChange={(e) => setPayoutType(e.target.value)}
                        options={[
                          { value: 'PERCENTAGE', label: 'Percentage of Booking Revenue (%)' },
                          { value: 'FIXED_AMOUNT', label: 'Fixed Amount per Booking (₹)' },
                          { value: 'CLEANING_FEE', label: 'Cleaning Fee Only' },
                          { value: 'CLEANING_FEE_PLUS_PERCENTAGE', label: 'Cleaning Fee + Revenue Percentage' },
                        ]}
                      />
                    </FormField>

                    {(payoutType === 'PERCENTAGE' || payoutType === 'CLEANING_FEE_PLUS_PERCENTAGE') && (
                      <FormField label="Revenue Percentage (%)">
                        <TextInput
                          type="number"
                          min="1"
                          max="100"
                          value={percentage}
                          onChange={(e) => setPercentage(Number(e.target.value))}
                          placeholder="e.g. 10"
                        />
                      </FormField>
                    )}

                    {payoutType === 'FIXED_AMOUNT' && (
                      <FormField label="Fixed Amount per Booking">
                        <CurrencyInput
                          value={fixedAmount}
                          onChange={setFixedAmount}
                        />
                      </FormField>
                    )}
                  </div>
                )}
              </div>

              {/* ACTION BUTTON */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#0e4962] hover:bg-[#1a6585] text-white rounded-2xl font-bold text-sm shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Creating Invitation...' : 'Send Co-Host Invitation'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
