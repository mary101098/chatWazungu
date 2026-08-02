import { Link } from 'react-router-dom';
import { ShieldCheck, Smartphone, Wallet, Clock, ArrowRight, CheckCircle2, Users, Globe2 } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function LandingPage() {
  return (
    <div className="page-enter">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-accent-50" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-100/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-24 w-96 h-96 bg-accent-100/40 rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-slide-up">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 border border-primary-100 text-primary-700 text-xs font-semibold mb-6">
                <ShieldCheck className="w-3.5 h-3.5" />
                Trusted Registration Portal
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-ink leading-[1.1]">
                Register to chat with{' '}
                <span className="text-primary-600">international clients</span>
              </h1>
              <p className="mt-5 text-lg text-gray-600 max-w-lg leading-relaxed">
                Chat Wazungu connects Kenyan applicants with international
                opportunities. Complete your registration, pay a small
                refundable fee, and start your journey.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link to="/register">
                  <Button size="xl" fullWidth rightIcon={<ArrowRight className="w-5 h-5" />} className="sm:w-auto">
                    Get Started
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="xl" variant="outline" fullWidth className="sm:w-auto">
                    I have an account
                  </Button>
                </Link>
              </div>

              <div className="mt-6 flex items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary-600" />
                  <span>Refundable KSh 150 fee</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary-600" />
                  <span>Secure M-Pesa payment</span>
                </div>
              </div>
            </div>

            {/* Hero card */}
            <div className="relative animate-scale-in">
              <div className="bg-white rounded-3xl shadow-card-hover border border-gray-100 p-6 sm:p-8 max-w-md mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-primary-600 text-white flex items-center justify-center">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-accent-50 text-accent-700 text-xs font-bold border border-accent-100">
                    REFUNDABLE
                  </span>
                </div>
                <h3 className="text-lg font-bold text-ink">Registration Fee</h3>
                <p className="text-sm text-gray-500 mt-1">One-time payment via M-Pesa STK Push</p>
                <div className="mt-4 flex items-end gap-1">
                  <span className="text-4xl font-extrabold text-ink">KSh 150</span>
                  <span className="text-sm text-gray-500 mb-1.5">only</span>
                </div>
                <div className="mt-6 space-y-3">
                  {[
                    'Create your account',
                    'Complete your profile',
                    'Pay refundable fee',
                    'Track your application',
                  ].map((step, i) => (
                    <div key={step} className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-primary-50 text-primary-700 flex items-center justify-center text-xs font-bold">
                        {i + 1}
                      </div>
                      <span className="text-sm font-medium text-ink">{step}</span>
                    </div>
                  ))}
                </div>
                <Link to="/register" className="block mt-6">
                  <Button fullWidth size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-16 sm:py-20 bg-white border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-extrabold text-ink">How it works</h2>
            <p className="mt-3 text-gray-600">
              Four simple steps to complete your registration. Designed to be
              easy for first-time smartphone users.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Users, title: 'Create account', desc: 'Sign up with your email and phone number.' },
              { icon: Smartphone, title: 'Fill profile', desc: 'Tell us about yourself and your withdrawal account.' },
              { icon: Wallet, title: 'Pay KSh 150', desc: 'Pay the refundable fee via M-Pesa STK Push.' },
              { icon: Clock, title: 'Track status', desc: 'Monitor your application status on your dashboard.' },
            ].map((step, i) => (
              <div key={step.title} className="relative">
                <div className="bg-[#FAFAFA] rounded-2xl p-6 border border-gray-100 hover:shadow-card-hover hover:border-primary-100 transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl bg-primary-600 text-white flex items-center justify-center mb-4">
                    <step.icon className="w-6 h-6" />
                  </div>
                  <div className="text-xs font-bold text-primary-600 mb-1">STEP {i + 1}</div>
                  <h3 className="font-bold text-ink">{step.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-50 border border-accent-100 text-accent-700 text-xs font-semibold mb-6">
            <Globe2 className="w-3.5 h-3.5" /> Connecting Kenya to the world
          </div>
          <h2 className="text-3xl font-extrabold text-ink">Built on trust and transparency</h2>
          <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
            Your registration fee is fully refundable. We use Safaricom's secure
            M-Pesa Daraja API for all payments, and your data is protected with
            industry-standard security.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4 max-w-lg mx-auto">
            <div>
              <div className="text-2xl font-extrabold text-primary-600">KSh 150</div>
              <div className="text-xs text-gray-500">Refundable fee</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-primary-600">M-Pesa</div>
              <div className="text-xs text-gray-500">Secure payment</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-primary-600">24/7</div>
              <div className="text-xs text-gray-500">Portal access</div>
            </div>
          </div>
          <Link to="/register" className="inline-block mt-8">
            <Button size="xl" rightIcon={<ArrowRight className="w-5 h-5" />}>
              Start your registration
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
