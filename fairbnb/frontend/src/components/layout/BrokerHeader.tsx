export default function BrokerHeader() {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
      <div className="flex items-center md:hidden">
        <span className="font-bold text-lg text-purple-600">FairBnB Broker</span>
      </div>
      <div className="hidden md:block">
        <h2 className="text-lg font-medium text-gray-800">Broker Portal</h2>
      </div>
      <div className="flex items-center gap-4">
        <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold">
          B
        </div>
      </div>
    </header>
  );
}
