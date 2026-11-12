
export type DriverVerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export type RegisteredUser = {
  id: string
  fullName: string
  businessName: string
  mobile: string
  email: string
  password: string
  address: string
  gstin: string
  pan: string
  licenceNumber: string
  role: 'CUSTOMER' | 'TRUCK_OWNER' | 'DRIVER' | 'TRANSPORTER'
  createdAt: string
  verificationStatus?: DriverVerificationStatus
  verificationReason?: string
}

const AUTH_STORAGE_KEY = 'transport_connect_registered_users'

export const getRegisteredUsers = (): RegisteredUser[] => {
  try {
    const storedUsers = localStorage.getItem(AUTH_STORAGE_KEY)
    return storedUsers ? JSON.parse(storedUsers) : []
  } catch {
    return []
  }
}

export const registerUser = (
  user: Omit<
    RegisteredUser,
    'id' | 'createdAt' | 'verificationStatus' | 'verificationReason'
  >,
): { success: boolean; message: string } => {
  const users = getRegisteredUsers()

  if (users.some((item) => item.mobile === user.mobile)) {
    return { success: false, message: 'This mobile number is already registered.' }
  }

  if (users.some((item) => item.email.toLowerCase() === user.email.toLowerCase())) {
    return { success: false, message: 'This email address is already registered.' }
  }

  const newUser: RegisteredUser = {
    ...user,
    id: `USER-${Date.now()}`,
    createdAt: new Date().toISOString(),
    ...(user.role === 'DRIVER' ? { verificationStatus: 'PENDING' as const } : {}),
  }

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify([newUser, ...users]))

  return { success: true, message: 'Registration successful.' }
}

export const authenticateUser = (
  mobile: string,
  password: string,
): RegisteredUser | null => {
  const users = getRegisteredUsers()

  return (
    users.find((user) => user.mobile === mobile && user.password === password) ??
    null
  )
}

export const updateRegisteredDriverVerification = (
  driverId: string,
  verificationStatus: DriverVerificationStatus,
  reason?: string,
): boolean => {
  const users = getRegisteredUsers()

  const driverIndex = users.findIndex(
    (user) => user.id === driverId && user.role === 'DRIVER',
  )

  if (driverIndex === -1) return false

  users[driverIndex] = {
    ...users[driverIndex],
    verificationStatus,
    verificationReason:
      verificationStatus === 'REJECTED' ? reason?.trim() : undefined,
  }

  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(users))
    return true
  } catch {
    return false
  }
}
