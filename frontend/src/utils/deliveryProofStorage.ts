
export type DeliveryProof = {
  tripId: string
  loadId: string
  receiverName: string
  receiverMobile: string
  deliveryPhoto: string
  otpVerified: boolean
  verifiedAt?: string
  submittedAt: string
}

const DELIVERY_PROOF_KEY = 'transport_connect_delivery_proofs'

export const getDeliveryProofs = (): Record<string, DeliveryProof> => {
  try {
    const raw = localStorage.getItem(DELIVERY_PROOF_KEY)

    return raw
      ? (JSON.parse(raw) as Record<string, DeliveryProof>)
      : {}
  } catch {
    return {}
  }
}

export const getDeliveryProof = (
  tripId: string,
): DeliveryProof | null => {
  const proofs = getDeliveryProofs()
  return proofs[tripId] ?? null
}

export const saveDeliveryProof = (
  proof: DeliveryProof,
): void => {
  const proofs = getDeliveryProofs()

  proofs[proof.tripId] = proof

  localStorage.setItem(
    DELIVERY_PROOF_KEY,
    JSON.stringify(proofs),
  )
}

export const verifyDeliveryOTP = (
  tripId: string,
): void => {
  const proofs = getDeliveryProofs()
  const proof = proofs[tripId]

  if (!proof) {
    throw new Error('Delivery proof not found')
  }

  proofs[tripId] = {
    ...proof,
    otpVerified: true,
    verifiedAt: new Date().toISOString(),
  }

  localStorage.setItem(
    DELIVERY_PROOF_KEY,
    JSON.stringify(proofs),
  )
}
