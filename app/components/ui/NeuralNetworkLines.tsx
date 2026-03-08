export default function NeuralNetworkLines() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg className="w-full h-full opacity-20" viewBox="0 0 1000 1000">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--color-monzed-accent)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="var(--color-mint-cyber)" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        <path 
          d="M100,200 Q300,100 500,300 T900,200" 
          stroke="url(#lineGradient)" 
          strokeWidth="2" 
          fill="none"
          className="animate-pulse"
        />
        <path 
          d="M200,800 Q400,600 600,700 T800,600" 
          stroke="url(#lineGradient)" 
          strokeWidth="1.5" 
          fill="none"
          className="animate-pulse"
          style={{ animationDelay: '1s' }}
        />
        <path 
          d="M50,500 Q250,400 450,600 T750,500" 
          stroke="url(#lineGradient)" 
          strokeWidth="1" 
          fill="none"
          className="animate-pulse"
          style={{ animationDelay: '2s' }}
        />
        <path 
          d="M150,300 Q350,200 550,400 T850,300" 
          stroke="url(#lineGradient)" 
          strokeWidth="1.5" 
          fill="none"
          className="animate-pulse"
          style={{ animationDelay: '0.5s' }}
        />
        <path 
          d="M300,100 Q500,50 700,250 T950,150" 
          stroke="url(#lineGradient)" 
          strokeWidth="1" 
          fill="none"
          className="animate-pulse"
          style={{ animationDelay: '1.5s' }}
        />
      </svg>
    </div>
  );
}
