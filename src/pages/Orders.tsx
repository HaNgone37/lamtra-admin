import React, { useState, useEffect } from "react";
import { Card } from "@/components/Card";
import { supabase } from "@/utils/supabaseClient";
import { Branch, Order } from "@/types";
import { Eye, X, ChevronDown, AlertCircle } from "lucide-react";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface OrderWithDetails extends Order {
  shippingfee: number;
  discountamount: number;
  customername?: string;
  branchname?: string;
}

interface OrderDetail {
  orderdetailid: string;
  orderid: string;
  productid: string;
  sizeid: string;
  quantity: number;
  sugarlevel: string;
  icelevel: string;
  priceatorder: number;
  subtotal: number;
  productname?: string;
  sizename?: string;
}

interface OrderTopping {
  toppingid: string;
  name: string;
  quantity: number;
  price: number;
}

interface EnrichedOrderDetail extends OrderDetail {
  toppings: OrderTopping[];
}

// ============================================================================
// ORDER STATUS CONSTANTS & HELPER FUNCTIONS
// ============================================================================

// Database values MUST match exactly - Chỉ viết hoa chữ cái đầu
const ORDER_STATUSES = {
  CHO_XAC_NHAN: "Chờ xác nhận",
  DANG_LAM: "Đang làm",
  DANG_GIAO: "Đang giao",
  HOAN_THANH: "Hoàn thành",
  HUY: "Hủy",
} as const;

const STATUS_OPTIONS = Object.values(ORDER_STATUSES);

// ============================================================================
// STATUS BADGE COMPONENT
// ============================================================================

const StatusBadge = ({ status }: { status: string }) => {
  let bgColor = "#F4F7FE";
  let textColor = "#2B3674";
  let dotColor = "#2B3674";
  let label = "N/A";

  // Normalize status to display value
  const normalizedStatus = status?.trim() || "";

  switch (normalizedStatus) {
    case "Chờ xác nhận":
      bgColor = "#EBF3FF";
      textColor = "#4318FF";
      dotColor = "#4318FF";
      label = "Chờ xác nhận";
      break;
    case "Đang làm":
      bgColor = "#FFF7E6";
      textColor = "#FF9900";
      dotColor = "#FF9900";
      label = "Đang làm";
      break;
    case "Đang giao":
      bgColor = "#F3E8FF";
      textColor = "#9333EA";
      dotColor = "#9333EA";
      label = "Đang giao";
      break;
    case "Hoàn thành":
      bgColor = "#E6FFFA";
      textColor = "#00A869";
      dotColor = "#00A869";
      label = "Hoàn thành";
      break;
    case "Hủy":
      bgColor = "#FFF5F5";
      textColor = "#C53030";
      dotColor = "#C53030";
      label = "Hủy";
      break;
  }

  return (
    <span
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      <span
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: dotColor }}
      />
      {label}
    </span>
  );
};

// ============================================================================
// MAIN ORDERS COMPONENT
// ============================================================================

export const Orders: React.FC = () => {
  // ==================== STATE ====================
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);

  // Auth/Role
  const role = localStorage.getItem("userRole") || "Staff";
  const userBranchIdStr = localStorage.getItem("userBranchId") || "";
  const userBranchId = userBranchIdStr ? Number(userBranchIdStr) : null;
  const isSuperAdmin = role.toLowerCase().includes("super");

  // Filter states
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedSource, setSelectedSource] = useState<string>("all");

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(
    null,
  );
  const [orderDetails, setOrderDetails] = useState<EnrichedOrderDetail[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Status update modal
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState<string>("Chờ");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Get branch name for display
  const branchDisplay = userBranchId
    ? branches.find((b) => b.branchid === userBranchId)?.name || "Chi nhánh"
    : "Chi nhánh";

  // ==================== INITIALIZE ====================
  useEffect(() => {
    loadBranches();
    // Auto-set branch for non-Super Admin
    if (!isSuperAdmin && userBranchId) {
      setSelectedBranch(String(userBranchId));
    } else {
      setSelectedBranch("all");
    }
  }, [isSuperAdmin, userBranchId]);

  // Auto-load orders when filters change
  useEffect(() => {
    loadOrders();
  }, [selectedBranch, selectedStatus, startDate, endDate]);

  // ==================== LOAD DATA ====================
  const loadBranches = async () => {
    try {
      const { data, error } = await supabase.from("branches").select("*");
      if (error) throw error;
      setBranches(data || []);
    } catch (error) {
      console.error("Error loading branches:", error);
    }
  };

  const loadOrders = async () => {
    try {
      setLoading(true);

      let query = supabase.from("orders").select("*");

      // Filter by branch
      if (!isSuperAdmin && userBranchId) {
        // Manager/Staff: tự động lọc theo chi nhánh của họ
        query = query.eq("branchid", userBranchId);
      } else if (selectedBranch !== "all" && isSuperAdmin) {
        // Super Admin: lọc theo dropdown selection
        query = query.eq("branchid", Number(selectedBranch));
      }

      // Filter by status (all values must match Vietnamese names exactly)
      if (selectedStatus !== "all") {
        query = query.eq("status", selectedStatus);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data && data.length > 0) {
        // Map branch names
        const branchMap = new Map(branches.map((b) => [b.branchid, b.name]));

        // Fetch customer names
        const customerIds = [
          ...new Set(data.map((o) => o.customerid).filter(Boolean)),
        ];
        const { data: customers } = await supabase
          .from("customers")
          .select("customerid, fullname")
          .in("customerid", customerIds.length > 0 ? customerIds : [""]);

        const customerMap = new Map(
          customers?.map((c) => [c.customerid, c.fullname]) || [],
        );

        const enrichedOrders: OrderWithDetails[] = data.map((order) => ({
          ...order,
          branchname: branchMap.get(order.branchid) || "N/A",
          customername: order.customerid
            ? customerMap.get(order.customerid) || "Khách lẻ"
            : "Khách lẻ",
        }));

        setOrders(enrichedOrders);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrderDetails = async (orderId: string) => {
    try {
      setLoadingDetails(true);

      // Fetch order details
      const { data: details, error } = await supabase
        .from("orderdetails")
        .select("*")
        .eq("orderid", orderId);

      if (error) throw error;

      if (details) {
        // Batch fetch product names
        const productIds = [...new Set(details.map((d) => d.productid))];
        const { data: products } = await supabase
          .from("products")
          .select("productid, name")
          .in("productid", productIds);

        // Batch fetch size names
        const sizeIds = [...new Set(details.map((d) => d.sizeid))];
        const { data: sizes } = await supabase
          .from("sizes")
          .select("sizeid, name")
          .in("sizeid", sizeIds);

        const productMap = new Map(
          products?.map((p) => [p.productid, p.name]) || [],
        );
        const sizeMap = new Map(sizes?.map((s) => [s.sizeid, s.name]) || []);

        // Fetch toppings for each detail
        const enrichedDetails: EnrichedOrderDetail[] = [];

        for (const detail of details) {
          const { data: toppingData } = await supabase
            .from("ordertoppings")
            .select("toppingid, quantity")
            .eq("orderdetailid", detail.orderdetailid);

          const toppingIds = toppingData?.map((t) => t.toppingid) || [];
          let toppings: OrderTopping[] = [];

          if (toppingIds.length > 0) {
            const { data: toppingInfo } = await supabase
              .from("toppings")
              .select("toppingid, name, price")
              .in("toppingid", toppingIds);

            const toppingInfoMap = new Map(
              toppingInfo?.map((t) => [
                t.toppingid,
                { name: t.name, price: t.price },
              ]) || [],
            );

            toppings =
              toppingData?.map((t) => ({
                toppingid: t.toppingid,
                name: toppingInfoMap.get(t.toppingid)?.name || "",
                quantity: t.quantity,
                price: toppingInfoMap.get(t.toppingid)?.price || 0,
              })) || [];
          }

          enrichedDetails.push({
            ...detail,
            productname: productMap.get(detail.productid) || "N/A",
            sizename: sizeMap.get(detail.sizeid) || "N/A",
            toppings,
          });
        }

        setOrderDetails(enrichedDetails);
      }
    } catch (error) {
      console.error("Error loading order details:", error);
    } finally {
      setLoadingDetails(false);
    }
  };

  // ==================== HANDLERS ====================
  const handleViewDetails = async (order: OrderWithDetails) => {
    setSelectedOrder(order);
    setNewStatus(order.status || "Chờ xác nhận"); // Initialize with current status
    setShowModal(true);
    await loadOrderDetails(order.orderid);
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder || !newStatus) return;

    if (newStatus === selectedOrder.status) {
      alert("Trạng thái không thay đổi");
      return;
    }

    try {
      setUpdatingStatus(true);

      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("orderid", selectedOrder.orderid);

      if (error) throw error;

      // Refresh and close modal
      await loadOrders();
      setShowStatusModal(false);
      setShowModal(false);
      alert("Cập nhật trạng thái thành công");
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Lỗi khi cập nhật trạng thái");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Apply filters (client-side for dates and status)
  const filteredOrders = orders.filter((order) => {
    const statusMatch =
      selectedStatus === "all" || order.status === selectedStatus;
    const orderDate = new Date(order.orderdate);
    const startDateMatch = !startDate || orderDate >= new Date(startDate);
    const endDateMatch = !endDate || orderDate <= new Date(endDate);
    const sourceMatch =
      selectedSource === "all" ||
      (selectedSource === "online" && order.orderid.startsWith("ORD-")) ||
      (selectedSource === "pos" && order.orderid.startsWith("LT-"));

    return statusMatch && startDateMatch && endDateMatch && sourceMatch;
  });

  // Format date with time
  const formatDateWithTime = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  // ==================== RENDER ====================
  return (
    <div className="space-y-6">
      {/* ============ HEADER ============ */}
      <div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: "#2B3674" }}>
          Quản lý đơn hàng
        </h1>
        {!isSuperAdmin && (
          <p style={{ color: "#8F9CB8" }}>
            Chi nhánh: <strong>{branchDisplay}</strong>
          </p>
        )}
      </div>

      {/* ============ FILTER SECTION ============ */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Branch Filter - Only for Super Admin */}
          {isSuperAdmin && (
            <div>
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: "#2B3674" }}
              >
                Chi nhánh
              </label>
              <div className="relative">
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg text-sm appearance-none pr-10"
                  style={{
                    backgroundColor: "#F4F7FE",
                    color: "#2B3674",
                    border: "1px solid #E0E5F2",
                  }}
                >
                  <option value="all">Tất cả chi nhánh</option>
                  {branches.map((branch) => (
                    <option
                      key={branch.branchid}
                      value={String(branch.branchid)}
                    >
                      {branch.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={18}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none"
                  style={{ color: "#8F9CB8" }}
                />
              </div>
            </div>
          )}

          {/* Status Filter */}
          <div>
            <label
              className="block text-sm font-semibold mb-2"
              style={{ color: "#2B3674" }}
            >
              Trạng thái
            </label>
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-4 py-2 rounded-lg text-sm appearance-none pr-10"
                style={{
                  backgroundColor: "#F4F7FE",
                  color: "#2B3674",
                  border: "1px solid #E0E5F2",
                }}
              >
                <option value="all">Tất cả trạng thái</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={18}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none"
                style={{ color: "#8F9CB8" }}
              />
            </div>
          </div>

          {/* Order Source Filter */}
          <div>
            <label
              className="block text-sm font-semibold mb-2"
              style={{ color: "#2B3674" }}
            >
              Nguồn đơn
            </label>
            <div className="relative">
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="w-full px-4 py-2 rounded-lg text-sm appearance-none pr-10"
                style={{
                  backgroundColor: "#F4F7FE",
                  color: "#2B3674",
                  border: "1px solid #E0E5F2",
                }}
              >
                <option value="all">Tất cả nguồn</option>
                <option value="online">Đơn hàng online</option>
                <option value="pos">Đơn hàng POS</option>
              </select>
              <ChevronDown
                size={18}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none"
                style={{ color: "#8F9CB8" }}
              />
            </div>
          </div>

          {/* Start Date Filter */}
          <div>
            <label
              className="block text-sm font-semibold mb-2"
              style={{ color: "#2B3674" }}
            >
              Từ ngày
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 rounded-lg text-sm"
              style={{
                backgroundColor: "#F4F7FE",
                color: "#2B3674",
                border: "1px solid #E0E5F2",
              }}
            />
          </div>

          {/* End Date Filter */}
          <div>
            <label
              className="block text-sm font-semibold mb-2"
              style={{ color: "#2B3674" }}
            >
              Đến ngày
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 rounded-lg text-sm"
              style={{
                backgroundColor: "#F4F7FE",
                color: "#2B3674",
                border: "1px solid #E0E5F2",
              }}
            />
          </div>
        </div>
      </Card>

      {/* ============ ORDERS TABLE ============ */}
      <Card>
        {loading ? (
          <div className="text-center py-12" style={{ color: "#8F9CB8" }}>
            Đang tải dữ liệu...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12" style={{ color: "#8F9CB8" }}>
            Không tìm thấy đơn hàng
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid #E0E5F2" }}>
                  <th
                    className="text-left py-3 px-4 text-sm font-semibold"
                    style={{ color: "#2B3674" }}
                  >
                    Mã đơn
                  </th>
                  <th
                    className="text-left py-3 px-4 text-sm font-semibold"
                    style={{ color: "#2B3674" }}
                  >
                    Khách hàng
                  </th>
                  <th
                    className="text-left py-3 px-4 text-sm font-semibold"
                    style={{ color: "#2B3674" }}
                  >
                    Chi nhánh
                  </th>
                  <th
                    className="text-left py-3 px-4 text-sm font-semibold"
                    style={{ color: "#2B3674" }}
                  >
                    Tổng tiền
                  </th>
                  <th
                    className="text-left py-3 px-4 text-sm font-semibold"
                    style={{ color: "#2B3674" }}
                  >
                    Trạng thái
                  </th>
                  <th
                    className="text-left py-3 px-4 text-sm font-semibold"
                    style={{ color: "#2B3674" }}
                  >
                    Ngày
                  </th>
                  <th
                    className="text-left py-3 px-4 text-sm font-semibold"
                    style={{ color: "#2B3674" }}
                  >
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr
                    key={order.orderid}
                    style={{ borderBottom: "1px solid #E0E5F2" }}
                  >
                    <td
                      className="py-3 px-4 text-sm"
                      style={{ color: "#2B3674" }}
                    >
                      <strong>{order.orderid}</strong>
                    </td>
                    <td
                      className="py-3 px-4 text-sm"
                      style={{ color: "#2B3674" }}
                    >
                      {order.customername}
                    </td>
                    <td
                      className="py-3 px-4 text-sm"
                      style={{ color: "#2B3674" }}
                    >
                      {order.branchname}
                    </td>
                    <td
                      className="py-3 px-4 text-sm"
                      style={{ color: "#2B3674" }}
                    >
                      {order.finalamount?.toLocaleString("vi-VN")}₫
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <StatusBadge status={order.status} />
                    </td>
                    <td
                      className="py-3 px-4 text-sm"
                      style={{ color: "#2B3674" }}
                    >
                      {formatDateWithTime(order.orderdate)}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <button
                        onClick={() => handleViewDetails(order)}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-white text-xs font-semibold hover:opacity-80"
                        style={{ backgroundColor: "#4318FF" }}
                      >
                        <Eye size={14} />
                        Xem
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ============ MODAL - ORDER DETAILS ============ */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-screen overflow-y-auto">
            {/* ---- Modal Header ---- */}
            <div
              className="flex items-center justify-between p-6 border-b"
              style={{ borderColor: "#E0E5F2" }}
            >
              <h2 className="text-xl font-bold" style={{ color: "#2B3674" }}>
                Chi tiết đơn hàng: {selectedOrder.orderid}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} style={{ color: "#8F9CB8" }} />
              </button>
            </div>

            {/* ---- Modal Content ---- */}
            <div className="p-6 space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm" style={{ color: "#8F9CB8" }}>
                    Khách hàng
                  </p>
                  <p className="font-semibold" style={{ color: "#2B3674" }}>
                    {selectedOrder.customername}
                  </p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: "#8F9CB8" }}>
                    Chi nhánh
                  </p>
                  <p className="font-semibold" style={{ color: "#2B3674" }}>
                    {selectedOrder.branchname}
                  </p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: "#8F9CB8" }}>
                    Trạng thái hiện tại
                  </p>
                  <StatusBadge status={selectedOrder.status} />
                </div>
                <div>
                  <p className="text-sm" style={{ color: "#8F9CB8" }}>
                    Ngày đặt
                  </p>
                  <p className="font-semibold" style={{ color: "#2B3674" }}>
                    {formatDateWithTime(selectedOrder.orderdate)}
                  </p>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-bold mb-3" style={{ color: "#2B3674" }}>
                  Sản phẩm trong đơn
                </h3>
                {loadingDetails ? (
                  <p style={{ color: "#8F9CB8" }}>Đang tải...</p>
                ) : (
                  <div className="space-y-2">
                    {orderDetails.map((detail) => (
                      <div
                        key={detail.orderdetailid}
                        className="p-3 rounded-lg"
                        style={{ backgroundColor: "#F4F7FE" }}
                      >
                        <p
                          className="font-semibold"
                          style={{ color: "#2B3674" }}
                        >
                          {detail.productname} ({detail.quantity}x)
                        </p>
                        <p className="text-sm" style={{ color: "#8F9CB8" }}>
                          Size: {detail.sizename} | Mức đường:{" "}
                          {detail.sugarlevel} | Mức đá: {detail.icelevel}
                        </p>
                        {detail.toppings.length > 0 && (
                          <p className="text-sm" style={{ color: "#8F9CB8" }}>
                            Topping:{" "}
                            {detail.toppings
                              .map((t) => `${t.name} (${t.quantity})`)
                              .join(", ")}
                          </p>
                        )}
                        <p
                          className="font-semibold text-sm"
                          style={{ color: "#4318FF" }}
                        >
                          {detail.subtotal?.toLocaleString("vi-VN")}₫
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Totals */}
              <div className="border-t pt-4" style={{ borderColor: "#E0E5F2" }}>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p style={{ color: "#8F9CB8" }}>Tổng tiền hàng</p>
                    <p className="font-semibold" style={{ color: "#2B3674" }}>
                      {selectedOrder.totalamount?.toLocaleString("vi-VN")}₫
                    </p>
                  </div>
                  <div>
                    <p style={{ color: "#8F9CB8" }}>Giảm giá</p>
                    <p className="font-semibold" style={{ color: "#2B3674" }}>
                      -{selectedOrder.discountamount?.toLocaleString("vi-VN")}₫
                    </p>
                  </div>
                  <div>
                    <p style={{ color: "#8F9CB8" }}>Phí giao hàng</p>
                    <p className="font-semibold" style={{ color: "#2B3674" }}>
                      {selectedOrder.shippingfee?.toLocaleString("vi-VN")}₫
                    </p>
                  </div>
                  <div>
                    <p style={{ color: "#8F9CB8" }}>Thành tiền</p>
                    <p
                      className="font-bold text-lg"
                      style={{ color: "#4318FF" }}
                    >
                      {selectedOrder.finalamount?.toLocaleString("vi-VN")}₫
                    </p>
                  </div>
                </div>
              </div>

              {/* ---- Super Admin Only: Status Update Section ---- */}
              {isSuperAdmin && (
                <div
                  className="p-4 rounded-lg border-l-4"
                  style={{ backgroundColor: "#F4F7FE", borderColor: "#4318FF" }}
                >
                  <div className="flex items-start gap-2 mb-3">
                    <AlertCircle
                      size={16}
                      style={{ color: "#4318FF", marginTop: "2px" }}
                    />
                    <p
                      className="text-xs font-semibold"
                      style={{ color: "#2B3674" }}
                    >
                      Super Admin - Quyền cập nhật trạng thái
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label
                        className="block text-sm font-semibold mb-2"
                        style={{ color: "#2B3674" }}
                      >
                        Cập nhật trạng thái
                      </label>
                      <div className="relative">
                        <select
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value)}
                          disabled={updatingStatus}
                          className="w-full px-4 py-2 rounded-lg text-sm appearance-none pr-10 disabled:opacity-50"
                          style={{
                            backgroundColor: "#FFFFFF",
                            color: "#2B3674",
                            border: "1px solid #E0E5F2",
                          }}
                        >
                          {STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          size={18}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none"
                          style={{ color: "#8F9CB8" }}
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => setShowStatusModal(true)}
                      disabled={
                        updatingStatus || newStatus === selectedOrder.status
                      }
                      className="w-full px-4 py-2 rounded-lg font-semibold text-white disabled:opacity-50 hover:opacity-90"
                      style={{ backgroundColor: "#4318FF" }}
                    >
                      {updatingStatus
                        ? "Đang cập nhật..."
                        : "Cập nhật trạng thái"}
                    </button>
                  </div>
                </div>
              )}

              {/* ---- Modal Footer Actions ---- */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg font-semibold text-white"
                  style={{ backgroundColor: "#4318FF" }}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ STATUS CONFIRMATION MODAL ============ */}
      {showStatusModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full">
            {/* Header */}
            <div
              className="flex items-center justify-between p-6 border-b"
              style={{ borderColor: "#E0E5F2" }}
            >
              <h2 className="text-lg font-bold" style={{ color: "#2B3674" }}>
                Xác nhận cập nhật trạng thái
              </h2>
              <button
                onClick={() => setShowStatusModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} style={{ color: "#8F9CB8" }} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Mã đơn:</strong> {selectedOrder.orderid}
                </p>
                <p className="text-sm text-gray-700 mt-2">
                  <strong>Trạng thái cũ:</strong>{" "}
                  <span style={{ color: "#8F9CB8" }}>
                    {selectedOrder.status}
                  </span>
                </p>
                <p className="text-sm text-gray-700 mt-2">
                  <strong>Trạng thái mới:</strong>{" "}
                  <span style={{ color: "#4318FF", fontWeight: "bold" }}>
                    {newStatus}
                  </span>
                </p>
              </div>

              <p className="text-sm" style={{ color: "#8F9CB8" }}>
                Bạn có chắc chắn muốn thay đổi trạng thái đơn hàng này?
              </p>
            </div>

            {/* Actions */}
            <div
              className="flex gap-3 p-6 border-t"
              style={{ borderColor: "#E0E5F2" }}
            >
              <button
                onClick={() => setShowStatusModal(false)}
                disabled={updatingStatus}
                className="flex-1 px-4 py-2 rounded-lg font-semibold border disabled:opacity-50"
                style={{ borderColor: "#E0E5F2", color: "#2B3674" }}
              >
                Hủy
              </button>
              <button
                onClick={handleUpdateStatus}
                disabled={updatingStatus}
                className="flex-1 px-4 py-2 rounded-lg font-semibold text-white disabled:opacity-50"
                style={{ backgroundColor: "#4318FF" }}
              >
                {updatingStatus ? "Đang cập nhật..." : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
