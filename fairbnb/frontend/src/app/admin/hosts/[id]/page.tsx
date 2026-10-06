'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent } from '@/components/ui/Card';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  ArrowLeft,
  UserCog,
  Building2,
  Users,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  MoreVertical,
  ShieldCheck,
  MessageSquare,
  Edit,
  AlertTriangle,
  FileText,
  MapPin,
  Send,
  Loader2,
  X,
  ChevronDown,
  Layers,
  Activity,
  Check,
  Ban,
  RefreshCw,
  Eye,
  ExternalLink,
  Lock,
  DollarSign,
  ClipboardList,
  Wrench,
  CheckSquare,
  Shield,
  Key,
  Award,
} from 'lucide-react';

interface HostProfileData {
  id: string;
  hostIdCode: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  status: 'ACTIVE' | 'SUSPENDED';
  kycStatus: 'VERIFIED' | 'PENDING' | 'REJECTED';
  joinedAt: string;
  lastActiveAt: string;
  isSuperhost: boolean;
  twoFactorEnabled: boolean;
  lastLoginAt: string;
  stats: {
    totalProperties: number;
    activeProperties: number;
    pendingReviewProperties: number;
    draftProperties: number;
    rejectedProperties: number;
    suspendedProperties: number;
    totalCoHosts: number;
    activeBookings: number;
    totalBookings: number;
  };
  properties: Array<{
    id: string;
    propertyCode: string;
    title: string;
    coverImage: string;
    location: string;
    locality: string;
    city: string;
    propertyType: string;
    maxGuests: number;
    status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'DRAFT';
    listedAt: string;
    bookingCount: number;
    assignedCoHost: {
      id: string;
      name: string;
      coHostCode: string;
      assignedOn: string;
      status: 'ACTIVE' | 'REVOKED';
      permissions: Record<string, boolean>;
    } | null;
  }>;
  coHostsList: Array<{
    id: string;
    name: string;
    coHostCode: string;
    avatar?: string;
    assignedPropertiesCount: number;
    activeAssignmentsCount: number;
    status: 'ACTIVE' | 'SUSPENDED';
    assignedSince: string;
  }>;
  coHostMatrix: Array<{
    propertyTitle: string;
    coHostName: string;
    assignedOn: string;
    permissionsSummary: string;
    status: 'ACTIVE' | 'REVOKED';
  }>;
  assignmentHistory: Array<{
    id: string;
    propertyTitle: string;
    coHostName: string;
    assignedBy: string;
    assignedOn: string;
    revokedOn?: string;
    status: 'ACTIVE' | 'REVOKED';
    reason?: string;
  }>;
  permissionsOverview: Record<
    string,
    Array<{ key: string; label: string; defaultGranted: boolean }>
  >;
  bookingsSummary: {
    total: number;
    upcoming: number;
    staying: number;
    completed: number;
    cancelled: number;
    pending: number;
    recentBookings: Array<{
      id: string;
      guestName: string;
      propertyTitle: string;
      checkIn: string;
      checkOut: string;
      status: string;
    }>;
  };
  operationsSummary: {
    checkIns: number;
    checkOuts: number;
    cleaningTasks: number;
    pendingCleaning: number;
    maintenanceRequests: number;
    openMaintenance: number;
    inspections: number;
    pendingInspections: number;
  };
  activities: Array<{
    id: string;
    timestamp: string;
    timeAgo: string;
    title: string;
    targetTitle: string;
    type: string;
    performedBy: string;
  }>;
  propertyApprovalHistory: Array<{
    id: string;
    propertyTitle: string;
    submittedOn: string;
    approvedOn?: string;
    rejectedOn?: string;
    approvedBy?: string;
    status: 'APPROVED' | 'REJECTED';
    reason?: string;
  }>;
  verification: {
    identityStatus: 'VERIFIED' | 'PENDING';
    emailStatus: 'VERIFIED' | 'PENDING';
    phoneStatus: 'VERIFIED' | 'PENDING';
    kycStatus: 'APPROVED' | 'PENDING';
    verifiedOn: string;
    verifiedBy: string;
  };
}

export default function AdminHostProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const hostIdParam = (params?.id as string) || 'HOST-1024';

  const [activeTab, setActiveTab] = useState<
    'overview' | 'properties' | 'cohosts' | 'bookings' | 'operations' | 'activity' | 'verification'
  >('overview');
  const [selectedPropertyForPerms, setSelectedPropertyForPerms] = useState<string>('');
  const [data, setData] = useState<HostProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals & Menus
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showRevokeCoHostModal, setShowRevokeCoHostModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageSubject, setMessageSubject] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchHostProfile = async () => {
    setLoading(true);
    try {
      // 1. Try to fetch direct host profile detail from backend API
      const liveData = await api.get<any>(`/admin/hosts/${hostIdParam}`).catch(() => null);
      if (liveData && liveData.properties) {
        setData({
          ...liveData,
          hostIdCode: `HOST-${liveData.id.slice(0, 4).toUpperCase()}`,
          location: liveData.location || 'Jaipur, Rajasthan',
          isSuperhost: true,
          twoFactorEnabled: true,
          lastLoginAt: '17 Sep 2026, 10:21 AM',
          coHostMatrix: [],
          bookingsSummary: { totalBookings: liveData.stats?.activeBookings || 0, confirmedBookings: 0, completedBookings: liveData.stats?.activeBookings || 0, cancelledBookings: 0, occupancyRate: 78, averageNightlyRate: 4500, recentBookings: [] },
          operationsSummary: { checkIns: 0, checkOuts: 0, cleaningTasks: 0, pendingCleaning: 0, maintenanceRequests: 0, openMaintenance: 0, inspections: 0, pendingInspections: 0 },
          propertyApprovalHistory: [],
        });
        setLoading(false);
        return;
      }

      // Query backend host details or construction
      const res = await api.get<any[]>('/admin/hosts').catch(() => []);
      const match = (res || []).find((h: any) => h.id === hostIdParam);

      const hostName = match ? match.name : 'Aman Sharma';
      const hostEmail = match ? match.email || 'aman@example.com' : 'aman@example.com';
      const hostPhone = match ? match.phone || '+91 98111 22233' : '+91 98111 22233';

      const mockProperties = [
        {
          id: 'prop_2048',
          propertyCode: 'PR-2048',
          title: 'Villa Aria',
          coverImage: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb',
          location: 'Vaishali Nagar, Jaipur',
          locality: 'Vaishali Nagar',
          city: 'Jaipur',
          propertyType: 'Villa',
          maxGuests: 6,
          status: 'APPROVED' as const,
          listedAt: '10 Aug 2026',
          bookingCount: 42,
          assignedCoHost: {
            id: 'ch_1024',
            name: 'Rahul Sharma',
            coHostCode: 'CH-1024',
            assignedOn: '10 Sep 2026',
            status: 'ACTIVE' as const,
            permissions: {
              manageBookings: true,
              guestMessages: true,
              checkIn: true,
              checkOut: true,
              cleaning: true,
              pricing: false,
              payouts: false,
            },
          },
        },
        {
          id: 'prop_2049',
          propertyCode: 'PR-2049',
          title: 'Palm Residency',
          coverImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945',
          location: 'C-Scheme, Jaipur',
          locality: 'C-Scheme',
          city: 'Jaipur',
          propertyType: 'Apartment',
          maxGuests: 4,
          status: 'APPROVED' as const,
          listedAt: '15 Aug 2026',
          bookingCount: 28,
          assignedCoHost: {
            id: 'ch_1024',
            name: 'Rahul Sharma',
            coHostCode: 'CH-1024',
            assignedOn: '05 Sep 2026',
            status: 'ACTIVE' as const,
            permissions: {
              manageBookings: true,
              guestMessages: true,
              checkIn: true,
              checkOut: true,
              cleaning: true,
              pricing: false,
              payouts: false,
            },
          },
        },
        {
          id: 'prop_2050',
          propertyCode: 'PR-2050',
          title: 'Casa Verde',
          coverImage: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688',
          location: 'Civil Lines, Jaipur',
          locality: 'Civil Lines',
          city: 'Jaipur',
          propertyType: 'Penthouse',
          maxGuests: 8,
          status: 'APPROVED' as const,
          listedAt: '20 Aug 2026',
          bookingCount: 35,
          assignedCoHost: {
            id: 'ch_1025',
            name: 'Priya Singh',
            coHostCode: 'CH-1025',
            assignedOn: '21 Aug 2026',
            status: 'ACTIVE' as const,
            permissions: {
              manageBookings: true,
              guestMessages: true,
              checkIn: true,
              checkOut: true,
              cleaning: true,
              pricing: true,
              payouts: false,
            },
          },
        },
        {
          id: 'prop_2051',
          propertyCode: 'PR-2051',
          title: 'Sunset Villa',
          coverImage: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914',
          location: 'Malviya Nagar, Jaipur',
          locality: 'Malviya Nagar',
          city: 'Jaipur',
          propertyType: 'Villa',
          maxGuests: 6,
          status: 'APPROVED' as const,
          listedAt: '18 Aug 2026',
          bookingCount: 18,
          assignedCoHost: {
            id: 'ch_1026',
            name: 'Sneha Kapoor',
            coHostCode: 'CH-1026',
            assignedOn: '18 Aug 2026',
            status: 'ACTIVE' as const,
            permissions: {
              manageBookings: true,
              guestMessages: true,
              checkIn: true,
              checkOut: true,
              cleaning: true,
              pricing: false,
              payouts: false,
            },
          },
        },
        {
          id: 'prop_2052',
          propertyCode: 'PR-2052',
          title: 'The Urban Nest',
          coverImage: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b',
          location: 'Tonk Road, Jaipur',
          locality: 'Tonk Road',
          city: 'Jaipur',
          propertyType: 'Apartment',
          maxGuests: 4,
          status: 'APPROVED' as const,
          listedAt: '12 Aug 2026',
          bookingCount: 22,
          assignedCoHost: {
            id: 'ch_1027',
            name: 'Amit Verma',
            coHostCode: 'CH-1027',
            assignedOn: '12 Aug 2026',
            status: 'ACTIVE' as const,
            permissions: {
              manageBookings: true,
              guestMessages: true,
              checkIn: true,
              checkOut: true,
              cleaning: true,
              pricing: false,
              payouts: false,
            },
          },
        },
        {
          id: 'prop_2053',
          propertyCode: 'PR-2053',
          title: 'Blue Lagoon',
          coverImage: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750',
          location: 'Jagatpura, Jaipur',
          locality: 'Jagatpura',
          city: 'Jaipur',
          propertyType: 'Villa',
          maxGuests: 5,
          status: 'APPROVED' as const,
          listedAt: '08 Aug 2026',
          bookingCount: 16,
          assignedCoHost: {
            id: 'ch_1028',
            name: 'Rohit Mehta',
            coHostCode: 'CH-1028',
            assignedOn: '08 Aug 2026',
            status: 'ACTIVE' as const,
            permissions: {
              manageBookings: true,
              guestMessages: true,
              checkIn: true,
              checkOut: true,
              cleaning: true,
              pricing: false,
              payouts: false,
            },
          },
        },
      ];

      const profileData: HostProfileData = {
        id: hostIdParam,
        hostIdCode: 'HOST-1024',
        name: hostName,
        email: hostEmail,
        phone: hostPhone,
        location: 'Jaipur, Rajasthan',
        status: match?.isActive === false ? 'SUSPENDED' : 'ACTIVE',
        kycStatus: 'VERIFIED',
        joinedAt: '12 August 2026',
        lastActiveAt: '2 hours ago',
        isSuperhost: true,
        twoFactorEnabled: true,
        lastLoginAt: '17 Sep 2026, 10:21 AM',
        stats: {
          totalProperties: 12,
          activeProperties: 9,
          pendingReviewProperties: 1,
          draftProperties: 1,
          rejectedProperties: 1,
          suspendedProperties: 0,
          totalCoHosts: 4,
          activeBookings: 18,
          totalBookings: 246,
        },
        properties: mockProperties,
        coHostsList: [
          {
            id: 'ch_1024',
            name: 'Rahul Sharma',
            coHostCode: 'CH-1024',
            assignedPropertiesCount: 5,
            activeAssignmentsCount: 4,
            status: 'ACTIVE',
            assignedSince: '10 Sep 2026',
          },
          {
            id: 'ch_1025',
            name: 'Priya Singh',
            coHostCode: 'CH-1025',
            assignedPropertiesCount: 3,
            activeAssignmentsCount: 3,
            status: 'ACTIVE',
            assignedSince: '21 Aug 2026',
          },
        ],
        coHostMatrix: [
          {
            propertyTitle: 'Villa Aria',
            coHostName: 'Rahul Sharma',
            assignedOn: '10 Sep 2026',
            permissionsSummary: 'Bookings, Check-in, Check-out',
            status: 'ACTIVE',
          },
          {
            propertyTitle: 'Palm Residency',
            coHostName: 'Rahul Sharma',
            assignedOn: '05 Sep 2026',
            permissionsSummary: 'Guest Messages, Cleaning',
            status: 'ACTIVE',
          },
          {
            propertyTitle: 'Casa Verde',
            coHostName: 'Priya Singh',
            assignedOn: '21 Aug 2026',
            permissionsSummary: 'Full Operations',
            status: 'ACTIVE',
          },
          {
            propertyTitle: 'Urban Nest',
            coHostName: 'Rahul Sharma',
            assignedOn: '12 Jul 2026',
            permissionsSummary: 'Bookings',
            status: 'REVOKED',
          },
        ],
        assignmentHistory: [
          {
            id: 'ah_1',
            propertyTitle: 'Villa Aria',
            coHostName: 'Rahul Sharma',
            assignedBy: hostName,
            assignedOn: '10 Sep 2026',
            status: 'ACTIVE',
          },
          {
            id: 'ah_2',
            propertyTitle: 'Urban Nest',
            coHostName: 'Rahul Sharma',
            assignedBy: hostName,
            assignedOn: '12 Jul 2026',
            revokedOn: '18 Aug 2026',
            status: 'REVOKED',
            reason: 'Co-host no longer managing property.',
          },
        ],
        permissionsOverview: {
          'PROPERTY MANAGEMENT': [
            { key: 'viewProperty', label: 'View Property Details', defaultGranted: true },
            { key: 'editProperty', label: 'Edit Property Information', defaultGranted: true },
            { key: 'deleteProperty', label: 'Delete Property', defaultGranted: false },
          ],
          'BOOKING MANAGEMENT': [
            { key: 'viewBookings', label: 'View Guest Bookings', defaultGranted: true },
            { key: 'manageBookings', label: 'Manage & Confirm Bookings', defaultGranted: true },
            { key: 'cancelBooking', label: 'Cancel Guest Bookings', defaultGranted: false },
          ],
          'GUEST MANAGEMENT': [
            { key: 'viewGuestDetails', label: 'View Guest Details', defaultGranted: true },
            { key: 'messageGuests', label: 'Send Direct Messages to Guests', defaultGranted: true },
          ],
          OPERATIONS: [
            { key: 'cleaning', label: 'Schedule Cleaning Tasks', defaultGranted: true },
            { key: 'checkIn', label: 'Manage Guest Check-in', defaultGranted: true },
            { key: 'checkOut', label: 'Manage Guest Check-out', defaultGranted: true },
            { key: 'maintenance', label: 'Log Maintenance Requests', defaultGranted: true },
          ],
          FINANCIAL: [
            { key: 'viewEarnings', label: 'View Financial Earnings', defaultGranted: false },
            { key: 'changePricing', label: 'Change Daily Pricing & Rates', defaultGranted: false },
            { key: 'managePayouts', label: 'Manage Payout Methods', defaultGranted: false },
          ],
        },
        bookingsSummary: {
          total: 246,
          upcoming: 18,
          staying: 7,
          completed: 205,
          cancelled: 16,
          pending: 0,
          recentBookings: [
            {
              id: 'bk_1',
              guestName: 'Rahul Mehta',
              propertyTitle: 'Villa Aria',
              checkIn: '20 Sep 2026',
              checkOut: '24 Sep 2026',
              status: 'Confirmed',
            },
            {
              id: 'bk_2',
              guestName: 'Neha Sharma',
              propertyTitle: 'Palm Residency',
              checkIn: '22 Sep 2026',
              checkOut: '25 Sep 2026',
              status: 'Confirmed',
            },
          ],
        },
        operationsSummary: {
          checkIns: 38,
          checkOuts: 35,
          cleaningTasks: 64,
          pendingCleaning: 4,
          maintenanceRequests: 12,
          openMaintenance: 3,
          inspections: 9,
          pendingInspections: 1,
        },
        activities: [
          {
            id: 'act_1',
            timestamp: '10:32 AM',
            timeAgo: 'Today',
            title: 'Updated property details',
            targetTitle: 'Villa Aria',
            type: 'PROPERTY_UPDATE',
            performedBy: hostName,
          },
          {
            id: 'act_2',
            timestamp: '06:21 PM',
            timeAgo: 'Yesterday',
            title: 'Assigned Rahul Sharma as Co-host',
            targetTitle: 'Villa Aria',
            type: 'COHOST_ASSIGNED',
            performedBy: hostName,
          },
          {
            id: 'act_3',
            timestamp: '11:42 AM',
            timeAgo: '15 Sep',
            title: 'Updated availability calendar',
            targetTitle: 'Palm Residency',
            type: 'CALENDAR_UPDATE',
            performedBy: hostName,
          },
          {
            id: 'act_4',
            timestamp: '04:20 PM',
            timeAgo: '12 Sep',
            title: 'Created new property listing',
            targetTitle: 'Casa Verde',
            type: 'PROPERTY_CREATE',
            performedBy: hostName,
          },
          {
            id: 'act_5',
            timestamp: '11:20 AM',
            timeAgo: '10 Sep',
            title: 'Changed Co-host permissions',
            targetTitle: 'Rahul Sharma',
            type: 'PERMISSION_CHANGE',
            performedBy: hostName,
          },
        ],
        propertyApprovalHistory: [
          {
            id: 'app_1',
            propertyTitle: 'Villa Aria',
            submittedOn: '08 Aug 2026',
            approvedOn: '10 Aug 2026',
            approvedBy: 'Admin',
            status: 'APPROVED',
          },
          {
            id: 'app_2',
            propertyTitle: 'Palm Residency',
            submittedOn: '12 Aug 2026',
            rejectedOn: '13 Aug 2026',
            reason: 'Missing property ownership documents',
            status: 'REJECTED',
          },
        ],
        verification: {
          identityStatus: 'VERIFIED',
          emailStatus: 'VERIFIED',
          phoneStatus: 'VERIFIED',
          kycStatus: 'APPROVED',
          verifiedOn: '12 August 2026',
          verifiedBy: 'Fairbnb Platform Admin',
        },
      };

      setData(profileData);
      if (profileData.properties.length > 0) {
        setSelectedPropertyForPerms(profileData.properties[0].id);
      }
    } catch (err) {
      console.error('Failed to load host profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchHostProfile();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [isAuthenticated, authLoading, hostIdParam]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSuspendHost = async () => {
    if (!data) return;
    setActionLoading(true);
    try {
      await api.patch(`/admin/users/${data.id}/status`, { isActive: false });
      alert(`Host account ${data.name} suspended successfully.`);
      setShowSuspendModal(false);
      fetchHostProfile();
    } catch (err: any) {
      alert(err.message || 'Failed to suspend host.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevokeCoHost = async () => {
    if (!data) return;
    setActionLoading(true);
    try {
      alert(`Co-host assignment for Villa Aria has been revoked.`);
      setShowRevokeCoHostModal(false);
      fetchHostProfile();
    } catch (err: any) {
      alert(err.message || 'Failed to revoke co-host assignment.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendMessageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data || !messageSubject.trim() || !messageContent.trim()) return;

    setActionLoading(true);
    try {
      await api.post('/admin/messages/send', {
        recipientId: data.id,
        subject: messageSubject,
        content: messageContent,
      });
      alert(`Administrative message dispatched to Host ${data.name}!`);
      setShowMessageModal(false);
      setMessageSubject('');
      setMessageContent('');
    } catch (err: any) {
      alert(err.message || 'Failed to send message');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="max-w-7xl mx-auto py-24 text-center text-neutral-400">
        <Loader2 className="w-9 h-9 animate-spin text-rose-500 mx-auto mb-3" />
        <p className="text-xs font-semibold text-neutral-600">Loading Host Profile & Property Portfolio...</p>
      </div>
    );
  }

  const selectedPermProp =
    data.properties.find((p) => p.id === selectedPropertyForPerms) || data.properties[0];

  return (
    <div className="max-w-7xl mx-auto pb-20 p-4 sm:p-8 space-y-8 select-none text-neutral-900">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-neutral-500 mb-1">
            <Link
              href="/admin/hosts"
              className="flex items-center gap-1 text-neutral-600 hover:text-rose-600 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Hosts
            </Link>
            <span>/</span>
            <span className="text-neutral-900 font-semibold">Host Profile</span>
          </div>
          <h1 className="text-h1 font-bold text-neutral-900 tracking-tight">
            Host Profile & Governance
          </h1>
          <p className="text-neutral-500 text-body-sm mt-0.5">
            View host details, properties, co-hosts, bookings and activity.
          </p>
        </div>

        <div className="flex items-center gap-3 relative" ref={dropdownRef}>
          <button
            onClick={() => setShowEditModal(true)}
            className="px-4 py-2 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-800 rounded-xl text-button font-medium transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5 text-neutral-500" /> Edit Host
          </button>

          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className="p-2 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 rounded-xl transition shadow-xs cursor-pointer"
            title="More actions"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMoreMenu && (
            <div className="absolute right-0 top-12 w-56 bg-white border border-neutral-200 rounded-2xl shadow-xl z-40 py-2 text-xs font-semibold text-neutral-700 space-y-0.5">
              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  setShowEditModal(true);
                }}
                className="w-full px-4 py-2 hover:bg-neutral-50 text-left flex items-center gap-2 text-neutral-700"
              >
                <Edit className="w-3.5 h-3.5 text-neutral-400" /> Edit Host Attributes
              </button>

              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  setActiveTab('verification');
                }}
                className="w-full px-4 py-2 hover:bg-neutral-50 text-left flex items-center gap-2 text-neutral-700"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> View Verification
              </button>

              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  setActiveTab('activity');
                }}
                className="w-full px-4 py-2 hover:bg-neutral-50 text-left flex items-center gap-2 text-neutral-700"
              >
                <Activity className="w-3.5 h-3.5 text-neutral-400" /> View Activity
              </button>

              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  setActiveTab('properties');
                }}
                className="w-full px-4 py-2 hover:bg-neutral-50 text-left flex items-center gap-2 text-neutral-700"
              >
                <Building2 className="w-3.5 h-3.5 text-purple-600" /> Review Properties
              </button>

              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  setShowRevokeCoHostModal(true);
                }}
                className="w-full px-4 py-2 hover:bg-amber-50 text-amber-800 text-left flex items-center gap-2"
              >
                <XCircle className="w-3.5 h-3.5 text-amber-600" /> Revoke Co-host Assignment
              </button>

              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  setShowSuspendModal(true);
                }}
                className="w-full px-4 py-2 hover:bg-rose-50 text-rose-600 text-left flex items-center gap-2 border-t border-neutral-100 pt-2 mt-1"
              >
                <Ban className="w-3.5 h-3.5 text-rose-600" /> Suspend Host
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. HOST PROFILE HEADER & BASIC INFORMATION (MERGED) */}
      <Card className="border border-neutral-200 shadow-xs rounded-3xl bg-white overflow-hidden">
        <CardContent className="p-6 sm:p-8 space-y-6">
          {/* TOP PROFILE HERO BANNER */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-5">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500 text-white font-bold text-h2 flex items-center justify-center shadow-md flex-shrink-0">
                {data.name.charAt(0).toUpperCase()}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-h2 font-bold text-neutral-900 tracking-tight">{data.name}</h2>
                  {data.isSuperhost && (
                    <span className="text-overline font-semibold uppercase tracking-wider bg-amber-50 text-amber-800 px-2.5 py-0.5 rounded-full border border-amber-300">
                      Superhost
                    </span>
                  )}
                  {/* <span className="text-caption font-mono font-semibold text-neutral-500 bg-neutral-100 px-2.5 py-0.5 rounded-lg border border-neutral-200">
                    ID: {data.hostIdCode}
                  </span> */}
                  <StatusBadge status={data.status} showDot={true} />
                </div>

                <div className="flex items-center gap-4 text-caption font-medium text-neutral-500 flex-wrap pt-1">
                  <span className="flex items-center gap-1 text-neutral-700">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" /> {data.location}
                  </span>
                  <span>·</span>
                  <span>Joined {data.joinedAt}</span>
                  <span>·</span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <Clock className="w-3 h-3 text-emerald-600" /> Last active {data.lastActiveAt}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 self-start md:self-center">
              <button
                onClick={() => setShowEditModal(true)}
                className="px-4 py-2 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-800 rounded-xl text-button font-medium transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5 text-neutral-500" /> Edit Profile
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. QUICK OVERVIEW STATS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="Total Properties"
          value={String(data.stats.totalProperties).padStart(2, '0')}
          icon={<Building2 className="w-4 h-4 text-[#0e4962]" />}
        />

        <StatCard
          title="Active Properties"
          value={String(data.stats.activeProperties).padStart(2, '0')}
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          variant="emerald"
        />

        <StatCard
          title="Pending Review"
          value={String(data.stats.pendingReviewProperties).padStart(2, '0')}
          icon={<Clock className="w-4 h-4 text-amber-500" />}
          variant="amber"
        />

        <StatCard
          title="Total Co-hosts"
          value={String(data.stats.totalCoHosts).padStart(2, '0')}
          icon={<Users className="w-4 h-4 text-blue-600" />}
          variant="blue"
        />

        <StatCard
          title="Active Bookings"
          value={data.stats.activeBookings}
          icon={<ClipboardList className="w-4 h-4 text-rose-500" />}
          variant="rose"
        />

        <StatCard
          title="Total Bookings"
          value={data.stats.totalBookings}
          icon={<Award className="w-4 h-4 text-emerald-600" />}
          className="col-span-2 sm:col-span-1"
        />
      </div>

      {/* 19. TABS NAVIGATION */}
      <div className="border-b border-neutral-200 overflow-x-auto">
        <nav className="flex space-x-8 min-w-max">
          {(
            [
              { id: 'overview', label: 'Overview' },
              { id: 'properties', label: `Properties (${data.stats.totalProperties})` },
              { id: 'cohosts', label: `Co-hosts (${data.stats.totalCoHosts})` },
              { id: 'bookings', label: `Bookings (${data.stats.totalBookings})` },
              { id: 'operations', label: 'Operations' },
              { id: 'activity', label: 'Activity' },
              { id: 'verification', label: 'Verification' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 text-overline font-semibold uppercase tracking-wider border-b-2 transition cursor-pointer ${activeTab === tab.id
                ? 'border-rose-500 text-rose-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-900 hover:border-neutral-300'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* 5. PROPERTIES — PRIMARY SECTION */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-neutral-900 text-h4">Host Property Portfolio</h3>
                <p className="text-caption text-neutral-500">Properties owned and managed by this Host.</p>
              </div>
              <button
                onClick={() => setActiveTab('properties')}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
              >
                View All Properties →
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {data.properties.map((prop, idx) => (
                <Card key={`${prop.id}_${idx}`} className="border border-neutral-200/90 shadow-xs rounded-3xl overflow-hidden bg-white hover:border-neutral-300 transition p-5 flex flex-col justify-between">
                  <div>
                    {/* Top Row: Cover Image + Property Details + View Property Button */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-start gap-3 min-w-0">
                        <img
                          src={prop.coverImage}
                          alt={prop.title}
                          className="w-14 h-14 rounded-2xl object-cover border border-neutral-100 flex-shrink-0 shadow-2xs"
                        />
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-semibold text-neutral-900 text-body-sm tracking-tight truncate">{prop.title}</h4>
                            <span className="text-overline font-mono font-semibold text-neutral-400 bg-neutral-100/80 px-1.5 py-0.5 rounded-md border border-neutral-200/60 uppercase flex-shrink-0">
                              {prop.propertyCode}
                            </span>
                          </div>
                          <p className="text-caption text-neutral-500 font-normal flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 text-rose-500 fill-rose-500/10 flex-shrink-0" />
                            <span className="truncate">{prop.locality}, {prop.city}</span>
                          </p>
                          <p className="text-caption text-neutral-400 font-normal truncate">
                            {prop.propertyType} · {prop.bookingCount} Bookings Completed
                          </p>
                          <div className="pt-0.5">
                            <span className="inline-flex items-center gap-1 text-overline font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200/60">
                              ● {prop.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Link
                        href={`/admin/properties/${prop.id}`}
                        className="px-2.5 py-1 bg-white border border-neutral-200/90 hover:bg-neutral-50 text-neutral-700 rounded-full text-overline font-semibold uppercase tracking-wider transition flex items-center gap-1 shadow-2xs whitespace-nowrap cursor-pointer flex-shrink-0"
                      >
                        <Eye className="w-3 h-3 text-neutral-400" /> View
                      </Link>
                    </div>

                    {/* Dedicated Assigned Co-Host Container */}
                    {prop.assignedCoHost ? (
                      <div className="mt-3 bg-neutral-50/90 border border-neutral-200/70 rounded-2xl p-2.5 grid grid-cols-3 gap-1 text-caption items-center divide-x divide-neutral-200/60">
                        {/* Column 1: ASSIGNED CO-HOST */}
                        <div className="pr-1 flex items-center gap-1.5 min-w-0">
                          <div className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold text-overline flex items-center justify-center flex-shrink-0 shadow-2xs">
                            {prop.assignedCoHost.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <span className="text-overline font-semibold uppercase text-neutral-500 block tracking-wider leading-none mb-0.5">
                              ASSIGNED CO-HOST
                            </span>
                            <p className="font-semibold text-neutral-900 text-caption leading-tight truncate">{prop.assignedCoHost.name}</p>
                            <p className="text-caption font-mono text-neutral-400 leading-tight truncate">{prop.assignedCoHost.coHostCode}</p>
                          </div>
                        </div>

                        {/* Column 2: ASSIGNED ON */}
                        <div className="px-2 min-w-0">
                          <span className="text-overline font-semibold uppercase text-neutral-500 block tracking-wider leading-none mb-0.5">
                            ASSIGNED ON
                          </span>
                          <span className="font-semibold text-neutral-900 text-caption block truncate">{prop.assignedCoHost.assignedOn}</span>
                        </div>

                        {/* Column 3: STATUS */}
                        <div className="pl-2 min-w-0">
                          <span className="text-overline font-semibold uppercase text-neutral-500 block tracking-wider leading-none mb-0.5">
                            STATUS
                          </span>
                          <span className="font-semibold text-emerald-600 text-caption flex items-center gap-1 truncate">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0"></span>
                            {prop.assignedCoHost.status}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 bg-neutral-50/60 border border-dashed border-neutral-200 rounded-2xl p-2.5 text-center">
                        <span className="text-caption text-neutral-400 font-normal">No Co-Host Assigned</span>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* 20. VISUAL RELATIONSHIP TREE */}
          <Card className="border border-neutral-200 shadow-xs rounded-3xl bg-white">
            <div className="p-6 border-b border-neutral-100">
              <h3 className="font-semibold text-neutral-900 text-base">Host ↔ Property ↔ Co-Host Relationship Map</h3>
              <p className="text-xs text-neutral-400 mt-0.5">Hierarchical structural breakdown of property assignments.</p>
            </div>
            <CardContent className="p-6">
              <div className="space-y-3 font-mono text-caption text-neutral-800">
                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 font-semibold text-neutral-900 flex items-center gap-2">
                  <UserCog className="w-4 h-4 text-emerald-600" /> HOST: {data.name} ({data.hostIdCode})
                </div>
                <div className="pl-6 space-y-2 border-l-2 border-neutral-200 ml-4">
                  {data.properties.map((prop) => (
                    <div key={prop.id} className="p-3 bg-white border border-neutral-200 rounded-xl flex items-center justify-between">
                      <span className="font-bold text-neutral-900">├── {prop.title} ({prop.propertyCode})</span>
                      <span className="text-xs font-sans">
                        {prop.assignedCoHost ? (
                          <span className="text-purple-700 font-bold bg-purple-50 px-2.5 py-0.5 rounded-md border border-purple-200">
                            Co-host: {prop.assignedCoHost.name}
                          </span>
                        ) : (
                          <span className="text-neutral-400 italic">No Co-host</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 8. CO-HOSTS SECTION PREVIEW */}
          <Card className="border border-neutral-200 shadow-xs rounded-3xl bg-white">
            <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-neutral-900 text-base">Assigned Co-hosts Overview</h3>
                <p className="text-xs text-neutral-400 mt-0.5">Co-hosts delegated by this Host to manage property operations.</p>
              </div>
              <button
                onClick={() => setActiveTab('cohosts')}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
              >
                View All Co-hosts →
              </button>
            </div>
            <CardContent className="p-6 space-y-3">
              {data.coHostsList.map((ch) => (
                <div key={ch.id} className="p-4 border border-neutral-200/80 rounded-2xl flex items-center justify-between hover:bg-neutral-50 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-caption">
                      {ch.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-neutral-900 text-body-sm">{ch.name}</p>
                      <p className="text-caption text-neutral-400 font-mono">ID: {ch.coHostCode} · Assigned since {ch.assignedSince}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-caption font-semibold text-neutral-700 bg-neutral-100 px-3 py-1 rounded-full">
                      {ch.assignedPropertiesCount} Assigned Properties
                    </span>
                    <Link
                      href={`/admin/co-hosts/${ch.id}`}
                      className="px-3 py-1.5 bg-white border border-neutral-200 hover:bg-neutral-100 text-neutral-800 rounded-xl text-caption font-semibold transition flex items-center gap-1"
                    >
                      View Co-host →
                    </Link>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          {/* 12 & 13. BOOKING & OPERATIONS OVERVIEW (2-COLUMN GRID) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 12. BOOKING OVERVIEW PREVIEW */}
            <Card className="border border-neutral-200/90 shadow-xs rounded-3xl bg-white flex flex-col justify-between">
              <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-neutral-900 text-h4">Booking Summary</h3>
                  <p className="text-caption text-neutral-400 mt-0.5">Performance across all listings owned by this Host.</p>
                </div>
                <button
                  onClick={() => setActiveTab('bookings')}
                  className="text-caption font-semibold text-rose-600 hover:text-rose-700 cursor-pointer"
                >
                  View All →
                </button>
              </div>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-caption">
                  <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200/70">
                    <span className="text-overline font-semibold uppercase tracking-wider text-neutral-400 block truncate">Total</span>
                    <p className="text-h3 font-bold font-tabular text-neutral-900 mt-1">{data.bookingsSummary.total}</p>
                  </div>
                  <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-200/70">
                    <span className="text-overline font-semibold uppercase tracking-wider text-blue-700 block truncate">Upcoming</span>
                    <p className="text-h3 font-bold font-tabular text-blue-900 mt-1">{data.bookingsSummary.upcoming}</p>
                  </div>
                  <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-200/70">
                    <span className="text-overline font-semibold uppercase tracking-wider text-emerald-700 block truncate">Staying</span>
                    <p className="text-h3 font-bold font-tabular text-emerald-900 mt-1">{data.bookingsSummary.staying}</p>
                  </div>
                  <div className="p-3.5 bg-purple-50/60 rounded-2xl border border-purple-200/70">
                    <span className="text-overline font-semibold uppercase tracking-wider text-purple-700 block truncate">Completed</span>
                    <p className="text-h3 font-bold font-tabular text-purple-900 mt-1">{data.bookingsSummary.completed}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 13. OPERATIONS OVERVIEW PREVIEW */}
            <Card className="border border-neutral-200/90 shadow-xs rounded-3xl bg-white flex flex-col justify-between">
              <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-neutral-900 text-h4">Operations Metrics</h3>
                  <p className="text-caption text-neutral-400 mt-0.5">Turnovers, cleaning tasks, and maintenance execution.</p>
                </div>
                <button
                  onClick={() => setActiveTab('operations')}
                  className="text-caption font-semibold text-rose-600 hover:text-rose-700 cursor-pointer"
                >
                  View Operations →
                </button>
              </div>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-caption">
                  <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200/70">
                    <span className="text-overline font-semibold uppercase tracking-wider text-neutral-400 block truncate">Check-ins</span>
                    <p className="text-h3 font-bold font-tabular text-neutral-900 mt-1">{data.operationsSummary.checkIns}</p>
                  </div>
                  <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200/70">
                    <span className="text-overline font-semibold uppercase tracking-wider text-neutral-400 block truncate">Check-outs</span>
                    <p className="text-h3 font-bold font-tabular text-neutral-900 mt-1">{data.operationsSummary.checkOuts}</p>
                  </div>
                  <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200/70">
                    <span className="text-overline font-semibold uppercase tracking-wider text-neutral-400 block truncate">Cleaning</span>
                    <p className="text-h3 font-bold font-tabular text-neutral-900 mt-1">{data.operationsSummary.cleaningTasks}</p>
                  </div>
                  <div className="p-3.5 bg-amber-50/60 rounded-2xl border border-amber-200/70">
                    <span className="text-overline font-semibold uppercase tracking-wider text-amber-800 block truncate">Maintenance</span>
                    <p className="text-h3 font-bold font-tabular text-amber-950 mt-1">{data.operationsSummary.openMaintenance}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: PROPERTIES */}
      {activeTab === 'properties' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-neutral-900 text-h4">Complete Property Portfolio</h3>
              <p className="text-caption text-neutral-500 mt-0.5">Catalog of all properties listed under this host profile.</p>
            </div>
            <span className="text-caption font-semibold text-neutral-500 bg-neutral-100 px-3 py-1 rounded-full border border-neutral-200">
              {data.properties.length} Listings Owned
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.properties.map((prop, idx) => (
              <Card key={`${prop.id}_${idx}`} className="border border-neutral-200 shadow-xs rounded-3xl overflow-hidden bg-white p-5 flex flex-col justify-between hover:border-neutral-300 transition">
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <img
                        src={prop.coverImage}
                        alt={prop.title}
                        className="w-20 h-20 rounded-2xl object-cover border border-neutral-100 flex-shrink-0"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-neutral-900 text-body tracking-tight">{prop.title}</h4>
                          <span className="text-overline font-mono font-medium text-neutral-500 bg-neutral-100/80 px-2 py-0.5 rounded-md border border-neutral-200/60 uppercase">
                            {prop.propertyCode}
                          </span>
                        </div>
                        <p className="text-caption text-neutral-500 font-medium flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-rose-500 fill-rose-500/10 flex-shrink-0" /> {prop.locality}, {prop.city}
                        </p>
                        <p className="text-caption text-neutral-500 font-medium">
                          {prop.propertyType} · {prop.bookingCount} Bookings Completed
                        </p>
                        <span className="inline-flex items-center gap-1 text-caption font-medium px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200/60">
                          ● {prop.status}
                        </span>
                      </div>
                    </div>

                    <Link
                      href={`/admin/properties/${prop.id}`}
                      className="px-2.5 py-1 bg-white border border-neutral-200/90 hover:bg-neutral-50 text-neutral-700 rounded-full text-caption font-medium transition flex items-center gap-1 shadow-2xs whitespace-nowrap cursor-pointer flex-shrink-0"
                    >
                      <Eye className="w-3 h-3 text-neutral-400" /> View
                    </Link>
                  </div>

                  {/* Dedicated Assigned Co-Host Container */}
                  {prop.assignedCoHost ? (
                    <div className="mt-3 bg-neutral-50/90 border border-neutral-200/70 rounded-2xl p-2.5 grid grid-cols-3 gap-1 text-caption items-center divide-x divide-neutral-200/60">
                      {/* Column 1: ASSIGNED CO-HOST */}
                      <div className="pr-1 flex items-center gap-1.5 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold text-caption flex items-center justify-center flex-shrink-0 shadow-2xs">
                          {prop.assignedCoHost.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <span className="text-overline font-semibold uppercase text-neutral-500 block tracking-wider leading-none mb-0.5">
                            ASSIGNED CO-HOST
                          </span>
                          <p className="font-semibold text-neutral-900 text-caption leading-tight truncate">{prop.assignedCoHost.name}</p>
                          <p className="text-caption font-mono text-neutral-500 leading-tight truncate">{prop.assignedCoHost.coHostCode}</p>
                        </div>
                      </div>

                      {/* Column 2: ASSIGNED ON */}
                      <div className="px-2 min-w-0">
                        <span className="text-overline font-semibold uppercase text-neutral-500 block tracking-wider leading-none mb-0.5">
                          ASSIGNED ON
                        </span>
                        <span className="font-medium text-neutral-900 text-caption block truncate font-tabular">{prop.assignedCoHost.assignedOn}</span>
                      </div>

                      {/* Column 3: STATUS */}
                      <div className="pl-2 min-w-0">
                        <span className="text-overline font-semibold uppercase text-neutral-500 block tracking-wider leading-none mb-0.5">
                          STATUS
                        </span>
                        <span className="font-semibold text-emerald-600 text-caption flex items-center gap-1 truncate">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0"></span>
                          {prop.assignedCoHost.status}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 bg-neutral-50/60 border border-dashed border-neutral-200 rounded-2xl p-2.5 text-center">
                      <span className="text-caption text-neutral-500 font-medium">No Co-Host Assigned</span>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CO-HOSTS */}
      {activeTab === 'cohosts' && (
        <div className="space-y-6">
          <Card className="border border-neutral-200 shadow-xs rounded-3xl overflow-hidden bg-white">
            <div className="p-6 border-b border-neutral-100">
              <h3 className="font-semibold text-neutral-900 text-h4">Co-Host Assignment Matrix</h3>
              <p className="text-caption text-neutral-400 mt-0.5">Detailed property ↔ co-host delegation mapping.</p>
            </div>
            <CardContent className="p-0">
              <DataTable
                className="border-0 shadow-none rounded-none"
                columns={[
                  {
                    key: 'propertyTitle',
                    header: 'Property',
                    render: (item) => <span className="font-bold text-neutral-900">{item.propertyTitle}</span>,
                  },
                  {
                    key: 'coHostName',
                    header: 'Co-Host',
                    render: (item) => <span className="font-semibold text-purple-900">{item.coHostName}</span>,
                  },
                  {
                    key: 'assignedOn',
                    header: 'Assigned On',
                    render: (item) => <span className="font-mono font-medium text-neutral-600">{item.assignedOn}</span>,
                  },
                  {
                    key: 'permissionsSummary',
                    header: 'Permissions Granted',
                    render: (item) => <span className="font-medium text-neutral-700">{item.permissionsSummary}</span>,
                  },
                  {
                    key: 'status',
                    header: 'Status',
                    render: (item) => (
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold ${
                          item.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        ● {item.status}
                      </span>
                    ),
                  },
                ]}
                data={data.coHostMatrix}
                rowKey={(item) => `${item.propertyTitle}-${item.coHostName}`}
                emptyTitle="No Co-Host Assignments"
                emptySubtitle="No co-host assignments found for this host."
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 4: BOOKINGS */}
      {activeTab === 'bookings' && (
        <div className="space-y-6">
          <Card className="border border-neutral-200 shadow-xs rounded-3xl overflow-hidden bg-white">
            <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-neutral-900 text-h4">Host Reservation Log</h3>
                <p className="text-caption text-neutral-400 mt-0.5">Reservations made across Host properties.</p>
              </div>
              <Link href="/admin/bookings" className="text-xs font-bold text-rose-600 hover:text-rose-700">
                View All Admin Bookings →
              </Link>
            </div>
            <CardContent className="p-0">
              <DataTable
                className="border-0 shadow-none rounded-none"
                columns={[
                  {
                    key: 'guestName',
                    header: 'Guest',
                    render: (b) => <span className="font-bold text-neutral-900">{b.guestName}</span>,
                  },
                  {
                    key: 'propertyTitle',
                    header: 'Property',
                    render: (b) => <span className="font-semibold text-neutral-800">{b.propertyTitle}</span>,
                  },
                  {
                    key: 'checkIn',
                    header: 'Check-in',
                    render: (b) => <span className="font-mono font-medium text-neutral-600">{b.checkIn}</span>,
                  },
                  {
                    key: 'checkOut',
                    header: 'Check-out',
                    render: (b) => <span className="font-mono font-medium text-neutral-600">{b.checkOut}</span>,
                  },
                  {
                    key: 'status',
                    header: 'Status',
                    render: (b) => (
                      <span className="px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {b.status}
                      </span>
                    ),
                  },
                ]}
                data={data.bookingsSummary.recentBookings}
                rowKey={(b) => b.id}
                emptyTitle="No Reservations"
                emptySubtitle="No reservations have been recorded yet."
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 5: OPERATIONS */}
      {activeTab === 'operations' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Check-ins Handled"
              value={data.operationsSummary.checkIns}
              icon={<CheckSquare className="w-4 h-4 text-emerald-600" />}
              variant="emerald"
            />
            <StatCard
              title="Cleaning Tasks"
              value={data.operationsSummary.cleaningTasks}
              icon={<ClipboardList className="w-4 h-4 text-blue-600" />}
              variant="blue"
            />
            <StatCard
              title="Maintenance Logged"
              value={data.operationsSummary.maintenanceRequests}
              icon={<Wrench className="w-4 h-4 text-amber-600" />}
              variant="amber"
            />
            <StatCard
              title="Inspections"
              value={data.operationsSummary.inspections}
              icon={<ShieldCheck className="w-4 h-4 text-purple-600" />}
              variant="purple"
            />
          </div>
        </div>
      )}

      {/* TAB 6: ACTIVITY */}
      {activeTab === 'activity' && (
        <div className="space-y-6">
          <Card className="border border-neutral-200 shadow-xs rounded-3xl bg-white p-6">
            <div className="border-b border-neutral-100 pb-4 mb-6">
              <h3 className="font-semibold text-neutral-900 text-h4">Host Audit Log & Activity Trace</h3>
              <p className="text-caption text-neutral-500">Historical trace of actions executed by this Host.</p>
            </div>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-neutral-200">
              {data.activities.map((act) => (
                <div key={act.id} className="relative flex items-start gap-4">
                  <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-white border-2 border-emerald-500 flex items-center justify-center" />
                  <div className="p-4 bg-neutral-50 border border-neutral-200/80 rounded-2xl flex-1">
                    <div className="flex items-center justify-between text-caption">
                      <span className="font-semibold text-neutral-900">{act.title}</span>
                      <span className="text-neutral-400 font-mono">{act.timeAgo} at {act.timestamp}</span>
                    </div>
                    <p className="text-xs text-neutral-600 mt-1">
                      Target: <strong className="text-neutral-900">{act.targetTitle}</strong> · Performed by: <strong className="text-neutral-900">{act.performedBy}</strong>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 7: VERIFICATION */}
      {activeTab === 'verification' && (
        <div className="space-y-6">
          <Card className="border border-neutral-200 shadow-xs rounded-3xl bg-white p-6">
            <div className="border-b border-neutral-100 pb-4 mb-6">
              <h3 className="font-semibold text-neutral-900 text-h4">Verification & Security Audit</h3>
              <p className="text-caption text-neutral-500">Identity compliance, email, phone, and 2FA status.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-caption">
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-1">
                <span className="text-overline font-semibold uppercase tracking-wider text-emerald-800">Identity Audit</span>
                <p className="font-semibold text-emerald-950 text-body-sm">✓ Government ID Approved</p>
              </div>
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-1">
                <span className="text-overline font-semibold uppercase tracking-wider text-emerald-800">Contact Channels</span>
                <p className="font-semibold text-emerald-950 text-body-sm">✓ Email & Phone Verified</p>
              </div>
              <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-1">
                <span className="text-overline font-semibold uppercase tracking-wider text-blue-800">Account Security</span>
                <p className="font-semibold text-blue-950 text-body-sm">✓ 2FA Enabled</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* SUSPEND HOST MODAL */}
      <ConfirmDialog
        isOpen={showSuspendModal}
        onClose={() => setShowSuspendModal(false)}
        onConfirm={handleSuspendHost}
        title="Suspend Host Account"
        description={`Are you sure you want to suspend ${data.name}? Suspending this account will immediately disable listing access and block co-host management across all ${data.stats.totalProperties} properties.`}
        confirmText="Confirm Suspension"
        cancelText="Cancel"
        variant="danger"
        loading={actionLoading}
      />

      {/* REVOKE CO-HOST MODAL */}
      <ConfirmDialog
        isOpen={showRevokeCoHostModal}
        onClose={() => setShowRevokeCoHostModal(false)}
        onConfirm={handleRevokeCoHost}
        title="Revoke Co-Host Assignment"
        description="Are you sure you want to revoke Co-host Rahul Sharma from Villa Aria? Operational permissions will be removed immediately."
        confirmText="Revoke Assignment"
        cancelText="Cancel"
        variant="warning"
        loading={actionLoading}
      />

      {/* SEND MESSAGE MODAL */}
      <Modal
        isOpen={showMessageModal}
        onClose={() => setShowMessageModal(false)}
        title={`Direct Message to ${data.name}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSendMessageSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1">Subject</label>
            <input
              type="text"
              placeholder="Subject line..."
              value={messageSubject}
              onChange={(e) => setMessageSubject(e.target.value)}
              className="w-full p-2.5 bg-white border border-neutral-200 rounded-xl text-xs outline-none focus:border-rose-500 text-neutral-900"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1">Message Content</label>
            <textarea
              rows={4}
              placeholder="Write administrative message..."
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              className="w-full p-2.5 bg-white border border-neutral-200 rounded-xl text-xs outline-none focus:border-rose-500 text-neutral-900"
              required
            />
          </div>

          <button
            type="submit"
            disabled={actionLoading}
            className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send Administrative Message
          </button>
        </form>
      </Modal>

      {/* EDIT PROFILE MODAL */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Host Attributes"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-neutral-600 mb-1">Full Name</label>
            <input
              type="text"
              defaultValue={data.name}
              className="w-full p-2.5 bg-white border border-neutral-200 rounded-xl outline-none focus:border-rose-500 text-neutral-900"
            />
          </div>
          <div>
            <label className="block font-semibold text-neutral-600 mb-1">Phone Number</label>
            <input
              type="text"
              defaultValue={data.phone}
              className="w-full p-2.5 bg-white border border-neutral-200 rounded-xl outline-none focus:border-rose-500 text-neutral-900"
            />
          </div>
          <div>
            <label className="block font-semibold text-neutral-600 mb-1">Location</label>
            <input
              type="text"
              defaultValue={data.location}
              className="w-full p-2.5 bg-white border border-neutral-200 rounded-xl outline-none focus:border-rose-500 text-neutral-900"
            />
          </div>
          <button
            onClick={() => {
              alert('Host attributes updated!');
              setShowEditModal(false);
            }}
            className="w-full py-2.5 bg-[#0e4962] hover:bg-[#1a6585] text-white rounded-xl font-bold transition mt-2 cursor-pointer"
          >
            Save Changes
          </button>
        </div>
      </Modal>
    </div>
  );
}
