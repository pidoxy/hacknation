import { NavLink } from "react-router-dom";
import {
    MessageSquare,
    Brain,
    Target,
    Search,
    ShieldCheck,
    Activity,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

const navItems = [
    { to: "/", icon: MessageSquare, label: "Command Center" },
    { to: "/idp", icon: Brain, label: "IDP Agent" },
    { to: "/planner", icon: Target, label: "Strategic Planner" },
    { to: "/explorer", icon: Search, label: "Facility Explorer" },
    { to: "/data-integrity", icon: ShieldCheck, label: "Data Integrity" },
];

type SidebarProps = {
    collapsed: boolean;
    onToggle: () => void;
};

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
    return (
        <aside
            className={`bg-white border-r border-slate-200 flex flex-col h-screen fixed left-0 top-0 z-20 transition-[width] duration-200 ${
                collapsed ? "w-16" : "w-52"
            }`}
        >
            {/* Logo */}
            <div className="p-4 border-b border-slate-200 relative">
                <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
                    <div className="flex items-center gap-2">
                        <div className="w-9 h-9 bg-blue-600 rounded-md flex items-center justify-center shadow-sm">
                            <Activity className="w-5 h-5 text-white" />
                        </div>
                        {!collapsed && (
                            <div>
                                <h1 className="text-sm font-semibold text-slate-900">Virtue Foundation</h1>
                                <p className="text-xs text-slate-500">Intelligence Platform</p>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={onToggle}
                        className={`p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 ${
                            collapsed ? "absolute right-2 top-4" : ""
                        }`}
                        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to === "/"}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                                isActive
                                    ? "bg-blue-50 text-blue-700"
                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                            } ${collapsed ? "justify-center" : ""}`
                        }
                        title={item.label}
                        aria-label={item.label}
                    >
                        <item.icon className="w-5 h-5" />
                        {collapsed ? <span className="sr-only">{item.label}</span> : item.label}
                    </NavLink>
                ))}
            </nav>

            {/* Footer */}
            <div className={`p-4 border-t border-slate-200 ${collapsed ? "flex justify-center" : ""}`}>
                <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md w-fit">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    {!collapsed && "System Operational"}
                </div>
                {!collapsed && <p className="text-xs text-slate-400 mt-2">Ghana, West Africa</p>}
            </div>
        </aside>
    );
}
