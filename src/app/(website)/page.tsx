import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { CheckCircle, Menu as MenuIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function Home() {
  const plans = [
    {
      name: 'Free Plan',
      description: 'Perfect for getting started',
      price: '$0',
      features: [
        'Boost engagement with target responses',
        'Automate comment replies to enhance audience interaction',
        'Turn followers into customers with targeted messaging',
      ],
      cta: 'Get Started',
    },
    {
      name: 'Smart AI Plan',
      description: 'Advanced features for power users',
      price: '$99',
      features: [
        'All features from Free Plan',
        'AI-powered response generation',
        'Advanced analytics and insights',
        'Priority customer support',
        'Custom branding options',
      ],
      cta: 'Upgrade Now',
    },
  ]

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-bg text-white">
      {/* NAV */}
      <header className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center font-bold text-lg">
              li
            </div>
            <div>
              <span className="text-xl font-semibold tracking-tight">Mation</span>
              <div className="text-xs text-blue-200/70">Instagram Automation</div>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm text-blue-200">
            <Link href="#features">Features</Link>
            <Link href="#pricing">Pricing</Link>
            <Link href="#about">About</Link>
          </nav>

          <div className="flex items-center gap-4">
            <div className="md:hidden">
              <button aria-label="menu" className="p-2 rounded-md bg-white/5">
                <MenuIcon />
              </button>
            </div>
            <Button className="hidden md:inline-flex bg-white "> 
              <Link href="/dashboard">Login</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="container mx-auto px-6 py-12 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
          <div className="md:col-span-7">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight">
              Transform Your Instagram Engagement with Mation
            </h1>
            <p className="mt-6 max-w-xl text-lg text-blue-200">
              Mation revolutionizes how you connect with your audience on Instagram. Automate responses and boost engagement effortlessly, turning interactions into valuable business opportunities.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-blue-600 text-white hover:bg-blue-700">
                Get Started
              </Button>
              <Button size="lg" variant="outline" className="border-blue-400 hover:bg-blue-900/40">
                Learn More
              </Button>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 max-w-md text-sm text-blue-200">
              <div className="bg-white/3 rounded-lg p-3">
                <div className="font-medium">Automated DM</div>
                <div className="text-xs text-blue-200/80">Send contextual DMs and save hours</div>
              </div>
              <div className="bg-white/3 rounded-lg p-3">
                <div className="font-medium">Comment Replies</div>
                <div className="text-xs text-blue-200/80">Instant replies that feel human</div>
              </div>
            </div>
          </div>

          <div className="md:col-span-5">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/5 bg-gradient-to-b from-white/5 to-white/2 p-4">
              <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,_rgba(99,102,241,0.15),transparent_30%)]" />
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-xs text-blue-200/80">Mation • Instagram</div>
                  <div className="font-semibold">AutoDM Campaign</div>
                </div>
                <div className="text-sm text-blue-200/70">Live</div>
              </div>

              <div className="mt-4 h-64 relative rounded-lg overflow-hidden bg-gradient-to-b from-slate-800 to-slate-900">
                <Image src="/mation-image.jpg" alt="Community" fill className="object-cover" />
              </div>

              <div className="mt-4 flex items-center justify-between text-sm text-blue-200/80">
                <div>500+ responses automated</div>
                <div className="text-xs">Updated today</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="container mx-auto px-6 py-12 md:py-20">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="col-span-2">
            <h2 className="text-3xl sm:text-4xl font-bold">Why Mation?</h2>
            <p className="mt-3 max-w-2xl text-blue-200">Automate everyday Instagram tasks while keeping your voice authentic. Built for creators, brands and agencies.</p>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                'AI-powered replies that sound natural',
                'Keyword-based automation for campaigns',
                'Performance analytics and insights',
                'Team inbox & user roles',
              ].map((f, i) => (
                <div key={i} className="flex gap-3 items-start bg-white/3 p-4 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <div className="font-medium">{f}</div>
                    <div className="text-sm text-blue-200/80">Scale your outreach with precision</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside className="hidden md:block">
            <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-800/60 to-slate-900/40 ring-1 ring-white/5">
              <div className="text-sm text-blue-200/80">Trusted by</div>
              <div className="mt-4 grid grid-cols-1 gap-3">
                <div className="bg-white/5 p-3 rounded">Creator Brand</div>
                <div className="bg-white/5 p-3 rounded">Shop XYZ</div>
                <div className="bg-white/5 p-3 rounded">Agency</div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="container mx-auto px-6 py-12 md:py-20 bg-background">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-5xl font-bold">Choose Your Plan</h2>
          <p className="mt-3 text-muted-foreground">Select the perfect plan to boost your Instagram engagement</p>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
          {plans.map((plan, index) => (
            <Card key={index} className="transform hover:-translate-y-1 transition p-0 overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-slate-800/50 to-slate-900/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      <CardDescription className="text-blue-200/80">{plan.description}</CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-extrabold">{plan.price}</div>
                      <div className="text-sm text-muted-foreground">/month</div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="mt-4 grid gap-4">
                  <ul className="grid gap-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="mt-1">
                          <CheckCircle className="h-5 w-5 text-primary" />
                        </div>
                        <div className="text-sm text-muted-foreground">{feature}</div>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="pt-4">
                  <Button className="w-full py-3 bg-blue-600 hover:bg-blue-700">{plan.cta}</Button>
                </CardFooter>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="container mx-auto px-6 py-12 text-sm text-blue-200/70">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="font-semibold">Mation</div>
            <div>Instagram Automation • Built with care</div>
          </div>

          <div className="flex items-center gap-4">
            <Link href="#">Privacy</Link>
            <Link href="#">Terms</Link>
            <Link href="#">Contact</Link>
          </div>
        </div>

        <div className="mt-8 text-xs text-blue-200/50">© {new Date().getFullYear()} Mation. All rights reserved.</div>
      </footer>
    </main>
  )
}
