import { useEffect, useState } from 'react';
import { Cookie, Shield, Settings, Eye, Globe } from 'lucide-react';
import type { LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { UnifiedHeader } from '~/components/header/UnifiedHeader';
import { Footer } from '~/components/footer/Footer';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return json({ success: true });
};

export default function CookiePolicy() {
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
              <Cookie className="w-5 h-5 text-monzed-accent" />
              <span className="text-sm font-semibold monzed-text-secondary">Cookie Policy</span>
            </div>

            <h1 className={`text-4xl md:text-5xl lg:text-6xl font-bold monzed-text-primary mb-6 monzed-font-dm-sans transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              Cookie Policy
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
            
            {/* What Are Cookies */}
            <div className="monzed-bg-secondary rounded-xl p-8 border monzed-border">
              <h2 className="text-2xl font-bold monzed-text-primary mb-6">What Are Cookies?</h2>
              <div className="space-y-4 monzed-text-secondary text-base leading-relaxed">
                <p>
                  Cookies are small text files stored on your device when you use our AI builder platform. They help us remember you and improve your experience.
                </p>
                <div className="bg-monzed-accent/10 border border-monzed-accent/30 rounded-lg p-4 mt-6">
                  <p className="font-semibold text-monzed-accent">
                    Simple version: Cookies keep you logged in and remember your preferences. Nothing creepy.
                  </p>
                </div>
              </div>
            </div>

            {/* What Cookies We Use */}
            <div className="monzed-bg-secondary rounded-xl p-8 border monzed-border">
              <h2 className="text-2xl font-bold monzed-text-primary mb-6">What Cookies We Use</h2>
              <div className="space-y-6 monzed-text-secondary text-base">
                <div className="flex gap-3">
                  <Shield className="w-5 h-5 text-monzed-accent flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold monzed-text-primary mb-2">Essential Cookies</h3>
                    <p><strong className="monzed-text-primary">Required:</strong> These keep you logged in and make the platform work. You can't opt out of these.</p>
                    <p className="text-sm mt-2">Example: Session cookies, security tokens.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Settings className="w-5 h-5 text-monzed-accent flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold monzed-text-primary mb-2">Preference Cookies</h3>
                    <p><strong className="monzed-text-primary">Optional:</strong> Remember your settings like theme choice, language, and workbench preferences.</p>
                    <p className="text-sm mt-2">Example: Dark mode preference, last used AI model.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Eye className="w-5 h-5 text-monzed-accent flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold monzed-text-primary mb-2">Analytics Cookies</h3>
                    <p><strong className="monzed-text-primary">Optional:</strong> Help us understand how you use the platform so we can improve it.</p>
                    <p className="text-sm mt-2">Example: Which features you use most, where you get stuck.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* What We DON'T Use */}
            <div className="monzed-bg-secondary rounded-xl p-8 border monzed-border">
              <div className="flex items-center gap-3 mb-6">
                <Shield className="w-6 h-6 text-monzed-accent" />
                <h2 className="text-2xl font-bold monzed-text-primary">What We DON'T Use</h2>
              </div>
              <div className="space-y-3 monzed-text-secondary text-base">
                <p><strong className="monzed-text-primary">No advertising cookies:</strong> We don't track you across the web or sell your data to advertisers.</p>
                <p><strong className="monzed-text-primary">No social media tracking:</strong> No Facebook pixels, Google remarketing, or similar tracking.</p>
                <p><strong className="monzed-text-primary">No unnecessary third-party cookies:</strong> We keep it minimal.</p>
              </div>
            </div>

            {/* Managing Cookies */}
            <div className="monzed-bg-secondary rounded-xl p-8 border monzed-border">
              <div className="flex items-center gap-3 mb-6">
                <Settings className="w-6 h-6 text-monzed-accent" />
                <h2 className="text-2xl font-bold monzed-text-primary">Managing Cookies</h2>
              </div>
              <div className="space-y-4 monzed-text-secondary text-base">
                <p><strong className="monzed-text-primary">In your browser:</strong> Most browsers let you block or delete cookies. Check your browser settings.</p>
                <p><strong className="monzed-text-primary">On our platform:</strong> Go to Account Settings → Privacy to manage optional cookies.</p>
                <p className="text-sm italic">Note: Blocking essential cookies will break the platform's functionality.</p>
              </div>
            </div>

            {/* How Long */}
            <div className="monzed-bg-secondary rounded-xl p-8 border monzed-border">
              <h2 className="text-2xl font-bold monzed-text-primary mb-6">How Long Do Cookies Last?</h2>
              <div className="space-y-3 monzed-text-secondary text-base">
                <p><strong className="monzed-text-primary">Session cookies:</strong> Deleted when you close your browser.</p>
                <p><strong className="monzed-text-primary">Persistent cookies:</strong> Stick around for up to 1 year, so you don't have to re-login constantly.</p>
                <p><strong className="monzed-text-primary">Analytics cookies:</strong> Last up to 2 years to track long-term usage patterns.</p>
              </div>
            </div>

            {/* Updates */}
            <div className="monzed-bg-secondary rounded-xl p-8 border monzed-border">
              <h2 className="text-2xl font-bold monzed-text-primary mb-6">Changes to This Policy</h2>
              <div className="space-y-3 monzed-text-secondary text-base">
                <p>If we change how we use cookies, we'll update this page and notify you via email.</p>
              </div>
            </div>

            {/* Questions */}
            <div className="monzed-bg-secondary rounded-xl p-8 border monzed-border">
              <div className="flex items-center gap-3 mb-6">
                <Globe className="w-6 h-6 text-monzed-accent" />
                <h2 className="text-2xl font-bold monzed-text-primary">Questions?</h2>
              </div>
              <div className="space-y-3 monzed-text-secondary text-base">
                <p>Email us at <a href="mailto:privacy@sharelock.cc" className="text-monzed-accent hover:underline font-semibold">privacy@sharelock.cc</a></p>
                <p className="text-sm">We'll respond within 30 days.</p>
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
