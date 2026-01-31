import React from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { LayoutDashboard, Phone, BarChart2, CheckCircle, LogOut, Users } from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, path, active }) => (
    <Link to={path} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${active ? 'bg-primary/10 text-primary border border-primary/20 shadow-lg shadow-primary/5' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
        <Icon className={`w-5 h-5 ${active ? 'text-primary' : 'group-hover:text-white'}`} />
        <span className="font-medium tracking-wide">{label}</span>
        {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(59,130,246,0.5)]" />}
    </Link>
);

const MainLayout = () => {
    const location = useLocation();

    const navItems = [
        { label: 'Agent Console', icon: Phone, path: '/' },
        { label: 'Supervisor Dashboard', icon: Users, path: '/dashboard' },
        { label: 'Coaching Hub', icon: BarChart2, path: '/analytics' },
        { label: 'Post-Call Analysis', icon: CheckCircle, path: '/analysis' },
    ];

    return (
        <div className="flex h-screen bg-obsidian-900 overflow-hidden font-sans text-gray-100 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-obsidian-900 to-black">
            {/* Sidebar */}
            <aside className="w-72 bg-obsidian-800/50 backdrop-blur-xl border-r border-white/5 flex flex-col relative z-20">
                <div className="p-8 pb-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/20">
                            <span className="font-bold text-white text-lg">C</span>
                        </div>
                        <h1 className="text-xl font-bold tracking-tight text-white">Cognivista<span className="text-primary font-light">QA</span></h1>
                    </div>
                    <p className="text-xs text-gray-500 font-mono pl-10">V2.0 ENTERPRISE BETA</p>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-1">
                    {navItems.map((item) => (
                        <SidebarItem
                            key={item.path}
                            {...item}
                            active={location.pathname === item.path}
                        />
                    ))}
                </nav>

                <div className="p-4 mt-auto">
                    <button className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 relative flex flex-col overflow-hidden">
                {/* Top Header - Glass */}
                <header className="h-16 px-8 flex items-center justify-between bg-obsidian-900/50 backdrop-blur-sm border-b border-white/5 z-10">
                    <div className="flex items-center gap-4">
                        <h2 className="text-lg font-medium text-white/90">
                            {navItems.find(i => i.path === location.pathname)?.label || 'Dashboard'}
                        </h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-xs font-medium text-green-400">System Core Online</span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 border border-white/10 ring-2 ring-transparent hover:ring-primary/50 transition-all cursor-pointer" />
                    </div>
                </header>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-8 relative">
                    {/* Subtle background glow effect */}
                    <div className="absolute top-0 left-0 w-full h-[500px] bg-primary/5 blur-[120px] pointer-events-none rounded-full transform -translate-y-1/2 translate-x-1/4" />

                    <div className="relative z-10 max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default MainLayout;
