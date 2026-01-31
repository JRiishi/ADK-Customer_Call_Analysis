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
    ];

    return (
        <div className="flex h-screen bg-[#0f1115] text-white font-sans overflow-hidden">
            {/* Cinematic Sidebar */}
            <aside className="w-20 lg:w-64 flex-shrink-0 border-r border-white/10 bg-[#161920]/80 backdrop-blur-xl flex flex-col transition-all duration-300">
                <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-white/5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-white">
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
                                    ? 'bg-blue-600/10 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)] border border-blue-500/20'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'}
                            `}
                        >
                            {({ isActive }) => (
                                <>
                                    <span className={isActive ? 'text-blue-400' : 'text-gray-400 group-hover:text-white'}>
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
            <main className="flex-1 overflow-y-auto relative z-0">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-[#0f1115] to-[#0f1115] pointer-events-none" />
                <div className="relative z-10 p-6 lg:p-10 min-h-full">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AgentLayout;
