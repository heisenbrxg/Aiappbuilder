import { useEffect, useState } from 'react';
import { MessageSquare, Lightbulb, Star, Send, ThumbsUp, Zap, Users } from 'lucide-react';
import { UnifiedHeader } from '~/components/header/UnifiedHeader';
import { Footer } from '~/components/footer/Footer';
import type { LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return json({ success: true });
};

export default function ProductFeedback() {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('feature');
  const [formData, setFormData] = useState({
    category: 'feature',
    title: '',
    description: '',
    email: '',
    priority: 'medium'
  });

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    console.log('Feedback submitted:', formData);
    // Reset form or show success message
  };

  const categories = [
    { id: 'feature', label: 'Feature Request', icon: Lightbulb, color: 'text-blue-500', bgColor: 'bg-blue-500/20' },
    { id: 'improvement', label: 'Improvement', icon: Star, color: 'text-yellow-500', bgColor: 'bg-yellow-500/20' },
    { id: 'bug', label: 'Bug Report', icon: Zap, color: 'text-red-500', bgColor: 'bg-red-500/20' },
    { id: 'general', label: 'General Feedback', icon: MessageSquare, color: 'text-green-500', bgColor: 'bg-green-500/20' }
  ];

  return (
    <div className="h-full monzed-bg-primary overflow-y-auto modern-scrollbar">
      <UnifiedHeader variant="landing" showNavigation={true} />
      <div className="pt-20">
        {/* Header */}
        <section className="py-20 monzed-bg-secondary relative overflow-hidden">
        <div className="absolute inset-0 monzed-grid-bg opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full border monzed-border-bright monzed-bg-primary/50 backdrop-blur-sm mb-8 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <MessageSquare className="w-5 h-5 text-monzed-accent" />
              <span className="text-sm font-semibold monzed-text-secondary">Your Voice Matters</span>
            </div>

            <h1 className={`text-4xl md:text-5xl lg:text-6xl font-bold monzed-text-primary mb-6 monzed-font-dm-sans transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              Product Feedback & Suggestions
            </h1>
            
            <p className={`text-xl monzed-text-secondary max-w-4xl mx-auto leading-relaxed transition-all duration-1000 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              Help us build the future of digital money and business by sharing your ideas, suggestions, and feedback.
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-20 monzed-bg-primary">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            {/* Feedback Form */}
            <div className="lg:col-span-2">
              <div className="monzed-bg-secondary rounded-2xl p-8 border monzed-border">
                <h2 className="text-2xl font-bold monzed-text-primary mb-6">Share Your Feedback</h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Category Selection */}
                  <div>
                    <label className="block text-sm font-semibold monzed-text-primary mb-4">
                      What type of feedback is this?
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {categories.map((category) => {
                        const IconComponent = category.icon;
                        return (
                          <button
                            key={category.id}
                            type="button"
                            onClick={() => {
                              setSelectedCategory(category.id);
                              setFormData(prev => ({ ...prev, category: category.id }));
                            }}
                            className={`p-4 rounded-xl border transition-all duration-300 flex items-center gap-3 ${
                              selectedCategory === category.id
                                ? `border-monzed-accent ${category.bgColor}`
                                : 'border-gray-600 hover:border-gray-500'
                            }`}
                          >
                            <IconComponent className={`w-5 h-5 ${category.color}`} />
                            <span className="text-sm font-medium monzed-text-primary">{category.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-semibold monzed-text-primary mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Brief summary of your feedback..."
                      className="w-full px-4 py-3 rounded-xl border monzed-border monzed-bg-primary monzed-text-primary placeholder-gray-500 focus:border-monzed-accent focus:outline-none"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold monzed-text-primary mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Please provide detailed information about your feedback, feature request, or suggestion..."
                      rows={6}
                      className="w-full px-4 py-3 rounded-xl border monzed-border monzed-bg-primary monzed-text-primary placeholder-gray-500 focus:border-monzed-accent focus:outline-none resize-none"
                      required
                    />
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="block text-sm font-semibold monzed-text-primary mb-2">
                      Priority
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border monzed-border monzed-bg-primary monzed-text-primary focus:border-monzed-accent focus:outline-none"
                    >
                      <option value="low">Low - Nice to have</option>
                      <option value="medium">Medium - Would improve experience</option>
                      <option value="high">High - Important for my workflow</option>
                      <option value="critical">Critical - Blocking my usage</option>
                    </select>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-semibold monzed-text-primary mb-2">
                      Email (Optional)
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="your@email.com (for follow-up if needed)"
                      className="w-full px-4 py-3 rounded-xl border monzed-border monzed-bg-primary monzed-text-primary placeholder-gray-500 focus:border-monzed-accent focus:outline-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full monzed-btn-primary flex items-center justify-center gap-2"
                  >
                    <Send className="w-5 h-5" />
                    Submit Feedback
                  </button>
                </form>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              
              {/* Quick Stats */}
              <div className="monzed-bg-secondary rounded-xl p-6 border monzed-border">
                <h3 className="text-lg font-bold monzed-text-primary mb-4">Community Impact</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm monzed-text-secondary">Features Requested</span>
                    <span className="text-lg font-bold text-monzed-accent">1,247</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm monzed-text-secondary">Features Implemented</span>
                    <span className="text-lg font-bold text-green-400">342</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm monzed-text-secondary">Implementation Rate</span>
                    <span className="text-lg font-bold text-monzed-accent">27%</span>
                  </div>
                </div>
              </div>

              {/* Popular Requests */}
              <div className="monzed-bg-secondary rounded-xl p-6 border monzed-border">
                <h3 className="text-lg font-bold monzed-text-primary mb-4">Popular Requests</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg border monzed-border">
                    <ThumbsUp className="w-4 h-4 text-monzed-accent" />
                    <div>
                      <div className="text-sm font-medium monzed-text-primary">Mobile App</div>
                      <div className="text-xs monzed-text-secondary">156 votes</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg border monzed-border">
                    <ThumbsUp className="w-4 h-4 text-monzed-accent" />
                    <div>
                      <div className="text-sm font-medium monzed-text-primary">Dark Mode</div>
                      <div className="text-xs monzed-text-secondary">134 votes</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg border monzed-border">
                    <ThumbsUp className="w-4 h-4 text-monzed-accent" />
                    <div>
                      <div className="text-sm font-medium monzed-text-primary">API Webhooks</div>
                      <div className="text-xs monzed-text-secondary">98 votes</div>
                    </div>
                  </div>
                </div>
                <button className="w-full mt-4 text-sm text-monzed-accent hover:underline">
                  View All Requests →
                </button>
              </div>

              {/* Recent Updates */}
              <div className="monzed-bg-secondary rounded-xl p-6 border monzed-border">
                <h3 className="text-lg font-bold monzed-text-primary mb-4">Recently Implemented</h3>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg border border-green-500/30 bg-green-500/10">
                    <div className="text-sm font-medium text-green-400">Two-Factor Authentication</div>
                    <div className="text-xs text-green-300">Implemented last week</div>
                  </div>
                  <div className="p-3 rounded-lg border border-green-500/30 bg-green-500/10">
                    <div className="text-sm font-medium text-green-400">Export Transactions</div>
                    <div className="text-xs text-green-300">Implemented 2 weeks ago</div>
                  </div>
                  <div className="p-3 rounded-lg border border-green-500/30 bg-green-500/10">
                    <div className="text-sm font-medium text-green-400">Bulk Operations</div>
                    <div className="text-xs text-green-300">Implemented last month</div>
                  </div>
                </div>
              </div>

              {/* Contact Options */}
              <div className="monzed-bg-secondary rounded-xl p-6 border monzed-border">
                <h3 className="text-lg font-bold monzed-text-primary mb-4">Other Ways to Reach Us</h3>
                <div className="space-y-3">
                  <a 
                    href="https://discord.gg/Starsky" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg border monzed-border hover:border-monzed-accent/30 transition-colors"
                  >
                    <Users className="w-5 h-5 text-monzed-accent" />
                    <div>
                      <div className="text-sm font-medium monzed-text-primary">Discord Community</div>
                      <div className="text-xs monzed-text-secondary">Join the discussion</div>
                    </div>
                  </a>
                  
                  <a 
                    href="mailto:feedback@sharelock.cc"
                    className="flex items-center gap-3 p-3 rounded-lg border monzed-border hover:border-monzed-accent/30 transition-colors"
                  >
                    <MessageSquare className="w-5 h-5 text-monzed-accent" />
                    <div>
                      <div className="text-sm font-medium monzed-text-primary">Direct Email</div>
                      <div className="text-xs monzed-text-secondary">feedback@sharelock.cc</div>
                    </div>
                  </a>
                  
                  <a 
                    href="https://github.com/Starsky-ai/feedback"
                    target="_blank"
                    rel="noopener noreferrer" 
                    className="flex items-center gap-3 p-3 rounded-lg border monzed-border hover:border-monzed-accent/30 transition-colors"
                  >
                    <Lightbulb className="w-5 h-5 text-monzed-accent" />
                    <div>
                      <div className="text-sm font-medium monzed-text-primary">GitHub Issues</div>
                      <div className="text-xs monzed-text-secondary">Track feature requests</div>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Feedback Guidelines */}
          <div className="mt-16 monzed-bg-secondary rounded-xl p-8 border monzed-border">
            <h2 className="text-2xl font-bold monzed-text-primary mb-6 text-center">Feedback Guidelines</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-monzed-accent/20 border-2 border-monzed-accent/30 flex items-center justify-center mx-auto mb-4">
                  <Star className="w-6 h-6 text-monzed-accent" />
                </div>
                <h3 className="font-bold monzed-text-primary mb-2">Be Specific</h3>
                <p className="text-sm monzed-text-secondary">Provide clear, detailed descriptions of your suggestion or issue.</p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-monzed-accent/20 border-2 border-monzed-accent/30 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-monzed-accent" />
                </div>
                <h3 className="font-bold monzed-text-primary mb-2">Think User Impact</h3>
                <p className="text-sm monzed-text-secondary">Consider how your suggestion would benefit other users.</p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-monzed-accent/20 border-2 border-monzed-accent/30 flex items-center justify-center mx-auto mb-4">
                  <Lightbulb className="w-6 h-6 text-monzed-accent" />
                </div>
                <h3 className="font-bold monzed-text-primary mb-2">Stay Constructive</h3>
                <p className="text-sm monzed-text-secondary">Focus on solutions and improvements rather than just problems.</p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-monzed-accent/20 border-2 border-monzed-accent/30 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-6 h-6 text-monzed-accent" />
                </div>
                <h3 className="font-bold monzed-text-primary mb-2">Engage Respectfully</h3>
                <p className="text-sm monzed-text-secondary">Maintain a respectful tone in all communications.</p>
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
