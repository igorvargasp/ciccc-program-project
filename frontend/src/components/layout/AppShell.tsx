import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileNav from './MobileNav';

export default function AppShell() {
  return (
    <div className="flex min-h-screen bg-app">
      {/* Desktop sidebar — fixed, 208 px wide */}
      <Sidebar />

      {/* Content column — offset by sidebar on lg+ */}
      <div className="flex flex-col flex-1 min-w-0 lg:pl-52">
        <Header />
        <main className="flex-1 px-4 py-6 md:px-6 pb-24 lg:pb-8 max-w-screen-xl mx-auto w-full">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <MobileNav />
    </div>
  );
}
