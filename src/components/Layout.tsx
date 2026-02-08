import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";


export const Layout = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Derived active tab from path (removing leading slash)
    const activeTab = location.pathname.slice(1) || "dashboard";

    const handleTabChange = (id: string) => {
        // Handle "dashboard" explicitly to go to root/dashboard
        if (id === "dashboard") navigate("/");
        else navigate(`/${id}`);
    };

    return (
        <div className="flex h-screen w-screen bg-[var(--bg-app)] text-[var(--text-main)] overflow-hidden font-sans">
            <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />
            <main className="flex-1 relative overflow-y-auto bg-[var(--bg-app)]">
                <Outlet />
            </main>
        </div>
    );
};
