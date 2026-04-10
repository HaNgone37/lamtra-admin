import React, { useState, useEffect } from 'react'
import { Card } from '@/components/Card'
import { branchService } from '@/services/branchService'
import { Branch } from '@/types'
import { Plus, MapPin, Navigation, X, Search, Trash2 } from 'lucide-react'

const StatusBadge = ({ isActive }: { isActive: boolean }) => {
  const bgColor = isActive ? '#E6FFFA' : '#F0F0F0'
  const textColor = isActive ? '#047857' : '#5A5A5A'
  const dotColor = isActive ? '#047857' : '#5A5A5A'
  const label = isActive ? 'Hoạt động' : 'Tạm nghỉ'

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

interface EditingBranch extends Branch {
  isEditing?: boolean
}

export const Branches: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [selectedBranch, setSelectedBranch] = useState<EditingBranch | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    longitude: 0,
    latitude: 0
  })

  useEffect(() => {
    loadBranches()
    const role = localStorage.getItem('userRole')
    setUserRole(role)
  }, [])

  const loadBranches = async () => {
    try {
      setLoading(true)
      const data = await branchService.getBranches()
      setBranches(data)
    } catch (error) {
      console.error('Error loading branches:', error)
      alert('Lỗi khi tải danh sách chi nhánh')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenEditModal = (branch: Branch) => {
    setSelectedBranch(branch)
    setFormData({
      name: branch.name,
      address: branch.address,
      longitude: branch.longitude,
      latitude: branch.latitude
    })
    setShowModal(true)
  }

  const handleOpenAddModal = () => {
    setFormData({
      name: '',
      address: '',
      longitude: 0,
      latitude: 0
    })
    setShowAddModal(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedBranch) return

    try {
      await branchService.updateBranch(String(selectedBranch.branchid), formData)
      await loadBranches()
      setShowModal(false)
      alert('Cập nhật chi nhánh thành công!')
    } catch (error) {
      console.error('Error updating branch:', error)
      alert('Lỗi khi cập nhật chi nhánh')
    }
  }

  const handleAddBranch = async () => {
    if (!formData.name || !formData.address) {
      alert('Vui lòng điền đầy đủ thông tin')
      return
    }

    try {
      await branchService.createBranch({
        name: formData.name,
        address: formData.address,
        longitude: formData.longitude,
        latitude: formData.latitude,
        isactive: true
      })
      await loadBranches()
      setShowAddModal(false)
      alert('Thêm chi nhánh thành công!')
    } catch (error) {
      console.error('Error creating branch:', error)
      alert('Lỗi khi thêm chi nhánh')
    }
  }

  const handleToggleStatus = async (branch: Branch) => {
    try {
      await branchService.toggleBranchStatus(String(branch.branchid), !branch.isactive)
      await loadBranches()
    } catch (error) {
      console.error('Error toggling branch status:', error)
      alert('Lỗi khi thay đổi trạng thái')
    }
  }

  const handleDeleteBranch = async () => {
    if (!selectedBranch) return

    try {
      setDeleteLoading(true)
      await branchService.deleteBranch(String(selectedBranch.branchid))
      await loadBranches()
      setShowDeleteConfirm(false)
      setSelectedBranch(null)
      alert('Xóa chi nhánh thành công!')
    } catch (error) {
      console.error('Error deleting branch:', error)
      alert('Lỗi khi xóa chi nhánh')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleOpenDeleteConfirm = (branch: Branch) => {
    setSelectedBranch(branch)
    setShowDeleteConfirm(true)
  }

  const handleOpenMaps = (address: string) => {
    const url = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(address)
    window.open(url, '_blank')
  }

  const filteredBranches = branches.filter(branch =>
    branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.address.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#2B3674' }}>Quản lý chi nhánh</h1>
          {/* <p style={{ color: '#8F9CB8' }}>Quản lý toàn bộ chi nhánh của hệ thống LAM TRÀ</p> */}
        </div>
        <button
          onClick={handleOpenAddModal}
          className="px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-all"
          style={{
            backgroundColor: '#4318FF',
            color: '#FFFFFF',
            boxShadow: 'rgba(67, 24, 255, 0.3) 0px 8px 16px'
          }}
          onMouseEnter={(e) => e.currentTarget.style.boxShadow = 'rgba(67, 24, 255, 0.5) 0px 12px 24px'}
          onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'rgba(67, 24, 255, 0.3) 0px 8px 16px'}
        >
          <Plus size={20} />
          Thêm chi nhánh mới
        </button>
      </div>

      {/* Search Bar */}
      <Card>
        <div className="relative">
          <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2" style={{ color: '#8F9CB8' }} />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc địa chỉ..."
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
      </Card>

      {/* Branches Table */}
      <Card>
        {loading ? (
          <div className="text-center py-12" style={{ color: '#8F9CB8' }}>
            Đang tải dữ liệu chi nhánh...
          </div>
        ) : filteredBranches.length === 0 ? (
          <div className="text-center py-12" style={{ color: '#8F9CB8' }}>
            Không tìm thấy chi nhánh
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '2px solid #E0E5F2', backgroundColor: '#F4F7FE' }}>
                  <th className="text-left py-4 px-6 font-bold" style={{ color: '#2B3674' }}>Tên chi nhánh</th>
                  <th className="text-left py-4 px-6 font-bold" style={{ color: '#2B3674' }}>Địa chỉ</th>
                  <th className="text-left py-4 px-6 font-bold" style={{ color: '#2B3674' }}>Vị trí (Maps)</th>
                  <th className="text-left py-4 px-6 font-bold" style={{ color: '#2B3674' }}>Trạng thái</th>
                  <th className="text-left py-4 px-6 font-bold" style={{ color: '#2B3674' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredBranches.map((branch) => (
                  <tr
                    key={branch.branchid}
                    style={{ borderBottom: '1px solid #E0E5F2' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F4F7FE'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td className="py-6 px-6">
                      <p className="font-bold text-sm" style={{ color: '#2B3674' }}>
                        {branch.name}
                      </p>
                    </td>
                    <td className="py-6 px-6">
                      <div className="flex items-start gap-2">
                        <MapPin size={16} style={{ color: '#8F9CB8', marginTop: '2px', flexShrink: 0 }} />
                        <p className="text-sm" style={{ color: '#8F9CB8' }}>
                          {branch.address}
                        </p>
                      </div>
                    </td>
                    <td className="py-6 px-6">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono" style={{ color: '#8F9CB8' }}>
                          {branch.latitude.toFixed(4)}, {branch.longitude.toFixed(4)}
                        </span>
                        <button
                          onClick={() => handleOpenMaps(branch.address)}
                          className="p-2 rounded-lg transition-colors"
                          style={{ backgroundColor: '#EBF3FF', color: '#4318FF' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D1E0FF'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#EBF3FF'}
                          title="Mở Google Maps"
                        >
                          <Navigation size={16} />
                        </button>
                      </div>
                    </td>
                    <td className="py-6 px-6">
                      <div className="flex items-center gap-2">
                        <StatusBadge isActive={branch.isactive} />
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={branch.isactive}
                            onChange={() => handleToggleStatus(branch)}
                            className="sr-only peer"
                          />
                          <div
                            className="w-11 h-6 rounded-full transition-all"
                            style={{
                              backgroundColor: branch.isactive ? '#4318FF' : '#D1DCEF'
                            }}
                          >
                            <div
                              className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-all"
                              style={{
                                backgroundColor: '#FFFFFF',
                                transform: branch.isactive ? 'translateX(1.2rem)' : 'translateX(0)'
                              }}
                            />
                          </div>
                        </label>
                      </div>
                    </td>
                    <td className="py-6 px-6">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEditModal(branch)}
                          className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                          style={{
                            backgroundColor: '#EBF3FF',
                            color: '#4318FF'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D1E0FF'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#EBF3FF'}
                        >
                          Sửa
                        </button>
                        {userRole?.toLowerCase() === 'super admin' && (
                          <button
                            onClick={() => handleOpenDeleteConfirm(branch)}
                            className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                            style={{
                              backgroundColor: '#FFE5E5',
                              color: '#E53E3E'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FFCCCC'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFE5E5'}
                            title="Xóa chi nhánh (chỉ Super Admin)"
                          >
                            <Trash2 size={16} />
                            Xóa
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Edit Modal */}
      {showModal && selectedBranch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold" style={{ color: '#2B3674' }}>Sửa chi nhánh</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg"
                style={{ backgroundColor: '#F4F7FE', color: '#2B3674' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              {/* Branch Name */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#2B3674' }}>
                  Tên chi nhánh
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg"
                  style={{ backgroundColor: '#F4F7FE', color: '#2B3674', border: '1px solid #E0E5F2' }}
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#2B3674' }}>
                  Địa chỉ
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg"
                  style={{ backgroundColor: '#F4F7FE', color: '#2B3674', border: '1px solid #E0E5F2' }}
                />
              </div>

              {/* Latitude */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#2B3674' }}>
                  Vĩ độ (Latitude)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 rounded-lg"
                  style={{ backgroundColor: '#F4F7FE', color: '#2B3674', border: '1px solid #E0E5F2' }}
                />
              </div>

              {/* Longitude */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#2B3674' }}>
                  Kinh độ (Longitude)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 rounded-lg"
                  style={{ backgroundColor: '#F4F7FE', color: '#2B3674', border: '1px solid #E0E5F2' }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleSaveEdit}
                className="flex-1 px-4 py-2 rounded-lg font-medium transition-all"
                style={{
                  backgroundColor: '#4318FF',
                  color: '#FFFFFF'
                }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = 'rgba(67, 24, 255, 0.3) 0px 8px 16px'}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
              >
                Lưu thay đổi
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 rounded-lg font-medium transition-all"
                style={{ backgroundColor: '#E0E5F2', color: '#2B3674' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D1DCEF'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#E0E5F2'}
              >
                Hủy
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* Add Branch Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold" style={{ color: '#2B3674' }}>Thêm chi nhánh mới</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-lg"
                style={{ backgroundColor: '#F4F7FE', color: '#2B3674' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              {/* Branch Name */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#2B3674' }}>
                  Tên chi nhánh
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg"
                  style={{ backgroundColor: '#F4F7FE', color: '#2B3674', border: '1px solid #E0E5F2' }}
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#2B3674' }}>
                  Địa chỉ
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg"
                  style={{ backgroundColor: '#F4F7FE', color: '#2B3674', border: '1px solid #E0E5F2' }}
                />
              </div>

              {/* Latitude */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#2B3674' }}>
                  Vĩ độ (Latitude)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 rounded-lg"
                  style={{ backgroundColor: '#F4F7FE', color: '#2B3674', border: '1px solid #E0E5F2' }}
                />
              </div>

              {/* Longitude */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#2B3674' }}>
                  Kinh độ (Longitude)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 rounded-lg"
                  style={{ backgroundColor: '#F4F7FE', color: '#2B3674', border: '1px solid #E0E5F2' }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleAddBranch}
                className="flex-1 px-4 py-2 rounded-lg font-medium transition-all"
                style={{
                  backgroundColor: '#4318FF',
                  color: '#FFFFFF'
                }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = 'rgba(67, 24, 255, 0.3) 0px 8px 16px'}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
              >
                Thêm chi nhánh
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 rounded-lg font-medium transition-all"
                style={{ backgroundColor: '#E0E5F2', color: '#2B3674' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D1DCEF'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#E0E5F2'}
              >
                Hủy
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedBranch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold" style={{ color: '#2B3674' }}>Xác nhận xóa</h2>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="p-2 rounded-lg"
                style={{ backgroundColor: '#F4F7FE', color: '#2B3674' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-6">
              <p style={{ color: '#8F9CB8', marginBottom: '12px' }}>
                Bạn có chắc chắn muốn xóa chi nhánh <strong style={{ color: '#2B3674' }}>{selectedBranch.name}</strong> không?
              </p>
              <p style={{ color: '#E53E3E', fontSize: '13px', fontWeight: '600' }}>
                ⚠️ Hành động này không thể hoàn tác. Vui lòng đảm bảo rằng chi nhánh không có dữ liệu quan trọng.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleDeleteBranch}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50"
                style={{
                  backgroundColor: '#E53E3E',
                  color: '#FFFFFF'
                }}
                onMouseEnter={(e) => !deleteLoading && (e.currentTarget.style.backgroundColor = '#C53030')}
                onMouseLeave={(e) => !deleteLoading && (e.currentTarget.style.backgroundColor = '#E53E3E')}
              >
                {deleteLoading ? 'Đang xóa...' : 'Xóa chi nhánh'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50"
                style={{ backgroundColor: '#E0E5F2', color: '#2B3674' }}
                onMouseEnter={(e) => !deleteLoading && (e.currentTarget.style.backgroundColor = '#D1DCEF')}
                onMouseLeave={(e) => !deleteLoading && (e.currentTarget.style.backgroundColor = '#E0E5F2')}
              >
                Hủy
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
