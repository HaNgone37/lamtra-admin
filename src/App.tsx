import { useState, useEffect } from "react";
import { useAuth } from "@/services/AuthContext";
import { Layout } from "@/components/Layout";
import { Sidebar } from "@/components/Sidebar";
import { BaristaLayout } from "@/components/BaristaLayout";
import { Login } from "@/pages/Login";
import { Dashboard } from "@/components/Dashboard";
import { Products } from "@/pages/Products";
import { Orders } from "@/pages/Orders";
import Employees from "@/pages/Employees";
import { Settings } from "@/pages/Settings";
import { Branches } from "@/pages/Branches";
import Vouchers from "@/pages/Vouchers";
import Inventory from "@/pages/Inventory";
import NewsPage from "@/pages/News";
import FeedbacksPage from "@/pages/Feedbacks";
import AnalyticsPage from "@/pages/Analytics";
import CustomersPage from "@/pages/Customers";
import { supabase } from "@/utils/supabaseClient";
import { Branch } from "@/types";

function App() {
  const { user, loading, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [branchInfo, setBranchInfo] = useState<Branch | null>(null);

  // Fetch branch info if user has branchid
  useEffect(() => {
    if (user?.branchid && user?.branchid !== "") {
      fetchBranchInfo(String(user.branchid));
    }
  }, [user?.branchid]);

  const fetchBranchInfo = async (branchId: string) => {
    try {
      const { data } = await supabase
        .from("branches")
        .select("*")
        .eq("branchid", branchId)
        .single();

      if (data) {
        setBranchInfo(data);
      }
    } catch (error) {
      console.error("Error fetching branch info:", error);
    }
  };

  if (loading) {
    return (
      <div
        className="w-screen h-screen flex items-center justify-center"
        style={{ backgroundColor: "#F4F7FE" }}
      >
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl mb-4">
            <span className="text-3xl animate-bounce">⏳</span>
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: "#2B3674" }}>
            LAM TRÀ
          </h1>
          <p className="text-gray-600">Đang khởi động hệ thống...</p>
        </div>
      </div>
    );
  }

  // Nếu chưa đăng nhập, hiển thị Login page
  if (!user) {
    return <Login />;
  }

  // Phân luồng theo role: Staff → BaristaLayout, Admin/Manager → AdminLayout
  const isStaff = user.role?.toLowerCase() === "staff";

  if (isStaff) {
    return <BaristaLayout onLogout={logout} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard />;
      case "products":
        return <Products />;
      // case 'branchmenu':
      //   return <BranchProductStatus branchId={user.branchid} branchName={branchInfo?.name || 'Chi nhánh'} />
      case "orders":
        return <Orders />;
      case "branches":
        return <Branches />;
      case "employees":
        return <Employees />;
      case "inventory":
        return <Inventory />;
      case "analytics":
        return <AnalyticsPage />;
      case "customers":
        return <CustomersPage />;
      case "news":
        return <NewsPage />;
      case "feedbacks":
        return <FeedbacksPage />;
      case "vouchers":
        return <Vouchers />;
      case "settings":
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen" style={{ backgroundColor: "#F4F7FE" }}>
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        userRole={user.role}
        branchName={branchInfo?.name || "Chi nhánh chính"}
        onLogout={logout}
      />

      <Layout
        sidebarOpen={sidebarOpen}
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        userName={user.name}
        userRole={user.role}
        branchName={branchInfo?.name || "Chi nhánh chính"}
      >
        {renderPage()}
      </Layout>
    </div>
  );
}

export default App;
