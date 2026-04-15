import { useState, useEffect } from "react";
import { Eye, EyeOff, Trash2 } from "lucide-react";
import { feedbackService } from "@/services/feedbackService";
import { Feedback } from "@/types";
import Toast from "@/components/Toast";

interface ToastMessage {
  id: string;
  message: string;
  type: "success" | "error";
}

const colors = {
  primary: "#4318FF",
  text: "#2B3674",
  textLight: "#8F9CB8",
  border: "#E0E5F2",
  success: "#05B75D",
  error: "#F3685A",
  background: "#F3F4F6",
  lightBg: "#F4F7FE",
};

export default function FeedbacksPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(false);
  const [toastMessages, setToastMessages] = useState<ToastMessage[]>([]);
  const [filterVisible, setFilterVisible] = useState<
    "all" | "visible" | "hidden"
  >("all");

  // ===== Initialize =====
  useEffect(() => {
    loadFeedbacks();
  }, []);

  // ===== Load Feedbacks =====
  const loadFeedbacks = async () => {
    try {
      setLoading(true);
      const data = await feedbackService.getFeedbacks();
      setFeedbacks(data);
    } catch (error) {
      console.error("Error loading feedbacks:", error);
      addToast("Lỗi tải feedback", "error");
    } finally {
      setLoading(false);
    }
  };

  // ===== Filter Feedbacks =====
  const filteredFeedbacks = feedbacks.filter((feedback) => {
    if (filterVisible === "visible") return feedback.is_visible;
    if (filterVisible === "hidden") return !feedback.is_visible;
    return true;
  });

  // ===== Toggle Visibility =====
  const handleToggleVisibility = async (id: string, currentStatus: boolean) => {
    try {
      setLoading(true);
      const newStatus = !currentStatus; // Chuyển sang trạng thái đối lập
      await feedbackService.setVisibility(id, newStatus);

      // Update local state
      setFeedbacks(
        feedbacks.map((f) =>
          f.id === id ? { ...f, is_visible: newStatus } : f,
        ),
      );

      addToast(`Đã ${newStatus ? "hiển thị" : "ẩn"} feedback`, "success");
    } catch (error) {
      console.error("Error toggling visibility:", error);
      addToast("Lỗi cập nhật trạng thái", "error");
    } finally {
      setLoading(false);
    }
  };

  // ===== Delete Feedback =====
  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn chắc chắn muốn xóa feedback này?")) return;

    try {
      setLoading(true);
      await feedbackService.deleteFeedback(id);
      setFeedbacks(feedbacks.filter((f) => f.id !== id));
      addToast("Xóa feedback thành công", "success");
    } catch (error) {
      console.error("Error deleting feedback:", error);
      addToast("Lỗi xóa feedback", "error");
    } finally {
      setLoading(false);
    }
  };

  // ===== Toast Management =====
  const addToast = (message: string, type: "success" | "error") => {
    const id = Date.now().toString();
    setToastMessages((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToastMessages((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  // ===== Format Date =====
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div style={{ padding: "24px" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1
          style={{
            color: colors.text,
            fontSize: "32px",
            fontWeight: "700",
            margin: 0,
          }}
        >
          Quản lý Feedbacks
        </h1>
        <p
          style={{
            color: colors.textLight,
            fontSize: "14px",
            margin: "8px 0 0 0",
          }}
        >
          Xem, quản lý và lật ngược trạng thái hiển thị của feedback từ khách
          hàng
        </p>
      </div>

      {/* Filter Tabs */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "24px",
          flexWrap: "wrap",
        }}
      >
        {[
          { key: "all", label: "Tất cả" },
          { key: "visible", label: "Hiển thị" },
          { key: "hidden", label: "Ẩn" },
        ].map((filter) => (
          <button
            key={filter.key}
            onClick={() => setFilterVisible(filter.key as any)}
            style={{
              padding: "8px 16px",
              border: "none",
              borderRadius: "20px",
              background:
                filterVisible === filter.key
                  ? colors.primary
                  : colors.background,
              color: filterVisible === filter.key ? "white" : colors.text,
              cursor: "pointer",
              fontWeight: filterVisible === filter.key ? "600" : "500",
              fontSize: "14px",
              transition: "all 0.3s ease",
            }}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            background: "white",
            borderRadius: "12px",
            padding: "16px",
            border: `1px solid ${colors.border}`,
          }}
        >
          <p
            style={{
              margin: "0 0 8px 0",
              color: colors.textLight,
              fontSize: "12px",
              fontWeight: "600",
            }}
          >
            TỔNG FEEDBACK
          </p>
          <p
            style={{
              margin: 0,
              color: colors.text,
              fontSize: "24px",
              fontWeight: "700",
            }}
          >
            {feedbacks.length}
          </p>
        </div>
        <div
          style={{
            background: "white",
            borderRadius: "12px",
            padding: "16px",
            border: `1px solid ${colors.border}`,
          }}
        >
          <p
            style={{
              margin: "0 0 8px 0",
              color: colors.textLight,
              fontSize: "12px",
              fontWeight: "600",
            }}
          >
            HIỂN THỊ
          </p>
          <p
            style={{
              margin: 0,
              color: colors.success,
              fontSize: "24px",
              fontWeight: "700",
            }}
          >
            {feedbacks.filter((f) => f.is_visible).length}
          </p>
        </div>
        <div
          style={{
            background: "white",
            borderRadius: "12px",
            padding: "16px",
            border: `1px solid ${colors.border}`,
          }}
        >
          <p
            style={{
              margin: "0 0 8px 0",
              color: colors.textLight,
              fontSize: "12px",
              fontWeight: "600",
            }}
          >
            ẨN
          </p>
          <p
            style={{
              margin: 0,
              color: colors.error,
              fontSize: "24px",
              fontWeight: "700",
            }}
          >
            {feedbacks.filter((f) => !f.is_visible).length}
          </p>
        </div>
      </div>

      {/* Table Container */}
      <div
        style={{
          background: "white",
          borderRadius: "20px",
          border: `1px solid ${colors.border}`,
          boxShadow: "rgba(112, 144, 176, 0.08) 0px 18px 40px",
          overflow: "hidden",
        }}
      >
        {/* Loading State */}
        {loading && (
          <div
            style={{
              padding: "40px",
              textAlign: "center",
              color: colors.textLight,
            }}
          >
            <p>Đang xử lý...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredFeedbacks.length === 0 && (
          <div
            style={{
              padding: "40px",
              textAlign: "center",
              color: colors.textLight,
            }}
          >
            <p style={{ margin: 0 }}>Không có feedback nào</p>
          </div>
        )}

        {/* Table */}
        {!loading && filteredFeedbacks.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "14px",
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: `1px solid ${colors.border}`,
                    background: colors.lightBg,
                  }}
                >
                  <th
                    style={{
                      padding: "16px",
                      textAlign: "left",
                      fontWeight: "600",
                      color: colors.text,
                      minWidth: "200px",
                    }}
                  >
                    Người gửi
                  </th>
                  <th
                    style={{
                      padding: "16px",
                      textAlign: "left",
                      fontWeight: "600",
                      color: colors.text,
                      minWidth: "300px",
                    }}
                  >
                    Nội dung
                  </th>
                  <th
                    style={{
                      padding: "16px",
                      textAlign: "left",
                      fontWeight: "600",
                      color: colors.text,
                      minWidth: "180px",
                    }}
                  >
                    Thời gian gửi
                  </th>
                  <th
                    style={{
                      padding: "16px",
                      textAlign: "center",
                      fontWeight: "600",
                      color: colors.text,
                      minWidth: "150px",
                    }}
                  >
                    Trạng thái
                  </th>
                  <th
                    style={{
                      padding: "16px",
                      textAlign: "center",
                      fontWeight: "600",
                      color: colors.text,
                      minWidth: "80px",
                    }}
                  >
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredFeedbacks.map((feedback, index) => (
                  <tr
                    key={feedback.id}
                    style={{
                      borderBottom: `1px solid ${colors.border}`,
                      background: index % 2 === 0 ? "white" : colors.lightBg,
                      transition: "background-color 0.2s ease",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = colors.lightBg;
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background =
                        index % 2 === 0 ? "white" : colors.lightBg;
                    }}
                  >
                    <td
                      style={{
                        padding: "16px",
                        color: colors.text,
                        fontWeight: "500",
                      }}
                    >
                      {feedback.displayname}
                    </td>
                    <td
                      style={{
                        padding: "16px",
                        color: colors.text,
                        maxWidth: "300px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {feedback.content}
                    </td>
                    <td
                      style={{
                        padding: "16px",
                        color: colors.textLight,
                        fontSize: "13px",
                      }}
                    >
                      {formatDate(feedback.createdat)}
                    </td>
                    <td
                      style={{
                        padding: "16px",
                        textAlign: "center",
                      }}
                    >
                      <button
                        onClick={() =>
                          handleToggleVisibility(
                            feedback.id,
                            feedback.is_visible,
                          )
                        }
                        disabled={loading}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "8px 12px",
                          border: "none",
                          borderRadius: "8px",
                          background: feedback.is_visible
                            ? colors.success
                            : colors.error,
                          color: "white",
                          cursor: loading ? "not-allowed" : "pointer",
                          fontWeight: "500",
                          fontSize: "12px",
                          transition: "opacity 0.3s ease",
                          opacity: loading ? 0.6 : 1,
                        }}
                      >
                        {feedback.is_visible ? (
                          <>
                            <Eye size={14} />
                            Hiện
                          </>
                        ) : (
                          <>
                            <EyeOff size={14} />
                            Ẩn
                          </>
                        )}
                      </button>
                    </td>
                    <td
                      style={{
                        padding: "16px",
                        textAlign: "center",
                      }}
                    >
                      <button
                        onClick={() => handleDelete(feedback.id)}
                        disabled={loading}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "36px",
                          height: "36px",
                          border: "none",
                          borderRadius: "8px",
                          background: "transparent",
                          color: colors.error,
                          cursor: loading ? "not-allowed" : "pointer",
                          transition: "background-color 0.3s ease",
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.background = "#FFE8E8";
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = "transparent";
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Toast Messages */}
      {toastMessages.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() =>
            setToastMessages((prev) => prev.filter((t) => t.id !== toast.id))
          }
        />
      ))}
    </div>
  );
}
