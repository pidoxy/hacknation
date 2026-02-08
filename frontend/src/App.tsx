import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Sidebar from "@/components/Sidebar";
import CommandCenter from "@/features/command-center/CommandCenter";
import IDPAgentView from "@/features/idp-agent/IDPAgentView";
import StrategicPlanner from "@/features/strategic-planner/StrategicPlanner";
import FacilityExplorer from "@/features/facility-explorer/FacilityExplorer";
import DataIntegrity from "@/features/data-integrity/DataIntegrity";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000,
            retry: 1,
        },
    },
});

export default function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <div className="flex">
                    <Sidebar />
                    <main className="ml-64 flex-1">
                        <Routes>
                            <Route path="/" element={<CommandCenter />} />
                            <Route path="/idp" element={<IDPAgentView />} />
                            <Route path="/planner" element={<StrategicPlanner />} />
                            <Route path="/explorer" element={<FacilityExplorer />} />
                            <Route path="/data-integrity" element={<DataIntegrity />} />
                        </Routes>
                    </main>
                </div>
            </BrowserRouter>
        </QueryClientProvider>
    );
}
