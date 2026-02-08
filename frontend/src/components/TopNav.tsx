import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { Activity, Bell } from "lucide-react";

const navItems = [
    { to: "/", label: "Command Center" },
    { to: "/idp", label: "IDP Agent" },
    { to: "/planner", label: "Strategic Planner" },
    { to: "/explorer", label: "Facility Explorer" },
    { to: "/data-integrity", label: "Data Integrity" },
];

export default function TopNav({ rightSlot }: { rightSlot?: ReactNode }) {
    return (
        <div className="sticky top-0 z-20 bg-white border-b border-slate-200">
            <div className="h-14 px-6 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
                            <Activity className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-sm font-semibold text-slate-900">
                            Virtue Foundation
                            <span className="text-slate-300 mx-2">|</span>
                            <span className="font-medium text-slate-500">Intelligence Platform</span>
                        </div>
                    </div>
                    <nav className="hidden lg:flex items-center gap-1">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                end={item.to === "/"}
                                className={({ isActive }) =>
                                    `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                        isActive
                                            ? "bg-blue-50 text-blue-700"
                                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                    }`
                                }
                            >
                                {item.label}
                            </NavLink>
                        ))}
                    </nav>
                </div>
                <div className="flex items-center gap-2">
                    {rightSlot ?? (
                        <>
                            <span className="hidden md:flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                                System Operational
                            </span>
                            <button className="h-9 w-9 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 flex items-center justify-center">
                                <Bell className="w-4 h-4" />
                            </button>
                            <button className="h-9 px-3 rounded-lg bg-blue-600 text-white text-sm font-medium shadow-sm hover:bg-blue-700">
                                Profile
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
