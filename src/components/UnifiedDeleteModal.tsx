import React, { useState, useEffect } from "react";
import type { DependencyCheckResult } from "@/utils/dependencyValidator";

interface UnifiedDeleteModalProps {
  isOpen: boolean;
  itemName: string;
  itemType: string; // 'Sản phẩm', 'Danh mục', 'Voucher', etc.
  dependencyResult: DependencyCheckResult | null;
  onClose: () => void;
  onConfirmDelete: () => void;
  isLoading: boolean;
}

export default function UnifiedDeleteModal({
  isOpen,
  itemName,
  itemType,
  dependencyResult,
  onClose,
  onConfirmDelete,
  isLoading,
}: UnifiedDeleteModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Trigger animation on open
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const hasConstraints = dependencyResult?.hasDependencies ?? false;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          opacity: isVisible ? 1 : 0,
          transition: "opacity 0.3s ease",
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          backgroundColor: "#FFFFFF",
          borderRadius: "16px",
          padding: "32px",
          maxWidth: "520px",
          width: "90%",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.2)",
          zIndex: 1001,
          fontFamily: '"Be Vietnam Pro", sans-serif',
          opacity: isVisible ? 1 : 0,
          transform: isVisible
            ? "translate(-50%, -50%)"
            : "translate(-50%, -48%)",
          transition: "all 0.3s ease",
          pointerEvents: isVisible ? "auto" : "none",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {hasConstraints ? (
          <CannotDeleteState
            itemType={itemType}
            itemName={itemName}
            dependencies={dependencyResult?.dependencies || []}
            onClose={onClose}
          />
        ) : (
          <ConfirmDeleteState
            itemType={itemType}
            itemName={itemName}
            onClose={onClose}
            onConfirm={onConfirmDelete}
            isLoading={isLoading}
          />
        )}
      </div>
    </>
  );
}

// ============= STATE A: CANNOT DELETE (HAS CONSTRAINTS) =============
function CannotDeleteState({
  itemType,
  itemName,
  dependencies,
  onClose,
}: {
  itemType: string;
  itemName: string;
  dependencies: any[];
  onClose: () => void;
}) {
  return (
    <div>
      {/* Title */}
      <div style={{ marginBottom: "24px" }}>
        <h2
          style={{
            margin: 0,
            fontSize: "20px",
            fontWeight: "700",
            color: "#2B3674",
            lineHeight: "1.4",
          }}
        >
          Không thể xóa {itemType.toLowerCase()}
        </h2>
      </div>

      {/* Description */}
      <p
        style={{
          margin: "0 0 24px 0",
          fontSize: "15px",
          color: "#6B7280",
          lineHeight: "1.6",
        }}
      >
        Thông tin này hiện đang có dữ liệu liên kết trong hệ thống và không thể
        xóa bỏ để đảm bảo tính chính xác của dữ liệu.
      </p>

      {/* Dependencies List */}
      <div
        style={{
          backgroundColor: "#F9FAFB",
          border: "1px solid #E5E7EB",
          borderRadius: "12px",
          padding: "16px",
          marginBottom: "28px",
        }}
      >
        <p
          style={{
            margin: "0 0 12px 0",
            fontSize: "12px",
            fontWeight: "600",
            color: "#6B7280",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          Dữ liệu liên kết:
        </p>
        <ul
          style={{
            margin: 0,
            paddingLeft: "20px",
            listStyle: "none",
          }}
        >
          {dependencies.map((dep, idx) => (
            <li
              key={idx}
              style={{
                fontSize: "14px",
                color: "#374151",
                marginBottom: "8px",
                paddingLeft: "4px",
                lineHeight: "1.5",
              }}
            >
              <span style={{ fontWeight: "600", color: "#f06192" }}>•</span>{" "}
              <span style={{ fontWeight: "500" }}>{dep.tableName}:</span>{" "}
              {dep.count} bản ghi
            </li>
          ))}
        </ul>
      </div>

      {/* Button */}
      <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
        <button
          onClick={onClose}
          style={{
            padding: "12px 28px",
            borderRadius: "8px",
            border: "none",
            backgroundColor: "#f06192",
            color: "#FFFFFF",
            fontSize: "15px",
            fontWeight: "600",
            cursor: "pointer",
            transition: "all 0.2s",
            fontFamily: '"Be Vietnam Pro", sans-serif',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#e8477d";
            e.currentTarget.style.boxShadow =
              "0 4px 12px rgba(240, 97, 146, 0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#f06192";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          Đã hiểu
        </button>
      </div>
    </div>
  );
}

// ============= STATE B: CONFIRM DELETE (NO CONSTRAINTS) =============
function ConfirmDeleteState({
  itemType,
  itemName,
  onClose,
  onConfirm,
  isLoading,
}: {
  itemType: string;
  itemName: string;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}) {
  return (
    <div>
      {/* Title */}
      <div style={{ marginBottom: "24px" }}>
        <h2
          style={{
            margin: 0,
            fontSize: "20px",
            fontWeight: "700",
            color: "#2B3674",
            lineHeight: "1.4",
          }}
        >
          Xác nhận xóa
        </h2>
      </div>

      {/* Description */}
      <p
        style={{
          margin: "0 0 28px 0",
          fontSize: "15px",
          color: "#6B7280",
          lineHeight: "1.6",
        }}
      >
        Bạn có chắc chắn muốn xóa{" "}
        <span style={{ fontWeight: "600", color: "#2B3674" }}>{itemName}</span>{" "}
        này không? Hành động này không thể hoàn tác.
      </p>

      {/* Buttons */}
      <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
        <button
          onClick={onClose}
          disabled={isLoading}
          style={{
            padding: "12px 28px",
            borderRadius: "8px",
            border: "1.5px solid #f06192",
            backgroundColor: "#FFFFFF",
            color: "#f06192",
            fontSize: "15px",
            fontWeight: "600",
            cursor: isLoading ? "not-allowed" : "pointer",
            transition: "all 0.2s",
            fontFamily: '"Be Vietnam Pro", sans-serif',
            opacity: isLoading ? 0.6 : 1,
          }}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.currentTarget.style.backgroundColor = "#fff0f5";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#FFFFFF";
          }}
        >
          Hủy
        </button>
        <button
          onClick={onConfirm}
          disabled={isLoading}
          style={{
            padding: "12px 28px",
            borderRadius: "8px",
            border: "none",
            backgroundColor: "#f06192",
            color: "#FFFFFF",
            fontSize: "15px",
            fontWeight: "600",
            cursor: isLoading ? "not-allowed" : "pointer",
            transition: "all 0.2s",
            fontFamily: '"Be Vietnam Pro", sans-serif',
            opacity: isLoading ? 0.7 : 1,
          }}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.currentTarget.style.backgroundColor = "#e8477d";
              e.currentTarget.style.boxShadow =
                "0 4px 12px rgba(240, 97, 146, 0.3)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#f06192";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          {isLoading ? "Đang xóa..." : "Xác nhận xóa"}
        </button>
      </div>
    </div>
  );
}
