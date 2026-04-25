import React, { useState, useRef, useEffect } from 'react'
import { autocompleteGoongAddress, getGoongPlaceDetail, calculateDistanceGoong } from '@/utils/geoUtils'

const PINK_PRIMARY = '#f06192'
const PINK_LIGHT = '#f5d5e0'
const BORDER_LIGHT = '#f5d5e0'
const TEXT_NAVY = '#1e293b' // Navy dark - ensures visibility
const GRAY_TEXT = '#666666'
const GRAY_DARK = '#333333'
const PLACEHOLDER_GRAY = '#a8a8a8' // Muted placeholder text

interface DeliveryAddressInputProps {
  branchLatitude: number
  branchLongitude: number
  onAddressSelect: (
    latitude: number,
    longitude: number,
    formattedAddress: string,
    distanceKm: number
  ) => void
}

interface AutocompleteResult {
  description: string
  place_id: string
  main_text: string
  secondary_text?: string
}

export const DeliveryAddressInput: React.FC<DeliveryAddressInputProps> = ({
  branchLatitude,
  branchLongitude,
  onAddressSelect
}) => {
  // Single input for full address (e.g., "94 ngõ 580 Trường Chinh")
  const [addressInput, setAddressInput] = useState('')
  const [suggestions, setSuggestions] = useState<AutocompleteResult[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  // Selected location coordinates from Goong
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [distanceKm, setDistanceKm] = useState<number | null>(null)
  const [loadingDistance, setLoadingDistance] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced search - 300ms
  const handleAddressChange = (value: string) => {
    setAddressInput(value)

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    if (value.length < 3) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    setIsSearching(true)
    setShowSuggestions(true)

    timeoutRef.current = setTimeout(async () => {
      try {
        const results = await autocompleteGoongAddress(value)
        setSuggestions(results)
        setShowSuggestions(results.length > 0)
      } catch (error) {
        console.error('[DeliveryAddressInput] Search failed:', error)
        setSuggestions([])
        setShowSuggestions(false)
      } finally {
        setIsSearching(false)
      }
    }, 300)
  }

  // Handle suggestion selection
  const handleSelectSuggestion = async (suggestion: AutocompleteResult) => {
    // Update input with full address from suggestion
    setAddressInput(suggestion.description)
    setShowSuggestions(false)
    setLoadingDistance(true)

    try {
      // Step 1: Get place details (coordinates)
      const details = await getGoongPlaceDetail(suggestion.place_id)
      if (!details) {
        console.error('[DeliveryAddressInput] Failed to get place details')
        setLoadingDistance(false)
        return
      }

      setSelectedLocation(details)

      // Step 2: Calculate distance from branch
      const distance = await calculateDistanceGoong(
        branchLatitude,
        branchLongitude,
        details.lat,
        details.lng
      )

      setDistanceKm(distance)

      console.log('═════════════════════════════════════════════════════════')
      console.log('✓ ĐỊA CHỈ GIAO HÀNG ĐÃ CHỌN (Goong Maps)')
      console.log('═════════════════════════════════════════════════════════')
      console.log(`Gợi ý được chọn: ${suggestion.description}`)
      console.log(`Tọa độ: ${details.lat.toFixed(4)}, ${details.lng.toFixed(4)}`)
      console.log(`Khoảng cách (đường đi): ${distance.toFixed(2)} km`)
      console.log('═════════════════════════════════════════════════════════')

      // Trigger callback with full suggestion address + coordinates
      onAddressSelect(details.lat, details.lng, suggestion.description, distance)
    } catch (error) {
      console.error('[DeliveryAddressInput] Error processing selection:', error)
    } finally {
      setLoadingDistance(false)
    }
  }

  return (
    <div
      ref={containerRef}
      style={{
        marginBottom: '28px',
        position: 'relative'
      }}
    >
      <style>{`
        input::placeholder {
          color: ${PLACEHOLDER_GRAY};
          opacity: 0.7;
        }
        input::-webkit-input-placeholder {
          color: ${PLACEHOLDER_GRAY};
          opacity: 0.7;
        }
        input::-moz-placeholder {
          color: ${PLACEHOLDER_GRAY};
          opacity: 0.7;
        }
      `}</style>
      {/* Single Input Container */}
      <div
        style={{
          position: 'relative',
          border: `2px solid ${isFocused ? PINK_PRIMARY : BORDER_LIGHT}`,
          borderRadius: '16px',
          backgroundColor: '#FFFFFF',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          boxShadow: isFocused ? `0 0 0 3px ${PINK_LIGHT}` : 'none'
        }}
      >
        <input
          type="text"
          placeholder="Nhập địa chỉ giao hàng (Số nhà, ngõ, đường...)"
          value={addressInput}
          onChange={(e) => handleAddressChange(e.target.value)}
          onFocus={() => {
            setIsFocused(true)
            if (suggestions.length > 0) {
              setShowSuggestions(true)
            }
          }}
          onBlur={() => {
            setIsFocused(false)
            // Update parent with current selection if exists
            if (selectedLocation && distanceKm !== null) {
              onAddressSelect(selectedLocation.lat, selectedLocation.lng, addressInput, distanceKm)
            }
          }}
          style={{
            width: '100%',
            border: 'none',
            outline: 'none',
            fontSize: '14px',
            fontFamily: 'Be Vietnam Pro, sans-serif',
            backgroundColor: 'transparent',
            color: GRAY_DARK,
            padding: '14px 16px',
            margin: 0,
            boxSizing: 'border-box'
          }}
        />

        {/* Dropdown Suggestions - FIXED TEXT VISIBILITY */}
        {showSuggestions && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              backgroundColor: '#FFFFFF',
              border: `1px solid ${BORDER_LIGHT}`,
              borderTop: 'none',
              borderBottomLeftRadius: '12px',
              borderBottomRightRadius: '12px',
              maxHeight: '320px',
              overflowY: 'auto',
              overflowX: 'hidden',
              zIndex: 9999,
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.16)',
              marginTop: '-1px'
            }}
          >
            {isSearching && (
              <div
                style={{
                  padding: '16px 16px',
                  color: GRAY_TEXT,
                  fontSize: '13px',
                  textAlign: 'center',
                  fontFamily: 'Be Vietnam Pro, sans-serif'
                }}
              >
                Đang tìm kiếm...
              </div>
            )}

            {!isSearching && suggestions.length === 0 && (
              <div
                style={{
                  padding: '16px 16px',
                  color: GRAY_TEXT,
                  fontSize: '13px',
                  textAlign: 'center',
                  fontFamily: 'Be Vietnam Pro, sans-serif'
                }}
              >
                Không tìm thấy kết quả
              </div>
            )}

            {suggestions.map((suggestion, idx) => (
              <div
                key={idx}
                onClick={() => handleSelectSuggestion(suggestion)}
                style={{
                  padding: '12px 16px',
                  borderBottom:
                    idx < suggestions.length - 1 ? `1px solid ${BORDER_LIGHT}` : 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.12s',
                  backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = PINK_LIGHT
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
                }}
              >
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: TEXT_NAVY,
                    fontFamily: 'Be Vietnam Pro, sans-serif'
                  }}
                >
                  {suggestion.description}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Distance Display */}
      {loadingDistance && (
        <div
          style={{
            fontSize: '12px',
            color: GRAY_TEXT,
            marginTop: '8px',
            fontFamily: 'Be Vietnam Pro, sans-serif'
          }}
        >
          Đang tính toán khoảng cách...
        </div>
      )}

      {distanceKm !== null && !loadingDistance && (
        <div
          style={{
            fontSize: '12px',
            color: GRAY_DARK,
            marginTop: '8px',
            fontFamily: 'Be Vietnam Pro, sans-serif',
            fontWeight: '500'
          }}
        >
          Khoảng cách: {distanceKm.toFixed(1)} km
        </div>
      )}
    </div>
  )
}
