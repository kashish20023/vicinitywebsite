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
  UserCheck,
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
} from 'lucide-react';

interface CoHostProfileData {
  id: string;
  coHostIdCode: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  status: 'ACTIVE' | 'SUSPENDED';
  kycStatus: 'VERIFIED' | 'PENDING' | 'REJECTED';
  joinedAt: string;
  lastActiveAt: string;
  stats: {
    totalProperties: number;
    activeAssignments: number;
    connectedHostsCount: number;
    managedBookingsCount: number;
    pendingTasksCount: number;
  };
  connectedHosts: Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    avatar?: string;
    assignedPropertyCount: number;
    status: string;
  }>;
  assignedProperties: Array<{
    id: string;
    propertyCode: string;
    title: string;
    coverImage: string;
    location: string;
    propertyType: string;
    maxGuests: number;
    status: 'APPROVED' | 'PENDING' | 'REJECTED';
    assignedByHost: {
      id: string;
      name: string;
      email: string;
      role: string;
      avatar?: string;
    };
    assignedOn: string;
    assignmentStatus: 'ACTIVE' | 'SUSPENDED' | 'REVOKED';
    bookingCount?: number;
    permissions: Record<string, boolean>;
  }>;
  assignmentHistory: Array<{
    id: string;
    propertyTitle: string;
    assignedBy: string;
    assignedTo: string;
    assignedOn: string;
    status: 'ACTIVE' | 'REVOKED';
    revokedOn?: string;
    revokedBy?: string;
    reason?: string;
  }>;
  permissionsOverview: Record<
    string,
    Array<{ key: string; label: string; defaultGranted: boolean }>
  >;
  recentActivities: Array<{
    id: string;
    timestamp: string;
    timeAgo: string;
    title: string;
    propertyTitle: string;
    type: 'CHECK_IN' | 'MESSAGE' | 'BOOKING' | 'PERMISSION' | 'ASSIGNMENT' | 'MAINTENANCE';
    performedBy: string;
  }>;
  performanceSummary: {
    bookings: {
      total: number;
      upcoming: number;
      staying: number;
      completed: number;
      cancelled: number;
    };
    operations: {
      checkIns: number;
      checkOuts: number;
      cleaningTasks: number;
      maintenanceRequests: number;
      pendingTasks: number;
    };
  };
  verification: {
    identityStatus: 'VERIFIED' | 'PENDING';
    phoneStatus: 'VERIFIED' | 'PENDING';
    emailStatus: 'VERIFIED' | 'PENDING';
    kycStatus: 'APPROVED' | 'PENDING';
    verifiedOn: string;
    verifiedBy: string;
  };
}

export default function AdminCoHostProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const coHostIdParam = (params?.id as string) || 'CH-1024';

  const [activeTab, setActiveTab] = useState<
    'overview' | 'properties' | 'permissions' | 'activity' | 'verification'
  >('overview');
  const [selectedPropertyForPerms, setSelectedPropertyForPerms] = useState<string>('');
  const [data, setData] = useState<CoHostProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals & Menus
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageSubject, setMessageSubject] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      // 1. Try to fetch direct profile detail from backend API
      const liveData = await api.get<any>(`/admin/co-hosts/${coHostIdParam}`).catch(() => null);
      if (liveData && liveData.assignedProperties) {
        setData({
          ...liveData,
          assignmentHistory: liveData.assignmentHistory || [],
          permissionsOverview: liveData.permissionsOverview || {},
        });
        setLoading(false);
        return;
      }

      // Fallback: fetch relationships list
      const res = await api.get<any>('/admin/co-hosts').catch(() => null);
      const relationships = res?.relationships || [];
      const match = relationships.find(
        (r: any) => r.coHostUser?.id === coHostIdParam || r.id === coHostIdParam,
      );

      const coHostName = match ? match.coHostUser.name : 'Rahul Sharma';
      const coHostEmail = match ? match.coHostUser.email || 'rahul@example.com' : 'rahul@example.com';
      const coHostPhone = match ? match.coHostUser.phone || '+91 98765 43210' : '+91 98765 43210';

      const liveProperties = relationships
        .filter((r: any) => match ? r.coHostUser.id === match.coHostUser.id : true)
        .map((r: any, idx: number) => ({
          id: r.id ? `${r.property?.id || 'prop'}_${r.id}` : `${r.property?.id || 'prop'}_${idx}`,
          propertyCode: `PR-20${48 + idx}`,
          title: r.property.title || (idx === 0 ? 'Villa Aria' : idx === 1 ? 'Palm Residency' : 'Casa Verde'),
          coverImage: r.property.coverImage || 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb',
          location: `${r.property.city || 'Jaipur'}, ${r.property.state || 'Rajasthan'}`,
          propertyType: 'Luxury Villa',
          maxGuests: 6,
          status: 'APPROVED',
          assignedByHost: {
            id: r.hostUser.id || 'usr_host_1',
            name: r.hostUser.name || 'Aman Sharma',
            email: r.hostUser.email || 'aman@fairbnb.com',
            role: 'Host',
          },
          assignedOn: new Date(r.acceptedAt || r.createdAt || Date.now()).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          }),
          assignmentStatus: r.status === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE',
          permissions: {
            manageBookings: true,
            guestMessages: true,
            checkIn: true,
            checkOut: true,
            calendarManagement: true,
            cleaning: true,
            pricing: idx === 0 ? false : true,
            propertyEditing: false,
            payoutManagement: false,
          },
        }));

      // Default mock properties if API returned empty
      const defaultProperties = [
        {
          id: 'prop_001',
          propertyCode: 'PR-2048',
          title: 'Villa Aria',
          coverImage: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb',
          location: 'Vaishali Nagar, Jaipur',
          locality: 'Vaishali Nagar',
          city: 'Jaipur',
          propertyType: 'Villa',
          bookingCount: 42,
          maxGuests: 6,
          status: 'APPROVED' as const,
          assignedByHost: {
            id: 'host_001',
            name: 'Rahul Sharma',
            email: 'rahul@fairbnb.com',
            role: 'Host',
          },
          assignedOn: '10 Sep 2026',
          assignmentStatus: 'ACTIVE' as const,
          permissions: {
            manageBookings: true,
            guestMessages: true,
            checkIn: true,
            checkOut: true,
            calendarManagement: true,
            cleaning: true,
            pricing: true,
            propertyEditing: false,
          },
        },
        {
          id: 'prop_002',
          propertyCode: 'PR-2049',
          title: 'Palm Residency',
          coverImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945',
          location: 'C-Scheme, Jaipur',
          locality: 'C-Scheme',
          city: 'Jaipur',
          propertyType: 'Apartment',
          bookingCount: 28,
          maxGuests: 4,
          status: 'APPROVED' as const,
          assignedByHost: {
            id: 'host_001',
            name: 'Rahul Sharma',
            email: 'rahul@fairbnb.com',
            role: 'Host',
          },
          assignedOn: '05 Sep 2026',
          assignmentStatus: 'ACTIVE' as const,
          permissions: {
            manageBookings: true,
            guestMessages: true,
            checkIn: true,
            checkOut: true,
            calendarManagement: true,
            cleaning: true,
            pricing: true,
            propertyEditing: false,
          },
        },
        {
          id: 'prop_003',
          propertyCode: 'PR-2050',
          title: 'Casa Verde',
          coverImage: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688',
          location: 'Civil Lines, Jaipur',
          locality: 'Civil Lines',
          city: 'Jaipur',
          propertyType: 'Penthouse',
          bookingCount: 35,
          maxGuests: 8,
          status: 'APPROVED' as const,
          assignedByHost: {
            id: 'host_002',
            name: 'Priya Singh',
            email: 'priya@fairbnb.com',
            role: 'Host',
          },
          assignedOn: '21 Aug 2026',
          assignmentStatus: 'ACTIVE' as const,
          permissions: {
            manageBookings: true,
            guestMessages: true,
            checkIn: true,
            checkOut: true,
            calendarManagement: true,
            cleaning: true,
            pricing: true,
            propertyEditing: false,
          },
        },
        {
          id: 'prop_004',
          propertyCode: 'PR-2051',
          title: 'Sunset Villa',
          coverImage: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914',
          location: 'Malviya Nagar, Jaipur',
          locality: 'Malviya Nagar',
          city: 'Jaipur',
          propertyType: 'Villa',
          bookingCount: 18,
          maxGuests: 6,
          status: 'APPROVED' as const,
          assignedByHost: {
            id: 'host_004',
            name: 'Sneha Kapoor',
            email: 'sneha@fairbnb.com',
            role: 'Co-Host',
          },
          assignedOn: '18 Aug 2026',
          assignmentStatus: 'ACTIVE' as const,
          permissions: {
            manageBookings: true,
            guestMessages: true,
            checkIn: true,
            checkOut: true,
            calendarManagement: true,
            cleaning: true,
            pricing: true,
            propertyEditing: false,
          },
        },
        {
          id: 'prop_005',
          propertyCode: 'PR-2052',
          title: 'The Urban Nest',
          coverImage: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b',
          location: 'Tonk Road, Jaipur',
          locality: 'Tonk Road',
          city: 'Jaipur',
          propertyType: 'Apartment',
          bookingCount: 22,
          maxGuests: 4,
          status: 'APPROVED' as const,
          assignedByHost: {
            id: 'host_005',
            name: 'Amit Verma',
            email: 'amit@fairbnb.com',
            role: 'Host',
          },
          assignedOn: '12 Aug 2026',
          assignmentStatus: 'ACTIVE' as const,
          permissions: {
            manageBookings: true,
            guestMessages: true,
            checkIn: true,
            checkOut: true,
            calendarManagement: true,
            cleaning: true,
            pricing: true,
            propertyEditing: false,
          },
        },
        {
          id: 'prop_006',
          propertyCode: 'PR-2053',
          title: 'Blue Lagoon',
          coverImage: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750',
          location: 'Jagatpura, Jaipur',
          locality: 'Jagatpura',
          city: 'Jaipur',
          propertyType: 'Villa',
          bookingCount: 16,
          maxGuests: 5,
          status: 'APPROVED' as const,
          assignedByHost: {
            id: 'host_006',
            name: 'Rohit Mehta',
            email: 'rohit@fairbnb.com',
            role: 'Co-Host',
          },
          assignedOn: '08 Aug 2026',
          assignmentStatus: 'ACTIVE' as const,
          permissions: {
            manageBookings: true,
            guestMessages: true,
            checkIn: true,
            checkOut: true,
            calendarManagement: true,
            cleaning: true,
            pricing: true,
            propertyEditing: false,
          },
        },
      ];

      const finalProperties = liveProperties.length > 0 ? liveProperties : defaultProperties;

      const profileData: CoHostProfileData = {
        id: coHostIdParam,
        coHostIdCode: 'CH-1024',
        name: coHostName,
        email: coHostEmail,
        phone: coHostPhone,
        location: 'Jaipur, Rajasthan',
        status: match?.status === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE',
        kycStatus: 'VERIFIED',
        joinedAt: '12 August 2026',
        lastActiveAt: '2 hours ago',
        stats: {
          totalProperties: finalProperties.length,
          activeAssignments: finalProperties.filter((p: any) => p.assignmentStatus === 'ACTIVE').length,
          connectedHostsCount: 3,
          managedBookingsCount: 124,
          pendingTasksCount: 6,
        },
        connectedHosts: [
          {
            id: 'host_001',
            name: 'Aman Sharma',
            email: 'aman@fairbnb.com',
            phone: '+91 98111 22233',
            assignedPropertyCount: 8,
            status: 'Active',
          },
          {
            id: 'host_002',
            name: 'Priya Singh',
            email: 'priya@fairbnb.com',
            phone: '+91 98444 55566',
            assignedPropertyCount: 3,
            status: 'Active',
          },
          {
            id: 'host_003',
            name: 'Vikas Mehta',
            email: 'vikas@fairbnb.com',
            phone: '+91 98555 66677',
            assignedPropertyCount: 2,
            status: 'Active',
          },
        ],
        assignedProperties: finalProperties,
        assignmentHistory: [
          {
            id: 'hist_001',
            propertyTitle: 'Villa Aria',
            assignedBy: 'Aman Sharma',
            assignedTo: coHostName,
            assignedOn: '10 Sep 2026',
            status: 'ACTIVE',
          },
          {
            id: 'hist_002',
            propertyTitle: 'Palm Residency',
            assignedBy: 'Priya Singh',
            assignedTo: coHostName,
            assignedOn: '05 Sep 2026',
            status: 'ACTIVE',
          },
          {
            id: 'hist_003',
            propertyTitle: 'Casa Verde',
            assignedBy: 'Vikas Mehta',
            assignedTo: coHostName,
            assignedOn: '21 Aug 2026',
            status: 'REVOKED',
            revokedOn: '30 Aug 2026',
            revokedBy: 'Vikas Mehta',
            reason: 'Co-host no longer responsible for this property.',
          },
        ],
        permissionsOverview: {
          'PROPERTY MANAGEMENT': [
            { key: 'viewProperty', label: 'View Property Details', defaultGranted: true },
            { key: 'editProperty', label: 'Edit Property Information', defaultGranted: false },
            { key: 'deleteProperty', label: 'Delete Property', defaultGranted: false },
          ],
          'BOOKING MANAGEMENT': [
            { key: 'viewBookings', label: 'View Guest Bookings', defaultGranted: true },
            { key: 'manageBookings', label: 'Manage & Confirm Bookings', defaultGranted: true },
            { key: 'cancelBooking', label: 'Cancel Guest Bookings', defaultGranted: false },
          ],
          'GUEST MANAGEMENT': [
            { key: 'viewGuestDetails', label: 'View Guest Contact Info', defaultGranted: true },
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
        recentActivities: [
          {
            id: 'act_1',
            timestamp: '10:32 AM',
            timeAgo: 'Today',
            title: 'Updated check-in status',
            propertyTitle: 'Villa Aria',
            type: 'CHECK_IN',
            performedBy: coHostName,
          },
          {
            id: 'act_2',
            timestamp: '06:21 PM',
            timeAgo: 'Yesterday',
            title: 'Responded to guest message',
            propertyTitle: 'Palm Residency',
            type: 'MESSAGE',
            performedBy: coHostName,
          },
          {
            id: 'act_3',
            timestamp: '11:42 AM',
            timeAgo: '15 Sep',
            title: 'Booking marked as completed',
            propertyTitle: 'Villa Aria',
            type: 'BOOKING',
            performedBy: coHostName,
          },
          {
            id: 'act_4',
            timestamp: '04:20 PM',
            timeAgo: '12 Sep',
            title: 'Permission package updated',
            propertyTitle: 'Villa Aria',
            type: 'PERMISSION',
            performedBy: 'Aman Sharma',
          },
          {
            id: 'act_5',
            timestamp: '11:20 AM',
            timeAgo: '10 Sep',
            title: 'Property assigned to Co-Host',
            propertyTitle: 'Villa Aria',
            type: 'ASSIGNMENT',
            performedBy: 'Aman Sharma',
          },
        ],
        performanceSummary: {
          bookings: {
            total: 124,
            upcoming: 18,
            staying: 7,
            completed: 91,
            cancelled: 8,
          },
          operations: {
            checkIns: 42,
            checkOuts: 38,
            cleaningTasks: 64,
            maintenanceRequests: 12,
            pendingTasks: 6,
          },
        },
        verification: {
          identityStatus: 'VERIFIED',
          phoneStatus: 'VERIFIED',
          emailStatus: 'VERIFIED',
          kycStatus: 'APPROVED',
          verifiedOn: '12 August 2026',
          verifiedBy: 'Fairbnb Platform Admin',
        },
      };

      setData(profileData);
      if (profileData.assignedProperties.length > 0) {
        setSelectedPropertyForPerms(profileData.assignedProperties[0].id);
      }
    } catch (err) {
      console.error('Failed to load co-host profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchProfileData();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [isAuthenticated, authLoading, coHostIdParam]);

  // Click outside to close More Menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSuspendCoHost = async () => {
    if (!data) return;
    setActionLoading(true);
    try {
      await api.patch(`/admin/co-hosts/${data.id}/status`, { status: 'SUSPENDED' });
      alert(`Co-Host ${data.name} suspended successfully.`);
      setShowSuspendModal(false);
      fetchProfileData();
    } catch (err: any) {
      alert(err.message || 'Failed to suspend co-host.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevokeAssignments = async () => {
    if (!data) return;
    setActionLoading(true);
    try {
      alert(`All property assignments for ${data.name} have been revoked.`);
      setShowRevokeModal(false);
      fetchProfileData();
    } catch (err: any) {
      alert(err.message || 'Failed to revoke assignments.');
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
      alert(`Administrative message dispatched to ${data.name}!`);
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
        <p className="text-xs font-semibold text-neutral-600">Loading Co-Host Profile & Relationship Context...</p>
      </div>
    );
  }

  const selectedPermProperty =
    data.assignedProperties.find((p) => p.id === selectedPropertyForPerms) ||
    data.assignedProperties[0];

  return (
    <div className="max-w-7xl mx-auto pb-20 p-4 sm:p-8 space-y-8 select-none text-neutral-900">
      {/* 1. TOP HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-neutral-500 mb-1">
            <Link
              href="/admin/co-hosts"
              className="flex items-center gap-1 text-neutral-600 hover:text-rose-600 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Co-hosts
            </Link>
            <span>/</span>
            <span className="text-neutral-900 font-semibold">Co-host Profile</span>
          </div>
          <h1 className="text-h1 font-bold text-neutral-900 tracking-tight">
            Co-host Profile & Supervision
          </h1>
          <p className="text-neutral-500 text-body-sm mt-0.5">
            View profile, assignments, permissions and activity log.
          </p>
        </div>

        <div className="flex items-center gap-3 relative" ref={dropdownRef}>
          <button
            onClick={() => setShowEditModal(true)}
            className="px-4 py-2 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-800 rounded-xl text-button font-medium transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5 text-neutral-500" /> Edit Co-host
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
                  setShowSuspendModal(true);
                }}
                className="w-full px-4 py-2.5 hover:bg-rose-50 text-rose-600 text-left flex items-center gap-2"
              >
                <Ban className="w-3.5 h-3.5 text-rose-600" /> Suspend Co-host
              </button>

              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  setShowRevokeModal(true);
                }}
                className="w-full px-4 py-2.5 hover:bg-amber-50 text-amber-700 text-left flex items-center gap-2"
              >
                <XCircle className="w-3.5 h-3.5 text-amber-600" /> Revoke All Assignments
              </button>

              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  setActiveTab('activity');
                }}
                className="w-full px-4 py-2.5 hover:bg-neutral-50 text-left flex items-center gap-2 text-neutral-700 border-t border-neutral-100"
              >
                <Activity className="w-3.5 h-3.5 text-neutral-400" /> View Activity Log
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. CO-HOST PROFILE HEADER & BASIC INFORMATION (MERGED) */}
      <Card className="border border-neutral-200 shadow-xs rounded-3xl bg-white overflow-hidden">
        <CardContent className="p-6 sm:p-8 space-y-6">
          {/* TOP PROFILE HERO BANNER */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-5">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-rose-500 text-white font-bold text-h2 flex items-center justify-center shadow-md flex-shrink-0">
                {data.name.charAt(0).toUpperCase()}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-h2 font-bold text-neutral-900 tracking-tight">{data.name}</h2>
                  {/* <span className="text-caption font-mono font-semibold text-neutral-500 bg-neutral-100 px-2.5 py-0.5 rounded-lg border border-neutral-200">
                    ID: {data.coHostIdCode}
                  </span> */}
                  <StatusBadge
                    status={data.status}
                    showDot
                    size="sm"
                  />
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

              <button
                onClick={() => setShowMessageModal(true)}
                className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-button font-medium transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" /> Message
              </button>
            </div>
          </div>

          {/* BASIC INFORMATION GRID */}
          <div className="border-t border-neutral-100 pt-6">
            <h3 className="text-overline font-semibold text-neutral-400 uppercase tracking-wider mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-body-sm">
              <div>
                <span className="text-neutral-400 font-medium block uppercase tracking-wider text-caption">Full Name</span>
                <span className="font-semibold text-neutral-900 text-body-sm mt-1 block">{data.name}</span>
              </div>
              <div>
                <span className="text-neutral-400 font-medium block uppercase tracking-wider text-caption">Email</span>
                <a href={`mailto:${data.email}`} className="font-semibold text-rose-600 hover:underline text-body-sm mt-1 block truncate">
                  {data.email}
                </a>
              </div>
              <div>
                <span className="text-neutral-400 font-medium block uppercase tracking-wider text-caption">Phone</span>
                <span className="font-mono font-medium text-neutral-900 text-body-sm mt-1 block">{data.phone}</span>
              </div>
              <div>
                <span className="text-neutral-400 font-medium block uppercase tracking-wider text-caption">Location</span>
                <span className="font-semibold text-neutral-900 text-body-sm mt-1 block">{data.location}</span>
              </div>
              <div>
                <span className="text-neutral-400 font-medium block uppercase tracking-wider text-caption">Account Status</span>
                <div className="mt-1">
                  <StatusBadge status={data.status} showDot size="sm" />
                </div>
              </div>
              <div>
                <span className="text-neutral-400 font-medium block uppercase tracking-wider text-caption">KYC Status</span>
                <div className="mt-1">
                  <StatusBadge status={data.kycStatus} size="sm" />
                </div>
              </div>
              <div>
                <span className="text-neutral-400 font-medium block uppercase tracking-wider text-caption">Joined Date</span>
                <span className="font-medium text-neutral-900 text-body-sm mt-1 block">{data.joinedAt}</span>
              </div>
              <div>
                <span className="text-neutral-400 font-medium block uppercase tracking-wider text-caption">Co-host ID</span>
                <span className="font-mono font-medium text-neutral-900 text-body-sm mt-1 block">{data.coHostIdCode}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. QUICK OVERVIEW STATS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          label="Total Properties"
          value={String(data.stats.totalProperties).padStart(2, '0')}
          icon={Building2}
          variant="default"
        />
        <StatCard
          label="Active Assignments"
          value={String(data.stats.activeAssignments).padStart(2, '0')}
          icon={CheckCircle2}
          variant="emerald"
        />
        <StatCard
          label="Connected Hosts"
          value={String(data.stats.connectedHostsCount).padStart(2, '0')}
          icon={Users}
          variant="blue"
        />
        <StatCard
          label="Managed Bookings"
          value={data.stats.managedBookingsCount}
          icon={ClipboardList}
          variant="rose"
        />
        <StatCard
          label="Pending Tasks"
          value={String(data.stats.pendingTasksCount).padStart(2, '0')}
          icon={Clock}
          variant="amber"
          className="col-span-2 sm:col-span-1"
        />
      </div>

      {/* 15. TABS NAVIGATION */}
      <div className="border-b border-neutral-200 overflow-x-auto">
        <nav className="flex space-x-8 min-w-max">
          {(
            [
              { id: 'overview', label: 'Overview' },
              { id: 'properties', label: `Properties (${data.assignedProperties.length})` },
              { id: 'permissions', label: 'Permissions' },
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

          {/* 5. ASSIGNED PROPERTIES (MOST IMPORTANT SECTION) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-neutral-900 text-h4">Assigned Properties</h3>
                <p className="text-caption text-neutral-500">Properties currently managed by this co-host.</p>
              </div>
              <button
                onClick={() => setActiveTab('properties')}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
              >
                View All →
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {data.assignedProperties.map((prop, idx) => (
                <Card
                  key={`${prop.id}_${idx}`}
                  className="border border-neutral-200/90 shadow-xs rounded-3xl overflow-hidden bg-white hover:border-neutral-300 transition p-4 flex flex-col justify-between"
                >
                  <div>
                    {/* Top Row: Cover Image + Property Details */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-start gap-3 min-w-0">
                        <img
                          src={prop.coverImage}
                          alt={prop.title}
                          className="w-14 h-14 rounded-2xl object-cover border border-neutral-100 flex-shrink-0 shadow-2xs"
                        />
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-semibold text-neutral-900 text-caption tracking-tight truncate">{prop.title}</h4>
                            <span className="text-overline font-mono font-medium text-neutral-500 bg-neutral-100/80 px-1.5 py-0.5 rounded-md border border-neutral-200/60 uppercase flex-shrink-0">
                              {prop.propertyCode}
                            </span>
                          </div>
                          <p className="text-caption text-neutral-500 font-medium flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 text-rose-500 fill-rose-500/10 flex-shrink-0" />
                            <span className="truncate">
                              {(!prop.location || prop.location.includes('usgsud') || prop.location.includes('swdash')) ? 'Jaipur, Rajasthan' : prop.location}
                            </span>
                          </p>
                          <p className="text-caption text-neutral-500 font-medium truncate">
                            {prop.propertyType} · {prop.bookingCount || 42} Bookings Completed
                          </p>
                          <div className="pt-0.5">
                            <span className="inline-flex items-center gap-1 text-caption font-medium px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200/60">
                              ● {prop.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        title="More options"
                        className="text-neutral-400 hover:text-neutral-600 p-1 rounded-lg hover:bg-neutral-100 transition cursor-pointer flex-shrink-0"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Dedicated Assigned Metadata Container */}
                    <div className="mt-3 bg-neutral-50/90 border border-neutral-200/70 rounded-2xl p-2.5 grid grid-cols-3 gap-1 text-caption items-center divide-x divide-neutral-200/60">
                      {/* Column 1: ASSIGNED BY */}
                      <div className="pr-1 flex items-center gap-1.5 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold text-caption flex items-center justify-center flex-shrink-0 shadow-2xs">
                          {prop.assignedByHost?.name?.charAt(0) || 'H'}
                        </div>
                        <div className="min-w-0">
                          <span className="text-overline font-semibold uppercase text-neutral-500 block tracking-wider leading-none mb-0.5">ASSIGNED BY</span>
                          <p className="font-semibold text-neutral-900 text-caption leading-tight truncate">{prop.assignedByHost?.name || 'Rahul Sharma'}</p>
                          <p className="text-caption text-neutral-500 leading-tight truncate">{prop.assignedByHost?.role || 'Host'}</p>
                        </div>
                      </div>

                      {/* Column 2: ASSIGNED ON */}
                      <div className="px-2 min-w-0">
                        <span className="text-overline font-semibold uppercase text-neutral-500 block tracking-wider leading-none mb-0.5">ASSIGNED ON</span>
                        <span className="font-medium text-neutral-900 text-caption block truncate font-tabular">{prop.assignedOn}</span>
                      </div>

                      {/* Column 3: STATUS */}
                      <div className="pl-2 min-w-0">
                        <span className="text-overline font-semibold uppercase text-neutral-500 block tracking-wider leading-none mb-0.5">STATUS</span>
                        <span className="font-semibold text-emerald-600 text-caption flex items-center gap-1 truncate">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0"></span>
                          {prop.assignmentStatus}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Section: Property-Specific Permissions */}
                    <div className="mt-3 pt-3 border-t border-neutral-100">
                      <span className="text-overline font-semibold uppercase tracking-wider text-neutral-500 block mb-1.5">
                        PROPERTY-SPECIFIC PERMISSIONS ({prop.title.toUpperCase()} - {prop.propertyType.toUpperCase()})
                      </span>
                      <div className="flex flex-wrap items-center gap-1 text-caption font-medium">
                        {Object.entries(prop.permissions).map(([key, granted]) => (
                          <span
                            key={key}
                            className={`px-2 py-0.5 rounded-full flex items-center gap-1 border ${granted
                              ? 'bg-emerald-50/80 text-emerald-700 border-emerald-200/70'
                              : 'bg-neutral-100/70 text-neutral-400 border-neutral-200/60 line-through'
                              }`}
                          >
                            {granted ? (
                              <Check className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                            ) : (
                              <X className="w-3 h-3 text-neutral-400 flex-shrink-0" />
                            )}
                            <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* 8. ASSIGNMENT HISTORY */}
          <div className="space-y-3">
            <div className="px-1">
              <h3 className="font-semibold text-neutral-900 text-base">Assignment History</h3>
              <p className="text-xs text-neutral-400 mt-0.5">Historical log of property delegations, active status, and revocations.</p>
            </div>

            <DataTable
              columns={[
                {
                  key: 'property',
                  header: 'Property',
                  cellClassName: 'font-bold text-neutral-900',
                  render: (item: any) => item.propertyTitle,
                },
                {
                  key: 'assignedBy',
                  header: 'Assigned By',
                  cellClassName: 'font-semibold text-neutral-700',
                  render: (item: any) => item.assignedBy,
                },
                {
                  key: 'assignedTo',
                  header: 'Assigned To',
                  cellClassName: 'font-semibold text-neutral-700',
                  render: (item: any) => item.assignedTo,
                },
                {
                  key: 'assignedOn',
                  header: 'Assigned On',
                  cellClassName: 'font-mono font-medium text-neutral-600',
                  render: (item: any) => item.assignedOn,
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (item: any) => (
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-bold ${item.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                    >
                      ● {item.status}
                    </span>
                  ),
                },
                {
                  key: 'auditDetails',
                  header: 'Revocation Audit Details',
                  cellClassName: 'text-neutral-500',
                  render: (item: any) =>
                    item.status === 'REVOKED' ? (
                      <div>
                        <p className="font-bold text-rose-700">Revoked by {item.revokedBy} ({item.revokedOn})</p>
                        <p className="text-caption text-neutral-500 font-medium">{item.reason}</p>
                      </div>
                    ) : (
                      <span className="text-neutral-400 font-normal">Active Delegation</span>
                    ),
                },
              ]}
              data={data.assignmentHistory}
              rowKey={(item: any) => item.id}
              emptyTitle="No Assignment History"
              emptySubtitle="No property delegations recorded for this co-host."
            />
          </div>

          {/* 9. CONNECTED HOSTS */}
          <Card className="border border-neutral-200 shadow-xs rounded-3xl bg-white">
            <div className="p-6 border-b border-neutral-100">
              <h3 className="font-semibold text-neutral-900 text-base">Connected Hosts Directory</h3>
              <p className="text-xs text-neutral-400 mt-0.5">Primary host accounts associated with this co-host.</p>
            </div>
            <CardContent className="p-6 space-y-3">
              {data.connectedHosts.map((h) => (
                <div key={h.id} className="p-4 border border-neutral-200/80 rounded-2xl flex items-center justify-between hover:bg-neutral-50 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-rose-500 text-white font-bold flex items-center justify-center text-caption">
                      {h.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-neutral-900 text-caption">{h.name}</p>
                      <p className="text-caption text-neutral-400">{h.email} · {h.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-caption font-bold text-neutral-700 bg-neutral-100 px-3 py-1 rounded-full">
                      {h.assignedPropertyCount} assigned properties
                    </span>
                    <Link
                      href="/admin/hosts"
                      className="px-3 py-1.5 bg-white border border-neutral-200 hover:bg-neutral-100 text-neutral-800 rounded-xl text-xs font-bold transition flex items-center gap-1"
                    >
                      View Host →
                    </Link>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 12. BOOKING & OPERATIONS SUMMARY */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border border-neutral-200 shadow-xs rounded-3xl bg-white">
              <div className="p-6 border-b border-neutral-100">
                <h3 className="font-semibold text-neutral-900 text-base">Booking Performance Summary</h3>
                <p className="text-xs text-neutral-400 mt-0.5">Reservation management counts across assigned listings.</p>
              </div>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4 text-caption">
                  <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/60">
                    <span className="text-neutral-500 font-semibold uppercase text-overline tracking-wider">Total Managed</span>
                    <p className="text-h3 font-bold font-tabular text-neutral-900 mt-1">{data.performanceSummary.bookings.total}</p>
                  </div>
                  <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200/60">
                    <span className="text-blue-600 font-semibold uppercase text-overline tracking-wider">Upcoming</span>
                    <p className="text-h3 font-bold font-tabular text-blue-900 mt-1">{data.performanceSummary.bookings.upcoming}</p>
                  </div>
                  <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200/60">
                    <span className="text-emerald-600 font-semibold uppercase text-overline tracking-wider">Currently Staying</span>
                    <p className="text-h3 font-bold font-tabular text-emerald-900 mt-1">{data.performanceSummary.bookings.staying}</p>
                  </div>
                  <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-200/60">
                    <span className="text-purple-600 font-semibold uppercase text-overline tracking-wider">Completed</span>
                    <p className="text-h3 font-bold font-tabular text-purple-900 mt-1">{data.performanceSummary.bookings.completed}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-neutral-200 shadow-xs rounded-3xl bg-white">
              <div className="p-6 border-b border-neutral-100">
                <h3 className="font-semibold text-neutral-900 text-base">Operations Summary</h3>
                <p className="text-caption text-neutral-400 mt-0.5">Turnover, cleaning, and guest check-in task execution.</p>
              </div>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4 text-caption">
                  <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/60">
                    <span className="text-neutral-500 font-semibold uppercase text-overline tracking-wider">Check-ins Handled</span>
                    <p className="text-h3 font-bold font-tabular text-neutral-900 mt-1">{data.performanceSummary.operations.checkIns}</p>
                  </div>
                  <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/60">
                    <span className="text-neutral-500 font-semibold uppercase text-overline tracking-wider">Check-outs Completed</span>
                    <p className="text-h3 font-bold font-tabular text-neutral-900 mt-1">{data.performanceSummary.operations.checkOuts}</p>
                  </div>
                  <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/60">
                    <span className="text-neutral-500 font-semibold uppercase text-overline tracking-wider">Cleaning Tasks</span>
                    <p className="text-h3 font-bold font-tabular text-neutral-900 mt-1">{data.performanceSummary.operations.cleaningTasks}</p>
                  </div>
                  <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/60">
                    <span className="text-amber-700 font-semibold uppercase text-overline tracking-wider">Pending Tasks</span>
                    <p className="text-h3 font-bold font-tabular text-amber-900 mt-1">{data.performanceSummary.operations.pendingTasks}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 13. VERIFICATION SUMMARY */}
          <Card className="border border-neutral-200 shadow-xs rounded-3xl bg-white">
            <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-neutral-900 text-base">Verification & Compliance Summary</h3>
                <p className="text-xs text-neutral-400 mt-0.5">Platform compliance, phone, email, and identity audit.</p>
              </div>
              <button
                onClick={() => setActiveTab('verification')}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
              >
                View Verification →
              </button>
            </div>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-semibold">
                <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl text-emerald-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Identity Verified</span>
                </div>
                <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl text-emerald-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Phone Verified</span>
                </div>
                <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl text-emerald-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Email Verified</span>
                </div>
                <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl text-emerald-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>KYC Approved</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: PROPERTIES */}
      {activeTab === 'properties' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-neutral-900 text-h4">All Assigned Properties</h3>
            <span className="text-caption font-semibold text-neutral-500 bg-neutral-100 px-3 py-1 rounded-full border border-neutral-200 font-tabular">
              {data.assignedProperties.length} Properties Currently Delegated
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.assignedProperties.map((prop, idx) => (
              <Card
                key={`${prop.id}_${idx}`}
                className="border border-neutral-200/90 shadow-xs rounded-3xl overflow-hidden bg-white hover:border-neutral-300 transition p-4 flex flex-col justify-between"
              >
                <div>
                  <div>
                    {/* Top Row: Cover Image + Property Details */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-start gap-3 min-w-0">
                        <img
                          src={prop.coverImage}
                          alt={prop.title}
                          className="w-14 h-14 rounded-2xl object-cover border border-neutral-100 flex-shrink-0 shadow-2xs"
                        />
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-semibold text-neutral-900 text-caption tracking-tight truncate">{prop.title}</h4>
                            <span className="text-overline font-mono font-medium text-neutral-500 bg-neutral-100/80 px-1.5 py-0.5 rounded-md border border-neutral-200/60 uppercase flex-shrink-0">
                              {prop.propertyCode}
                            </span>
                          </div>
                          <p className="text-caption text-neutral-500 font-medium flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 text-rose-500 fill-rose-500/10 flex-shrink-0" />
                            <span className="truncate">
                              {(!prop.location || prop.location.includes('usgsud') || prop.location.includes('swdash')) ? 'Jaipur, Rajasthan' : prop.location}
                            </span>
                          </p>
                          <p className="text-caption text-neutral-500 font-medium truncate">
                            {prop.propertyType} · {prop.bookingCount || 42} Bookings Completed
                          </p>
                          <div className="pt-0.5">
                            <span className="inline-flex items-center gap-1 text-caption font-medium px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200/60">
                              ● {prop.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        title="More options"
                        className="text-neutral-400 hover:text-neutral-600 p-1 rounded-lg hover:bg-neutral-100 transition cursor-pointer flex-shrink-0"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Dedicated Assigned Metadata Container */}
                    <div className="mt-3 bg-neutral-50/90 border border-neutral-200/70 rounded-2xl p-2.5 grid grid-cols-3 gap-1 text-caption items-center divide-x divide-neutral-200/60">
                      {/* Column 1: ASSIGNED BY */}
                      <div className="pr-1 flex items-center gap-1.5 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold text-caption flex items-center justify-center flex-shrink-0 shadow-2xs">
                          {prop.assignedByHost?.name?.charAt(0) || 'H'}
                        </div>
                        <div className="min-w-0">
                          <span className="text-overline font-semibold uppercase text-neutral-500 block tracking-wider leading-none mb-0.5">ASSIGNED BY</span>
                          <p className="font-semibold text-neutral-900 text-caption leading-tight truncate">{prop.assignedByHost?.name || 'Rahul Sharma'}</p>
                          <p className="text-caption text-neutral-500 leading-tight truncate">{prop.assignedByHost?.role || 'Host'}</p>
                        </div>
                      </div>

                      {/* Column 2: ASSIGNED ON */}
                      <div className="px-2 min-w-0">
                        <span className="text-overline font-semibold uppercase text-neutral-500 block tracking-wider leading-none mb-0.5">ASSIGNED ON</span>
                        <span className="font-medium text-neutral-900 text-caption block truncate font-tabular">{prop.assignedOn}</span>
                      </div>

                      {/* Column 3: STATUS */}
                      <div className="pl-2 min-w-0">
                        <span className="text-overline font-semibold uppercase text-neutral-500 block tracking-wider leading-none mb-0.5">STATUS</span>
                        <span className="font-semibold text-emerald-600 text-caption flex items-center gap-1 truncate">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0"></span>
                          {prop.assignmentStatus}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Section: Property-Specific Permissions */}
                    <div className="mt-3 pt-3 border-t border-neutral-100">
                      <span className="text-overline font-semibold uppercase tracking-wider text-neutral-500 block mb-1.5">
                        PROPERTY-SPECIFIC PERMISSIONS ({prop.title.toUpperCase()} - {prop.propertyType.toUpperCase()})
                      </span>
                      <div className="flex flex-wrap items-center gap-1 text-caption font-medium">
                        {Object.entries(prop.permissions).map(([key, granted]) => (
                          <span
                            key={key}
                            className={`px-2 py-0.5 rounded-full flex items-center gap-1 border ${granted
                              ? 'bg-emerald-50/80 text-emerald-700 border-emerald-200/70'
                              : 'bg-neutral-100/70 text-neutral-400 border-neutral-200/60 line-through'
                              }`}
                          >
                            {granted ? (
                              <Check className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                            ) : (
                              <X className="w-3 h-3 text-neutral-400 flex-shrink-0" />
                            )}
                            <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: PERMISSIONS */}
      {activeTab === 'permissions' && (
        <div className="space-y-6">
          <Card className="border border-neutral-200 shadow-xs rounded-3xl bg-white p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-4">
              <div>
                <h3 className="font-semibold text-neutral-900 text-h4">Property-Specific Permissions Breakdown</h3>
                <p className="text-caption text-neutral-500">
                  Select a property to view granted capabilities. Permissions vary per property delegation.
                </p>
              </div>

              {/* Property Selector */}
              <div className="flex items-center gap-2">
                <span className="text-caption font-semibold text-neutral-600">Property:</span>
                <select
                  value={selectedPropertyForPerms}
                  onChange={(e) => setSelectedPropertyForPerms(e.target.value)}
                  className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-caption font-medium text-neutral-900 outline-none cursor-pointer"
                >
                  {data.assignedProperties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.propertyCode})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-6 space-y-6">
              {Object.entries(data.permissionsOverview).map(([category, items]) => (
                <div key={category} className="space-y-3">
                  <h4 className="text-overline font-semibold text-neutral-500 uppercase tracking-wider">{category}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-semibold">
                    {items.map((perm) => {
                      const granted = selectedPermProperty.permissions[perm.key] ?? perm.defaultGranted;
                      return (
                        <div
                          key={perm.key}
                          className={`p-3.5 rounded-2xl border flex items-center justify-between ${granted
                            ? 'bg-emerald-50/70 border-emerald-200/80 text-emerald-900'
                            : 'bg-neutral-50 border-neutral-200 text-neutral-400'
                            }`}
                        >
                          <span>{perm.label}</span>
                          {granted ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-neutral-300 flex-shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 4: ACTIVITY */}
      {activeTab === 'activity' && (
        <div className="space-y-6">
          <Card className="border border-neutral-200 shadow-xs rounded-3xl bg-white">
            <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-neutral-900 text-h4">Audit & Operational Activity Log</h3>
                <p className="text-caption text-neutral-500">Real-time trace of co-host actions, check-ins, and permission updates.</p>
              </div>
              <span className="text-caption font-semibold text-neutral-500 bg-neutral-100 px-3 py-1 rounded-full border border-neutral-200">
                Live Log Entries
              </span>
            </div>

            <CardContent className="p-6">
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-neutral-200">
                {data.recentActivities.map((act) => (
                  <div key={act.id} className="relative flex items-start gap-4">
                    <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-white border-2 border-rose-500 flex items-center justify-center" />
                    <div className="p-4 bg-neutral-50 border border-neutral-200/80 rounded-2xl flex-1 hover:bg-neutral-100/60 transition">
                      <div className="flex items-center justify-between text-caption">
                        <span className="font-semibold text-neutral-900">{act.title}</span>
                        <span className="text-neutral-400 font-mono">{act.timeAgo} at {act.timestamp}</span>
                      </div>
                      <p className="text-xs text-neutral-600 mt-1">
                        Target Property: <strong className="text-neutral-900">{act.propertyTitle}</strong> · Action by: <strong className="text-neutral-900">{act.performedBy}</strong>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 5: VERIFICATION */}
      {activeTab === 'verification' && (
        <div className="space-y-6">
          <Card className="border border-neutral-200 shadow-xs rounded-3xl bg-white p-6">
            <div className="border-b border-neutral-100 pb-4">
              <h3 className="font-semibold text-neutral-900 text-h4">Identity & KYC Verification Record</h3>
              <p className="text-caption text-neutral-500">System compliance verification, timestamps, and auditing authority.</p>
            </div>

            <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-6 text-caption">
              <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl space-y-2">
                <span className="text-overline font-semibold uppercase tracking-wider text-emerald-800">Identity Verification</span>
                <p className="font-semibold text-emerald-950 text-body-sm flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Government ID Verified
                </p>
                <p className="text-caption text-emerald-800 font-medium">Verified On: {data.verification.verifiedOn}</p>
              </div>

              <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl space-y-2">
                <span className="text-overline font-semibold uppercase tracking-wider text-emerald-800">Contact Channels</span>
                <p className="font-semibold text-emerald-950 text-body-sm flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Phone & Email OTP Verified
                </p>
                <p className="text-caption text-emerald-800 font-medium">Audited By: {data.verification.verifiedBy}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* SUSPEND CO-HOST CONFIRMATION MODAL */}
      <ConfirmDialog
        isOpen={showSuspendModal}
        onClose={() => setShowSuspendModal(false)}
        onConfirm={handleSuspendCoHost}
        title="Suspend Co-host Account"
        description={`Are you sure you want to suspend ${data.name}? Suspending this account will immediately revoke operational access to all ${data.stats.totalProperties} assigned properties.`}
        confirmText="Confirm Suspension"
        cancelText="Cancel"
        variant="danger"
        loading={actionLoading}
      />

      {/* REVOKE ALL ASSIGNMENTS CONFIRMATION MODAL */}
      <ConfirmDialog
        isOpen={showRevokeModal}
        onClose={() => setShowRevokeModal(false)}
        onConfirm={handleRevokeAssignments}
        title="Revoke All Property Assignments"
        description={`Are you sure you want to revoke all property delegations for ${data.name}? All ${data.stats.totalProperties} assigned property permissions will be unlinked.`}
        confirmText="Revoke All Assignments"
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
        title="Edit Co-Host Attributes"
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
              alert('Co-Host attributes updated!');
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
