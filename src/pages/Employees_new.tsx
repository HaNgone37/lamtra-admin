import React, { useState, useEffect } from 'react'
import { Card } from '@/components/Card'
import { EmployeeFormData } from '@/services/employeeService'
import { Branch } from '@/types'
import { Plus, Edit2, UserPlus, X, Search, ChevronDown } from 'lucide-react'
import { supabase } from '@/utils/supabaseClient'

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
  const bgColor = status === 'active' ? '#E6FFFA' : '#F0F0F0'
  const textColor = status === 'active' ? '#047857' : '#5A5A5A'
  const dotColor = status === 'active' ? '#047857' : '#5A5A5A'
  const label = status === 'active' ? '─Éang l├ám' : 'Nghß╗ë viß╗çc'

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
        <div className="text-4xl" style={{ color: '#4318FF', opacity: 0.1 }}>ΓåÆ</div>
      </div>
    </div>
  </Card>
)

export const Employees: React.FC = () => {
  const [employees, setEmployees] = useState<EmployeeWithBranch[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>('all')
  const [stats, setStats] = useState({ totalEmployees: 0, totalBranches: 0, newEmployeesThisMonth: 0 })
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAccountModal, setShowAccountModal] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeWithBranch | null>(null)
  const [formData, setFormData] = useState<EmployeeFormData>({
    fullname: '',
    email: '',
    phone: '',
    position: 'barista',
    branchid: '',
    status: 'active'
  })

  const getUserFromStorage = () => {
    try {
      const userStr = localStorage.getItem('user')
      return userStr ? JSON.parse(userStr) : null
    } catch (e) {
      console.error('Γ¥î Lß╗ùi parse user tß╗½ localStorage:', e)
      return null
    }
  }
  
  const currentUser = getUserFromStorage()
  const userRole = currentUser?.role || 'staff'
  const userBranchId = currentUser?.branchid || ''
  const isSuperAdmin = userRole?.toLowerCase().replace(/\s/g, '') === 'superadmin'

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      console.log('=== ≡ƒÜÇ Bß║«T ─Éß║ªU Tß║óI Dß╗« LIß╗åU ===')
      console.log('≡ƒæñ User tß╗½ localStorage:', currentUser)
      console.log('≡ƒöÉ Raw Role:', userRole)
      console.log('Γ£à isSuperAdmin:', isSuperAdmin)
      console.log('≡ƒÅó userBranchId:', userBranchId)
      
      let branchData: Branch[] = []
      try {
        const { data: branchesData, error: branchesError } = await supabase
          .from('branches')
          .select('*')
          .order('name', { ascending: true })
        
        if (branchesError) {
          console.error('Γ¥î [BRANCHES]:', branchesError)
        } else {
          branchData = branchesData || []
          console.log(`Γ£à [BRANCHES] ${branchData.length} chi nh├ính`)
        }
        setBranches(branchData)
      } catch (err) {
        console.error('Γ¥î [BRANCHES]:', err)
        setBranches([])
      }

      let empData: EmployeeWithBranch[] = []
      try {
        let query = supabase
          .from('employees')
          .select('*, branches(name)')
          .order('fullname', { ascending: true })
        
        if (isSuperAdmin) {
          console.log('≡ƒöæ [SUPER ADMIN] - Lß║Ñy Tß║ñT Cß║ó')
        } else {
          if (!userBranchId) {
            console.warn('ΓÜá∩╕Å Branch ID trß╗æng!')
            empData = []
          } else {
            console.log(`≡ƒæñ [BRANCH MANAGER] Filter branchid = ${userBranchId}`)
            query = query.eq('branchid', userBranchId)
          }
        }

        if (!isSuperAdmin && !userBranchId) {
          empData = []
        } else {
          const { data, error } = await query
          if (error) {
            console.error('Γ¥î [QUERY]:', error)
          } else {
            console.log('≡ƒôª Dß╗» liß╗çu nh├ón vi├¬n th├┤ tß╗½ DB:', data)
            empData = data || []
            console.log(`Γ£à [EMPLOYEES] ${empData.length} nh├ón vi├¬n`)
          }
        }

        console.log(`≡ƒôè setEmployees(${empData.length})`)
        setEmployees(empData)
        empData.forEach((e, idx) => {
          const branchName = Array.isArray(e.branches) ? e.branches[0]?.name : e.branches?.name
          console.log(`  [${idx+1}] ${e.fullname} | ${e.position} | ${branchName}`)
        })
        
      } catch (err) {
        console.error('Γ¥î [EMPLOYEES]:', err)
        setEmployees([])
      }

      const totalEmployees = empData.length
      const totalBranches = branchData.length
      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()
      const newEmployeesThisMonth = empData.filter(emp => {
        if (!emp.created_at) return false
        const createdDate = new Date(emp.created_at)
        return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear
      }).length
      
      console.log('≡ƒôê Stats:', { totalEmployees, totalBranches, newEmployeesThisMonth })
      setStats({ totalEmployees, totalBranches, newEmployeesThisMonth })
      
    } catch (error) {
      console.error('Γ¥î [FATAL]:', error)
      setEmployees([])
      setBranches([])
    } finally {
      setLoading(false)
    }
  }

  const handleOpenAddModal = () => {
    setFormData({
      fullname: '',
      email: '',
      phone: '',
      position: 'barista',
      branchid: isSuperAdmin ? '' : userBranchId,
      status: 'active'
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
      alert('Vui l├▓ng ─æiß╗ün ─æß║ºy ─æß╗º')
      return
    }
    try {
      const { error } = await supabase.from('employees').insert([{
        fullname: formData.fullname,
        email: formData.email,
        phone: formData.phone,
        position: formData.position,
        branchid: formData.branchid,
        status: formData.status || 'active'
      }])
      if (error) throw error
      await loadData()
      setShowAddModal(false)
      alert('Th├¬m th├ánh c├┤ng!')
    } catch (error) {
      console.error('Error:', error)
      alert('Lß╗ùi')
    }
  }

  const handleUpdateEmployee = async () => {
    if (!selectedEmployee) return
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
      await loadData()
      setShowEditModal(false)
      alert('Cß║¡p nhß║¡p th├ánh c├┤ng!')
    } catch (error) {
      console.error('Error:', error)
      alert('Lß╗ùi')
    }
  }

  const handleGrantAccount = (employee: EmployeeWithBranch) => {
    setSelectedEmployee(employee)
    setShowAccountModal(true)
  }

  const filteredEmployees = employees.filter(emp => {
    const matchSearch = emp.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase())
    if (!matchSearch) return false
    if (isSuperAdmin && selectedBranchFilter === 'all') return true
    const matchBranch = selectedBranchFilter === 'all' || emp.branchid === selectedBranchFilter
    return matchBranch
  })

  const getBranchName = (emp: EmployeeWithBranch): string => {
    if (!emp.branches) return 'N/A'
    const branchObj = Array.isArray(emp.branches) ? emp.branches[0] : emp.branches
    return branchObj?.name || 'N/A'
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#2B3674' }}>Quß║ún l├╜ nh├ón sß╗▒</h1>
          <p style={{ color: '#8F9CB8' }}>{isSuperAdmin ? 'To├án bß╗Ö nh├ón sß╗▒' : 'Nh├ón sß╗▒ chi nh├ính'}</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="px-6 py-3 rounded-lg font-medium flex items-center gap-2"
          style={{ backgroundColor: '#4318FF', color: '#FFFFFF' }}
        >
          <Plus size={20} /> Th├¬m nh├ón vi├¬n
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Tß╗òng nh├ón sß╗▒" value={stats.totalEmployees} subtext="to├án hß╗ç thß╗æng" />
        <StatCard title="Chi nh├ính" value={stats.totalBranches} subtext="─æiß╗âm kinh doanh" />
        <StatCard title="Nh├ón sß╗▒ mß╗¢i" value={stats.newEmployeesThisMonth} subtext="th├íng n├áy" />
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#8F9CB8' }} />
            <input
              type="text"
              placeholder="T├¼m theo t├¬n hoß║╖c email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-lg text-sm"
              style={{ backgroundColor: '#F4F7FE', color: '#2B3674' }}
            />
          </div>
          {isSuperAdmin && branches.length > 0 && (
            <div className="relative">
              <select
                value={selectedBranchFilter}
                onChange={(e) => setSelectedBranchFilter(e.target.value)}
                className="w-full px-4 py-3 rounded-lg text-sm appearance-none pr-10"
                style={{ backgroundColor: '#F4F7FE', color: '#2B3674' }}
              >
                <option value="all">Tß║Ñt cß║ú chi nh├ính</option>
                {branches.map(branch => (
                  <option key={branch.branchid} value={branch.branchid}>{branch.name}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#2B3674' }} />
            </div>
          )}
        </div>
      </Card>

      <Card>
        {loading ? (
          <div className="text-center py-12" style={{ color: '#8F9CB8' }}>─Éang tß║úi...</div>
        ) : filteredEmployees.length === 0 ? (
          <div className="text-center py-12" style={{ color: '#8F9CB8' }}>Kh├┤ng t├¼m thß║Ñy</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '2px solid #E0E5F2' }}>
                  <th className="text-left py-4 px-6 font-bold" style={{ color: '#2B3674' }}>Nh├ón vi├¬n</th>
                  <th className="text-left py-4 px-6 font-bold" style={{ color: '#2B3674' }}>Vß╗ï tr├¡</th>
                  <th className="text-left py-4 px-6 font-bold" style={{ color: '#2B3674' }}>Chi nh├ính</th>
                  <th className="text-left py-4 px-6 font-bold" style={{ color: '#2B3674' }}>Trß║íng th├íi</th>
                  <th className="text-left py-4 px-6 font-bold" style={{ color: '#2B3674' }}>Thao t├íc</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map(employee => (
                  <tr key={employee.employeeid} style={{ borderBottom: '1px solid #E0E5F2' }}>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <AvatarCircle name={employee.fullname} />
                        <div>
                          <p className="font-bold text-sm" style={{ color: '#2B3674' }}>{employee.fullname}</p>
                          <p className="text-xs" style={{ color: '#8F9CB8' }}>{employee.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-3 py-1 rounded-lg text-xs font-semibold" style={{ backgroundColor: '#EBF3FF', color: '#4318FF' }}>
                        {employee.position}
                      </span>
                    </td>
                    <td className="py-4 px-6" style={{ color: '#8F9CB8' }}>{getBranchName(employee)}</td>
                    <td className="py-4 px-6"><StatusBadge status={employee.status} /></td>
                    <td className="py-4 px-6">
                      <div className="flex gap-2">
                        <button onClick={() => handleOpenEditModal(employee)} className="p-2 rounded-lg" style={{ backgroundColor: '#EBF3FF', color: '#4318FF' }}>
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleGrantAccount(employee)} className="p-2 rounded-lg" style={{ backgroundColor: '#FFF7E6', color: '#FF9900' }}>
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

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold" style={{ color: '#2B3674' }}>Th├¬m nh├ón vi├¬n</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2" style={{ backgroundColor: '#F4F7FE' }}><X size={20} /></button>
            </div>
            <div className="space-y-4 mb-6">
              <input type="text" placeholder="T├¬n" value={formData.fullname} onChange={(e) => setFormData({ ...formData, fullname: e.target.value })} className="w-full px-4 py-2 rounded-lg" style={{ backgroundColor: '#F4F7FE' }} />
              <input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-2 rounded-lg" style={{ backgroundColor: '#F4F7FE' }} />
              <input type="tel" placeholder="Sß╗æ ─æiß╗çn thoß║íi" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-2 rounded-lg" style={{ backgroundColor: '#F4F7FE' }} />
              <select value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} className="w-full px-4 py-2 rounded-lg" style={{ backgroundColor: '#F4F7FE' }}>
                <option value="barista">Pha chß║┐</option>
                <option value="manager">Quß║ún l├╜</option>
              </select>
              {isSuperAdmin && (
                <select value={formData.branchid} onChange={(e) => setFormData({ ...formData, branchid: e.target.value })} className="w-full px-4 py-2 rounded-lg" style={{ backgroundColor: '#F4F7FE' }}>
                  <option value="">Chß╗ìn chi nh├ính</option>
                  {branches.map(b => <option key={b.branchid} value={b.branchid}>{b.name}</option>)}
                </select>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={handleAddEmployee} className="flex-1 px-4 py-2 rounded-lg" style={{ backgroundColor: '#4318FF', color: '#fff' }}>Th├¬m</button>
              <button onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2 rounded-lg" style={{ backgroundColor: '#E0E5F2' }}>Hß╗ºy</button>
            </div>
          </Card>
        </div>
      )}

      {showEditModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold" style={{ color: '#2B3674' }}>Sß╗¡a nh├ón vi├¬n</h2>
              <button onClick={() => setShowEditModal(false)} className="p-2" style={{ backgroundColor: '#F4F7FE' }}><X size={20} /></button>
            </div>
            <div className="space-y-4 mb-6">
              <input type="text" value={formData.fullname} onChange={(e) => setFormData({ ...formData, fullname: e.target.value })} className="w-full px-4 py-2 rounded-lg" style={{ backgroundColor: '#F4F7FE' }} />
              <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-2 rounded-lg" style={{ backgroundColor: '#F4F7FE' }} />
              <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-2 rounded-lg" style={{ backgroundColor: '#F4F7FE' }} />
              <select value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} className="w-full px-4 py-2 rounded-lg" style={{ backgroundColor: '#F4F7FE' }}>
                <option value="barista">Pha chß║┐</option>
                <option value="manager">Quß║ún l├╜</option>
              </select>
              <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-4 py-2 rounded-lg" style={{ backgroundColor: '#F4F7FE' }}>
                <option value="active">─Éang l├ám</option>
                <option value="inactive">Nghß╗ë viß╗çc</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button onClick={handleUpdateEmployee} className="flex-1 px-4 py-2 rounded-lg" style={{ backgroundColor: '#4318FF', color: '#fff' }}>L╞░u</button>
              <button onClick={() => setShowEditModal(false)} className="flex-1 px-4 py-2 rounded-lg" style={{ backgroundColor: '#E0E5F2' }}>Hß╗ºy</button>
            </div>
          </Card>
        </div>
      )}

      {showAccountModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold" style={{ color: '#2B3674' }}>Cß║Ñp t├ái khoß║ún</h2>
              <button onClick={() => setShowAccountModal(false)} className="p-2" style={{ backgroundColor: '#F4F7FE' }}><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div style={{ backgroundColor: '#EBF3FF', padding: '16px', borderRadius: '12px' }}>
                <p style={{ color: '#4318FF', fontWeight: 'bold' }}>Nh├ón vi├¬n: {selectedEmployee.fullname}</p>
                <p style={{ color: '#8F9CB8', fontSize: '12px' }}>Email: {selectedEmployee.email}</p>
              </div>
              <button onClick={() => setShowAccountModal(false)} className="w-full px-4 py-2 rounded-lg" style={{ backgroundColor: '#E0E5F2' }}>─É├│ng</button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}