import type { MetaFunction } from '@remix-run/node';
import { motion } from 'framer-motion';
import { classNames } from '~/utils/classNames';
import { UnifiedHeader } from '~/components/header/UnifiedHeader';
import { Footer } from '~/components/footer/Footer';

export const meta: MetaFunction = () => {
  return [
    { title: 'Support - Starsky' },
    { name: 'description', content: 'Get help with Starsky - Documentation, FAQs, and support resources' },
  ];
};

const supportOptions = [
  {
    title: 'Documentation',
    description: 'Comprehensive guides and API references',
    icon: 'i-ph:book-open',
    link: '#docs',
    color: 'blue',
  },
  {
    title: 'Community Discord',
    description: 'Join our community for real-time help',
    icon: 'i-ph:discord-logo',
    link: 'https://discord.gg/StarskyAI',
    color: 'purple',
  },
  {
    title: 'Email Support',
    description: 'Get direct help from our team',
    icon: 'i-ph:envelope',
    link: 'https://mail.google.com/mail/?view=cm&fs=1&to=hello@sharelock.cc&su=Support%20Request&body=Hi%20Starsky%20AI%20team,%0A%0AI%20need%20help%20with:%0A%0A[Please%20describe%20your%20issue%20here]%0A%0AThank%20you!',
    color: 'green',
  },
  {
    title: 'GitHub Issues',
    description: 'Report bugs and request features',
    icon: 'i-ph:github-logo',
    link: 'https://github.com/StarskyAI/issues',
    color: 'gray',
  },
];

const faqs = [
  {
    question: 'How do I get started with Starsky?',
    answer: 'Simply sign up for a free account and start describing your app idea. Starsky will guide you through the entire development process.',
  },
  {
    question: 'What programming languages does Starsky support?',
    answer: 'Starsky supports all major web technologies including React, Vue, Angular, Node.js, Python, and many more frameworks and languages.',
  },
  {
    question: 'Can I export my projects?',
    answer: 'Yes! Pro and Enterprise users can export their projects to GitHub or download them as ZIP files.',
  },
  {
    question: 'Is my code secure?',
    answer: 'Absolutely. We use enterprise-grade security measures and never store your code permanently. Private projects are only accessible to you.',
  },
  {
    question: 'How does billing work?',
    answer: 'Billing is based on the number of AI messages used per month. You can track your usage in your account dashboard.',
  },
];

export default function Support() {
  return (
    <div className="h-full monzed-bg-primary flex flex-col overflow-y-auto modern-scrollbar">
      <UnifiedHeader variant="landing" />
      <main className="flex-1 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl lg:text-6xl font-bold monzed-text-primary mb-6">
            How can we{' '}
            <span className="bg-gradient-to-r from-monzed-glow to-monzed-accent bg-clip-text text-transparent">
              help you?
            </span>
          </h1>
          <p className="text-lg monzed-text-secondary max-w-2xl mx-auto">
            Find answers, get support, and connect with our community. We're here to help you succeed.
          </p>
        </motion.div>

        {/* Support Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {supportOptions.map((option, index) => (
            <motion.a
              key={option.title}
              href={option.link}
              target={option.link.startsWith('http') ? '_blank' : undefined}
              rel={option.link.startsWith('http') ? 'noopener noreferrer' : undefined}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group p-6 rounded-xl border monzed-border monzed-bg-secondary hover:border-monzed-accent/30 transition-all duration-200 hover:shadow-lg"
            >
              <div className="w-12 h-12 rounded-lg bg-monzed-accent/10 flex items-center justify-center mb-4 group-hover:bg-monzed-accent/20 transition-colors">
                <div className={classNames(option.icon, 'w-6 h-6 text-monzed-accent')} />
              </div>
              <h3 className="text-lg font-semibold monzed-text-primary mb-2 group-hover:text-monzed-accent transition-colors">
                {option.title}
              </h3>
              <p className="monzed-text-secondary text-sm">
                {option.description}
              </p>
            </motion.a>
          ))}
        </div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="max-w-4xl mx-auto"
        >
          <h2 className="text-3xl font-bold monzed-text-primary mb-12 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                className="p-6 rounded-xl border monzed-border monzed-bg-secondary"
              >
                <h3 className="text-lg font-semibold monzed-text-primary mb-3">
                  {faq.question}
                </h3>
                <p className="monzed-text-secondary leading-relaxed">
                  {faq.answer}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Contact Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-20 text-center p-8 rounded-2xl bg-gradient-to-r from-monzed-glow/10 to-monzed-accent/10 border border-monzed-accent/20"
        >
          <h2 className="text-2xl font-bold monzed-text-primary mb-4">
            Still need help?
          </h2>
          <p className="monzed-text-secondary mb-6">
            Our support team is here to help you succeed with Starsky.
          </p>
          <a
            href="https://mail.google.com/mail/?view=cm&fs=1&to=hello@sharelock.cc&su=Support%20Request&body=Hi%20Starsky%20AI%20team,%0A%0AI%20need%20help%20with:%0A%0A[Please%20describe%20your%20issue%20here]%0A%0AThank%20you!"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-monzed-glow to-monzed-accent text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 font-medium"
          >
            <div className="i-ph:envelope w-5 h-5" />
            Contact Support
          </a>
        </motion.div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
