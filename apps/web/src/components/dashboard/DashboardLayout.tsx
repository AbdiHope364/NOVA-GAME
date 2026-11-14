import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { ArrowUp } from 'lucide-react';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardHeader } from './DashboardHeader';
import { MobileBottomNavigation } from './MobileBottomNavigation';

export const DashboardLayout: React.FC = () => {
  const { pathname } = useLocation();
  const { isAuthenticated } = useAuthStore();
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('nova_sidebar_collapsed') === 'true';
  });
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadNotifications(0);
      return;
    }
    api
      .get('/dashboard/notifications')
      .then((res) => {
        if (res.data?.data) {
          setUnreadNotifications(Number(res.data.data.unreadCount || 0));
        }
      })
      .catch(() => {});
  }, [isAuthenticated, pathname]);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 220);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('nova_sidebar_collapsed', String(next));
      return next;
    });
  };

  return (
    <div className="min-h-screen w-full bg-[#11101D] text-white flex selection:bg-[#8B5CF6] selection:text-white overflow-x-clip">
      <DashboardSidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebar}
        unreadNotifications={unreadNotifications}
      />

      <div className="flex-1 flex flex-col min-w-0 w-full">
        <DashboardHeader
          unreadNotifications={unreadNotifications}
          onUnreadCountChange={setUnreadNotifications}
        />

        {/* Full-screen edge-to-edge dashboard workspace */}
        <main className="flex-1 w-full px-3 sm:px-5 lg:px-6 py-4 sm:py-5 pb-mobile-nav">
          <Outlet />
        </main>
      </div>

      {showScrollTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Scroll to top"
          className="fixed bottom-20 md:bottom-6 right-4 z-30 w-10 h-10 rounded-full bg-[#8B5CF6] hover:bg-violet-500 text-white shadow-xl flex items-center justify-center transition-colors cursor-pointer"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}

      <MobileBottomNavigation unreadNotifications={unreadNotifications} />
    </div>
  );
};
