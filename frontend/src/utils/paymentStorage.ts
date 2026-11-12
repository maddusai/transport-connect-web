export type CustomerPaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED'

export type CustomerPaymentSubmission = {
  id: string
  loadId: string
  bookingId: string
  amount: string
  transactionNumber: string
  slipFileName: string
  slipMimeType: string
  slipDataUrl: string
  status: CustomerPaymentStatus
  submittedAt: string
}

const PAYMENT_SUBMISSIONS_KEY = 'transport_connect_customer_payment_submissions'

export const getPaymentSubmissions = (): CustomerPaymentSubmission[] => {
  try {
    const raw = localStorage.getItem(PAYMENT_SUBMISSIONS_KEY)
    return raw ? (JSON.parse(raw) as CustomerPaymentSubmission[]) : []
  } catch {
    return []
  }
}

export const addPaymentSubmission = (
  submission: CustomerPaymentSubmission,
): { success: true } | { success: false; message: string } => {
  const existing = getPaymentSubmissions()

  const duplicateTransaction = existing.some(
    (item) =>
      item.transactionNumber.toUpperCase() === submission.transactionNumber.toUpperCase(),
  )
  if (duplicateTransaction) {
    return { success: false, message: 'This transaction number has already been submitted.' }
  }

  const existingForLoad = existing.find(
    (item) => item.loadId === submission.loadId && item.status !== 'FAILED',
  )
  if (existingForLoad) {
    return {
      success: false,
      message: 'A payment submission already exists for this booking.',
    }
  }

  try {
    localStorage.setItem(
      PAYMENT_SUBMISSIONS_KEY,
      JSON.stringify([submission, ...existing]),
    )
    return { success: true }
  } catch {
    return {
      success: false,
      message: 'Could not save the payment slip. Please use an image or PDF under 2 MB.',
    }
  }
}
