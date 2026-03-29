import React, { useState, useEffect } from 'react'
import { supabase } from '../utils/supabaseClient'
import Toast from '../components/Toast'
import { authAdminService } from '../services/authAdminService'
import { employeeService } from '../services/employeeService'
import EmployeeStats from '../components/employees/EmployeeStats'
import EmployeeTable from '../components/employees/EmployeeTable'
import EmployeeModals from '../components/employees/EmployeeModals'
import type { EmployeeWithBranch, Branch } from '../types'

interface StatsData {
  totalEmployees: number
  activeEmployees: number
  newThisMonth: number
}

interface ToastMessage {
  message: string
  type: 'success' | 'error'
}

const Employees: React.FC = () => {
  // State: Tabs & Data
  const [activeTab, setActiveTab] = useState<'profiles' | 'system'>('profiles')
  const [employees, setEmployees] = useState<EmployeeWithBranch[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [stats, setStats] = useState<StatsData>({
    totalEmployees: 0,
    activeEmployees: 0,
    newThisMonth: 0,
  })

  // State: UI
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userBranchId, setUserBranchId] = useState<number | null>(null)
  const [userBranchName, setUserBranchName] = useState<string>('')
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null)

  // State: Modal flags
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showGrantModal, setShowGrantModal] = useState(false)
  const [showManageModal, setShowManageModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeWithBranch | null>(null)

  // State: Loading states
  const [addLoading, setAddLoading] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [grantLoading, setGrantLoading] = useState(false)
  const [manageLoading, setManageLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const isSuperAdmin = userRole?.toLowerCase() === 'super admin'

  // Effects - Initialize user role and branch
  useEffect(() => {
    const role = localStorage.getItem('userRole')
    const branchIdStr = localStorage.getItem('userBranchId')
    const branchId = branchIdStr ? parseInt(branchIdStr, 10) : null
    
    setUserRole(role)
    setUserBranchId(branchId)
    
    // Auto-set selectedBranch immediately for Branch Manager
    const isSA = role?.toLowerCase() === 'super admin'
    if (!isSA && branchId) {
      setSelectedBranch(branchId)
      console.log('[RBAC] Branch Manager detected - setting selectedBranch to:', branchId)
    } else if (isSA) {
      setSelectedBranch(null)
      console.log('[RBAC] Super Admin detected - showing all branches')
    }
    
    console.log('[RBAC] Initialized - User Role:', role, 'Branch ID:', branchId, 'Is Super Admin:', isSA)
  }, [])

  useEffect(() => {
    const loadBranches = async () => {
      try {
        const data = await employeeService.getBranches()
        setBranches(data)
        
        // Set branch name for Branch Manager
        if (userBranchId && !isSuperAdmin) {
          const branch = data.find(b => b.branchid === userBranchId)
          if (branch) {
            setUserBranchName(branch.name)
            console.log('[RBAC] Found branch name:', branch.name)
          }
        }
      } catch (err) {
        console.error('[ERROR] Loading branches:', err)
      }
    }
    
    if (userBranchId !== null || isSuperAdmin) {
      loadBranches()
    }
  }, [userBranchId, isSuperAdmin])

  // Trigger data load when selectedBranch changes
  useEffect(() => {
    console.log('[RBAC] selectedBranch changed to:', selectedBranch)
    loadEmployeesAndStats()
  }, [selectedBranch])

  // Functions
  const loadEmployeesAndStats = async () => {
    try {
      setLoading(true)
      const employeeData = await employeeService.getAllEmployees(selectedBranch)
      setEmployees(employeeData)
      const statsData = await employeeService.getEmployeeStats(selectedBranch)
      setStats(statsData)
    } catch (err) {
      console.error('[ERROR] Loading data:', err)
      setToast({ message: 'Không thể tải dữ liệu', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleAddEmployee = async (formData: any) => {
    try {
      setAddLoading(true)
      await employeeService.createEmployee(formData)
      setToast({ message: 'Thêm nhân viên thành công', type: 'success' })
      setShowAddModal(false)
      await loadEmployeesAndStats()
    } catch (err) {
      console.error('[ERROR]', err)
      setToast({ message: 'Không thể thêm nhân viên', type: 'error' })
    } finally {
      setAddLoading(false)
    }
  }

  const handleEditEmployee = async (formData: any) => {
    if (!selectedEmployee) return
    try {
      setEditLoading(true)
      await employeeService.updateEmployee(selectedEmployee.employeeid, formData)
      setToast({ message: 'Cập nhật thành công', type: 'success' })
      setShowEditModal(false)
      setSelectedEmployee(null)
      await loadEmployeesAndStats()
    } catch (err) {
      console.error('[ERROR]', err)
      setToast({ message: 'Không thể cập nhật', type: 'error' })
    } finally {
      setEditLoading(false)
    }
  }

  const handleGrantAccount = async (password: string, role: string) => {
    if (!selectedEmployee || !password) {
      setToast({ message: 'Vui lòng nhập mật khẩu', type: 'error' })
      return
    }
    try {
      setGrantLoading(true)
      // Map role names to auth service format
      const roleMap: { [key: string]: 'Staff' | 'Branch Manager' | 'Super Admin' } = {
        'staff': 'Staff',
        'manager': 'Branch Manager',
        'super_admin': 'Super Admin',
      }
      await authAdminService.createEmployeeAccount({
        email: selectedEmployee.email,
        password,
        employeeId: selectedEmployee.employeeid,
        branchId: selectedEmployee.branchid,
        role: roleMap[role] || 'Staff',
      })
      setToast({ message: 'Cấp tài khoản thành công', type: 'success' })
      setShowGrantModal(false)
      setSelectedEmployee(null)
      await loadEmployeesAndStats()
    } catch (err: any) {
      setToast({ message: err.message || 'Không thể cấp tài khoản', type: 'error' })
    } finally {
      setGrantLoading(false)
    }
  }

  const handleResetPassword = async (password: string) => {
    if (!selectedEmployee || !password) {
      setToast({ message: 'Vui lòng nhập mật khẩu mới', type: 'error' })
      return
    }
    try {
      setManageLoading(true)
      const { data: account } = await supabase
        .from('accounts')
        .select('accountid')
        .eq('employeeid', selectedEmployee.employeeid)
        .single()
      if (!account?.accountid) throw new Error('Không tìm thấy tài khoản')
      await authAdminService.resetPassword({ userId: account.accountid, newPassword: password })
      setToast({ message: 'Đặt lại mật khẩu thành công', type: 'success' })
      setShowManageModal(false)
      setSelectedEmployee(null)
      await loadEmployeesAndStats()
    } catch (err: any) {
      setToast({ message: err.message || 'Không thể đặt lại mật khẩu', type: 'error' })
    } finally {
      setManageLoading(false)
    }
  }

  const handleToggleLock = async (shouldLock: boolean) => {
    if (!selectedEmployee) return
    try {
      setManageLoading(true)
      const { data: account } = await supabase
        .from('accounts')
        .select('accountid')
        .eq('employeeid', selectedEmployee.employeeid)
        .single()
      if (!account?.accountid) throw new Error('Không tìm thấy tài khoản')
      await authAdminService.updateAccountStatus({ userId: account.accountid, isBanned: shouldLock })
      setToast({
        message: shouldLock ? 'Khóa tài khoản thành công' : 'Mở khóa tài khoản thành công',
        type: 'success',
      })
      setShowManageModal(false)
      setSelectedEmployee(null)
      await loadEmployeesAndStats()
    } catch (err: any) {
      setToast({ message: err.message || 'Không thể thay đổi', type: 'error' })
    } finally {
      setManageLoading(false)
    }
  }

  const handleDeleteEmployee = async () => {
    if (!selectedEmployee) return
    try {
      setDeleteLoading(true)
      await employeeService.deleteEmployee(selectedEmployee.employeeid)
      setToast({ message: 'Xóa nhân viên thành công', type: 'success' })
      setShowDeleteConfirm(false)
      setSelectedEmployee(null)
      await loadEmployeesAndStats()
    } catch (err: any) {
      setToast({ message: err.message || 'Không thể xóa nhân viên', type: 'error' })
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản Lý Nhân Viên</h1>
        <p className="text-gray-600">Quản lý thông tin và tài khoản đăng nhập của nhân viên</p>
      </div>

      <EmployeeStats stats={stats} />

      <div className="mb-6 flex gap-2 border-b border-gray-200 mt-8">
        <button
          onClick={() => setActiveTab('profiles')}
          className={`px-6 py-3 font-semibold transition-all border-b-2 ${
            activeTab === 'profiles'
              ? 'text-blue-600 border-blue-600'
              : 'text-gray-600 border-transparent hover:text-gray-900'
          }`}
        >
          Hồ Sơ Nhân Viên
        </button>
        {isSuperAdmin && (
          <button
            onClick={() => setActiveTab('system')}
            className={`px-6 py-3 font-semibold transition-all border-b-2 ${
              activeTab === 'system'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            Quản Trị Hệ Thống
          </button>
        )}
      </div>

      {!loading && (
        <EmployeeTable
          employees={employees}
          branches={branches}
          activeTab={activeTab}
          isSuperAdmin={isSuperAdmin}
          userBranchName={userBranchName}
          loading={loading}
          onAddClick={() => setShowAddModal(true)}
          onEditClick={(emp) => {
            setSelectedEmployee(emp)
            setShowEditModal(true)
          }}
          onGrantClick={(emp) => {
            setSelectedEmployee(emp)
            setShowGrantModal(true)
          }}
          onManageClick={(emp) => {
            setSelectedEmployee(emp)
            setShowManageModal(true)
          }}
          onDeleteClick={(emp) => {
            setSelectedEmployee(emp)
            setShowDeleteConfirm(true)
          }}
          onBranchChange={setSelectedBranch}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <EmployeeModals
        showAddModal={showAddModal}
        onAddClose={() => setShowAddModal(false)}
        onAddSubmit={handleAddEmployee}
        addLoading={addLoading}
        showEditModal={showEditModal}
        selectedEmployee={selectedEmployee}
        onEditClose={() => {
          setShowEditModal(false)
          setSelectedEmployee(null)
        }}
        onEditSubmit={handleEditEmployee}
        editLoading={editLoading}
        showGrantModal={showGrantModal}
        onGrantClose={() => {
          setShowGrantModal(false)
          setSelectedEmployee(null)
        }}
        onGrantSubmit={handleGrantAccount}
        grantLoading={grantLoading}
        showManageModal={showManageModal}
        onManageClose={() => {
          setShowManageModal(false)
          setSelectedEmployee(null)
        }}
        onResetPassword={handleResetPassword}
        onToggleLock={handleToggleLock}
        manageLoading={manageLoading}
        branches={branches}
        isSuperAdmin={isSuperAdmin}
        userBranchId={userBranchId}
      />

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteConfirm && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Xác nhận xóa</h2>
            <p className="text-gray-600 mb-6">
              Bạn có chắc chắn muốn xóa nhân viên <span className="font-semibold text-gray-900">{selectedEmployee.fullname}</span> khỏi danh sách? Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setSelectedEmployee(null)
                }}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium disabled:bg-gray-100"
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteEmployee}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors font-medium"
              >
                {deleteLoading ? 'Đang xử lý...' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Employees
