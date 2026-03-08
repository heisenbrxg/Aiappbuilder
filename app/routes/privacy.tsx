import { useEffect, useState } from 'react';
import { Shield, Eye, Database, Lock, Globe, Mail, Phone, FileText } from 'lucide-react';
import type { LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { UnifiedHeader } from '~/components/header/UnifiedHeader';
import { Footer } from '~/components/footer/Footer';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return json({ success: true });
};

export default function PrivacyPolicy() {
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
              <Shield className="w-5 h-5 text-monzed-accent" />
              <span className="text-sm font-semibold monzed-text-secondary">Privacy & Data Protection</span>
            </div>

            <h1 className={`text-4xl md:text-5xl lg:text-6xl font-bold monzed-text-primary mb-6 monzed-font-dm-sans transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              Privacy Policy
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
            
            {/* What This Is About */}
            <div className="monzed-bg-secondary rounded-xl p-8 border monzed-border">
              <h2 className="text-2xl font-bold monzed-text-primary mb-6">What This Is About</h2>
              <div className="space-y-4 monzed-text-secondary leading-relaxed text-base">
                <p>
                  We built an AI platform that helps you build websites and apps. To do that, we need some of your information. 
                  This policy explains what we collect, how we use it, and how we protect it.
                </p>
                <div className="bg-monzed-accent/10 border border-monzed-accent/30 rounded-lg p-4 mt-6">
                  <p className="font-semibold text-monzed-accent">
                    Simple version: We only collect what's needed to run the AI builder, we don't sell your data, and you can delete everything anytime.
                  </p>
                </div>
              </div>
            </div>

            {/* What We Collect */}
            <div className="monzed-bg-secondary rounded-xl p-8 border monzed-border">
              <h2 className="text-2xl font-bold monzed-text-primary mb-6">What We Collect</h2>
              <div className="space-y-6 monzed-text-secondary text-base">
                <div className="flex gap-3">
                  <Database className="w-5 h-5 text-monzed-accent flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold monzed-text-primary mb-2">Account Stuff</h3>
                    <p>Your name, email, and password (encrypted). That's it for the basics.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Lock className="w-5 h-5 text-monzed-accent flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold monzed-text-primary mb-2">Payment Info</h3>
                    <p>If you upgrade, we need billing details. We use Stripe to process payments securely—we never store your card number.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Eye className="w-5 h-5 text-monzed-accent flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold monzed-text-primary mb-2">AI Conversations</h3>
                    <p>What you ask the AI and what it builds for you. We need this to make the AI work and improve it.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Globe className="w-5 h-5 text-monzed-accent flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold monzed-text-primary mb-2">Cookies</h3>
                    <p>Basic cookies to keep you logged in and remember your preferences. See our <a href="/cookies" className="text-monzed-accent hover:underline">Cookie Policy</a> for more.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* How We Use It */}
            <div className="monzed-bg-secondary rounded-xl p-8 border monzed-border">
              <h2 className="text-2xl font-bold monzed-text-primary mb-6">How We Use It</h2>
              <div className="space-y-4 monzed-text-secondary text-base">
                <p><strong className="monzed-text-primary">To run the platform:</strong> Your account lets you log in, your prompts help AI build websites, and payments keep your subscription active.</p>
                <p><strong className="monzed-text-primary">To make it better:</strong> We analyze how people use the platform to improve the AI and fix bugs.</p>
                <p><strong className="monzed-text-primary">To communicate:</strong> Send you important emails about your account, security alerts, and updates (you can unsubscribe from marketing emails).</p>
                <p><strong className="monzed-text-primary">When required by law:</strong> If we get a legal request, we may need to share data. We'll fight it if it's unreasonable.</p>
              </div>
            </div>

            {/* Who Sees It */}
            <div className="monzed-bg-secondary rounded-xl p-8 border monzed-border">
              <h2 className="text-2xl font-bold monzed-text-primary mb-6">Who Sees Your Data</h2>
              <div className="space-y-4 monzed-text-secondary text-base">
                <div className="bg-monzed-accent/10 border border-monzed-accent/30 rounded-lg p-4 flex items-center gap-3">
                  <Shield className="w-6 h-6 text-monzed-accent flex-shrink-0" />
                  <p className="font-semibold text-monzed-accent text-lg">We DON'T sell your data. Period.</p>
                </div>
                <p><strong className="monzed-text-primary">Service providers:</strong> Companies that help us run the platform (cloud hosting, payment processing, AI APIs). They're required to keep your data secure.</p>
                <p><strong className="monzed-text-primary">If legally required:</strong> Law enforcement with a valid request. We'll notify you unless prohibited by law.</p>
                <p><strong className="monzed-text-primary">That's it.</strong> Nobody else gets your data without your explicit permission.</p>
              </div>
            </div>

            {/* Security */}
            <div className="monzed-bg-secondary rounded-xl p-8 border monzed-border">
              <div className="flex items-center gap-3 mb-6">
                <Lock className="w-6 h-6 text-monzed-accent" />
                <h2 className="text-2xl font-bold monzed-text-primary">How We Protect It</h2>
              </div>
              <div className="space-y-4 monzed-text-secondary text-base">
                <p>We encrypt your data, use secure servers, and require strong passwords. Your payment info goes through Stripe (never touches our servers).</p>
                <p>If there's ever a data breach, we'll email you within 72 hours with details and what to do.</p>
              </div>
            </div>

            {/* Your Rights */}
            <div className="monzed-bg-secondary rounded-xl p-8 border monzed-border">
              <h2 className="text-2xl font-bold monzed-text-primary mb-6">Your Rights</h2>
              <div className="space-y-4 monzed-text-secondary text-base">
                <p><strong className="monzed-text-primary">View your data:</strong> See everything we have about you.</p>
                <p><strong className="monzed-text-primary">Export:</strong> Download all your data in a readable format.</p>
                <p><strong className="monzed-text-primary">Delete:</strong> Delete your account and all data permanently.</p>
                <p><strong className="monzed-text-primary">Correct:</strong> Fix any wrong information in your profile.</p>
                <div className="flex items-center gap-2 text-sm mt-6">
                  <Mail className="w-4 h-4 text-monzed-accent" />
                  <p>Go to Account Settings or email <a href="mailto:privacy@sharelock.cc" className="text-monzed-accent hover:underline">privacy@sharelock.cc</a></p>
                </div>
              </div>
            </div>

            {/* Data Retention */}
            <div className="monzed-bg-secondary rounded-xl p-8 border monzed-border">
              <h2 className="text-2xl font-bold monzed-text-primary mb-6">How Long We Keep It</h2>
              <div className="space-y-3 monzed-text-secondary text-base">
                <p><strong className="monzed-text-primary">While you're using the platform:</strong> As long as your account is active.</p>
                <p><strong className="monzed-text-primary">After you delete your account:</strong> Most data is deleted immediately. Some legal/financial records we're required to keep for 3-7 years.</p>
                <p><strong className="monzed-text-primary">Anonymous usage data:</strong> We keep aggregated stats (no personal info) to improve the platform.</p>
              </div>
            </div>

            {/* Other Important Stuff */}
            <div className="monzed-bg-secondary rounded-xl p-8 border monzed-border">
              <h2 className="text-2xl font-bold monzed-text-primary mb-6">Other Important Stuff</h2>
              <div className="space-y-4 monzed-text-secondary text-base">
                <p><strong className="monzed-text-primary">Age:</strong> You must be 18+ to use this platform.</p>
                <p><strong className="monzed-text-primary">International:</strong> Your data may be stored on servers in different countries (always encrypted).</p>
                <p><strong className="monzed-text-primary">Changes:</strong> If we update this policy, we'll email you. Continuing to use the platform means you accept the changes.</p>
              </div>
            </div>

            {/* Contact */}
            <div className="monzed-bg-secondary rounded-xl p-8 border monzed-border">
              <div className="flex items-center gap-3 mb-6">
                <Mail className="w-6 h-6 text-monzed-accent" />
                <h2 className="text-2xl font-bold monzed-text-primary">Questions?</h2>
              </div>
              <div className="space-y-3 monzed-text-secondary text-base">
                <p>Email us at <a href="mailto:privacy@sharelock.cc" className="text-monzed-accent hover:underline font-semibold">privacy@sharelock.cc</a></p>
                <p className="text-sm">We'll respond within 30 days (usually faster).</p>
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
