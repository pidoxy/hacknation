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
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen fixed left-0 top-0 z-10">
            {/* Logo */}
            <div className="p-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Activity className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-gray-900">Virtue Foundation</h1>
                        <p className="text-xs text-gray-500">Intelligence Platform</p>
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
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            }`
                        }
                    >
                        <item.icon className="w-5 h-5" />
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-xs text-gray-500">System Operational</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Ghana, West Africa</p>
            </div>
        </aside>
    );
}
