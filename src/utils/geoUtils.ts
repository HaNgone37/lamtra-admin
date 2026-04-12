/**
 * Goong Autocomplete - Search for addresses
 * Returns array of suggestions with description and place_id
 */
export const autocompleteGoongAddress = async (query: string): Promise<any[]> => {
  if (query.length < 3) return []

  const apiKey = import.meta.env.VITE_GOONG_API_KEY

  if (!apiKey) {
    console.error('[Goong] API key not found in environment variables')
    return []
  }

  try {
    const url = new URL('https://rsapi.goong.io/Place/Autocomplete')
    url.searchParams.append('api_key', apiKey)
    url.searchParams.append('input', query)

    const response = await fetch(url.toString())

    if (!response.ok) {
      console.error('[Goong] Autocomplete error:', response.status)
      return []
    }

    const data = await response.json()
    console.log('[Goong] Autocomplete results:', data)

    if (!data.predictions) {
      return []
    }

    return data.predictions.map((item: any) => ({
      description: item.description,
      place_id: item.place_id,
      main_text: item.main_text,
      secondary_text: item.secondary_text
    }))
  } catch (error) {
    console.error('[Goong] Autocomplete failed:', error)
    return []
  }
}

/**
 * Goong Place Detail - Get latitude/longitude from place_id
 * Returns object with lat, lng
 */
export const getGoongPlaceDetail = async (placeId: string): Promise<{ lat: number; lng: number } | null> => {
  const apiKey = import.meta.env.VITE_GOONG_API_KEY

  if (!apiKey) {
    console.error('[Goong] API key not found')
    return null
  }

  try {
    const url = new URL('https://rsapi.goong.io/Place/Detail')
    url.searchParams.append('api_key', apiKey)
    url.searchParams.append('place_id', placeId)

    const response = await fetch(url.toString())

    if (!response.ok) {
      console.error('[Goong] Place Detail error:', response.status)
      return null
    }

    const data = await response.json()
    console.log('[Goong] Place Detail:', data)

    if (!data.result || !data.result.geometry) {
      return null
    }

    return {
      lat: data.result.geometry.location.lat,
      lng: data.result.geometry.location.lng
    }
  } catch (error) {
    console.error('[Goong] Place Detail failed:', error)
    return null
  }
}

/**
 * Goong Distance Matrix - Calculate real distance (not straight line)
 * Returns distance in kilometers
 */
export const calculateDistanceGoong = async (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): Promise<number> => {
  const apiKey = import.meta.env.VITE_GOONG_API_KEY

  if (!apiKey) {
    console.error('[Goong] API key not found')
    return 0
  }

  try {
    const url = new URL('https://rsapi.goong.io/DistanceMatrix')
    url.searchParams.append('api_key', apiKey)
    url.searchParams.append('origins', `${lat1},${lng1}`)
    url.searchParams.append('destinations', `${lat2},${lng2}`)
    url.searchParams.append('vehicle', 'car')

    const response = await fetch(url.toString())

    if (!response.ok) {
      console.error('[Goong] DistanceMatrix error:', response.status)
      return 0
    }

    const data = await response.json()
    console.log('[Goong] DistanceMatrix:', data)

    if (!data.rows || !data.rows[0] || !data.rows[0].elements || !data.rows[0].elements[0]) {
      return 0
    }

    const distanceInMeters = data.rows[0].elements[0].distance?.value || 0
    const distanceInKm = distanceInMeters / 1000

    return parseFloat(distanceInKm.toFixed(2))
  } catch (error) {
    console.error('[Goong] DistanceMatrix failed:', error)
    return 0
  }
}
