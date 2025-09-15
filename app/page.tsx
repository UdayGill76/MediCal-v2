import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-rose-50 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center">
                <Image
                  src="/images/medical-logo-clean.jpg"
                  alt="MediCal Logo"
                  width={48}
                  height={48}
                  className="object-contain mix-blend-multiply"
                />
              </div>
              <div>
                <h1 className="text-3xl font-bold">
                  <span className="text-teal-600">Medi</span>
                  <span className="text-rose-500">Cal</span>
                </h1>
                <p className="text-sm text-slate-600">Medication Tracker</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8 bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-md border border-white/20">
              <div className="mb-8">
                <div className="inline-flex items-center justify-center w-28 h-28 rounded-2xl mb-4">
                  <Image
                    src="/images/medical-logo-clean.jpg"
                    alt="MediCal Logo"
                    width={120}
                    height={120}
                    className="object-contain mix-blend-multiply"
                  />
                </div>
              </div>
              <h2 className="text-4xl font-bold text-slate-800 mb-3">Welcome to MediCal!</h2>
              <p className="text-lg text-slate-600 leading-relaxed">your doctor will pop the get-well-soon instructions right here</p>
            </div>

            <div className="flex justify-center max-w-sm mx-auto">
              <Link href="/login" className="w-full">
                <Button
                  size="lg"
                  className="w-full h-14 text-lg font-semibold bg-teal-600 hover:bg-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl text-white rounded-xl"
                >
                  Doctor Login
                </Button>
              </Link>
            </div>

            <div className="text-center mt-4">
              <p className="text-slate-500 bg-white/40 backdrop-blur-sm rounded-lg px-4 py-2 inline-block text-sm">
                Doctor access only. Use your Staff ID (DOC-...).
              </p>
            </div>

            {/* Side notes */}
            <div className="mt-4 grid sm:grid-cols-2 gap-3">
              <div className="text-center text-xs sm:text-sm text-teal-700 bg-teal-50 border border-teal-200 rounded-lg px-3 py-2">
                This is ONLY for the doctor.
              </div>
              <div className="text-center text-xs sm:text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                Patients: please download our app.
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 text-center">
          <p className="text-slate-500 text-sm">Making medication tracking simple and accessible</p>
        </div>
      </footer>
    </div>
  )
}
