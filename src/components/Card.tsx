import React from 'react'

interface CardProps {
  title?: string
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  noPadding?: boolean
}

/**
 * Card Component - Horizon UI Style
 * - Background: #FFFFFF
 * - Border: #E0E5F2
 * - Border Radius: 20px
 * - Shadow: rgba(112, 144, 176, 0.08) 0px 18px 40px
 */
export const Card: React.FC<CardProps> = ({
  title,
  children,
  className = '',
  noPadding = false
}) => {
  return (
    <div
      className={`rounded-3xl border transition-all duration-200 hover:shadow-lg ${
        noPadding ? '' : 'p-6 sm:p-8'
      } ${className}`}
      style={{
        backgroundColor: '#FFFFFF',
        borderColor: '#E0E5F2',
        boxShadow: 'rgba(112, 144, 176, 0.08) 0px 18px 40px'
      }}
    >
      {title && (
        <h2
          className="text-xl font-bold mb-6"
          style={{ color: '#2B3674' }}
        >
          {title}
        </h2>
      )}
      {children}
    </div>
  )
}

interface StatsCardProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  color?: 'blue' | 'green' | 'yellow' | 'purple' | 'red' | 'orange'
  trend?: {
    value: number
    direction: 'up' | 'down'
  }
}

/**
 * StatsCard Component - For KPIs
 */
export const StatsCard: React.FC<StatsCardProps> = ({
  label,
  value,
  icon,
  color = 'blue',
  trend
}) => {
  const colorConfigs = {
    blue: { bg: '#EBF3FF', border: '#D1E0FF', text: '#4318FF' },
    green: { bg: '#EDFCF3', border: '#C8F7DC', text: '#00A869' },
    yellow: { bg: '#FFF7E6', border: '#FFDBA3', text: '#FF9900' },
    purple: { bg: '#F3E5FF', border: '#E0C3FF', text: '#7C3AED' },
    red: { bg: '#FFE5E5', border: '#FFB3B3', text: '#FF4444' },
    orange: { bg: '#FFEBDC', border: '#FFCCAA', text: '#FF8C00' }
  }

  const config = colorConfigs[color]

  return (
    <Card className="hover:shadow-xl">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-2">{label}</p>
          <div className="flex items-end gap-2">
            <p className="text-4xl font-bold" style={{ color: '#2B3674' }}>
              {value}
            </p>
            {trend && (
              <span
                className={`text-xs font-bold px-2 py-1 rounded-md mb-1 ${
                  trend.direction === 'up' ? 'text-green-700' : 'text-red-700'
                }`}
                style={{
                  backgroundColor:
                    trend.direction === 'up' ? '#EDFCF3' : '#FFE5E5'
                }}
              >
                {trend.direction === 'up' ? '↑' : '↓'} {Math.abs(
                  trend.value
                )}%
              </span>
            )}
          </div>
        </div>

        {icon && (
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{
              backgroundColor: config.bg,
              border: `2px solid ${config.border}`
            }}
          >
            <div style={{ color: config.text }}>{icon}</div>
          </div>
        )}
      </div>
    </Card>
  )
}

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

/**
 * EmptyState Component
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action
}) => {
  return (
    <Card className="text-center py-12">
      {icon && <div className="mb-4 text-4xl opacity-50">{icon}</div>}
      <h3 className="text-lg font-bold mb-2" style={{ color: '#2B3674' }}>
        {title}
      </h3>
      <p className="text-gray-600 mb-4">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 rounded-lg font-medium text-white transition-all"
          style={{ backgroundColor: '#4318FF' }}
        >
          {action.label}
        </button>
      )}
    </Card>
  )
}
