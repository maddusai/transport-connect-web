import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'

import RegistrationSuccess from './RegistrationSuccess'
import LocationAutocompleteInput from './LocationAutocompleteInput'

import {
  X,
  Truck,
  User,
  Phone,
  Lock,
  Mail,
  Building2,
  FileText,
  Eye,
  EyeOff,
} from 'lucide-react'

import {
  registerUser,
  authenticateUser,
} from '../../utils/authStorage'
import { apiClient, setAuthToken, setCurrentUser } from '../../services/apiClient'

type UserRole =
  | 'CUSTOMER'
  | 'TRUCK_OWNER'
  | 'DRIVER'
  | 'TRANSPORTER'
  | 'ADMIN'

type AuthMode = 'login' | 'register'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onLogin: (role: UserRole) => void
  initialMode: AuthMode
}

function AuthModal({
  isOpen,
  onClose,
  onLogin,
  initialMode,
}: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [role, setRole] = useState<UserRole>('CUSTOMER')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [successOpen, setSuccessOpen] = useState(false)

  const [formData, setFormData] = useState({
    fullName: '',
    businessName: '',
    mobile: '',
    email: '',
    password: '',
    confirmPassword: '',
    address: '',
    gstin: '',
    pan: '',
    licenceNumber: '',
  })

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode)
      setRole('CUSTOMER')
      setError('')
      setShowPassword(false)
      localStorage.removeItem('transport_connect_registered_users')
    }
  }, [isOpen, initialMode])

  if (!isOpen) return null

  const updateField = (field: string, value: string) => {
    setFormData((previous) => ({
      ...previous,
      [field]:
        field === 'gstin' || field === 'pan'
          ? value.toUpperCase()
          : value,
    }))

    setError('')
  }

  const requiresBusinessDetails =
    role === 'TRUCK_OWNER' || role === 'TRANSPORTER'

  const validateForm = (): string => {
    if (!/^[6-9][0-9]{9}$/.test(formData.mobile)) {
      return 'Enter a valid 10-digit Indian mobile number.'
    }

    if (mode === 'register') {
      if (!formData.fullName.trim()) {
        return 'Full name is required.'
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        return 'Enter a valid email address.'
      }

      if (!formData.address.trim()) {
        return 'Address / Location is required.'
      }

      if (formData.password.length < 8) {
        return 'Password must contain at least 8 characters.'
      }

      if (formData.password !== formData.confirmPassword) {
        return 'Passwords do not match.'
      }

      if (requiresBusinessDetails) {
        if (!formData.businessName.trim()) {
          return 'Business name is required.'
        }

        if (
          !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(
            formData.gstin,
          )
        ) {
          return 'Enter a valid 15-character GSTIN format.'
        }

        if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(formData.pan)) {
          return 'Enter a valid PAN format.'
        }
      }

      if (role === 'DRIVER' && !formData.licenceNumber.trim()) {
        return 'Driving licence number is required.'
      }
    } else {
      if (!formData.password) {
        return 'Password is required.'
      }
    }

    return ''
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const validationError = validateForm()

    if (validationError) {
      setError(validationError)
      return
    }

    setError('')

    if (mode === 'register') {
      await handleDirectRegister()
      return
    }

    if (role === 'ADMIN') {
      onLogin('ADMIN')
      return
    }

    apiClient
      .login(formData.mobile, formData.password)
      .then((response) => {
        if (response.role !== role) {
          setError(`Please select your registered role: ${response.role}`)
          return
        }
        setAuthToken(response.token)
        setCurrentUser(response)
        onLogin(response.role as UserRole)
      })
      .catch((err: any) => {
        const localUser = authenticateUser(formData.mobile, formData.password)
        if (localUser) {
          if (localUser.role !== role) {
            setError(`Please select your registered role: ${localUser.role}`)
            return
          }
          setCurrentUser(localUser)
          onLogin(localUser.role)
          return
        }
        setError(
          err.message ||
            'Invalid mobile number or password. Please register first.',
        )
      })
  }

  const handleDirectRegister = async () => {
    try {
      const response = await apiClient.register({
        name: formData.fullName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.mobile,
        companyName: formData.businessName.trim() || undefined,
        city: formData.address.trim(),
        gstNumber: formData.gstin || undefined,
        role: role,
      })

      setAuthToken(response.token)
      setCurrentUser(response)

      registerUser({
        fullName: formData.fullName.trim(),
        businessName: formData.businessName.trim(),
        mobile: formData.mobile,
        email: formData.email.trim(),
        password: formData.password,
        address: formData.address.trim(),
        gstin: formData.gstin,
        pan: formData.pan,
        licenceNumber: formData.licenceNumber.trim(),
        role: role as
          | 'CUSTOMER'
          | 'TRUCK_OWNER'
          | 'DRIVER'
          | 'TRANSPORTER',
      })

      setError('')
      setSuccessOpen(true)
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.')
    }
  }

  const changeMode = (newMode: AuthMode) => {
    if (newMode === 'register' && role === 'ADMIN') {
      setRole('CUSTOMER')
    }

    setMode(newMode)
    setError('')
  }

  const changeRole = (newRole: UserRole) => {
    setRole(newRole)
    setError('')
  }

  const inputClass =
    'w-full bg-transparent text-sm outline-none placeholder:text-slate-400'

  const fieldClass =
    'flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 focus-within:border-blue-600'

  return (
    <>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            onClose()
          }
        }}
      >
        <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-5 top-5 rounded-full p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Close popup"
          >
            <X size={21} />
          </button>

          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-700 text-white">
              <Truck size={28} />
            </div>

            <h2 className="text-2xl font-extrabold text-slate-900">
              Transport
              <span className="text-blue-700">Connect</span>
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              {mode === 'login'
                ? 'Welcome back! Login to continue.'
                : 'Create your account and join our network.'}
            </p>
          </div>

          <div className="mb-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => changeMode('login')}
              className={`rounded-lg py-3 text-sm font-bold ${
                mode === 'login'
                  ? 'bg-white text-blue-700 shadow'
                  : 'text-slate-500'
              }`}
            >
              Login
            </button>

            <button
              type="button"
              onClick={() => changeMode('register')}
              className={`rounded-lg py-3 text-sm font-bold ${
                mode === 'register'
                  ? 'bg-white text-blue-700 shadow'
                  : 'text-slate-500'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* User Role */}
            <div>
              <label className="mb-2 block text-sm font-semibold">
                I am a <span className="text-red-500">*</span>
              </label>

              <select
                value={role}
                onChange={(event) =>
                  changeRole(event.target.value as UserRole)
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-600"
              >
                <option value="CUSTOMER">Customer</option>
                <option value="TRUCK_OWNER">Truck Owner</option>
                <option value="DRIVER">Driver</option>
                <option value="TRANSPORTER">Transporter</option>

                {mode === 'login' && (
                  <option value="ADMIN">Admin</option>
                )}
              </select>
            </div>

            {/* Full Name */}
            {mode === 'register' && (
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  {role === 'TRANSPORTER'
                    ? 'Owner / Contact Person Name'
                    : 'Full Name'}
                  <span className="text-red-500"> *</span>
                </label>

                <div className={fieldClass}>
                  <User size={18} className="text-slate-400" />

                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) =>
                      updateField('fullName', e.target.value)
                    }
                    placeholder="Enter your full name"
                    required
                    className={inputClass}
                  />
                </div>
              </div>
            )}

            {/* Business Details */}
            {mode === 'register' && requiresBusinessDetails && (
              <>
                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Business Name <span className="text-red-500">*</span>
                  </label>

                  <div className={fieldClass}>
                    <Building2 size={18} className="text-slate-400" />

                    <input
                      value={formData.businessName}
                      onChange={(e) =>
                        updateField('businessName', e.target.value)
                      }
                      placeholder="Enter registered business name"
                      required
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    GSTIN <span className="text-red-500">*</span>
                  </label>

                  <div className={fieldClass}>
                    <FileText size={18} className="text-slate-400" />

                    <input
                      value={formData.gstin}
                      onChange={(e) =>
                        updateField(
                          'gstin',
                          e.target.value.slice(0, 15),
                        )
                      }
                      placeholder="Enter 15-character GSTIN"
                      maxLength={15}
                      required
                      className={inputClass}
                    />
                  </div>

                  <p className="mt-1 text-xs text-slate-500">
                    Mandatory for Truck Owners and Transporters.
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    PAN Number <span className="text-red-500">*</span>
                  </label>

                  <div className={fieldClass}>
                    <FileText size={18} className="text-slate-400" />

                    <input
                      value={formData.pan}
                      onChange={(e) =>
                        updateField(
                          'pan',
                          e.target.value.slice(0, 10),
                        )
                      }
                      placeholder="ABCDE1234F"
                      maxLength={10}
                      required
                      className={inputClass}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Driver Licence */}
            {mode === 'register' && role === 'DRIVER' && (
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Driving Licence Number{' '}
                  <span className="text-red-500">*</span>
                </label>

                <div className={fieldClass}>
                  <FileText size={18} className="text-slate-400" />

                  <input
                    value={formData.licenceNumber}
                    onChange={(e) =>
                      updateField('licenceNumber', e.target.value)
                    }
                    placeholder="Enter driving licence number"
                    required
                    className={inputClass}
                  />
                </div>
              </div>
            )}

            {/* Mobile Number */}
            <div>
              <label className="mb-2 block text-sm font-semibold">
                Mobile Number <span className="text-red-500">*</span>
              </label>

              <div className={fieldClass}>
                <Phone size={18} className="text-slate-400" />
                <span className="text-sm text-slate-500">+91</span>

                <input
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) =>
                    updateField(
                      'mobile',
                      e.target.value.replace(/\D/g, '').slice(0, 10),
                    )
                  }
                  placeholder="Enter 10-digit mobile number"
                  maxLength={10}
                  required
                  className={inputClass}
                />
              </div>
            </div>

            {/* Email */}
            {mode === 'register' && (
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Email Address <span className="text-red-500">*</span>
                </label>

                <div className={fieldClass}>
                  <Mail size={18} className="text-slate-400" />

                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      updateField('email', e.target.value)
                    }
                    placeholder="Enter email address"
                    required
                    className={inputClass}
                  />
                </div>
              </div>
            )}

            {/* Address / Location with Live Autocomplete */}
            {mode === 'register' && (
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  {requiresBusinessDetails
                    ? 'Business Location / Address'
                    : 'City / Village / Address'}
                  <span className="text-red-500"> *</span>
                </label>

                <LocationAutocompleteInput
                  required
                  value={formData.address}
                  onChange={(val) => updateField('address', val)}
                  placeholder="Type your village, town or city (e.g. Hyderabad, Siddipet)"
                />
              </div>
            )}

            {/* Password */}
            <div>
              <label className="mb-2 block text-sm font-semibold">
                Password <span className="text-red-500">*</span>
              </label>

              <div className={fieldClass}>
                <Lock size={18} className="text-slate-400" />

                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) =>
                    updateField('password', e.target.value)
                  }
                  placeholder={
                    mode === 'register'
                      ? 'Minimum 8 characters'
                      : 'Enter your password'
                  }
                  minLength={mode === 'register' ? 8 : undefined}
                  required
                  className={inputClass}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            {mode === 'register' && (
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Confirm Password{' '}
                  <span className="text-red-500">*</span>
                </label>

                <div className={fieldClass}>
                  <Lock size={18} className="text-slate-400" />

                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      updateField('confirmPassword', e.target.value)
                    }
                    placeholder="Re-enter your password"
                    minLength={8}
                    required
                    className={inputClass}
                  />
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full rounded-xl bg-blue-700 py-3.5 font-bold text-white transition hover:bg-blue-800"
            >
              {mode === 'login'
                ? 'Login to Account'
                : 'Create Account'}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-slate-500">
            By continuing, you agree to our Terms & Privacy Policy.
          </p>
        </div>
      </div>

      {/* Registration Success */}
      <RegistrationSuccess
        isOpen={successOpen}
        name={formData.fullName}
        role={role}
        onLogin={() => {
          setSuccessOpen(false)
          setMode('login')
          setRole('CUSTOMER')
          setError('')
        }}
      />
    </>
  )
}

export default AuthModal
