export type SentimentCategory = 'positive' | 'neutral' | 'negative'

export type SentimentFilterValue = 'all' | SentimentCategory

export type ProductFilterValue = 'all' | string

export interface SentimentReviewRow {
  reviewid: string | number
  rating: number
  comment: string
  createdat: string
  productid: string | number
  productName: string
  sentimentLabel: string
  sentimentCategory: SentimentCategory
  is_visible: boolean
  customerName?: string
}

export interface SentimentStatsData {
  positive: number
  neutral: number
  negative: number
  total: number
}

export interface SentimentChartDatum {
  name: string
  value: number
  color: string
  category: SentimentCategory
}