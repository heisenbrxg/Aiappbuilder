import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from '@remix-run/react';
import { useAuthGuard } from '~/hooks/useAuthGuard';

// Capability Cards (featured)
const CAPABILITY_CARDS: { title: string; icon: string; prompt: string }[] = [
  {
    title: 'Mobile App',
    icon: 'i-ph:device-mobile',
    prompt:
      'Create a React Native Expo mobile app called TaskMaster for managing todo tasks. Include a clean UI with tabs for tasks, calendar, and profile. Use TypeScript and modern design.'
  },
  {
    title: 'Website',
    icon: 'i-ph:globe',
    prompt:
      'Build a modern business website. Include Home page with hero section, About, Services, Portfolio, and Contact pages. Make it responsive with smooth animations.'
  },
  {
    title: 'Web3 App',
    icon: 'i-ph:cube',
    prompt:
      'Build a Web3 DApp with wallet integration. Include connect wallet button and display token balance. Create a clean UI with modern design.'
  }
];

export function ExamplePrompts({ sendMessage }: { sendMessage?: (event: React.UIEvent, messageInput?: string) => void }) {
  const { isAuthenticated } = useAuthGuard();
  const navigate = useNavigate();

  return (
    <div id="examples" className="flex flex-col gap-4 mt-4">
      {/* Featured capability cards */}
      <div className="flex flex-wrap gap-2 justify-center">
        {CAPABILITY_CARDS.map((card, idx) => (
          <motion.button
            key={card.title}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
            onClick={(event) => {
              if (isAuthenticated) {
                sendMessage?.(event, card.prompt);
              } else {
                navigate('/login');
              }
            }}
            className={`group relative px-4 py-2 rounded-full border transition-all duration-200 hover:scale-105 hover:border-monzed-accent/60 hover:shadow-lg hover:shadow-monzed-accent/20 shadow-sm shadow-monzed-accent/10 monzed-bg-secondary
              ${isAuthenticated ? 'monzed-glass monzed-border-bright' : 'monzed-glass monzed-border'}`}
            title={!isAuthenticated ? 'Login required' : card.title}
          >
            <div className="flex items-center gap-2">
              <div className={`${card.icon} w-4 h-4 text-monzed-accent`} />
              <div className="text-xs font-medium monzed-text-primary">{card.title}</div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
