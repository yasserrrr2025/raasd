import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, PlusCircle, LayoutDashboard } from 'lucide-react';

export const Layout = () => {
  const location = useLocation();
  const isPrint = location.pathname.includes('/report');

  if (isPrint) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      <header className="bg-white shadow-sm border-b border-gray-200 no-print sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
            <img 
              src="https://upload.wikimedia.org/wikipedia/ar/1/17/Saudi_Ministry_of_Education_Logo_2025.png" 
              alt="شعار وزارة التعليم" 
              className="h-10 object-contain" 
            />
            <div>
              <h1 className="text-xl font-bold text-[#007A66]">رصد</h1>
              <p className="text-xs text-gray-500 hidden sm:block">منصة تحليل نتائج الاختبارات المركزية</p>
            </div>
          </Link>
          <nav className="flex items-center gap-2">
            <Link 
              to="/" 
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/' ? 'bg-[#007A66]/10 text-[#007A66]' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <LayoutDashboard size={18} />
              <span className="hidden sm:inline">المشاريع</span>
            </Link>
            <Link 
              to="/setup" 
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#007A66] text-white hover:bg-[#005F4F] transition-colors"
            >
              <PlusCircle size={18} />
              <span className="hidden sm:inline">تقرير جديد</span>
            </Link>
          </nav>
        </div>
      </header>
      
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-gray-200 py-6 mt-auto no-print">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          تطوير وبرمجة بواسطة ياسر الهذلي
        </div>
      </footer>
    </div>
  );
};
