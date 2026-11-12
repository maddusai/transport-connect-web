
import { CheckCircle2, ArrowRight, Truck, ShieldCheck } from 'lucide-react'

interface RegistrationSuccessProps {
  isOpen: boolean
  name: string
  role: string
  onLogin: () => void
}

function RegistrationSuccess({
  isOpen,
  name,
  role,
  onLogin,
}: RegistrationSuccessProps) {
  if (!isOpen) return null

  const roleName = role.replace('_', ' ').toLowerCase()

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">

        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 size={48} className="text-green-600" />
        </div>

        <h2 className="text-2xl font-extrabold text-slate-900">
          Registration Successful!
        </h2>

        <p className="mt-3 text-slate-600">
          Welcome to TransportConnect, {name}!
        </p>

        <div className="my-6 rounded-2xl bg-slate-50 p-4 text-left">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-100 p-3 text-blue-700">
              <Truck size={22} />
            </div>
            <div>
              <p className="text-xs text-slate-500">Registered Role</p>
              <p className="font-bold capitalize text-slate-900">
                {roleName}
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 text-sm text-green-700">
            <ShieldCheck size={18} />
            <span>Demo mobile verification completed</span>
          </div>
        </div>

        <p className="mb-6 text-sm text-slate-500">
          Your registration demo is complete. You can continue to the login screen.
        </p>

        <button
          onClick={onLogin}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 py-4 font-bold text-white transition hover:bg-blue-800"
        >
          Continue to Login
          <ArrowRight size={19} />
        </button>

      </div>
    </div>
  )
}

export default RegistrationSuccess
