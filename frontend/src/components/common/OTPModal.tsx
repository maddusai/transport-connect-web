import { useState } from 'react'
import { ArrowLeft, RefreshCw, ShieldCheck, Truck } from 'lucide-react'
import { sendFirebasePhoneOtp, verifyFirebasePhoneOtp } from '../../services/firebase'

interface OTPModalProps {
  isOpen: boolean
  mobile: string
  onClose: () => void
  onVerified: () => void
}

function OTPModal({
  isOpen,
  mobile,
  onClose,
  onVerified,
}: OTPModalProps) {
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [resending, setResending] = useState(false)
  const [infoMsg, setInfoMsg] = useState('')

  if (!isOpen) return null

  const handleVerify = async () => {
    if (!/^[0-9]{6}$/.test(otp)) {
      setError('Please enter a valid 6-digit OTP.')
      return
    }

    setError('')
    setVerifying(true)
    try {
      await verifyFirebasePhoneOtp(otp, mobile)
      setOtp('')
      onVerified()
    } catch (err: any) {
      setError(
        err?.code === 'auth/invalid-verification-code'
          ? 'Invalid OTP code. Please check the SMS sent to your mobile.'
          : err?.message || 'OTP verification failed. Please try again.',
      )
    } finally {
      setVerifying(false)
    }
  }

  const handleResend = async () => {
    setError('')
    setInfoMsg('')
    setResending(true)
    try {
      await sendFirebasePhoneOtp(mobile, 'recaptcha-container')
      setInfoMsg(`New OTP sent via SMS to +91 ${mobile}`)
    } catch (err: any) {
      setError(err?.message || 'Failed to resend OTP. Please try again.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-700 text-white">
            <Truck size={28} />
          </div>

          <h2 className="text-2xl font-extrabold">
            Verify Your Mobile
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Enter the 6-digit SMS OTP sent to
          </p>

          <p className="mt-1 font-bold text-blue-700">
            +91 {mobile}
          </p>
        </div>

        <label className="mb-2 block text-sm font-semibold">
          Enter OTP
        </label>

        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={otp}
          onChange={(e) => {
            setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
            setError('')
          }}
          placeholder="000000"
          className="w-full rounded-xl border border-slate-200 px-4 py-4 text-center text-2xl font-bold tracking-[0.5em] outline-none focus:border-blue-600"
        />

        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}

        {infoMsg && (
          <p className="mt-2 text-sm text-emerald-600">{infoMsg}</p>
        )}

        <button
          type="button"
          disabled={verifying}
          onClick={handleVerify}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 py-4 font-bold text-white hover:bg-blue-800 disabled:opacity-60"
        >
          <ShieldCheck size={19} />
          {verifying ? 'Verifying SMS OTP...' : 'Verify OTP'}
        </button>

        <button
          type="button"
          disabled={resending}
          onClick={handleResend}
          className="mt-3 flex w-full items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-blue-700 hover:underline disabled:opacity-60"
        >
          <RefreshCw size={14} className={resending ? 'animate-spin' : ''} />
          {resending ? 'Sending SMS...' : 'Resend SMS OTP'}
        </button>

        <button
          type="button"
          onClick={onClose}
          className="mt-2 flex w-full items-center justify-center gap-2 py-2 text-sm font-semibold text-slate-500 hover:text-blue-700"
        >
          <ArrowLeft size={17} />
          Back to Registration
        </button>
      </div>
    </div>
  )
}

export default OTPModal