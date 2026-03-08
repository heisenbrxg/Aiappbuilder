import { Star, Quote } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export default function Testimonials() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'E-commerce Entrepreneur',
      avatar: '/avatars/sarah.png',
      content: 'I told Starsky "build me an online jewelry store" and had a complete e-commerce site with Stripe payments ready in 15 minutes. Made my first sale within hours!',
      rating: 5,
      company: 'Artisan Jewelry Co'
    },
    {
      name: 'Marcus Rodriguez',
      role: 'Digital Consultant',
      avatar: '/avatars/markus.png',
      content: 'Starsky handles everything - websites, payment processing, even marketing automation. I can deliver complete business solutions to clients in minutes instead of months.',
      rating: 5,
      company: 'Rodriguez Digital'
    },
    {
      name: 'Emily Watson',
      role: 'Small Business Owner',
      avatar: '/avatars/emily.png',
      content: 'As someone with zero technical skills, Starsky made it possible for me to build a professional consulting business with online booking and payments. It\'s like having a tech team in my pocket.',
      rating: 5,
      company: 'Watson Consulting'
    }
  ];

  return (
    <section id="testimonials" className="py-24 monzed-bg-primary relative overflow-hidden" ref={sectionRef}>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-12 sm:mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold monzed-text-primary mb-6 monzed-font-dm-sans">
            What Our <span className="text-transparent bg-gradient-to-r from-monzed-accent to-mint-cyber bg-clip-text monzed-gradient-animate">Users Say</span>
          </h2>
          <p className="text-base sm:text-lg lg:text-xl monzed-text-secondary max-w-3xl mx-auto leading-relaxed px-2 sm:px-0">
            Join thousands of entrepreneurs and business owners who are building their dreams with Starsky
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className={`group p-8 rounded-2xl monzed-glass border monzed-border hover:border-monzed-accent/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-monzed-accent/10 relative overflow-hidden ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${index * 200}ms` }}
            >
              {/* Quote Icon with animation */}
              <div className="absolute top-6 right-6 opacity-10 group-hover:opacity-20 transition-opacity duration-300">
                <Quote size={48} className="monzed-text-primary group-hover:text-monzed-accent transition-colors duration-300" />
              </div>
              
              {/* Hover gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-monzed-accent/0 to-monzed-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />

              {/* Rating with stagger animation */}
              <div className="flex items-center gap-1 mb-4 relative z-10">
                {[...Array(testimonial.rating)].map((_, starIndex) => (
                  <Star 
                    key={starIndex} 
                    size={16} 
                    className={`text-monzed-accent fill-current transition-all duration-300 ${
                      isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
                    }`}
                    style={{ transitionDelay: `${(index * 200) + (starIndex * 50)}ms` }}
                  />
                ))}
              </div>

              {/* Content */}
              <p className="monzed-text-secondary leading-relaxed mb-6 relative z-10">
                "{testimonial.content}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-monzed-accent/20 group-hover:border-monzed-accent/40 transition-colors duration-300">
                  <img 
                    src={testimonial.avatar} 
                    alt={`${testimonial.name} avatar`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-bold monzed-text-primary monzed-font-dm-sans">
                    {testimonial.name}
                  </h4>
                  <p className="text-sm monzed-text-secondary">
                    {testimonial.role}
                  </p>
                  <p className="text-xs text-monzed-accent">
                    {testimonial.company}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
