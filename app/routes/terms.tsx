import { useEffect, useState } from 'react';
import { Scale, Shield, AlertTriangle, AlertCircle, Clock, Gavel } from 'lucide-react';
import type { LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { UnifiedHeader } from '~/components/header/UnifiedHeader';
import { Footer } from '~/components/footer/Footer';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return json({ success: true });
};

export default function TermsOfService() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="h-screen monzed-bg-primary overflow-x-hidden overflow-y-auto modern-scrollbar">
      <UnifiedHeader variant="landing" showNavigation={true} />
      <div>
      {/* Header */}
      <section className="py-20 monzed-bg-secondary relative overflow-hidden">
        <div className="absolute inset-0 monzed-grid-bg opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full border monzed-border-bright monzed-bg-primary/50 backdrop-blur-sm mb-8 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <Scale className="w-5 h-5 text-monzed-accent" />
              <span className="text-sm font-semibold monzed-text-secondary">Legal Terms & Conditions</span>
            </div>

            <h1 className={`text-4xl md:text-5xl lg:text-6xl font-bold monzed-text-primary mb-6 monzed-font-dm-sans transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              Terms of Service
            </h1>
            
            <p className={`text-xl monzed-text-secondary max-w-4xl mx-auto leading-relaxed transition-all duration-1000 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              Simple & Straightforward | Last Updated: January 2025
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-20 monzed-bg-primary">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="space-y-12">
            
            {/* Introduction */}
            <div className="monzed-bg-secondary rounded-xl p-8 border monzed-border">
              <h2 className="text-2xl font-bold monzed-text-primary mb-6">The Basics</h2>
              <div className="space-y-4 monzed-text-secondary text-base leading-relaxed">
                <p>
                  By using our AI builder platform, you agree to these terms. Simple as that.
                </p>
                <p>
                  We built a platform where you use AI to build websites and apps. These terms explain the rules.
                </p>
                <div className="bg-monzed-accent/10 border border-monzed-accent/30 rounded-lg p-4 mt-6">
                  <p className="font-semibold text-monzed-accent">
                    Key point: Don't use it for illegal stuff, be respectful, and we'll provide the best AI builder we can.
                  </p>
                </div>
              </div>
            </div>

            {/* Who Can Use It */}
            <div className="monzed-bg-secondary rounded-xl p-8 border monzed-border">
              <div className="flex items-center gap-3 mb-6">
                <Shield className="w-6 h-6 text-monzed-accent" />
                <h2 className="text-2xl font-bold monzed-text-primary">Who Can Use This</h2>
              </div>
              <div className="space-y-4 monzed-text-secondary text-base">
                <p><strong className="monzed-text-primary">Age:</strong> You must be 18 or older.</p>
                <p><strong className="monzed-text-primary">Account:</strong> You need a valid email to sign up. Keep your password secure.</p>
                <p><strong className="monzed-text-primary">Location:</strong> We can't serve sanctioned countries (Iran, North Korea, etc.) due to legal restrictions.</p>
              </div>
            </div>

            {/* What You Get */}
            <div className="monzed-bg-secondary rounded-xl p-8 border monzed-border">
              <h2 className="text-2xl font-bold monzed-text-primary mb-6">What You Get</h2>
              <div className="space-y-4 monzed-text-secondary text-base">
                <p><strong className="monzed-text-primary">AI Builder:</strong> Chat with AI to build websites and apps. No coding required.</p>
                <p><strong className="monzed-text-primary">Hosting & Deployment:</strong> We host your projects and help you deploy them.</p>
                <p><strong className="monzed-text-primary">Support:</strong> Help when you need it via email or in-app chat.</p>
                <p><strong className="monzed-text-primary">Updates:</strong> We're constantly improving the AI and adding features.</p>
              </div>
            </div>

            {/* Don't Do These Things */}
            <div className="monzed-bg-secondary rounded-xl p-8 border monzed-border">
              <div className="flex items-center gap-3 mb-6">
                <AlertTriangle className="w-6 h-6 text-monzed-accent" />
                <h2 className="text-2xl font-bold monzed-text-primary">Don't Do These Things</h2>
              </div>
              <div className="space-y-4 monzed-text-secondary text-base">
                <p><strong className="monzed-text-primary">Illegal stuff:</strong> Don't use the platform for anything illegal (scams, fraud, hacking, etc.).</p>
                <p><strong className="monzed-text-primary">Harmful content:</strong> Don't generate content that's harmful, malicious, or violates others' rights.</p>
                <p><strong className="monzed-text-primary">Abuse the system:</strong> Don't try to hack us, create fake accounts, or spam.</p>
                <p><strong className="monzed-text-primary">Respect copyright:</strong> Don't copy other people's work without permission.</p>
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mt-6 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-400 text-sm">If you break these rules, we'll suspend or delete your account. Serious violations will be reported to authorities.</p>
                </div>
              </div>
            </div>

            {/* What You Own */}
            <div className="monzed-bg-secondary rounded-xl p-8 border monzed-border">
              <h2 className="text-2xl font-bold monzed-text-primary mb-6">Ownership</h2>
              <div className="space-y-4 monzed-text-secondary text-base">
                <p><strong className="monzed-text-primary">Your projects:</strong> You own what you build with our AI. The code, designs, content—it's yours.</p>
                <p><strong className="monzed-text-primary">Our platform:</strong> We own the AI builder platform itself, the code that runs it, and our branding.</p>
                <p><strong className="monzed-text-primary">AI outputs:</strong> Generated code is yours to use commercially. We don't claim ownership of what you create.</p>
              </div>
            </div>

            {/* Payments */}
            <div className="monzed-bg-secondary rounded-xl p-8 border monzed-border">
              <h2 className="text-2xl font-bold monzed-text-primary mb-6">Payments & Refunds</h2>
              <div className="space-y-4 monzed-text-secondary text-base">
                <p><strong className="monzed-text-primary">Subscription:</strong> Pay monthly or annually. Cancel anytime from your account settings.</p>
                <p><strong className="monzed-text-primary">Refunds:</strong> We offer 7-day money-back guarantee. After that, no refunds for the current billing period.</p>
                <p><strong className="monzed-text-primary">Pricing changes:</strong> If we change prices, we'll notify you 30 days in advance.</p>
              </div>
            </div>

            {/* Disclaimers */}
            <div className="monzed-bg-secondary rounded-xl p-8 border monzed-border">
              <div className="flex items-center gap-3 mb-6">
                <AlertCircle className="w-6 h-6 text-monzed-accent" />
                <h2 className="text-2xl font-bold monzed-text-primary">Important Disclaimers</h2>
              </div>
              <div className="space-y-4 monzed-text-secondary text-base">
                <p><strong className="monzed-text-primary">AI isn't perfect:</strong> The AI can make mistakes, produce inaccurate code, or misunderstand requests. Always review what it generates.</p>
                <p><strong className="monzed-text-primary">No guarantees:</strong> We provide the platform "as is." We can't guarantee it'll work perfectly 100% of the time.</p>
                <p><strong className="monzed-text-primary">Not professional advice:</strong> This isn't legal, financial, or professional advice. Consult experts for important decisions.</p>
                <p><strong className="monzed-text-primary">Downtime happens:</strong> We try to keep the platform running 24/7, but maintenance and outages can occur.</p>
              </div>
            </div>

            {/* Termination */}
            <div className="monzed-bg-secondary rounded-xl p-8 border monzed-border">
              <h2 className="text-2xl font-bold monzed-text-primary mb-6">Canceling Your Account</h2>
              <div className="space-y-4 monzed-text-secondary text-base">
                <p><strong className="monzed-text-primary">You can leave anytime:</strong> Cancel from Account Settings. You'll keep access until the end of your billing period.</p>
                <p><strong className="monzed-text-primary">We can remove you:</strong> If you violate these terms or do illegal stuff, we'll suspend or delete your account.</p>
                <p><strong className="monzed-text-primary">Export your data:</strong> Before canceling, export your projects. After 30 days, we may delete your data.</p>
              </div>
            </div>

            {/* Changes */}
            <div className="monzed-bg-secondary rounded-xl p-8 border monzed-border">
              <div className="flex items-center gap-3 mb-6">
                <Clock className="w-6 h-6 text-monzed-accent" />
                <h2 className="text-2xl font-bold monzed-text-primary">Changes to Terms</h2>
              </div>
              <div className="space-y-4 monzed-text-secondary text-base">
                <p>We might update these terms. If we do, we'll email you. By continuing to use the platform after changes, you accept the new terms.</p>
              </div>
            </div>

            {/* Contact */}
            <div className="monzed-bg-secondary rounded-xl p-8 border monzed-border">
              <div className="flex items-center gap-3 mb-6">
                <Gavel className="w-6 h-6 text-monzed-accent" />
                <h2 className="text-2xl font-bold monzed-text-primary">Questions About Terms?</h2>
              </div>
              <div className="space-y-3 monzed-text-secondary text-base">
                <p>Email us at <a href="mailto:legal@sharelock.cc" className="text-monzed-accent hover:underline font-semibold">legal@sharelock.cc</a></p>
                <p className="text-sm">We'll respond within a few days.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      </div>
      <Footer />
    </div>
  );
}
