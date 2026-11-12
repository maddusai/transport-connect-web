
import { useState } from 'react'
import { ArrowLeft, ShieldCheck, Truck } from 'lucide-react'

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

  if (!isOpen) return null

  const handleVerify = () => {
    if (!/^[0-9]{6}$/.test(otp)) {
      setError('Please enter a valid 6-digit OTP.')
      return
    }

    setError('')
    alert('Demo OTP accepted. Real OTP verification will be connected with backend.')
    onVerified()
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
            Enter the 6-digit OTP sent to
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

        <button
          onClick={handleVerify}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 py-4 font-bold text-white hover:bg-blue-800"
        >
          <ShieldCheck size={19} />
          Verify OTP
        </button>

        <button
          onClick={onClose}
          className="mt-4 flex w-full items-center justify-center gap-2 py-2 text-sm font-semibold text-slate-500 hover:text-blue-700"
        >
          <ArrowLeft size={17} />
          Back to Registration
        </button>

      </div>
    </div>
  )
}

export default OTPModal
