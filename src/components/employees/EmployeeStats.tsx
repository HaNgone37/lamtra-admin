import React from 'react'
import { Users, UserCheck, UserPlus } from 'lucide-react'

interface StatsData {
  totalEmployees: number
  activeEmployees: number
  newThisMonth: number
}

interface EmployeeStatsProps {
  stats: StatsData
}

const EmployeeStats: React.FC<EmployeeStatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Card 1: Total Employees */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm font-medium">Tổng Nhân Viên</p>
            <p className="text-4xl font-bold text-gray-900 mt-3">{stats.totalEmployees}</p>
            <p className="text-xs text-gray-400 font-light tracking-wide mt-2">Tổng số nhân sự</p>
          </div>
          <div className="bg-blue-100 p-4 rounded-full">
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Card 2: Active Employees */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm font-medium">Đang Làm Việc</p>
            <p className="text-4xl font-bold text-gray-900 mt-3">{stats.activeEmployees}</p>
            <p className="text-xs text-gray-400 font-light tracking-wide mt-2">Nhân viên đang trực</p>
          </div>
          <div className="bg-green-100 p-4 rounded-full">
            <UserCheck className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Card 3: New This Month */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm font-medium">Nhân Sự Mới</p>
            <p className="text-4xl font-bold text-gray-900 mt-3">{stats.newThisMonth}</p>
            <p className="text-xs text-gray-400 font-light tracking-wide mt-2">Gia nhập tháng này</p>
          </div>
          <div className="bg-purple-100 p-4 rounded-full">
            <UserPlus className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmployeeStats
