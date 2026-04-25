import VerticalSidebar from "./VerticalSidebar";
import MobileBottomNav from "./MobileBottomNav";
import { Outlet } from "react-router-dom";

export default function DashboardLayout({ isAdmin }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <VerticalSidebar isAdmin={isAdmin} />
      {/* Sidebar offset: always collapsed width (4rem = 16) on desktop */}
      <div className="lg:ml-16 transition-all duration-300 min-h-screen pb-24 lg:pb-0">
        <Outlet />
      </div>
      <MobileBottomNav isAdmin={isAdmin} />
    </div>
  );
}
