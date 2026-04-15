import type {
  SentimentCategory,
  SentimentChartDatum,
  SentimentReviewRow,
  SentimentStatsData,
} from './types'

export const SENTIMENT_COLORS: Record<SentimentCategory, string> = {
  positive: '#05B75D',
  neutral: '#FEC90F',
  negative: '#F3685A',
}

const SENTIMENT_LABELS: Record<SentimentCategory, string> = {
  positive: 'Tích cực',
  neutral: 'Trung lập',
  negative: 'Tiêu cực',
}

const normalizeVietnameseText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

export const normalizeSentimentCategory = (sentiment?: string | null): SentimentCategory => {
  if (!sentiment) {
    return 'neutral'
  }

  const normalized = normalizeVietnameseText(sentiment)

  if (
    normalized.includes('tich cuc') ||
    normalized.includes('positive') ||
    normalized.includes('positivity') ||
    normalized === 'good' ||
    normalized === 'happy' ||
    normalized === 'satisfied'
  ) {
    return 'positive'
  }

  if (
    normalized.includes('tieu cuc') ||
    normalized.includes('negative') ||
    normalized.includes('negativity') ||
    normalized === 'bad' ||
    normalized === 'angry' ||
    normalized === 'unsatisfied' ||
    normalized === 'poor'
  ) {
    return 'negative'
  }

  if (
    normalized.includes('trung lap') ||
    normalized.includes('neutral') ||
    normalized === 'binh thuong' ||
    normalized === 'normal' ||
    normalized === 'mixed'
  ) {
    return 'neutral'
  }

  return 'neutral'
}

export const getSentimentLabel = (category: SentimentCategory): string => SENTIMENT_LABELS[category]

export const normalizeSentimentLabel = (sentiment?: string | null): string =>
  getSentimentLabel(normalizeSentimentCategory(sentiment))

export const needsReviewAttention = (review: Pick<SentimentReviewRow, 'rating' | 'sentimentCategory'>): boolean =>
  review.sentimentCategory === 'negative' || review.rating <= 2

export const buildSentimentStats = (reviews: SentimentReviewRow[]): SentimentStatsData => {
  const stats = reviews.reduce<SentimentStatsData>(
    (accumulator, review) => {
      accumulator[review.sentimentCategory] += 1
      accumulator.total += 1
      return accumulator
    },
    {
      positive: 0,
      neutral: 0,
      negative: 0,
      total: 0,
    },
  )

  return stats
}

export const buildSentimentChartData = (stats: SentimentStatsData): SentimentChartDatum[] => [
  {
    name: 'Tích cực',
    value: stats.positive,
    color: SENTIMENT_COLORS.positive,
    category: 'positive',
  },
  {
    name: 'Trung lập',
    value: stats.neutral,
    color: SENTIMENT_COLORS.neutral,
    category: 'neutral',
  },
  {
    name: 'Tiêu cực',
    value: stats.negative,
    color: SENTIMENT_COLORS.negative,
    category: 'negative',
  },
]