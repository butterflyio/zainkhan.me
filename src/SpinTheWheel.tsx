import { useRef, useEffect, useState } from 'react';
import { X, ChevronDown, Moon, Sun, Linkedin, BookOpen, Menu } from 'lucide-react';
import { motion } from 'motion/react';

interface WheelSegment {
  label: string;
  color: string;
  action: () => void;
}

export default function SpinTheWheel({
  spinDuration = 3,
  minSpins = 5
}: {
  spinDuration?: number;
  minSpins?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [pointerTopPosition, setPointerTopPosition] = useState(80);
  const animationRef = useRef<number>();

  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [winningSegment, setWinningSegment] = useState<WheelSegment | null>(null);

  const segments: WheelSegment[] = [
    {
      label: 'PromptRaise',
      color: '#EA580C',
      action: () => window.open('https://www.promptraise.com', '_blank')
    },
    {
      label: 'BuzzzAgentic',
      color: '#047857',
      action: () => window.open('https://www.buzzzagentic.com', '_blank')
    },
    {
      label: 'Blog',
      color: '#9333EA',
      action: () => window.open('https://www.khan.ink', '_blank')
    },
    {
      label: 'Services',
      color: '#06B6D4',
      action: () => window.open('https://www.oxd.one', '_blank')
    },
    {
      label: 'LinkedIn',
      color: '#EC4899',
      action: () => window.open('https://www.linkedin.com/in/01z/', '_blank')
    }
  ];

  const MOBILE_BREAKPOINT = 600; // canvas-width threshold for mobile layout
  const LONG_LABEL_RADIUS_OFFSET = 0.60; // fraction of radius for multi-word labels
  const STANDARD_LABEL_RADIUS_OFFSET = 0.62; // fraction of radius for short labels
  const CLICK_TEXT_SCALE_FACTOR_MOBILE = 0.55; // fraction of centerRadius used for CLICK font size
  const CLICK_TEXT_SCALE_FACTOR_DESKTOP = 0.42; // fraction of centerRadius used for CLICK font size

  const drawWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isMobile = canvas.width < MOBILE_BREAKPOINT;
    const centerX = canvas.width / 2;
    // Move the wheel down to avoid header overlap
    const centerY = canvas.height / 2 + 40;
    const radius = Math.min(canvas.width, canvas.height) * (isMobile ? 0.28 : 0.35);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw segments
    const segmentAngle = (Math.PI * 2) / segments.length;

    segments.forEach((segment, index) => {
      const startAngle = (rotation * Math.PI / 180) + (index * segmentAngle) - Math.PI / 2;
      const endAngle = startAngle + segmentAngle;

      // Draw segment
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = segment.color;
      ctx.fill();

      // Draw border
      ctx.strokeStyle = theme === 'dark' ? '#000000' : '#FFFFFF';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw text - smaller font for longer labels
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + segmentAngle / 2);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#FFFFFF';

      // Use smaller font and closer positioning for longer labels
      if (segment.label === 'PromptRaise' || segment.label === 'BuzzzAgentic') {
        ctx.font = `bold ${isMobile ? 9 : 13}px monospace`;
        ctx.fillText(segment.label, radius * LONG_LABEL_RADIUS_OFFSET, 5);
      } else {
        ctx.font = `bold ${isMobile ? 11 : 16}px monospace`;
        ctx.fillText(segment.label, radius * STANDARD_LABEL_RADIUS_OFFSET, 5);
      }

      ctx.restore();
    });

    // Draw center circle with gradient and glow
    const centerRadius = radius * 0.25;

    // Outer glow
    const glowGradient = ctx.createRadialGradient(centerX, centerY, centerRadius * 0.5, centerX, centerY, centerRadius * 1.5);
    glowGradient.addColorStop(0, 'rgba(4, 120, 87, 0.4)');
    glowGradient.addColorStop(0.5, 'rgba(234, 88, 12, 0.2)');
    glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.beginPath();
    ctx.arc(centerX, centerY, centerRadius * 1.5, 0, Math.PI * 2);
    ctx.fillStyle = glowGradient;
    ctx.fill();

    // Main center circle with gradient
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, centerRadius);
    gradient.addColorStop(0, '#1a1a1a');
    gradient.addColorStop(0.6, '#000000');
    gradient.addColorStop(1, '#047857');

    ctx.beginPath();
    ctx.arc(centerX, centerY, centerRadius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Inner shine effect
    const shineGradient = ctx.createRadialGradient(
      centerX - centerRadius * 0.3,
      centerY - centerRadius * 0.3,
      0,
      centerX,
      centerY,
      centerRadius
    );
    shineGradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
    shineGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
    shineGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.beginPath();
    ctx.arc(centerX, centerY, centerRadius, 0, Math.PI * 2);
    ctx.fillStyle = shineGradient;
    ctx.fill();

    // Border with gradient
    ctx.beginPath();
    ctx.arc(centerX, centerY, centerRadius, 0, Math.PI * 2);
    ctx.strokeStyle = '#047857';
    ctx.lineWidth = 5;
    ctx.stroke();

    // Inner border
    ctx.beginPath();
    ctx.arc(centerX, centerY, centerRadius * 0.85, 0, Math.PI * 2);
    ctx.strokeStyle = '#EA580C';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw "CLICK" text in center
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FFFFFF';
    const clickScaleFactor = isMobile ? CLICK_TEXT_SCALE_FACTOR_MOBILE : CLICK_TEXT_SCALE_FACTOR_DESKTOP;
    const clickFontSize = Math.max(10, Math.round(centerRadius * clickScaleFactor));
    ctx.font = `bold ${clickFontSize}px monospace`;
    ctx.fillText('CLICK', centerX, centerY);
    ctx.restore();

    // Draw pointer at top
    ctx.save();
    ctx.translate(centerX, centerY - radius - 20);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-15, -30);
    ctx.lineTo(15, -30);
    ctx.closePath();
    ctx.fillStyle = '#EA580C';
    ctx.fill();
    ctx.strokeStyle = theme === 'dark' ? '#000000' : '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // Calculate and update text position (above the pointer with more spacing)
    const pointerTop = centerY - radius - 50; // Top of the pointer triangle
    setPointerTopPosition(Math.max(10, pointerTop - 50)); // at least 10px from top
  };

  const spinWheel = () => {
    if (isSpinning) return;

    setIsSpinning(true);

    // Random final rotation (multiple full spins + random position)
    const spins = minSpins + Math.random() * 3;
    const randomAngle = Math.random() * 360;
    const totalRotation = rotation + (spins * 360) + randomAngle;

    const startTime = Date.now();
    const startRotation = rotation;
    const targetRotation = totalRotation;
    const duration = spinDuration * 1000;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out cubic)
      const eased = 1 - Math.pow(1 - progress, 3);

      const currentRotation = startRotation + (targetRotation - startRotation) * eased;
      setRotation(currentRotation % 360);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);

        // Determine which segment we landed on
        const normalizedRotation = (360 - (currentRotation % 360)) % 360;
        const segmentAngle = 360 / segments.length;
        const selectedIndex = Math.floor(normalizedRotation / segmentAngle) % segments.length;

        // Show the winning segment overlay so the user can tap to open the link
        setWinningSegment(segments[selectedIndex]);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size
    const updateSize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        const width = parent.clientWidth;
        const height = parent.clientHeight;
        canvas.width = width;
        canvas.height = height;
        setDimensions({ width, height });
        drawWheel();
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', updateSize);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinDuration, minSpins, theme]);

  // Redraw wheel when rotation changes
  useEffect(() => {
    drawWheel();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rotation, theme]);

  // suppress unused variable warning
  void dimensions;

  return (
    <div className={`w-full min-h-screen ${theme === 'dark' ? 'bg-black' : 'bg-white'} relative overflow-x-hidden flex flex-col transition-colors duration-300`}>
      {/* Header */}
      <header className={`relative z-10 px-8 py-6 ${
        theme === 'dark'
          ? 'border-b border-green-500/20 bg-black'
          : 'border-b border-gray-300 bg-white'
      } backdrop-blur-sm transition-colors duration-300`}>
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className={`px-4 py-2 rounded-lg border ${
              theme === 'dark'
                ? 'bg-green-500/10 border-green-500/30'
                : 'bg-gray-100 border-gray-300'
            } transition-colors duration-300`}>
              <span className={`text-xl font-mono ${
                theme === 'dark'
                  ? 'text-green-400'
                  : 'text-black font-bold'
              } transition-colors duration-300`} style={theme === 'light' ? { textShadow: '0 0 0 2px #EA580C, 0 0 0 3px #EA580C' } : {}}>ZK.</span>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-mono">
            {/* Products Dropdown */}
            <div className="relative group">
              <button className={`flex items-center gap-1 ${
                theme === 'dark'
                  ? 'text-green-400/80 hover:text-green-400'
                  : 'text-[#EA580C] hover:text-[#EA580C]/80'
              } transition-colors`}>
                Products
                <ChevronDown className="w-4 h-4" />
              </button>
              <div className={`absolute top-full right-0 mt-2 w-48 ${
                theme === 'dark'
                  ? 'bg-black/95 border-2 border-green-500/40 shadow-xl shadow-green-500/20'
                  : 'bg-white border-2 border-gray-300 shadow-xl'
              } rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200`}>
                <div className="py-2">
                  <a
                    href="https://www.promptraise.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`block px-4 py-2 ${
                      theme === 'dark'
                        ? 'text-[#047857] hover:text-[#EA580C] hover:bg-green-500/10'
                        : 'text-gray-600 hover:text-[#EA580C] hover:bg-gray-100'
                    } transition-colors`}
                  >
                    Promptraise
                  </a>
                  <a
                    href="https://www.buzzzagentic.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`block px-4 py-2 ${
                      theme === 'dark'
                        ? 'text-[#047857] hover:text-[#EA580C] hover:bg-green-500/10'
                        : 'text-gray-600 hover:text-[#EA580C] hover:bg-gray-100'
                    } transition-colors`}
                  >
                    BuzzzAgentic
                  </a>
                </div>
              </div>
            </div>

            {/* Services Dropdown */}
            <div className="relative group">
              <button className={`flex items-center gap-1 ${
                theme === 'dark'
                  ? 'text-green-400/80 hover:text-green-400'
                  : 'text-[#EA580C] hover:text-[#EA580C]/80'
              } transition-colors`}>
                Services
                <ChevronDown className="w-4 h-4" />
              </button>
              <div className={`absolute top-full right-0 mt-2 w-48 ${
                theme === 'dark'
                  ? 'bg-black/95 border-2 border-green-500/40 shadow-xl shadow-green-500/20'
                  : 'bg-white border-2 border-gray-300 shadow-xl'
              } rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200`}>
                <div className="py-2">
                  <a
                    href="https://www.oxd.one"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`block px-4 py-2 ${
                      theme === 'dark'
                        ? 'text-[#047857] hover:text-[#EA580C] hover:bg-green-500/10'
                        : 'text-gray-600 hover:text-[#EA580C] hover:bg-gray-100'
                    } transition-colors`}
                  >
                    OxD
                  </a>
                </div>
              </div>
            </div>

            {/* Blog Direct Link */}
            <a
              href="https://www.khan.ink"
              target="_blank"
              rel="noopener noreferrer"
              className={`${
                theme === 'dark'
                  ? 'text-green-400/80 hover:text-green-400'
                  : 'text-[#EA580C] hover:text-[#EA580C]/80'
              } transition-colors`}
            >
              Blog
            </a>

            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={`p-2 rounded-lg border ${
                theme === 'dark'
                  ? 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20'
                  : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
              } transition-all duration-300`}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </nav>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`p-2 rounded-lg border ${
              theme === 'dark'
                ? 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20'
                : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
            } transition-all duration-300 md:hidden`}
            aria-label="Toggle mobile menu"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div
          className={`fixed inset-0 z-20 md:hidden`}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className={`absolute top-0 right-0 h-full w-[280px] ${
              theme === 'dark'
                ? 'bg-black border-l-2 border-green-500/40'
                : 'bg-white border-l-2 border-gray-300'
            } shadow-2xl transition-colors duration-300`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col h-full">
              <div className={`flex items-center justify-between p-6 border-b ${
                theme === 'dark' ? 'border-green-500/20' : 'border-gray-300'
              }`}>
                <span className={`text-xl font-mono ${
                  theme === 'dark' ? 'text-green-400' : 'text-[#EA580C]'
                }`}>Menu</span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`p-2 rounded-lg ${
                    theme === 'dark'
                      ? 'text-green-400/40 hover:text-green-400 hover:bg-green-500/10'
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                  } transition-colors`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex flex-col p-6 gap-6 text-sm font-mono flex-1">
                {/* Products Section */}
                <div>
                  <div className={`mb-3 font-bold ${
                    theme === 'dark' ? 'text-green-400/60' : 'text-[#EA580C]/60'
                  } uppercase text-xs tracking-wider`}>
                    Products
                  </div>
                  <div className="flex flex-col gap-3 pl-2">
                    <a
                      href="https://www.promptraise.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`${
                        theme === 'dark'
                          ? 'text-[#047857] hover:text-[#EA580C]'
                          : 'text-gray-600 hover:text-[#EA580C]'
                      } transition-colors`}
                    >
                      Promptraise
                    </a>
                    <a
                      href="https://www.buzzzagentic.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`${
                        theme === 'dark'
                          ? 'text-[#047857] hover:text-[#EA580C]'
                          : 'text-gray-600 hover:text-[#EA580C]'
                      } transition-colors`}
                    >
                      BuzzzAgentic
                    </a>
                  </div>
                </div>

                {/* Services Section */}
                <div>
                  <div className={`mb-3 font-bold ${
                    theme === 'dark' ? 'text-green-400/60' : 'text-[#EA580C]/60'
                  } uppercase text-xs tracking-wider`}>
                    Services
                  </div>
                  <div className="flex flex-col gap-3 pl-2">
                    <a
                      href="https://www.oxd.one"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`${
                        theme === 'dark'
                          ? 'text-[#047857] hover:text-[#EA580C]'
                          : 'text-gray-600 hover:text-[#EA580C]'
                      } transition-colors`}
                    >
                      OxD
                    </a>
                  </div>
                </div>

                {/* Blog Link */}
                <div>
                  <a
                    href="https://www.khan.ink"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`${
                      theme === 'dark'
                        ? 'text-green-400/80 hover:text-green-400'
                        : 'text-[#EA580C] hover:text-[#EA580C]/80'
                    } transition-colors`}
                  >
                    Blog
                  </a>
                </div>

                {/* Theme Toggle */}
                <div className={`pt-4 border-t ${
                  theme === 'dark' ? 'border-green-500/20' : 'border-gray-300'
                }`}>
                  <button
                    onClick={() => {
                      setTheme(theme === 'dark' ? 'light' : 'dark');
                    }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg border w-full ${
                      theme === 'dark'
                        ? 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20'
                        : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                    } transition-all duration-300`}
                  >
                    {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                  </button>
                </div>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Game Canvas */}
      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          onClick={spinWheel}
          className="cursor-crosshair w-full h-full"
          style={{ display: 'block' }}
        />
        <div
          className={`absolute left-1/2 transform -translate-x-1/2 font-mono pointer-events-none text-center ${
            theme === 'dark' ? 'text-white' : 'text-black'
          } transition-colors duration-300`}
          style={{ top: `${pointerTopPosition}px` }}
        >
          <motion.div
            className={`text-base md:text-2xl font-mono font-bold whitespace-nowrap ${
              theme === 'dark' ? 'text-white' : 'text-black'
            } transition-colors duration-300`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.span
              animate={{
                opacity: [0.6, 1, 0.6],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
            >
              Spin the Wheel to Explore
            </motion.span>
          </motion.div>
        </div>

        {/* Winning segment overlay – direct tap triggers window.open (works on mobile) */}
        {winningSegment && (
          <div
            className="absolute inset-0 flex items-center justify-center z-20"
            style={{ background: 'rgba(0,0,0,0.55)' }}
          >
            <div
              className={`flex flex-col items-center gap-4 px-8 py-6 rounded-2xl border-2 ${
                theme === 'dark'
                  ? 'bg-black border-green-500/50 shadow-xl shadow-green-500/20'
                  : 'bg-white border-gray-300 shadow-xl'
              } max-w-xs w-full mx-4`}
            >
              <p className={`font-mono text-sm ${theme === 'dark' ? 'text-green-400/70' : 'text-gray-500'}`}>
                You landed on
              </p>
              <p className={`font-mono text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                {winningSegment.label}
              </p>
              <button
                onClick={() => {
                  winningSegment.action();
                  setWinningSegment(null);
                }}
                className="w-full px-6 py-3 rounded-lg font-mono font-bold text-white text-sm"
                style={{ backgroundColor: winningSegment.color }}
              >
                Visit {winningSegment.label} →
              </button>
              <button
                onClick={() => setWinningSegment(null)}
                className={`font-mono text-xs ${theme === 'dark' ? 'text-green-400/50 hover:text-green-400' : 'text-gray-400 hover:text-gray-600'} transition-colors`}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className={`relative z-10 px-4 md:px-8 py-4 md:py-6 ${
        theme === 'dark'
          ? 'border-t border-green-500/20 bg-black'
          : 'border-t border-gray-300 bg-white'
      } backdrop-blur-sm transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <span className={`text-xl font-mono font-bold ${theme === 'dark' ? 'text-green-400' : 'text-gray-700'} transition-colors duration-300`}>ZK.</span>
              </div>
              <p className={`text-xs font-mono ${
                theme === 'dark' ? 'text-green-400/60' : 'text-gray-500'
              } transition-colors duration-300`}>
                From idea to done
              </p>
            </div>

            {/* Products */}
            <div>
              <h3 className={`font-mono text-sm font-bold mb-4 ${
                theme === 'dark' ? 'text-green-400' : 'text-[#EA580C]'
              } transition-colors duration-300`}>Products</h3>
              <ul className="space-y-2 text-xs font-mono">
                <li>
                  <a
                    href="https://www.promptraise.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${
                      theme === 'dark'
                        ? 'text-green-400/70 hover:text-[#EA580C]'
                        : 'text-gray-600 hover:text-[#EA580C]'
                    } transition-colors`}
                  >
                    Promptraise
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.buzzzagentic.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${
                      theme === 'dark'
                        ? 'text-green-400/70 hover:text-[#EA580C]'
                        : 'text-gray-600 hover:text-[#EA580C]'
                    } transition-colors`}
                  >
                    BuzzzAgentic
                  </a>
                </li>
              </ul>
            </div>

            {/* Services */}
            <div>
              <h3 className={`font-mono text-sm font-bold mb-4 ${
                theme === 'dark' ? 'text-green-400' : 'text-[#EA580C]'
              } transition-colors duration-300`}>Services</h3>
              <ul className="space-y-2 text-xs font-mono">
                <li>
                  <a
                    href="https://www.oxd.one"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${
                      theme === 'dark'
                        ? 'text-green-400/70 hover:text-[#EA580C]'
                        : 'text-gray-600 hover:text-[#EA580C]'
                    } transition-colors`}
                  >
                    OxD
                  </a>
                </li>
              </ul>
            </div>

            {/* Connect */}
            <div>
              <h3 className={`font-mono text-sm font-bold mb-4 ${
                theme === 'dark' ? 'text-green-400' : 'text-[#EA580C]'
              } transition-colors duration-300`}>Connect</h3>
              <div className="flex gap-4">
                <a
                  href="https://www.linkedin.com/in/01z/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-2 rounded-lg border ${
                    theme === 'dark'
                      ? 'bg-green-500/10 border-green-500/30 text-green-400 hover:text-[#EA580C] hover:bg-green-500/20'
                      : 'bg-gray-100 border-gray-300 text-gray-700 hover:text-[#EA580C] hover:bg-gray-200'
                  } transition-all duration-300`}
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
                <a
                  href="https://medium.com/@zainkhan"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-2 rounded-lg border ${
                    theme === 'dark'
                      ? 'bg-green-500/10 border-green-500/30 text-green-400 hover:text-[#EA580C] hover:bg-green-500/20'
                      : 'bg-gray-100 border-gray-300 text-gray-700 hover:text-[#EA580C] hover:bg-gray-200'
                  } transition-all duration-300`}
                  aria-label="Medium"
                >
                  <BookOpen className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className={`mt-4 md:mt-6 pt-3 md:pt-4 border-t ${
            theme === 'dark' ? 'border-green-500/20' : 'border-gray-300'
          } transition-colors duration-300`}>
            <p className={`text-xs font-mono text-center ${
              theme === 'dark' ? 'text-[#047857]/40' : 'text-gray-500'
            } transition-colors duration-300`}>
              © 2026 Zain Khan. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
