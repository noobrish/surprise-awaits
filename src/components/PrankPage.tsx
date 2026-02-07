import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

type Screen = 'error' | 'question' | 'revealed';

const gradientClasses = [
  'gradient-bg-1',
  'gradient-bg-2',
  'gradient-bg-3',
  'gradient-bg-4',
  'gradient-bg-5',
];

// Floating emoji component
const FloatingEmoji = ({ id, isHeavy }: { id: number; isHeavy: boolean }) => {
  const randomX = Math.random() * 100;
  const randomDelay = Math.random() * 0.5;
  const size = isHeavy ? Math.random() * 40 + 30 : 40;
  
  return (
    <motion.div
      key={id}
      className="fixed pointer-events-none z-50 select-none"
      style={{ left: `${randomX}%`, fontSize: size }}
      initial={{ y: window.innerHeight + 50, opacity: 1, rotate: 0 }}
      animate={{ 
        y: -100, 
        opacity: [1, 1, 0],
        rotate: Math.random() > 0.5 ? 360 : -360
      }}
      transition={{ 
        duration: isHeavy ? 2 : 3, 
        delay: randomDelay,
        ease: "easeOut"
      }}
    >
      😂
    </motion.div>
  );
};

const PrankPage = () => {
  const [screen, setScreen] = useState<Screen>('error');
  const [noButtonPosition, setNoButtonPosition] = useState({ x: 0, y: 0 });
  const [currentGradient, setCurrentGradient] = useState(0);
  const [showButtons, setShowButtons] = useState(true);
  const [hasClickedNo, setHasClickedNo] = useState(false);
  const [noClickCount, setNoClickCount] = useState(0);
  const [floatingEmojis, setFloatingEmojis] = useState<number[]>([]);
  const emojiIdRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  const playLaughSound = useCallback((isHeavy: boolean) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    const ctx = audioContextRef.current;
    
    // Create a laughing-like sound using oscillators
    const createLaughBurst = (startTime: number, frequency: number, volume: number) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.15);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.15);
    };
    
    const now = ctx.currentTime;
    const baseVolume = isHeavy ? 0.3 : 0.1;
    const laughCount = isHeavy ? 8 : 4;
    
    for (let i = 0; i < laughCount; i++) {
      const freq = isHeavy 
        ? 300 + Math.random() * 200 
        : 400 + Math.random() * 100;
      createLaughBurst(now + i * 0.12, freq, baseVolume * (1 - i * 0.1));
    }
  }, []);

  const spawnEmojis = useCallback((count: number, isHeavy: boolean) => {
    const newEmojis: number[] = [];
    for (let i = 0; i < count; i++) {
      emojiIdRef.current += 1;
      newEmojis.push(emojiIdRef.current);
    }
    setFloatingEmojis(prev => [...prev, ...newEmojis]);
    
    // Clean up emojis after animation
    setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(id => !newEmojis.includes(id)));
    }, isHeavy ? 2500 : 3500);
  }, []);

  const moveNoButton = useCallback(() => {
    const buttonWidth = 120;
    const buttonHeight = 56;
    const padding = 20;
    
    const maxX = window.innerWidth - buttonWidth - padding;
    const maxY = window.innerHeight - buttonHeight - padding;
    
    const newX = Math.max(padding, Math.random() * maxX);
    const newY = Math.max(padding, Math.random() * maxY);
    
    setNoButtonPosition({ x: newX, y: newY });
  }, []);

  const handleRefresh = () => {
    setScreen('question');
  };

  const handleYes = () => {
    setScreen('revealed');
    
    setTimeout(() => {
      setShowButtons(false);
    }, 1000);

    // Confetti effect
    const duration = 5000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#a855f7', '#ec4899', '#8b5cf6', '#d946ef', '#f472b6'],
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#a855f7', '#ec4899', '#8b5cf6', '#d946ef', '#f472b6'],
      });
    }, 250);
  };

  const handleNo = () => {
    setHasClickedNo(true);
    const newCount = noClickCount + 1;
    setNoClickCount(newCount);
    moveNoButton();
    setCurrentGradient((prev) => (prev + 1) % gradientClasses.length);
    
    // After 30 clicks - heavy laugh and many emojis
    if (newCount >= 30) {
      playLaughSound(true);
      spawnEmojis(8 + Math.floor(Math.random() * 5), true);
    }
    // After 15 clicks - soft laugh and one emoji
    else if (newCount >= 15) {
      playLaughSound(false);
      spawnEmojis(1, false);
    }
  };

  useEffect(() => {
    if (hasClickedNo && screen === 'question') {
      moveNoButton();
    }
  }, [hasClickedNo, screen, moveNoButton]);

  return (
    <div 
      className={`min-h-screen w-full flex items-center justify-center transition-all duration-700 ${gradientClasses[currentGradient]}`}
    >
      <AnimatePresence mode="wait">
        {screen === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="flex flex-col items-center gap-8 text-center px-6"
          >
            <motion.h1 
              className="text-[120px] md:text-[180px] font-bold text-foreground leading-none tracking-tighter"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              404
            </motion.h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-md">
              Oops! The page you're looking for seems to have wandered off into the void.
            </p>
            <motion.button
              onClick={handleRefresh}
              className="mt-4 px-8 py-4 bg-secondary text-foreground rounded-2xl font-semibold text-lg shadow-button hover:bg-muted transition-colors duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Refresh Page
            </motion.button>
          </motion.div>
        )}

        {screen === 'question' && (
          <motion.div
            key="question"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="flex flex-col items-center gap-12 text-center px-6"
          >
            <motion.h1 
              className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground tracking-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              ARE YOU GAY
            </motion.h1>
            
            <AnimatePresence>
              {showButtons && (
                <motion.div 
                  className="flex gap-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  <motion.button
                    onClick={handleYes}
                    className="px-10 py-4 bg-primary text-primary-foreground rounded-2xl font-semibold text-xl shadow-button animate-pulse-glow"
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    YES
                  </motion.button>
                  
                  {!hasClickedNo && (
                    <motion.button
                      onClick={handleNo}
                      className="px-10 py-4 bg-secondary text-foreground rounded-2xl font-semibold text-xl shadow-button hover:bg-muted transition-colors duration-300"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      NO
                    </motion.button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {screen === 'revealed' && (
          <motion.div
            key="revealed"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="flex flex-col items-center gap-12 text-center px-6"
          >
            <motion.h1 
              className="text-3xl md:text-5xl lg:text-6xl font-bold text-foreground tracking-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              ahahahha i knew it
            </motion.h1>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating NO button */}
      <AnimatePresence>
        {hasClickedNo && screen === 'question' && showButtons && (
          <motion.button
            onClick={handleNo}
            className="fixed px-10 py-4 bg-secondary text-foreground rounded-2xl font-semibold text-xl shadow-button hover:bg-muted z-50"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              x: noButtonPosition.x,
              y: noButtonPosition.y,
            }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ 
              type: 'spring',
              stiffness: 300,
              damping: 25,
            }}
            style={{ 
              position: 'fixed',
              left: 0,
              top: 0,
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            NO
          </motion.button>
        )}
      </AnimatePresence>

      {/* Floating emojis */}
      <AnimatePresence>
        {floatingEmojis.map(id => (
          <FloatingEmoji key={id} id={id} isHeavy={noClickCount >= 30} />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default PrankPage;