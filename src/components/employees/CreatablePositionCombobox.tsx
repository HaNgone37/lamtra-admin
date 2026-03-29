import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Plus } from 'lucide-react'

interface CreatablePositionComboboxProps {
  value: string
  onChange: (value: string) => void
  options: string[]
  placeholder?: string
}

const CreatablePositionCombobox: React.FC<CreatablePositionComboboxProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Chọn hoặc gõ chức vụ',
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState(value)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Update inputValue when external value changes
  useEffect(() => {
    setInputValue(value)
  }, [value])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex !== -1 && listRef.current) {
      const items = listRef.current.querySelectorAll('[data-index]')
      if (items[highlightedIndex]) {
        items[highlightedIndex].scrollIntoView({ block: 'nearest' })
      }
    }
  }, [highlightedIndex])

  // Filter logic: always show all options, plus "Thêm mới" if input doesn't match
  const matchedOptions = options.filter(opt =>
    opt.toLowerCase().includes(inputValue.toLowerCase())
  )

  const isNewValue = inputValue.trim() && !options.some(opt => opt.toLowerCase() === inputValue.toLowerCase())

  const displayOptions = [
    ...matchedOptions,
    ...(isNewValue ? [`__NEW__${inputValue}`] : []),
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    setHighlightedIndex(-1)
    setIsOpen(true)
  }

  const handleInputFocus = () => {
    setIsOpen(true)
    setHighlightedIndex(-1)
  }

  const handleSelectOption = (option: string) => {
    if (option.startsWith('__NEW__')) {
      const newValue = option.replace('__NEW__', '')
      onChange(newValue)
      setInputValue(newValue)
    } else {
      onChange(option)
      setInputValue(option)
    }
    setIsOpen(false)
    setHighlightedIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && ['ArrowDown', 'ArrowUp', 'Enter'].includes(e.key)) {
      setIsOpen(true)
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => (prev + 1) % displayOptions.length)
        break

      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => (prev - 1 + displayOptions.length) % displayOptions.length)
        break

      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && displayOptions[highlightedIndex]) {
          handleSelectOption(displayOptions[highlightedIndex])
        } else if (isNewValue && inputValue.trim()) {
          handleSelectOption(`__NEW__${inputValue}`)
        }
        break

      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        break

      case 'Tab':
        setIsOpen(false)
        break

      default:
        break
    }
  }

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Input Field - Đồng bộ với Chi Nhánh */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-[12px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white text-gray-900 text-sm"
        />
        {/* Chevron Icon - Màu xám đậm */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <ChevronDown
            className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </div>

      {/* Dropdown Menu - Đơn giản và thanh mảnh */}
      {isOpen && displayOptions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-md">
          <div
            ref={listRef}
            className="max-h-60 overflow-y-auto"
          >
            {displayOptions.map((option, index) => {
              const isNew = option.startsWith('__NEW__')
              const displayValue = isNew ? option.replace('__NEW__', '') : option
              const isHighlighted = index === highlightedIndex

              return (
                <button
                  key={`${option}-${index}`}
                  data-index={index}
                  onClick={() => handleSelectOption(option)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`w-full px-4 py-3 text-left transition-colors flex items-center gap-3 ${
                    isHighlighted
                      ? 'bg-slate-100 text-gray-900'
                      : 'text-gray-700 hover:bg-slate-100'
                  } ${index < displayOptions.length - 1 ? 'border-b border-gray-100' : ''}`}
                  type="button"
                >
                  {isNew ? (
                    <>
                      <Plus className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      <span className="text-sm">
                        <span className="font-medium">Thêm mới:</span>{' '}
                        <span className="text-blue-600">{displayValue}</span>
                      </span>
                    </>
                  ) : (
                    <span className="text-sm">{displayValue}</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {isOpen && displayOptions.length === 0 && inputValue.trim() !== '' && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-md">
          <div className="px-4 py-3 text-center text-gray-500 text-sm">
            Không tìm thấy kết quả phù hợp
          </div>
        </div>
      )}
    </div>
  )
}

export default CreatablePositionCombobox
