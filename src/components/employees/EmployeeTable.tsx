import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Search, Shield, Key, Mail, AlertCircle, Lock, Trash2 } from 'lucide-react'
import type { EmployeeWithBranch, Branch } from '../../types'

interface EmployeeTableProps {
  employees: EmployeeWithBranch[]
  branches: Branch[]
  activeTab: 'profiles' | 'system'
  isSuperAdmin: boolean
  userBranchName?: string
  loading: boolean
  onAddClick: () => void
  onEditClick: (emp: EmployeeWithBranch) => void
  onGrantClick: (emp: EmployeeWithBranch) => void
  onManageClick: (emp: EmployeeWithBranch) => void
  onDeleteClick: (emp: EmployeeWithBranch) => void
  onBranchChange: (branchId: number | null) => void
}

const EmployeeTable: React.FC<EmployeeTableProps> = ({
  employees,
  branches,
  activeTab,
  isSuperAdmin,
  userBranchName = '',
  loading,
  onAddClick,
  onEditClick,
  onGrantClick,
  onManageClick,
  onDeleteClick,
  onBranchChange,
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null)
  const [filteredEmployees, setFilteredEmployees] = useState<EmployeeWithBranch[]>([])

  // Filter employees
  useEffect(() => {
    const filtered = employees.filter(
      (emp) =>
        emp.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.phone?.includes(searchTerm) || false)
    )
    setFilteredEmployees(filtered)
  }, [searchTerm, employees])

  const handleBranchChange = (branchId: number | null) => {
    setSelectedBranch(branchId)
    onBranchChange(branchId)
  }

  const getAccountStatus = (emp: EmployeeWithBranch) => {
    if (!emp.accounts || emp.accounts.length === 0) {
      return { status: 'no-account', label: 'Chưa có tài khoản', color: 'bg-gray-100 text-gray-700' }
    }
    if (emp.accounts[0].isactive === false) {
      return { status: 'locked', label: 'Đã khóa', color: 'bg-red-100 text-red-700' }
    }
    return { status: 'active', label: 'Đã cấp quyền', color: 'bg-green-100 text-green-700' }
  }

  const hasAccount = (emp: EmployeeWithBranch) => emp.accounts && emp.accounts.length > 0

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((p) => p[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)

  const avatarColors = ['#4318FF', '#5E78F7', '#6B9FFF', '#1E90FF', '#7C63FF']
  const getAvatarColor = (index: number) => avatarColors[index % avatarColors.length]

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <>
      {/* Controls */}
      <div className="mb-6 flex gap-3 flex-wrap">
        {/* Branch Filter or Static Branch Display */}
        {isSuperAdmin ? (
          <select
            value={selectedBranch || ''}
            onChange={(e) => handleBranchChange(e.target.value ? Number(e.target.value) : null)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          >
            <option value="">Tất cả chi nhánh</option>
            {branches.map((branch) => (
              <option key={branch.branchid} value={branch.branchid}>
                {branch.name}
              </option>
            ))}
          </select>
        ) : (
          <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg font-medium text-blue-900">
            Chi nhánh: <span className="font-semibold">{userBranchName}</span>
          </div>
        )}

        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, email hoặc số điện thoại..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Add Button */}
        {activeTab === 'profiles' && (
          <button
            onClick={onAddClick}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
          >
            <Plus className="w-5 h-5" />
            Thêm
          </button>
        )}
      </div>

      {/* PROFILES TAB */}
      {activeTab === 'profiles' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Nhân Viên</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Chức Vụ</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Chi Nhánh</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Điện Thoại</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Hành Động</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp, idx) => (
                  <tr key={emp.employeeid} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                          style={{ backgroundColor: getAvatarColor(idx) }}
                        >
                          {getInitials(emp.fullname)}
                        </div>
                        <p className="font-medium text-gray-900">{emp.fullname}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{emp.email}</td>
                    <td className="px-6 py-4 text-gray-600">{emp.position || '-'}</td>
                    <td className="px-6 py-4 text-gray-600">{emp.branches?.name || '-'}</td>
                    <td className="px-6 py-4 text-gray-600">{emp.phone}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onEditClick(emp)}
                          className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => onDeleteClick(emp)}
                          className="text-slate-400 hover:text-red-600 p-2 hover:bg-red-50 rounded transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredEmployees.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Không tìm thấy nhân viên nào</p>
            </div>
          )}
        </div>
      )}

      {/* SYSTEM TAB - SUPER ADMIN ONLY */}
      {activeTab === 'system' && isSuperAdmin && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Nhân Viên</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email Đăng Nhập</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Trạng Thái</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Hành Động</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp, idx) => {
                  const accountStatus = getAccountStatus(emp)
                  return (
                    <tr key={emp.employeeid} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                            style={{ backgroundColor: getAvatarColor(idx) }}
                          >
                            {getInitials(emp.fullname)}
                          </div>
                          <p className="font-medium text-gray-900">{emp.fullname}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail className="w-4 h-4 text-gray-400" />
                          {emp.email}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${accountStatus.color}`}>
                          {accountStatus.status === 'no-account' && <AlertCircle className="w-4 h-4" />}
                          {accountStatus.status === 'locked' && <Lock className="w-4 h-4" />}
                          {accountStatus.status === 'active' && <Shield className="w-4 h-4" />}
                          {accountStatus.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {!hasAccount(emp) ? (
                            <button
                              onClick={() => onGrantClick(emp)}
                              className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-2 font-medium text-sm"
                            >
                              <Shield className="w-4 h-4" />
                              Cấp Tài Khoản
                            </button>
                          ) : (
                            <button
                              onClick={() => onManageClick(emp)}
                              className="bg-purple-100 text-purple-700 px-4 py-2 rounded-lg hover:bg-purple-200 transition-colors flex items-center gap-2 font-medium text-sm"
                            >
                              <Key className="w-4 h-4" />
                              Quản Trị
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {filteredEmployees.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Không tìm thấy nhân viên nào</p>
            </div>
          )}
        </div>
      )}
    </>
  )
}

export default EmployeeTable
