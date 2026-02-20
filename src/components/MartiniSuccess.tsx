import { useEffect } from 'react';

export function MartiniSuccess() {
  useEffect(() => {
    // Add sparkle animation keyframes dynamically
    const style = document.createElement('style');
    style.textContent = `
      @keyframes sparkle {
        0%, 100% { opacity: 0; transform: scale(0); }
        50% { opacity: 1; transform: scale(1); }
      }
      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
      }
      @keyframes shimmer {
        0% { opacity: 0.3; }
        50% { opacity: 1; }
        100% { opacity: 0.3; }
      }
      .sparkle {
        animation: sparkle 2s ease-in-out infinite;
      }
      .float {
        animation: float 3s ease-in-out infinite;
      }
      .shimmer {
        animation: shimmer 2s ease-in-out infinite;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#10B981]/10 to-[#F59E0B]/10 dark:from-[#10B981]/20 dark:to-[#F59E0B]/20">
      <div className="float">
        {/* Success Checkmark Circle */}
        <svg 
          width="120" 
          height="120" 
          viewBox="0 0 120 120" 
          className="mb-8"
        >
          {/* Outer Circle */}
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke="#10B981"
            strokeWidth="4"
            className="shimmer"
          />
          
          {/* Inner Circle */}
          <circle
            cx="60"
            cy="60"
            r="40"
            fill="url(#gradient)"
            opacity="0.2"
          />
          
          {/* Checkmark */}
          <path
            d="M40 60 L55 75 L80 45"
            fill="none"
            stroke="#10B981"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="sparkle"
          />
          
          {/* Gradient Definition */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
          </defs>
        </svg>

        {/* Martini Glass Icon */}
        <svg 
          width="80" 
          height="120" 
          viewBox="0 0 80 120" 
          className="mb-6"
        >
          {/* Glass Stem */}
          <line 
            x1="40" 
            y1="80" 
            x2="40" 
            y2="110" 
            stroke="#1F2937" 
            strokeWidth="3" 
            strokeLinecap="round"
          />
          {/* Glass Base */}
          <ellipse 
            cx="40" 
            cy="110" 
            rx="20" 
            ry="5" 
            fill="#1F2937"
          />
          {/* Glass Body */}
          <path 
            d="M20 10 Q20 80 40 80 Q60 80 60 10 Z" 
            fill="none" 
            stroke="#1F2937" 
            strokeWidth="4" 
            strokeLinecap="round"
          />
          {/* Liquid */}
          <path 
            d="M23 20 Q23 70 40 70 Q57 70 57 20 Z" 
            fill="#10B981" 
            opacity="0.6"
          />
          {/* Olive with Twist */}
          <g className="sparkle">
            <circle 
              cx="40" 
              cy="25" 
              r="6" 
              fill="#10B981"
              stroke="#047857"
              strokeWidth="1.5"
            />
            <circle 
              cx="40" 
              cy="25" 
              r="2.5" 
              fill="#065F46"
            />
            {/* Olive Twist */}
            <path
              d="M40 19 Q44 21 44 25"
              fill="none"
              stroke="#F59E0B"
              strokeWidth="1"
              strokeLinecap="round"
            />
          </g>
          {/* Glass Reflection */}
          <path
            d="M23 15 Q27 60 40 60 Q53 60 57 15"
            fill="none"
            stroke="white"
            strokeWidth="1.5"
            opacity="0.4"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Success Message */}
      <h2 className="text-3xl font-bold text-[#1F2937] dark:text-[#FAFAFA] mb-2">
        Martini Shot Invoices
      </h2>
      <p className="text-lg text-[#6B7280] dark:text-[#9CA3AF]">
        All changes saved successfully!
      </p>

      {/* Decorative Sparkles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-[#F59E0B] sparkle"
            style={{
              left: `${10 + (i * 12)}%`,
              top: `${10 + (i * 8)}%`,
              animationDelay: `${i * 0.3}s`
            }}
          />
        ))}
      </div>
    </div>
  );
}
