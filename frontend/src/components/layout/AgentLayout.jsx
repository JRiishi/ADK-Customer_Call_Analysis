import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, PhoneCall, Users, BookOpen, BarChart3, Settings, ShieldAlert } from 'lucide-react';

const AgentLayout = () => {
    const navItems = [
        { path: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
        { path: "/console", label: "Live Assist", icon: <PhoneCall size={20} /> },
        { path: "/supervisor", label: "Supervisor", icon: <ShieldAlert size={20} /> },
        { path: "/manager", label: "Manager", icon: <BarChart3 size={20} /> },
        { path: "/coaching", label: "Coaching", icon: <Users size={20} /> },
        { path: "/sops", label: "SOPs", icon: <BookOpen size={20} /> },
        { path: "/profile", label: "My Profile", icon: <Users size={20} /> }, // Re-using icon for now or use User if imported
    ];

    return (
        <div className="flex h-screen bg-[#0f1115] text-white font-sans overflow-hidden">
            {/* Cinematic Sidebar */}
            <aside className="w-20 lg:w-64 flex-shrink-0 border-r border-white/10 bg-[#161920]/80 backdrop-blur-xl flex flex-col transition-all duration-300">
                <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-white/5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center font-bold text-white">
                        C
                    </div>
                    <span className="ml-3 font-semibold text-lg hidden lg:block tracking-wide">Cognivista</span>
                </div>

                <nav className="flex-1 py-6 space-y-2 px-3">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `
                                flex items-center px-3 py-3 rounded-xl transition-all duration-200 group
                                ${isActive
                                    ? 'bg-cyan-600/10 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)] border border-cyan-500/20'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'}
                            `}
                        >
                            {({ isActive }) => (
                                <>
                                    <span className={isActive ? 'text-cyan-400' : 'text-gray-400 group-hover:text-white'}>
                                        {item.icon}
                                    </span>
                                    <span className="ml-3 font-medium hidden lg:block">{item.label}</span>
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-white/5">
                    <button className="flex items-center w-full px-3 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                        <Settings size={20} />
                        <span className="ml-3 font-medium hidden lg:block">Settings</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto overflow-x-hidden relative z-0">
                <div className="fixed inset-0 left-20 lg:left-64 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/10 via-[#0f1115] to-[#0f1115] pointer-events-none" />
                <div className="relative z-10 w-full p-6 lg:p-10 pb-16">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AgentLayout;
