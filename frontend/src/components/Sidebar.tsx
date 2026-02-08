import { NavLink } from "react-router-dom";
import {
    MessageSquare,
    Brain,
    Target,
    Search,
    ShieldCheck,
    Activity,
} from "lucide-react";

const navItems = [
    { to: "/", icon: MessageSquare, label: "Command Center" },
    { to: "/idp", icon: Brain, label: "IDP Agent" },
    { to: "/planner", icon: Target, label: "Strategic Planner" },
    { to: "/explorer", icon: Search, label: "Facility Explorer" },
    { to: "/data-integrity", icon: ShieldCheck, label: "Data Integrity" },
];

export default function Sidebar() {
    return (
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen fixed left-0 top-0 z-20">
            {/* Logo */}
            <div className="p-4 border-b border-slate-200">
                <div className="flex items-center gap-2">
                    <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                        <Activity className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-sm font-semibold text-slate-900">Virtue Foundation</h1>
                        <p className="text-xs text-slate-500">Intelligence Platform</p>
                    </div>
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
                            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                isActive
                                    ? "bg-blue-50 text-blue-700"
                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                            }`
                        }
                    >
                        <item.icon className="w-5 h-5" />
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200">
                <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full w-fit">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    System Operational
                </div>
                <p className="text-xs text-slate-400 mt-2">Ghana, West Africa</p>
            </div>
        </aside>
    );
}
