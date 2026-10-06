const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:3002';
const routes = [
  { name: 'Dashboard', path: '/admin' },
  { name: 'Listings', path: '/admin/listings' },
  { name: 'Bookings Ledger', path: '/admin/bookings' },
  { name: 'Users Directory', path: '/admin/users' },
  { name: 'Finance Ledger', path: '/admin/finance' },
  { name: 'Moderation Queue', path: '/admin/moderation' },
  { name: 'KYC Verification', path: '/admin/verification' },
  { name: 'Support & Tickets', path: '/admin/support' },
  { name: 'Analytics', path: '/admin/analytics' },
  { name: 'Marketing Banners', path: '/admin/marketing/banners' },
  { name: 'Amenities & Tags', path: '/admin/settings/amenities-tags' },
  { name: 'Global Settings', path: '/admin/settings' },
  { name: 'Spaces & Campuses', path: '/admin/spaces' },
];

function fetchPage(p) {
  return new Promise((resolve) => {
    http.get(BASE + p, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, html: data }));
    }).on('error', (err) => resolve({ status: 500, error: err.message }));
  });
}

async function verifyAll() {
  console.log('========================================================================');
  console.log('  STUDIO I ADMIN — DOM & LIGHT THEME HEURISTIC AUDIT');
  console.log('========================================================================\n');

  let passed = 0;
  for (const r of routes) {
    const res = await fetchPage(r.path);
    const hasWhiteOrPink = res.html.includes('#FF007A') || res.html.includes('#FFF0F7') || res.html.includes('bg-[#FFF0F7]') || res.html.includes('bg-white') || res.html.includes('bg-slate-50');
    const hasDarkSidebar = res.html.includes('#1E1E2D') || res.html.includes('#151521') || res.html.includes('bg-slate-900') || res.html.includes('bg-gray-900');

    const ok = res.status === 200 && hasWhiteOrPink && !hasDarkSidebar;
    if (ok) passed++;
    console.log(`[${ok ? 'PASS' : 'FAIL'}] ${r.name} (${r.path}) -> HTTP ${res.status} | Light Theme Verified: ${hasWhiteOrPink} | Dark Sidebar Forbidden: ${!hasDarkSidebar}`);
  }

  console.log(`\nDOM Light Theme Audit: ${passed} / ${routes.length} pages verified.`);
}

verifyAll();
