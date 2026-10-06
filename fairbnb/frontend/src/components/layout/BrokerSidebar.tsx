import Link from 'next/link';

export default function BrokerSidebar() {
  return (
    <aside className="w-64 bg-white border-r border-neutral-200/80 text-neutral-900 flex flex-col h-full hidden md:flex select-none">
      <div className="h-20 flex items-center px-6 border-b border-neutral-100">
        <Link href="/broker/dashboard" className="text-xl font-bold tracking-wider text-purple-600">FairBnB Broker</Link>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        <Link href="/broker/dashboard" className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl bg-purple-600 text-white font-semibold shadow-sm">
          <span>Overview</span>
        </Link>
        <Link href="/broker/listings" className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 font-semibold transition">
          <span>Managed Listings</span>
        </Link>
        <Link href="/broker/cross-listings" className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 font-semibold transition">
          <span>Cross-listings</span>
        </Link>
        <Link href="/broker/leads" className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 font-semibold transition">
          <span>Clients & Leads</span>
        </Link>
        <Link href="/broker/commissions" className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 font-semibold transition">
          <span>Commissions</span>
        </Link>
      </nav>
      <div className="p-4 border-t border-neutral-100">
        <button className="w-full py-2.5 text-xs font-bold text-neutral-600 hover:text-purple-600 transition border border-neutral-200 hover:border-purple-200 rounded-2xl hover:bg-purple-50/50 cursor-pointer">
          Sign Out
        </button>
      </div>
    </aside>
  );
}

