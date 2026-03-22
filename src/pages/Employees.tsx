import React, { useState, useEffect } from 'react'
import { Card } from '@/components/Card'
import { EmployeeFormData } from '@/services/employeeService'
import { Branch } from '@/types'
import { Plus, Edit2, UserPlus, X, Search, ChevronDown, Loader } from 'lucide-react'
import { supabase } from '@/utils/supabaseClient'
import Toast from '@/components/Toast'

interface EmployeeWithBranch {
  employeeid: string
  fullname: string
  email: string
  phone: string
  position: string
  status: string
  branchid: string
  created_at?: string
  branches?: any
}

const StatusBadge = ({ status }: { status: string }) => {
  const isActive = status === 'Đang làm' || status === 'active'
  const bgColor = isActive ? '#E6FFFA' : '#F0F0F0'
  const textColor = isActive ? '#047857' : '#5A5A5A'
  const dotColor = isActive ? '#047857' : '#5A5A5A'
  const label = status === 'Đang làm' ? 'Đang làm' : status === 'active' ? 'Đang làm' : 'Nghỉ việc'

  return (
    <span
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: dotColor }} />
      {label}
    </span>
  )
}

const AvatarCircle = ({ name }: { name: string }) => {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm"
      style={{ backgroundColor: '#4318FF' }}
    >
      {initials}
    </div>
  )
}

const StatCard = ({ title, value, subtext }: { title: string; value: number; subtext: string }) => (
  <Card>
    <div>
      <p className="text-sm mb-2" style={{ color: '#8F9CB8' }}>{title}</p>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-3xl font-bold" style={{ color: '#2B3674' }}>{value}</p>
          <p className="text-xs mt-1" style={{ color: '#8F9CB8' }}>{subtext}</p>
        </div>
        <div className="text-4xl" style={{ color: '#4318FF', opacity: 0.1 }}>→</div>
      </div>
    </div>
  </Card>
)

export const Employees: React.FC = () => {
  const [employees, setEmployees] = useState<EmployeeWithBranch[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all')
  const [stats, setStats] = useState({ totalEmployees: 0, totalBranches: 0, newEmployeesThisMonth: 0 })
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAccountModal, setShowAccountModal] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeWithBranch | null>(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [formData, setFormData] = useState<EmployeeFormData>({
    fullname: '',
    email: '',
    phone: '',
    position: 'Pha chế',
    branchid: '',
    status: 'Đang làm'
  })

  // Get role and branchId from localStorage
  const getUserFromStorage = () => {
    try {
      const userStr = localStorage.getItem('user')
      return userStr ? JSON.parse(userStr) : null
    } catch (e) {
      console.error('Lỗi parse user từ localStorage:', e)
      return null
    }
  }
  
  const currentUser = getUserFromStorage()
  const userRole = currentUser?.role || 'staff'
  const userBranchId = currentUser?.branchid || ''
  const isSuperAdmin = userRole?.toLowerCase().replace(/\s/g, '') === 'superadmin'

  // STEP 1: Load branches only once on component mount
  useEffect(() => {
    const loadBranches = async () => {
      try {
        const { data: branchesData, error: branchesError } = await supabase
          .from('branches')
          .select('*')
          .order('name', { ascending: true })
        
        if (branchesError) {
          console.error('❌ [BRANCHES]:', branchesError)
        } else {
          setBranches(branchesData || [])
          console.log(`✅ [BRANCHES] ${branchesData?.length} chi nhánh`)
        }
      } catch (err) {
        console.error('❌ [BRANCHES ERROR]:', err)
      }
    }
    
    loadBranches()
  }, [])

  // STEP 2: Fetch employees whenever selectedBranchId changes
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true)
        console.log('=== 🚀 BẮT ĐẦU LỌC DỮ LIỆU ===')
        console.log('👤 User Role:', userRole)
        console.log('✅ isSuperAdmin:', isSuperAdmin)
        console.log('🔍 selectedBranchId:', selectedBranchId)

        let query = supabase
          .from('employees')
          .select('*, branches(name)')
          .order('fullname', { ascending: true })

        // Apply filtering logic based on role and selectedBranchId
        if (isSuperAdmin) {
          // Super Admin: Apply branch filter if selectedBranchId !== 'all'
          if (selectedBranchId !== 'all') {
            console.log(`🏢 [SUPER ADMIN] Lọc theo chi nhánh: ${selectedBranchId}`)
            query = query.eq('branchid', parseInt(selectedBranchId))
          } else {
            console.log('🔑 [SUPER ADMIN] Lấy TẤT CẢ (không lọc)')
          }
        } else {
          // Branch Manager: Always filter by their own branchid
          if (!userBranchId) {
            console.warn('⚠️ Branch ID trống!')
            setEmployees([])
            setStats({ totalEmployees: 0, totalBranches: branches.length, newEmployeesThisMonth: 0 })
            setLoading(false)
            return
          }
          console.log(`👤 [BRANCH MANAGER] Bị ép cứng lọc branchid: ${userBranchId}`)
          query = query.eq('branchid', userBranchId)
        }

        const { data, error } = await query
        if (error) {
          console.error('❌ [QUERY ERROR]:', error)
          setEmployees([])
        } else {
          console.log('📦 Dữ liệu nhân viên thô từ DB:', data)
          const empData = data || []
          console.log(`✅ [EMPLOYEES] ${empData.length} nhân viên`)
          empData.forEach((e, idx) => {
            const branchName = Array.isArray(e.branches) ? e.branches[0]?.name : e.branches?.name
            console.log(`  [${idx+1}] ${e.fullname} | ${e.position} | ${branchName}`)
          })
          setEmployees(empData)

          // Calculate stats
          const totalEmployees = empData.length
          const totalBranches = branches.length
          const now = new Date()
          // Get first day of current month (00:00:00)
          const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
          const newEmployeesThisMonth = empData.filter(emp => {
            if (!emp.created_at) return false
            const createdDate = new Date(emp.created_at)
            // Compare: from first day of month to today (inclusive)
            return createdDate >= firstDayOfMonth && createdDate <= now
          }).length

          console.log('📈 Stats:', { totalEmployees, totalBranches, newEmployeesThisMonth })
          setStats({ totalEmployees, totalBranches, newEmployeesThisMonth })
        }
      } catch (error) {
        console.error('❌ [FATAL ERROR]:', error)
        setEmployees([])
      } finally {
        setLoading(false)
      }
    }

    fetchEmployees()
  }, [selectedBranchId, isSuperAdmin, userBranchId, branches.length])

  // Helper function to refresh employees list
  const refreshEmployees = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('employees')
        .select('*, branches(name)')
        .order('fullname', { ascending: true })

      if (isSuperAdmin) {
        if (selectedBranchId !== 'all') {
          query = query.eq('branchid', parseInt(selectedBranchId))
        }
      } else {
        if (userBranchId) {
          query = query.eq('branchid', userBranchId)
        }
      }

      const { data, error } = await query
      if (error) {
        console.error('❌ Refresh error:', error)
        setToast({ message: 'Lỗi tải lại dữ liệu', type: 'error' })
      } else {
        const empData = data || []
        setEmployees(empData)

        // Recalculate stats
        const totalEmployees = empData.length
        const totalBranches = branches.length
        const now = new Date()
        // Get first day of current month (00:00:00)
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const newEmployeesThisMonth = empData.filter(emp => {
          if (!emp.created_at) return false
          const createdDate = new Date(emp.created_at)
          // Compare: from first day of month to today (inclusive)
          return createdDate >= firstDayOfMonth && createdDate <= now
        }).length

        setStats({ totalEmployees, totalBranches, newEmployeesThisMonth })
      }
    } catch (error) {
      console.error('❌ Refresh error:', error)
      setToast({ message: 'Lỗi tải lại dữ liệu', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenAddModal = () => {
    setFormData({
      fullname: '',
      email: '',
      phone: '',
      position: 'Pha chế',
      branchid: isSuperAdmin ? '' : userBranchId,
      status: 'Đang làm'
    })
    setShowAddModal(true)
  }

  const handleOpenEditModal = (employee: EmployeeWithBranch) => {
    setSelectedEmployee(employee)
    setFormData({
      fullname: employee.fullname,
      email: employee.email,
      phone: employee.phone,
      position: employee.position,
      branchid: employee.branchid,
      status: employee.status
    })
    setShowEditModal(true)
  }

  const handleAddEmployee = async () => {
    if (!formData.fullname || !formData.email || !formData.branchid) {
      setToast({ message: 'Vui lòng điền đầy đủ thông tin', type: 'error' })
      return
    }
    
    setModalLoading(true)
    try {
      const { error } = await supabase.from('employees').insert([{
        fullname: formData.fullname,
        email: formData.email,
        phone: formData.phone,
        position: formData.position,
        branchid: formData.branchid,
        status: formData.status || 'Đang làm'
      }])
      if (error) throw error
      
      setToast({ message: `✅ Thêm nhân viên ${formData.fullname} thành công!`, type: 'success' })
      setShowAddModal(false)
      
      // Refresh employees list
      await refreshEmployees()
    } catch (error) {
      console.error('Error:', error)
      setToast({ message: 'Lỗi thêm nhân viên: ' + (error as any).message, type: 'error' })
    } finally {
      setModalLoading(false)
    }
  }

  const handleUpdateEmployee = async () => {
    if (!selectedEmployee) return
    
    setModalLoading(true)
    try {
      const { error } = await supabase
        .from('employees')
        .update({
          fullname: formData.fullname,
          email: formData.email,
          phone: formData.phone,
          position: formData.position,
          status: formData.status
        })
        .eq('employeeid', selectedEmployee.employeeid)
      if (error) throw error
      
      setToast({ message: `✅ Cập nhật thông tin ${formData.fullname} thành công!`, type: 'success' })
      setShowEditModal(false)
      
      // Refresh employees list
      await refreshEmployees()
    } catch (error) {
      console.error('Error:', error)
      setToast({ message: 'Lỗi cập nhật nhân viên: ' + (error as any).message, type: 'error' })
    } finally {
      setModalLoading(false)
    }
  }

  const handleGrantAccount = (employee: EmployeeWithBranch) => {
    setSelectedEmployee(employee)
    setShowAccountModal(true)
  }

  const filteredEmployees = employees.filter(emp => {
    // Filter by search term only (branch filtering is done at database level in fetchEmployees)
    const matchSearch =
      emp.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchSearch
  })

  // Helper function to get branch name from Supabase data
  const getBranchName = (emp: EmployeeWithBranch): string => {
    if (!emp.branches) {
      return 'N/A'
    }
    // Handle case where branches might be an object or array
    const branchObj = Array.isArray(emp.branches) ? emp.branches[0] : emp.branches
    return branchObj?.name || 'N/A'
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#2B3674' }}>Quản lý nhân sự</h1>
          <p style={{ color: '#8F9CB8' }}>
            {isSuperAdmin ? 'Toàn bộ nhân sự' : 'Nhân sự chi nhánh'}
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-all"
          style={{
            backgroundColor: '#4318FF',
            color: '#FFFFFF',
            boxShadow: 'rgba(67, 24, 255, 0.3) 0px 8px 16px'
          }}
        >
          <Plus size={20} />
          Thêm nhân viên
        </button>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Tổng nhân sự" value={stats.totalEmployees} subtext="toàn hệ thống" />
        <StatCard title="Chi nhánh" value={stats.totalBranches} subtext="điểm kinh doanh" />
        <StatCard title="Nhân sự mới" value={stats.newEmployeesThisMonth} subtext="tháng này" />
      </div>

      {/* Search & Filter */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2" style={{ color: '#8F9CB8' }} />
            <input
              type="text"
              placeholder="Tìm theo tên hoặc email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-lg text-sm"
              style={{
                backgroundColor: '#F4F7FE',
                color: '#2B3674',
                border: '1px solid #E0E5F2'
              }}
            />
          </div>

          {isSuperAdmin && (
            <div className="relative">
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="w-full px-4 py-3 rounded-lg text-sm appearance-none pr-10"
                style={{ backgroundColor: '#F4F7FE', color: '#2B3674', border: '1px solid #E0E5F2' }}
              >
                <option value="all">Tất cả chi nhánh</option>
                {branches.map(branch => (
                  <option key={branch.branchid} value={branch.branchid}>
                    {branch.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" style={{ color: '#2B3674' }} />
            </div>
          )}
        </div>
      </Card>

      {/* Employees Table */}
      <Card>
        {loading ? (
          <div className="text-center py-12" style={{ color: '#8F9CB8' }}>
            Đang tải dữ liệu...
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="text-center py-12" style={{ color: '#8F9CB8' }}>
            Không tìm thấy nhân viên
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '2px solid #E0E5F2', backgroundColor: '#F4F7FE' }}>
                  <th className="text-left py-4 px-6 font-bold" style={{ color: '#2B3674' }}>Nhân viên</th>
                  <th className="text-left py-4 px-6 font-bold" style={{ color: '#2B3674' }}>Vị trí</th>
                  <th className="text-left py-4 px-6 font-bold" style={{ color: '#2B3674' }}>Chi nhánh</th>
                  <th className="text-left py-4 px-6 font-bold" style={{ color: '#2B3674' }}>Trạng thái</th>
                  <th className="text-left py-4 px-6 font-bold" style={{ color: '#2B3674' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map(employee => (
                  <tr
                    key={employee.employeeid}
                    style={{ borderBottom: '1px solid #E0E5F2' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F4F7FE'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <AvatarCircle name={employee.fullname} />
                        <div>
                          <p className="font-bold text-sm" style={{ color: '#2B3674' }}>
                            {employee.fullname}
                          </p>
                          <p className="text-xs" style={{ color: '#8F9CB8' }}>
                            {employee.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className="inline-block px-3 py-1 rounded-lg text-xs font-semibold"
                        style={{
                          backgroundColor: '#EBF3FF',
                          color: '#4318FF'
                        }}
                      >
                        {employee.position}
                      </span>
                    </td>
                    <td className="py-4 px-6" style={{ color: '#8F9CB8' }}>
                      {getBranchName(employee)}
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge status={employee.status} />
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEditModal(employee)}
                          className="p-2 rounded-lg transition-colors"
                          style={{ backgroundColor: '#EBF3FF', color: '#4318FF' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D1E0FF'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#EBF3FF'}
                          title="Sửa"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleGrantAccount(employee)}
                          className="p-2 rounded-lg transition-colors"
                          style={{ backgroundColor: '#FFF7E6', color: '#FF9900' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FFE8CC'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFF7E6'}
                          title="Cấp tài khoản"
                        >
                          <UserPlus size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold" style={{ color: '#2B3674' }}>Thêm nhân viên mới</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-lg"
                style={{ backgroundColor: '#F4F7FE', color: '#2B3674' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#2B3674' }}>Tên nhân viên</label>
                <input
                  type="text"
                  value={formData.fullname}
                  onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg"
                  style={{ backgroundColor: '#F4F7FE', color: '#2B3674', border: '1px solid #E0E5F2' }}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#2B3674' }}>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg"
                  style={{ backgroundColor: '#F4F7FE', color: '#2B3674', border: '1px solid #E0E5F2' }}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#2B3674' }}>Số điện thoại</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg"
                  style={{ backgroundColor: '#F4F7FE', color: '#2B3674', border: '1px solid #E0E5F2' }}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#2B3674' }}>Vị trí</label>
                <select
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg"
                  style={{ backgroundColor: '#F4F7FE', color: '#2B3674', border: '1px solid #E0E5F2' }}
                >
                  <option value="Pha chế">Pha chế</option>
                  <option value="Phục vụ">Phục vụ</option>
                  <option value="Quản lý">Quản lý</option>
                  <option value="Bảo vệ">Bảo vệ</option>
                  <option value="Giao hàng">Giao hàng</option>
                  <option value="Kế toán">Kế toán</option>
                </select>
              </div>
              {isSuperAdmin && (
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#2B3674' }}>Chi nhánh</label>
                  <select
                    value={formData.branchid}
                    onChange={(e) => setFormData({ ...formData, branchid: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg"
                    style={{ backgroundColor: '#F4F7FE', color: '#2B3674', border: '1px solid #E0E5F2' }}
                  >
                    <option value="">Chọn chi nhánh</option>
                    {branches.map(branch => (
                      <option key={branch.branchid} value={branch.branchid}>{branch.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleAddEmployee}
                disabled={modalLoading}
                className="flex-1 px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                style={{ 
                  backgroundColor: modalLoading ? '#A3AED0' : '#4318FF', 
                  color: '#FFFFFF',
                  cursor: modalLoading ? 'not-allowed' : 'pointer',
                  opacity: modalLoading ? 0.7 : 1
                }}
              >
                {modalLoading ? (
                  <>
                    <Loader size={16} style={{ animation: 'spin 0.8s linear infinite' }} />
                    Đang xử lý...
                  </>
                ) : (
                  '✅ Thêm nhân viên'
                )}
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                disabled={modalLoading}
                className="flex-1 px-4 py-2 rounded-lg font-medium transition-all"
                style={{ 
                  backgroundColor: '#E0E5F2', 
                  color: '#2B3674',
                  opacity: modalLoading ? 0.5 : 1,
                  cursor: modalLoading ? 'not-allowed' : 'pointer'
                }}
              >
                Hủy
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* Edit Employee Modal */}
      {showEditModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold" style={{ color: '#2B3674' }}>Sửa thông tin nhân viên</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 rounded-lg"
                style={{ backgroundColor: '#F4F7FE', color: '#2B3674' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#2B3674' }}>Tên nhân viên</label>
                <input
                  type="text"
                  value={formData.fullname}
                  onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg"
                  style={{ backgroundColor: '#F4F7FE', color: '#2B3674', border: '1px solid #E0E5F2' }}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#2B3674' }}>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg"
                  style={{ backgroundColor: '#F4F7FE', color: '#2B3674', border: '1px solid #E0E5F2' }}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#2B3674' }}>Số điện thoại</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg"
                  style={{ backgroundColor: '#F4F7FE', color: '#2B3674', border: '1px solid #E0E5F2' }}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#2B3674' }}>Vị trí</label>
                <select
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg"
                  style={{ backgroundColor: '#F4F7FE', color: '#2B3674', border: '1px solid #E0E5F2' }}
                >
                  <option value="Pha chế">Pha chế</option>
                  <option value="Phục vụ">Phục vụ</option>
                  <option value="Quản lý">Quản lý</option>
                  <option value="Bảo vệ">Bảo vệ</option>
                  <option value="Giao hàng">Giao hàng</option>
                  <option value="Kế toán">Kế toán</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#2B3674' }}>Trạng thái</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg"
                  style={{ backgroundColor: '#F4F7FE', color: '#2B3674', border: '1px solid #E0E5F2' }}
                >
                  <option value="Đang làm">Đang làm</option>
                  <option value="Nghỉ việc">Nghỉ việc</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleUpdateEmployee}
                disabled={modalLoading}
                className="flex-1 px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                style={{ 
                  backgroundColor: modalLoading ? '#A3AED0' : '#4318FF', 
                  color: '#FFFFFF',
                  cursor: modalLoading ? 'not-allowed' : 'pointer',
                  opacity: modalLoading ? 0.7 : 1
                }}
              >
                {modalLoading ? (
                  <>
                    <Loader size={16} style={{ animation: 'spin 0.8s linear infinite' }} />
                    Đang xử lý...
                  </>
                ) : (
                  '✅ Lưu thay đổi'
                )}
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                disabled={modalLoading}
                className="flex-1 px-4 py-2 rounded-lg font-medium transition-all"
                style={{ 
                  backgroundColor: '#E0E5F2', 
                  color: '#2B3674',
                  opacity: modalLoading ? 0.5 : 1,
                  cursor: modalLoading ? 'not-allowed' : 'pointer'
                }}
              >
                Hủy
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* Grant Account Modal */}
      {showAccountModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold" style={{ color: '#2B3674' }}>Cấp tài khoản</h2>
              <button
                onClick={() => setShowAccountModal(false)}
                className="p-2 rounded-lg"
                style={{ backgroundColor: '#F4F7FE', color: '#2B3674' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div style={{ backgroundColor: '#EBF3FF', padding: '16px', borderRadius: '12px' }}>
                <p className="text-sm font-semibold mb-2" style={{ color: '#4318FF' }}>
                  Nhân viên: {selectedEmployee.fullname}
                </p>
                <p className="text-xs" style={{ color: '#8F9CB8' }}>
                  Email: {selectedEmployee.email}
                </p>
              </div>

              <div style={{ backgroundColor: '#FFF7E6', padding: '16px', borderRadius: '12px' }}>
                <p className="text-sm font-semibold mb-3" style={{ color: '#FF9900' }}>
                  📋 Hướng dẫn cấp tài khoản:
                </p>
                <ol className="text-xs space-y-2" style={{ color: '#8F9CB8' }}>
                  <li>1. Liên hệ Admin Supabase để tạo user trong Auth</li>
                  <li>2. Copy User ID (UUID) từ Supabase</li>
                  <li>3. Thêm bản ghi vào bảng accounts với accountid = UUID</li>
                  <li>4. Ghi rõ role (admin/manager/staff) và branchid</li>
                  <li>5. Lưu lại và thông báo tài khoản cho nhân viên</li>
                </ol>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#2B3674' }}>
                  User ID (Supabase Auth)
                </label>
                <input
                  type="text"
                  placeholder="UUID từ Supabase (a1b2c3d4...)"
                  className="w-full px-4 py-2 rounded-lg text-sm"
                  style={{ backgroundColor: '#F4F7FE', color: '#2B3674', border: '1px solid #E0E5F2' }}
                />
                <p className="text-xs mt-2" style={{ color: '#8F9CB8' }}>
                  💡 Hãy copy UUID từ Supabase Auth sau khi tạo user
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAccountModal(false)}
                className="flex-1 px-4 py-2 rounded-lg font-medium transition-all"
                style={{ backgroundColor: '#E0E5F2', color: '#2B3674' }}
              >
                Đóng
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
