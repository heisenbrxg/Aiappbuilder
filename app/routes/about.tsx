import type { MetaFunction } from '@remix-run/node';
import { motion } from 'framer-motion';
import { classNames } from '~/utils/classNames';
import { UnifiedHeader } from '~/components/header/UnifiedHeader';
import { Footer } from '~/components/footer/Footer';
import { getDefaultMeta } from '~/lib/seo';

export const meta: MetaFunction = () =>
  getDefaultMeta(
    'About – Starsky',
    'Learn about Starsky – our mission, vision, and the team behind the AI-powered development platform',
    '/about'
  );

const values = [
  {
    title: 'Innovation',
    description: 'Pushing the boundaries of what\'s possible with AI-assisted development',
    icon: 'i-ph:lightbulb',
  },
  {
    title: 'Accessibility',
    description: 'Making powerful development tools accessible to everyone, regardless of experience',
    icon: 'i-ph:users',
  },
  {
    title: 'Quality',
    description: 'Delivering exceptional code quality and user experience in every interaction',
    icon: 'i-ph:star',
  },
  {
    title: 'Community',
    description: 'Building a supportive community of developers and creators',
    icon: 'i-ph:heart',
  },
];

const stats = [
  { label: 'Projects Created', value: '100K+' },
  { label: 'Active Developers', value: '50K+' },
  { label: 'Lines of Code Generated', value: '10M+' },
  { label: 'Countries Served', value: '150+' },
];


const faqs = [
  { q: 'What is Starsky?', a: 'An AI-assisted development platform that helps you create, improve, and ship apps faster.' },
  { q: 'Is it suitable for beginners?', a: 'Yes. We focus on accessibility and clear UX so both newcomers and experts can be productive.' },
  { q: 'Can I export my code?', a: 'Absolutely. You can download your code or deploy directly using integrated providers.' },
  { q: 'Which models are supported?', a: 'We support a variety of leading AI models and continue to expand the set regularly.' },
];

export default function About() {
  return (
    <div className="h-full monzed-bg-primary flex flex-col overflow-y-auto modern-scrollbar">
      <UnifiedHeader variant="landing" />

      {/* Main Content */}
      <main className="flex-1 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold monzed-text-primary mb-6">
            About{' '}
            <span className="bg-gradient-to-r from-monzed-glow to-monzed-accent bg-clip-text text-transparent">
              Starsky
            </span>
          </h1>
          <p className="text-base sm:text-lg monzed-text-secondary max-w-3xl mx-auto leading-relaxed">
            We're on a mission to democratize software development by making AI-powered coding accessible to everyone. 
            From idea to deployment, Starsky empowers creators to build amazing applications without barriers.
          </p>
        </motion.div>

        {/* Mission Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-20"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold monzed-text-primary mb-6">
                Our Mission
              </h2>
              <p className="monzed-text-secondary leading-relaxed mb-6">
                We believe that great ideas shouldn't be limited by technical barriers. Starsky bridges the gap 
                between imagination and implementation, enabling anyone to bring their vision to life through the power of AI.
              </p>
              <p className="monzed-text-secondary leading-relaxed">
                Whether you're a seasoned developer looking to accelerate your workflow or a complete beginner with a 
                brilliant idea, Starsky provides the tools and guidance you need to succeed.
              </p>
            </div>
            <div className="relative">
              <div className="w-full h-64 rounded-2xl bg-gradient-to-br from-monzed-glow/20 to-monzed-accent/20 border border-monzed-accent/30 flex items-center justify-center">
                <div className="text-6xl text-monzed-accent">
                  <div className="i-ph:rocket" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-20"
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                className="text-center p-6 rounded-xl monzed-bg-secondary border monzed-border"
              >
                <div className="text-3xl font-bold text-monzed-accent mb-2">{stat.value}</div>
                <div className="monzed-text-secondary text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Values Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mb-20"
        >
          <h2 className="text-3xl font-bold monzed-text-primary mb-12 text-center">
            Our Values
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 + index * 0.1 }}
                className="text-center p-6 rounded-xl monzed-bg-secondary border monzed-border hover:border-monzed-accent/30 transition-all duration-200"
              >
                <div className="w-16 h-16 rounded-full bg-monzed-accent/10 flex items-center justify-center mx-auto mb-4">
                  <div className={classNames(value.icon, 'w-8 h-8 text-monzed-accent')} />
                </div>
                <h3 className="text-lg font-semibold monzed-text-primary mb-3">
                  {value.title}
                </h3>
                <p className="monzed-text-secondary text-sm leading-relaxed">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="mb-20"
        >
          <h2 className="text-3xl font-bold monzed-text-primary mb-8 text-center">FAQ</h2>
          <div className="max-w-3xl mx-auto space-y-3">
            {faqs.map((item, i) => (
              <details key={i} className="rounded-lg monzed-bg-secondary border monzed-border p-4 group">
                <summary className="cursor-pointer list-none flex items-center justify-between">
                  <span className="font-medium monzed-text-primary">{item.q}</span>
                  <span className="i-ph:caret-down group-open:rotate-180 transition-transform" />
                </summary>
                <div className="mt-2 text-sm monzed-text-secondary">{item.a}</div>
              </details>
            ))}
          </div>
        </motion.div>



        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="mt-16 text-center"
        >
          <h2 className="text-2xl md:text-3xl font-bold monzed-text-primary mb-4">
            Ready to build something amazing?
          </h2>
          <p className="monzed-text-secondary mb-6 max-w-2xl mx-auto">
            Start creating with AI-assisted development. From idea to production, Starsky helps you ship faster.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="/signup"
              className="px-5 py-2.5 bg-gradient-to-r from-monzed-glow to-monzed-accent text-white font-semibold rounded-lg hover:shadow-lg transition-all"
            >
              Get Started
            </a>
            <a
              href="/pricing"
              className="px-5 py-2.5 monzed-bg-secondary border monzed-border rounded-lg font-medium monzed-text-primary hover:monzed-text-primary/90 transition-colors"
            >
              View Pricing
            </a>
          </div>
        </motion.div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
