export default function BrokerDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Portfolio Overview</h1>
        <p className="text-gray-500 text-sm">Monitor your managed listings, incoming leads, and commission metrics.</p>
      </div>
      
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Managed Properties</h3>
          <p className="text-3xl font-bold text-purple-600">14</p>
          <p className="text-xs text-gray-400 mt-2">Active across 3 hosts</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Pending Cross-listings</h3>
          <p className="text-3xl font-bold text-amber-600">2</p>
          <p className="text-xs text-gray-400 mt-2">Awaiting admin review</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 mb-1">MTD Commission</h3>
          <p className="text-3xl font-bold text-gray-900">$4,250</p>
          <p className="text-xs text-green-500 mt-2">+12% from last month</p>
        </div>
      </div>
    </div>
  );
}
