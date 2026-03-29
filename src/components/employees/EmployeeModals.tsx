import React, { useState, useEffect } from 'react'
import { X, User, Mail, Plus, Key, Lock, Unlock } from 'lucide-react'
import type { EmployeeWithBranch, Branch } from '../../types'
import CreatablePositionCombobox from './CreatablePositionCombobox'

interface EmployeeFormData {
  fullname: string
  email: string
  phone: string
  position: string
  branchid: string
  status: string
}

// Danh sách chức vụ phổ biến
const COMMON_POSITIONS = ['Quản lý', 'Pha chế', 'Phục vụ', 'Bảo vệ', 'Giao hàng', 'Kế toán']

interface EmployeeModalsProps {
  branches: Branch[]
  isSuperAdmin?: boolean
  userBranchId?: number | null
  // Add Modal
  showAddModal: boolean
  onAddClose: () => void
  onAddSubmit: (data: EmployeeFormData) => Promise<void>
  addLoading?: boolean
  // Edit Modal
  showEditModal: boolean
  selectedEmployee: EmployeeWithBranch | null
  onEditClose: () => void
  onEditSubmit: (data: EmployeeFormData) => Promise<void>
  editLoading?: boolean
  // Grant Account Modal
  showGrantModal: boolean
  onGrantClose: () => void
  onGrantSubmit: (password: string, role: string) => Promise<void>
  grantLoading?: boolean
  // Manage Account Modal
  showManageModal: boolean
  onManageClose: () => void
  onResetPassword: (password: string) => Promise<void>
  onToggleLock: (shouldLock: boolean) => Promise<void>
  manageLoading?: boolean
}

const EmployeeModals: React.FC<EmployeeModalsProps> = ({
  branches,
  isSuperAdmin = true,
  userBranchId = null,
  showAddModal,
  onAddClose,
  onAddSubmit,
  addLoading,
  showEditModal,
  selectedEmployee,
  onEditClose,
  onEditSubmit,
  editLoading,
  showGrantModal,
  onGrantClose,
  onGrantSubmit,
  grantLoading,
  showManageModal,
  onManageClose,
  onResetPassword,
  onToggleLock,
  manageLoading,
}) => {
  const [formData, setFormData] = useState<EmployeeFormData>({
    fullname: '',
    email: '',
    phone: '',
    position: '',
    branchid: isSuperAdmin ? '' : String(userBranchId || ''),
    status: 'Đang làm',
  })

  // Grant Account State
  const [accountPassword, setAccountPassword] = useState('')
  const [accountRole, setAccountRole] = useState('staff')
  const [showPassword, setShowPassword] = useState(false)

  // Manage Account State
  const [manageTab, setManageTab] = useState<'reset' | 'lock'>('reset')
  const [newPassword, setNewPassword] = useState('')
  const [shouldLock, setShouldLock] = useState(false)

  // Initialize form for edit mode
  useEffect(() => {
    if (showEditModal && selectedEmployee) {
      setFormData({
        fullname: selectedEmployee.fullname,
        email: selectedEmployee.email,
        phone: selectedEmployee.phone,
        position: selectedEmployee.position || '',
        branchid: String(selectedEmployee.branchid),
        status: selectedEmployee.status || 'active',
      })
    }
  }, [showEditModal, selectedEmployee])

  // Validate phone - only numbers
  const handlePhoneChange = (value: string) => {
    const numberOnly = value.replace(/\D/g, '')
    setFormData({ ...formData, phone: numberOnly })
  }

  const handleAddSubmit = async () => {
    await onAddSubmit(formData)
    setFormData({
      fullname: '',
      email: '',
      phone: '',
      position: '',
      branchid: isSuperAdmin ? '' : String(userBranchId || ''),
      status: 'active',
    })
  }

  const handleEditSubmit = async () => {
    await onEditSubmit(formData)
  }

  const handleGrantReset = () => {
    setAccountPassword('')
    setAccountRole('staff')
    setShowPassword(false)
  }

  const handleManageReset = () => {
    setManageTab('reset')
    setNewPassword('')
    setShouldLock(false)
  }

  return (
    <>
      {/* ADD EMPLOYEE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Thêm Nhân Viên</h2>
              <button
                onClick={() => {
                  onAddClose()
                  setFormData({
                    fullname: '',
                    email: '',
                    phone: '',
                    position: '',
                    branchid: isSuperAdmin ? '' : String(userBranchId || ''),
                    status: 'Đang làm',
                  })
                }}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Tên nhân viên */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tên Nhân Viên</label>
                <input
                  type="text"
                  placeholder="Nhập tên nhân viên"
                  value={formData.fullname}
                  onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-[12px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  placeholder="Nhập email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-[12px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              {/* Số điện thoại */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Số Điện Thoại</label>
                <input
                  type="text"
                  placeholder="Nhập số điện thoại"
                  value={formData.phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  maxLength={20}
                  className="w-full px-4 py-3 border border-gray-300 rounded-[12px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              {/* Chức vụ - Creatable Combobox */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Chức Vụ</label>
                <CreatablePositionCombobox
                  value={formData.position}
                  onChange={(value) => setFormData({ ...formData, position: value })}
                  options={COMMON_POSITIONS}
                  placeholder="Chọn hoặc gõ chức vụ"
                />
              </div>

              {/* Chi nhánh - Super Admin thì dropdown, Branch Manager thì text tĩnh */}
              {isSuperAdmin ? (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Chi Nhánh</label>
                  <select
                    value={formData.branchid}
                    onChange={(e) => setFormData({ ...formData, branchid: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-[12px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  >
                    <option value="">-- Chọn chi nhánh --</option>
                    {branches.map((b) => (
                      <option key={b.branchid} value={b.branchid}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Chi Nhánh</label>
                  <div className="px-4 py-3 bg-blue-50 border border-blue-200 rounded-[12px] font-medium text-blue-900">
                    {branches.find(b => b.branchid === userBranchId)?.name || 'N/A'}
                  </div>
                </div>
              )}

              {/* Trạng thái - Chỉ 2 option: Đang làm, Nghỉ việc */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Trạng Thái</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-[12px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                >
                  <option value="Đang làm">Đang làm</option>
                  <option value="Nghỉ việc">Nghỉ việc</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-10">
              <button
                onClick={() => {
                  onAddClose()
                  setFormData({
                    fullname: '',
                    email: '',
                    phone: '',
                    position: '',
                    branchid: isSuperAdmin ? '' : String(userBranchId || ''),
                    status: 'Đang làm',
                  })
                }}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-[12px] text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Hủy
              </button>
              <button
                onClick={handleAddSubmit}
                disabled={addLoading}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-[12px] hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
              >
                {addLoading ? 'Đang xử lý...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT EMPLOYEE MODAL */}
      {showEditModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Chỉnh Sửa Nhân Viên</h2>
              <button
                onClick={onEditClose}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Tên nhân viên */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tên Nhân Viên</label>
                <input
                  type="text"
                  placeholder="Nhập tên nhân viên"
                  value={formData.fullname}
                  onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-[12px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  placeholder="Nhập email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-[12px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              {/* Số điện thoại */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Số Điện Thoại</label>
                <input
                  type="text"
                  placeholder="Nhập số điện thoại"
                  value={formData.phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  maxLength={20}
                  className="w-full px-4 py-3 border border-gray-300 rounded-[12px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              {/* Chức vụ - Creatable Combobox */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Chức Vụ</label>
                <CreatablePositionCombobox
                  value={formData.position}
                  onChange={(value) => setFormData({ ...formData, position: value })}
                  options={COMMON_POSITIONS}
                  placeholder="Chọn hoặc gõ chức vụ"
                />
              </div>

              {/* Chi nhánh - Super Admin thì dropdown, Branch Manager thì text tĩnh */}
              {isSuperAdmin ? (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Chi Nhánh</label>
                  <select
                    value={formData.branchid}
                    onChange={(e) => setFormData({ ...formData, branchid: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-[12px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  >
                    <option value="">-- Chọn chi nhánh --</option>
                    {branches.map((b) => (
                      <option key={b.branchid} value={b.branchid}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Chi Nhánh</label>
                  <div className="px-4 py-3 bg-blue-50 border border-blue-200 rounded-[12px] font-medium text-blue-900">
                    {branches.find(b => b.branchid === userBranchId)?.name || 'N/A'}
                  </div>
                </div>
              )}

              {/* Trạng thái - Chỉ 2 option: Đang làm, Nghỉ việc */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Trạng Thái</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-[12px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                >
                  <option value="Đang làm">Đang làm</option>
                  <option value="Nghỉ việc">Nghỉ việc</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-10">
              <button
                onClick={onEditClose}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-[12px] text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Hủy
              </button>
              <button
                onClick={handleEditSubmit}
                disabled={editLoading}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-[12px] hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
              >
                {editLoading ? 'Đang xử lý...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GRANT ACCOUNT MODAL */}
      {showGrantModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Cấp Tài Khoản</h2>
              <button
                onClick={() => {
                  onGrantClose()
                  handleGrantReset()
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-gray-700 flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="font-semibold">{selectedEmployee.fullname}</span>
              </p>
              <p className="text-sm text-gray-700 mt-2 flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="font-semibold">{selectedEmployee.email}</span>
              </p>
            </div>

            <div className="space-y-6">
              {/* Mật khẩu */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Mật Khẩu</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                    value={accountPassword}
                    onChange={(e) => setAccountPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-[12px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    {showPassword ? 'Ẩn' : 'Hiện'}
                  </button>
                </div>
              </div>

              {/* Vai trò */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Vai Trò</label>
                <select
                  value={accountRole}
                  onChange={(e) => setAccountRole(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-[12px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                >
                  <option value="staff">Nhân Viên</option>
                  <option value="manager">Quản Lý Chi Nhánh</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-10">
              <button
                onClick={() => {
                  onGrantClose()
                  handleGrantReset()
                }}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-[12px] text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Hủy
              </button>
              <button
                onClick={() => onGrantSubmit(accountPassword, accountRole)}
                disabled={grantLoading}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-[12px] hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium flex items-center justify-center gap-2"
              >
                {grantLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Cấp Quyền
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANAGE ACCOUNT MODAL */}
      {showManageModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Quản Trị Tài Khoản</h2>
              <button
                onClick={() => {
                  onManageClose()
                  handleManageReset()
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-700 flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="font-semibold">{selectedEmployee.fullname}</span>
              </p>
              <p className="text-sm text-gray-700 mt-2 flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="font-semibold">{selectedEmployee.email}</span>
              </p>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-6 border-b border-gray-200">
              <button
                onClick={() => setManageTab('reset')}
                className={`px-4 py-2 font-medium transition-colors ${
                  manageTab === 'reset'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Đặt Lại Mật Khẩu
              </button>
              <button
                onClick={() => setManageTab('lock')}
                className={`px-4 py-2 font-medium transition-colors ${
                  manageTab === 'lock'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Khóa/Mở Khóa
              </button>
            </div>

            {/* Reset Password Tab */}
            {manageTab === 'reset' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Mật Khẩu Mới</label>
                  <input
                    type="password"
                    placeholder="Nhập mật khẩu mới"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-[12px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>

                <div className="flex gap-3 mt-10">
                  <button
                    onClick={() => {
                      onManageClose()
                      handleManageReset()
                    }}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-[12px] text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={() => onResetPassword(newPassword)}
                    disabled={manageLoading}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-[12px] hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    {manageLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <Key className="w-4 h-4" />
                        Đặt Lại
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Lock/Unlock Tab */}
            {manageTab === 'lock' && (
              <div className="space-y-6">
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm text-gray-700 font-medium mb-4">Chọn trạng thái tài khoản:</p>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="lock-status"
                        checked={!shouldLock}
                        onChange={() => setShouldLock(false)}
                        className="w-4 h-4 text-green-600"
                      />
                      <span className="text-sm text-gray-700 font-medium">Mở Khóa (Cho phép đăng nhập)</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="lock-status"
                        checked={shouldLock}
                        onChange={() => setShouldLock(true)}
                        className="w-4 h-4 text-red-600"
                      />
                      <span className="text-sm text-gray-700 font-medium">Khóa (Cấm đăng nhập)</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 mt-10">
                  <button
                    onClick={() => {
                      onManageClose()
                      handleManageReset()
                    }}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-[12px] text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={() => onToggleLock(shouldLock)}
                    disabled={manageLoading}
                    className={`flex-1 px-4 py-3 text-white rounded-[12px] transition-colors font-medium flex items-center justify-center gap-2 disabled:bg-gray-400 ${
                      shouldLock ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {manageLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Đang xử lý...
                      </>
                    ) : shouldLock ? (
                      <>
                        <Lock className="w-4 h-4" />
                        Khóa Tài Khoản
                      </>
                    ) : (
                      <>
                        <Unlock className="w-4 h-4" />
                        Mở Khóa Tài Khoản
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default EmployeeModals
