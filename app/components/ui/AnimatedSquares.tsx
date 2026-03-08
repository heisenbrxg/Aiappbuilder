import { useEffect, useState } from 'react';

interface Square {
  id: number;
  x: number;
  y: number;
  size: number;
  rotation: number;
  opacity: number;
  speed: number;
  rotationSpeed: number;
  gradient: string;
}

export default function AnimatedSquares() {
  const [squares, setSquares] = useState<Square[]>([]);

  useEffect(() => {
    // Create initial squares
    const initialSquares: Square[] = [];
    const gradients = [
      'from-yellow-400/40 to-yellow-600/20',
      'from-yellow-500/35 to-yellow-700/25',
      'from-yellow-600/30 to-yellow-500/20',
      'from-yellow-300/45 to-amber-500/15',
      'from-amber-400/30 to-yellow-400/25',
      'from-yellow-500/25 to-amber-600/30',
      'from-yellow-200/40 to-yellow-600/20',
    ];

    for (let i = 0; i < 18; i++) {
      initialSquares.push({
        id: i,
        x: Math.random() * 130 - 15, // Allow more squares to start off-screen
        y: Math.random() * 130 - 15,
        size: Math.random() * 100 + 10, // 10-110px for more variety
        rotation: Math.random() * 360,
        opacity: Math.random() * 0.35 + 0.03, // 0.03-0.38 for subtlety
        speed: Math.random() * 0.6 + 0.08, // 0.08-0.68 for smoother movement
        rotationSpeed: Math.random() * 2.5 - 1.25, // -1.25 to 1.25
        gradient: gradients[Math.floor(Math.random() * gradients.length)],
      });
    }

    setSquares(initialSquares);

    // Animation loop
    const animateSquares = () => {
      setSquares(prevSquares =>
        prevSquares.map(square => {
          let newY = square.y + square.speed;
          let newX = square.x;

          // Reset position when square goes off screen
          if (newY > 110) {
            newY = -10;
            newX = Math.random() * 120 - 10;
          }

          return {
            ...square,
            y: newY,
            x: newX + Math.sin(Date.now() * 0.0008 + square.id) * 0.15, // Gentle horizontal drift
            rotation: square.rotation + square.rotationSpeed,
            opacity: square.opacity + Math.sin(Date.now() * 0.002 + square.id) * 0.05, // Subtle opacity pulse
          };
        })
      );
    };

    const interval = setInterval(animateSquares, 60);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Main animated squares */}
      {squares.map(square => (
        <div
          key={square.id}
          className={`absolute bg-gradient-to-br ${square.gradient} rounded-lg`}
          style={{
            left: `${square.x}%`,
            top: `${square.y}%`,
            width: `${square.size}px`,
            height: `${square.size}px`,
            opacity: Math.max(0.05, Math.min(0.5, square.opacity)),
            transform: `rotate(${square.rotation}deg)`,
            filter: `blur(${square.size > 50 ? '2px' : '1px'})`,
            transition: 'all 0.06s linear',
          }}
        />
      ))}

      {/* Smaller accent squares */}
      {squares.slice(0, 9).map(square => (
        <div
          key={`accent-${square.id}`}
          className="absolute bg-yellow-500/8 rounded-sm"
          style={{
            left: `${(square.x + 25) % 100}%`,
            top: `${(square.y + 35) % 100}%`,
            width: `${square.size * 0.25}px`,
            height: `${square.size * 0.25}px`,
            opacity: square.opacity * 0.7,
            transform: `rotate(${-square.rotation * 0.8}deg)`,
            filter: 'blur(0.5px)',
            transition: 'all 0.06s linear',
          }}
        />
      ))}

      {/* Additional micro squares for depth */}
      {squares.slice(0, 6).map(square => (
        <div
          key={`micro-${square.id}`}
          className="absolute bg-yellow-400/6 rounded-full"
          style={{
            left: `${(square.x + 50) % 100}%`,
            top: `${(square.y + 60) % 100}%`,
            width: `${square.size * 0.15}px`,
            height: `${square.size * 0.15}px`,
            opacity: square.opacity * 0.5,
            transform: `rotate(${square.rotation * 1.5}deg)`,
            filter: 'blur(1px)',
            transition: 'all 0.06s linear',
          }}
        />
      ))}

      {/* Floating particles */}
      <div className="absolute inset-0">
        {[...Array(22)].map((_, i) => (
          <div
            key={`particle-${i}`}
            className="absolute rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 4 + 0.5}px`,
              height: `${Math.random() * 4 + 0.5}px`,
              backgroundColor: `rgba(244, 211, 94, ${Math.random() * 0.25 + 0.05})`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${1.5 + Math.random() * 3.5}s`,
            }}
          />
        ))}
      </div>

      {/* Subtle glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-yellow-500/5 to-amber-500/10" />
    </div>
  );
}
