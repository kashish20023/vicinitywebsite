'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { 
  CheckCircle2, XCircle, FileText, ShieldCheck, 
  ExternalLink, Search, RefreshCw, UserCheck
} from 'lucide-react';

interface VerificationRecord {
  id: string;
  name: string;
  role: 'HOST' | 'BROKER' | 'COHOST';
  submittedAt: string;
  documents: string[];
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  contact: string;
}

const mockHostVerifications: VerificationRecord[] = [
  {
    id: 'ver-1',
    name: 'Jaipur Realty Partners',
    role: 'HOST',
    submittedAt: '15 mins ago',
    documents: ['Government ID (Aadhaar)', 'GSTIN Certificate', 'Commercial Electricity Bill'],
    status: 'PENDING',
    contact: '+91 98290 12345'
  },
  {
    id: 'ver-2',
    name: 'Horizon Management Group',
    role: 'HOST',
    submittedAt: '2 hours ago',
    documents: ['Trade License', 'Fire Safety NOC', 'PAN Card'],
    status: 'VERIFIED',
    contact: '+91 94140 67890'
  }
];

const mockBrokerVerifications: VerificationRecord[] = [
  {
    id: 'brk-1',
    name: 'Amit Singh Coworking Advisory',
    role: 'BROKER',
    submittedAt: '35 mins ago',
    documents: ['RERA Broker License', 'GST Registration'],
    status: 'PENDING',
    contact: '+91 97850 54321'
  }
];

export default function AdminVerificationPage() {
  const [hostList, setHostList] = useState(mockHostVerifications);
  const [brokerList, setBrokerList] = useState(mockBrokerVerifications);
  const [selectedRecord, setSelectedRecord] = useState<VerificationRecord | null>(null);

  const handleVerify = (id: string, isHost: boolean) => {
    if (isHost) {
      setHostList(hostList.map(h => h.id === id ? { ...h, status: 'VERIFIED' } : h));
    } else {
      setBrokerList(brokerList.map(b => b.id === id ? { ...b, status: 'VERIFIED' } : b));
    }
    if (selectedRecord && selectedRecord.id === id) {
      setSelectedRecord({ ...selectedRecord, status: 'VERIFIED' });
    }
  };

  const renderTable = (records: VerificationRecord[], isHost: boolean) => (
    <div className="overflow-x-auto rounded-2xl border border-neutral-200/80 bg-white">
      <table className="w-full text-left text-xs whitespace-nowrap">
        <thead className="bg-[#F8F9FA] text-neutral-500 font-bold uppercase text-[10px] tracking-wider border-b border-neutral-200">
          <tr>
            <th className="px-6 py-4">Applicant / Entity</th>
            <th className="px-6 py-4">Role</th>
            <th className="px-6 py-4">Contact</th>
            <th className="px-6 py-4">Submitted Documents</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4 text-right">Verification Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100 font-medium text-neutral-800">
          {records.map(rec => (
            <tr key={rec.id} className="hover:bg-[#edf4f7]/20 transition">
              <td className="px-6 py-4 font-bold text-neutral-900">{rec.name}</td>
              <td className="px-6 py-4">
                <Badge variant={rec.role === 'HOST' ? 'pink' : 'default'}>{rec.role}</Badge>
              </td>
              <td className="px-6 py-4 text-neutral-500 font-mono">{rec.contact}</td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#0e4962]" />
                  <span>{rec.documents.join(', ')}</span>
                </div>
              </td>
              <td className="px-6 py-4">
                <Badge variant={rec.status === 'VERIFIED' ? 'success' : 'warning'}>
                  {rec.status}
                </Badge>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => setSelectedRecord(rec)}
                    className="px-3 py-1.5 bg-neutral-100 text-neutral-700 hover:bg-neutral-200 rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    Inspect KYC
                  </button>
                  {rec.status !== 'VERIFIED' && (
                    <button
                      onClick={() => handleVerify(rec.id, isHost)}
                      className="px-3 py-1.5 bg-[#0e4962] text-white hover:bg-[#093447] rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      Certify & Approve
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const verificationTabs = [
    { id: 'hosts', label: `Host Flagships (${hostList.filter(h => h.status === 'PENDING').length})`, content: renderTable(hostList, true) },
    { id: 'brokers', label: `Brokers & Partners (${brokerList.filter(b => b.status === 'PENDING').length})`, content: renderTable(brokerList, false) },
    { 
      id: 'history', 
      label: 'Audit History', 
      content: (
        <div className="p-8 text-center text-neutral-400 bg-white rounded-2xl border border-neutral-200 text-xs">
          All verified certifications are digitally stamped with timestamp and admin credentials.
        </div>
      ) 
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-neutral-900 tracking-tight">KYC & Partner Verification</h1>
        <p className="text-xs text-neutral-500 mt-1">
          Review legal identity, commercial licenses, and GST certificates for Hosts and Partners.
        </p>
      </div>

      <Card className="bg-white border-neutral-200/80">
        <CardContent className="p-6">
          <Tabs tabs={verificationTabs} defaultTabId="hosts" />
        </CardContent>
      </Card>

      {/* KYC Inspector Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 border border-neutral-200 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#0e4962]" />
                <h3 className="text-base font-bold text-neutral-900">{selectedRecord.name}</h3>
              </div>
              <Badge variant={selectedRecord.status === 'VERIFIED' ? 'success' : 'warning'}>
                {selectedRecord.status}
              </Badge>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-bold text-neutral-400 uppercase text-[10px] block">Role & Contact</span>
                <p className="font-semibold text-neutral-800">{selectedRecord.role} • {selectedRecord.contact}</p>
              </div>

              <div>
                <span className="font-bold text-neutral-400 uppercase text-[10px] block mb-1">Attached Documents</span>
                <div className="space-y-1.5">
                  {selectedRecord.documents.map((doc, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 bg-neutral-50 rounded-xl border border-neutral-200">
                      <span className="font-medium text-neutral-700">{doc}</span>
                      <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Uploaded & Validated
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 bg-neutral-100 text-neutral-700 text-xs font-bold rounded-xl hover:bg-neutral-200 transition cursor-pointer"
              >
                Close
              </button>
              {selectedRecord.status !== 'VERIFIED' && (
                <button
                  onClick={() => handleVerify(selectedRecord.id, selectedRecord.role === 'HOST')}
                  className="px-4 py-2 bg-[#0e4962] text-white text-xs font-bold rounded-xl hover:bg-[#093447] transition shadow-xs cursor-pointer"
                >
                  Approve Certification
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
