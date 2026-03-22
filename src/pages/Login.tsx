import React, { useState } from 'react'
import { useAuth } from '@/services/AuthContext'
import { Lock, Mail, AlertCircle, Loader } from 'lucide-react'

export const Login: React.FC = () => {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
    } catch (err: any) {
      setError(err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra email và mật khẩu.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-0 right-0 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      
      <div className="relative z-10 w-full max-w-md">
        {/* Card */}
        <div className="bg-white backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-4">
              <span className="text-2xl">⏳</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">LAM TRÀ Admin</h1>
            <p className="text-gray-600 text-sm">Hệ thống quản lý chuỗi cửa hàng đồ uống</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@lamtra.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors bg-gray-50 hover:bg-white"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors bg-gray-50 hover:bg-white"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold py-3 rounded-xl hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Đang đăng nhập...
                </>
              ) : (
                'Đăng nhập'
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-gray-600 text-sm mt-6">
            © 2024 LAM TRÀ System. All rights reserved.
          </p>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-white/20 backdrop-blur-lg rounded-xl p-4 text-white text-sm">
          <p className="font-semibold mb-2">🔐 Demo Credentials:</p>
          <p>Email: admin@lamtra.com</p>
          <p>Password: (contact administrator)</p>
        </div>
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  )
}
