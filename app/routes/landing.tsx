import { json, type MetaFunction, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import Layout from '~/components/landing/Layout';
import Hero from '~/components/landing/sections/Hero';
import Features from '~/components/landing/sections/Features';
import Testimonials from '~/components/landing/sections/Testimonials';
import CallToAction from '~/components/landing/sections/CallToAction';

export const meta: MetaFunction = () => {
  return [
    { title: 'sharelock.cc | The Complete AI Ecosystem' },
    { name: 'description', content: 'The complete AI ecosystem that\'s as refreshing as monzed. Launch businesses at light speed with one unified workflow.' },
    { name: 'keywords', content: 'AI ecosystem, artificial intelligence, business automation, monzed AI, Starsky' },
    { property: 'og:title', content: 'sharelock.cc | The Complete AI Ecosystem' },
    { property: 'og:description', content: 'The complete AI ecosystem that\'s as refreshing as monzed. Launch businesses at light speed with one unified workflow.' },
    { property: 'og:type', content: 'website' },
    { property: 'og:image', content: '/logo-white.png' },
    { property: 'og:url', content: 'https://sharelock.cc/' },
    { property: 'twitter:card', content: 'summary_large_image' },
    { property: 'twitter:title', content: 'sharelock.cc | The Complete AI Ecosystem' },
    { property: 'twitter:description', content: 'The complete AI ecosystem that\'s as refreshing as monzed. Launch businesses at light speed with one unified workflow.' },
    { property: 'twitter:image', content: '/logo-white.png' },
    { name: 'robots', content: 'index, follow, max-image-preview:large' },
  ];
};

export default function Landing() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Layout>
        <Hero />
        <Features />
        <Testimonials />
        <CallToAction />
      </Layout>
    </div>
  );
}
