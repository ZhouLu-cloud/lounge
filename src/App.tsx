import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  Users, 
  Settings as SettingsIcon, 
  Home, 
  ChevronRight, 
  Zap, 
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import { GameType, GameRoom, PokerCard } from './types';
import { ROOMS } from './constants';
import { loungeApi } from './lib/api';

// --- Components ---

const TopAppBar = ({ credits, onBack }: { credits: number, onBack?: () => void }) => (
  <header className="bg-surface sticky top-0 z-50 w-full px-6 py-4 pt-10 border-b border-surface-container-high">
    <div className="flex justify-between items-center max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <button 
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden hover:bg-surface-container-highest transition-colors"
        >
          <img 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAMqmqnUfUeXom0Ep6ofgn-fW0sGy0RhMtWaXkNaYfhzxAs9_IJfPtmR-zsKP9bMuSZNGvBXfMiYZuIDtrlgk6bWoxB4mgeajFyekKwLT1rkGelXSPsPdcjf8vNHn9x1jtC4qxv28OcCY1AVMJEiuXW5tqJ1HeTQN-jJwbESdFr385Uko6vVi4_xiiC7mXkQyR-jPbiZOwPyRjMGPFgkf69ICgmAvcXn_NdF38mlPW9Z2xe_V5kr7rseXCWAK2pOZD4CtO2GyAu4q3q" 
            alt="Profile" 
            className="w-full h-full object-cover"
          />
        </button>
        <h1 className="font-headline font-bold tracking-tight text-2xl text-on-surface">The Lounge</h1>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-container-low">
          <span className="material-symbols-outlined text-sm text-secondary">database</span>
          <span className="font-headline font-bold text-on-surface text-sm">{credits.toLocaleString()} Credits</span>
        </div>
        <button className="p-2 text-outline hover:text-on-surface transition-colors">
          <Bell size={20} />
        </button>
      </div>
    </div>
  </header>
);

const BottomNav = ({ activeTab, onTabChange }: { activeTab: string, onTabChange: (tab: string) => void }) => (
  <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-8 pt-4 bg-white/80 backdrop-blur-xl border-t border-surface-container-high">
    {[
      { id: 'home', icon: Home, label: 'Home' },
      { id: 'social', icon: Users, label: 'Social' },
      { id: 'settings', icon: SettingsIcon, label: 'Settings' },
    ].map((tab) => (
      <button
        key={tab.id}
        onClick={() => onTabChange(tab.id)}
        className={`flex flex-col items-center justify-center px-6 py-2 rounded-xl transition-all duration-200 ${
          activeTab === tab.id 
            ? 'bg-surface-container-high text-on-surface scale-105' 
            : 'text-outline hover:text-on-surface'
        }`}
      >
        <tab.icon size={20} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
        <span className="font-body text-[10px] font-medium mt-1 uppercase tracking-wider">{tab.label}</span>
      </button>
    ))}
  </nav>
);

// --- Views ---

const LobbyView = ({ onSelectGame, rooms, isLoading }: { onSelectGame: (type: GameType) => void; rooms: GameRoom[]; isLoading: boolean }) => {
  const diceRoom = rooms.find((room) => room.type === 'DICE');
  const pokerRooms = rooms.filter((room) => room.type === 'POKER');
  const pokerPlayers = pokerRooms.reduce((sum, room) => sum + room.players, 0);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-5xl mx-auto px-6 pt-12 pb-32"
    >
      <section className="mb-12">
        <h2 className="font-headline text-5xl font-extrabold tracking-tighter mb-4 text-on-surface leading-[1.1]">
          Choose your <br/><span className="text-secondary">vibe tonight.</span>
        </h2>
        <p className="font-body text-on-surface-variant max-w-md leading-relaxed">
          High-end social experiences curated for the modern minimalist. Select a game to begin your session.
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Featured: Lady Cards */}
        <div className="md:col-span-2 group relative bg-surface-container-lowest rounded-2xl p-8 flex flex-col justify-between min-h-[420px] hover:bg-surface-container-low transition-all duration-300 editorial-shadow border border-surface-container-high">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold tracking-[0.2em] text-outline uppercase mb-2 block">Social Classic</span>
              <h3 className="font-headline text-3xl font-bold">Lady Cards</h3>
              <p className="text-on-surface-variant mt-1 font-medium">小姐牌</p>
            </div>
            <div className="w-12 h-12 rounded-full border border-surface-container-high flex items-center justify-center group-hover:bg-primary group-hover:text-on-primary transition-colors">
              <span className="material-symbols-outlined text-2xl">playing_cards</span>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center py-8">
            <div className="relative w-40 h-56 bg-surface-container-low rounded-xl flex items-center justify-center border border-surface-container-high shadow-sm">
              <span className="text-7xl text-secondary/25">♥</span>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-headline text-5xl font-extrabold text-primary/30">Q</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => onSelectGame('LADY_CARDS')}
            className="w-full py-4 bg-primary text-on-primary rounded-xl font-bold font-headline tracking-wide hover:opacity-90 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            Join Table
            <ArrowRight size={18} />
          </button>
        </div>

        {/* Side Column */}
        <div className="flex flex-col gap-6">
          {/* Dice Game */}
          <div 
            onClick={() => onSelectGame('DICE')}
            className="group cursor-pointer bg-surface-container-lowest rounded-2xl p-6 flex flex-col justify-between min-h-[200px] hover:bg-surface-container-low transition-all border border-surface-container-high"
          >
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-xl bg-secondary-container/30 flex items-center justify-center">
                <span className="text-secondary text-lg leading-none">⚄</span>
              </div>
              <ChevronRight className="text-outline group-hover:text-primary transition-colors" size={20} />
            </div>
            <div>
              <h3 className="font-headline text-2xl font-bold">Dice Game</h3>
              <p className="text-on-surface-variant text-sm font-medium">摇骰子</p>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <div className="h-1 flex-1 bg-surface-container-high rounded-full overflow-hidden">
                <div className="h-full bg-secondary w-2/3"></div>
              </div>
              <span className="text-[10px] font-bold text-outline tracking-widest">
                {isLoading ? '...' : `${diceRoom?.players ?? 0} ACTIVE`}
              </span>
            </div>
          </div>

          {/* Poker */}
          <div 
            onClick={() => onSelectGame('POKER')}
            className="group cursor-pointer bg-surface-container-lowest rounded-2xl p-6 flex flex-col justify-between min-h-[200px] hover:bg-surface-container-low transition-all border border-surface-container-high"
          >
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center">
                <span className="text-primary text-lg leading-none">♠</span>
              </div>
              <ChevronRight className="text-outline group-hover:text-primary transition-colors" size={20} />
            </div>
            <div>
              <h3 className="font-headline text-2xl font-bold">Texas Hold'em</h3>
              <p className="text-on-surface-variant text-sm font-medium">德州扑克</p>
            </div>
            <div className="mt-4">
              <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-surface-container-high overflow-hidden">
                    <img src={`https://picsum.photos/seed/p${i}/40/40`} alt="Player" className="w-full h-full object-cover" />
                  </div>
                ))}
                <div className="w-6 h-6 rounded-full bg-surface-container-high border-2 border-white flex items-center justify-center text-[8px] font-bold text-outline">
                  {isLoading ? '...' : `+${Math.max(pokerPlayers - 3, 0)}`}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="mt-16 bg-surface-container-low rounded-3xl p-10 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="md:w-1/2">
          <h4 className="font-headline text-2xl font-bold mb-3">Feeling adventurous?</h4>
          <p className="text-on-surface-variant text-sm leading-relaxed font-medium">
            The Lounge curates a unique selection of minimal social games designed for quiet nights and high-stakes conversations.
          </p>
        </div>
        <button className="px-10 py-4 bg-white text-on-surface rounded-xl font-bold text-sm shadow-sm hover:shadow-md transition-all border border-surface-container-high active:scale-95">
          Explore More Games
        </button>
      </section>
    </motion.div>
  );
};

const DiceGameView = () => {
  const pipLayout: Record<number, Array<[number, number]>> = {
    1: [[1, 1]],
    2: [[0, 0], [2, 2]],
    3: [[0, 0], [1, 1], [2, 2]],
    4: [[0, 0], [0, 2], [2, 0], [2, 2]],
    5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
    6: [[0, 0], [0, 1], [0, 2], [2, 0], [2, 1], [2, 2]],
  };

  const [diceCount, setDiceCount] = useState(5);
  const [results, setResults] = useState<number[]>([]);
  const [isShaking, setIsShaking] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [isPeeking, setIsPeeking] = useState(false);

  const handleShake = async () => {
    setIsShaking(true);
    setErrorMessage('');

    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      const result = await loungeApi.rollDice(diceCount, 'Guest');
      setResults(result.results);
      setIsRevealed(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to roll dice.';
      setErrorMessage(message);
      setResults(Array.from({ length: diceCount }, () => Math.floor(Math.random() * 6) + 1));
      setIsRevealed(true);
    } finally {
      setIsShaking(false);
    }
  };

  // Only initialize results when count changes, but don't "shake" automatically
  useEffect(() => {
    setResults(Array.from({ length: diceCount }, () => 1));
    setIsRevealed(false);
  }, [diceCount]);

  const showDice = isRevealed || isPeeking;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-5xl mx-auto px-6 pt-8 pb-32"
    >
      <section className="mb-8 text-center">
        <h1 className="font-headline text-5xl font-extrabold tracking-tighter text-on-surface mb-2">摇骰子</h1>
        <p className="font-body text-on-surface-variant max-w-md mx-auto leading-relaxed font-medium">
          Select dice count and shake. Use "Peek" to check your results.
        </p>
      </section>

      <div className="flex flex-col gap-8">
        {/* Dice Selection - Horizontal Scroll on Mobile */}
        <div className="bg-surface-container-low rounded-3xl p-6 border border-surface-container-high">
          <h3 className="font-headline text-sm font-bold uppercase tracking-widest text-outline mb-4 text-center">How many dice?</h3>
          <div className="flex overflow-x-auto pb-2 gap-2 no-scrollbar justify-center sm:justify-center">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
              <button 
                key={n}
                onClick={() => setDiceCount(n)}
                className={`flex-shrink-0 w-12 h-12 rounded-xl border font-bold transition-all ${
                  diceCount === n 
                    ? 'bg-primary border-primary text-on-primary scale-110 shadow-lg' 
                    : 'bg-white border-surface-container-high hover:bg-surface-container-low'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Main Dice Display Area */}
        <div className="bg-white rounded-[2.5rem] p-8 flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden editorial-shadow border border-surface-container-high">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(var(--color-primary-rgb),0.03),transparent)] pointer-events-none"></div>
          
          <div className="flex flex-wrap justify-center items-center gap-4 z-10 max-w-2xl">
            <AnimatePresence mode="popLayout">
              {results.map((val, idx) => (
                <motion.div 
                  key={`${idx}-${val}`}
                  initial={{ scale: 0.8, opacity: 0, rotateY: 90 }}
                  animate={{ 
                    scale: 1, 
                    opacity: 1, 
                    rotateY: showDice ? 0 : 180,
                    x: isShaking ? [0, -15, 15, -15, 15, 0] : 0,
                    y: isShaking ? [0, 15, -15, 15, -15, 0] : 0
                  }}
                  transition={{ 
                    duration: isShaking ? 0.1 : 0.4, 
                    repeat: isShaking ? 5 : 0,
                    delay: idx * 0.05 
                  }}
                  className="w-16 h-16 sm:w-20 sm:h-20 bg-surface-container-lowest rounded-2xl flex items-center justify-center shadow-xl border border-surface-container-high relative preserve-3d"
                >
                  {/* Front (Value) */}
                  <div className={`absolute inset-0 flex items-center justify-center backface-hidden ${showDice ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="grid grid-cols-3 grid-rows-3 gap-1 w-10 h-10 sm:w-12 sm:h-12">
                      {Array.from({ length: 9 }).map((_, cellIndex) => {
                        const row = Math.floor(cellIndex / 3);
                        const col = cellIndex % 3;
                        const isActive = (pipLayout[val] ?? []).some(([r, c]) => r === row && c === col);

                        return (
                          <div key={cellIndex} className="flex items-center justify-center">
                            <div className={`rounded-full transition-all ${isActive ? 'w-2.5 h-2.5 sm:w-3 sm:h-3 bg-primary' : 'w-1.5 h-1.5 sm:w-2 sm:h-2 bg-transparent'}`} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {/* Back (Hidden) */}
                  <div className={`absolute inset-0 flex items-center justify-center bg-primary rounded-2xl backface-hidden rotate-y-180 ${showDice ? 'opacity-0' : 'opacity-100'}`}>
                    <span className="material-symbols-outlined text-2xl sm:text-3xl text-on-primary">question_mark</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-2">
            <div className="bg-secondary-container/40 backdrop-blur-xl px-4 py-1.5 rounded-full flex items-center gap-2 border border-white/20">
              <div className={`w-1.5 h-1.5 rounded-full ${showDice ? 'bg-error' : 'bg-primary'} animate-pulse`}></div>
              <span className="text-[9px] font-bold text-on-secondary-container tracking-widest uppercase">
                {showDice ? 'Visible' : 'Hidden'}
              </span>
            </div>
          </div>
        </div>

        {errorMessage && (
          <p className="text-center text-sm text-error font-medium">{errorMessage}</p>
        )}

        {/* Primary Controls */}
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={handleShake}
            disabled={isShaking}
            className="flex flex-col items-center justify-center py-6 bg-primary text-on-primary rounded-[2rem] shadow-2xl active:scale-95 transition-all disabled:opacity-50"
          >
            <Zap size={24} className={`mb-2 ${isShaking ? 'animate-pulse' : ''}`} />
            <span className="font-headline font-bold text-sm uppercase tracking-widest">Shake Cup</span>
          </button>
          
          <div className="grid grid-rows-2 gap-2">
            <button 
              onMouseDown={() => setIsPeeking(true)}
              onMouseUp={() => setIsPeeking(false)}
              onMouseLeave={() => setIsPeeking(false)}
              onTouchStart={() => setIsPeeking(true)}
              onTouchEnd={() => setIsPeeking(false)}
              className="flex items-center justify-center bg-surface-container-high text-on-surface-variant rounded-2xl font-headline font-bold text-xs uppercase tracking-widest active:bg-primary active:text-on-primary transition-all"
            >
              Hold to Peek
            </button>
            <button 
              onClick={() => setIsRevealed(!isRevealed)}
              className={`flex items-center justify-center rounded-2xl font-headline font-bold text-xs uppercase tracking-widest transition-all ${
                isRevealed ? 'bg-error text-on-error' : 'bg-surface-container-low text-on-surface-variant'
              }`}
            >
              {isRevealed ? 'Hide Dice' : 'Reveal All'}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const PokerGameView = () => {
  const [mode, setMode] = useState<'create' | 'join'>('join');
  const [maxPlayers, setMaxPlayers] = useState(6);
  const [roomCode, setRoomCode] = useState('');
  const [roomPlayers, setRoomPlayers] = useState(0);
  const [roomMaxPlayers, setRoomMaxPlayers] = useState(0);
  const [roomStatus, setRoomStatus] = useState<'waiting' | 'full' | 'active'>('waiting');
  const [isHost, setIsHost] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [communityCards, setCommunityCards] = useState<PokerCard[]>([]);
  const [revealStage, setRevealStage] = useState(0); // 0: Pre-flop, 1: Flop, 2: Turn, 3: River
  const [playerCards, setPlayerCards] = useState<PokerCard[]>([]);
  const [handId, setHandId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [playerCardsRevealed, setPlayerCardsRevealed] = useState(false);

  const isRoomFull = roomPlayers >= roomMaxPlayers && roomMaxPlayers > 0;
  const isGameStarted = roomStatus === 'active' && !!handId;

  useEffect(() => {
    if (!isJoined || !roomCode) {
      return;
    }

    const pollRoom = async () => {
      try {
        const status = await loungeApi.getPokerRoomStatus(roomCode);
        setRoomPlayers(status.room.players);
        setRoomMaxPlayers(status.room.maxPlayers);
        setRoomStatus(status.room.status as 'waiting' | 'full' | 'active');

        if (status.hand && status.room.status === 'active') {
          setHandId(status.hand.id);
          setPlayerCards(Array.isArray(status.hand.playerCards) ? status.hand.playerCards.slice(0, 2) : []);
          setCommunityCards(Array.isArray(status.hand.communityCards) ? status.hand.communityCards : []);
          setRevealStage(status.hand.revealStage ?? 0);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to sync room status.';
        setErrorMessage(message);
      }
    };

    pollRoom();
    const timer = setInterval(pollRoom, 3000);
    return () => clearInterval(timer);
  }, [isJoined, roomCode]);

  const handleJoin = async () => {
    if (roomCode.length !== 4) {
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');
      const result = await loungeApi.joinPokerRoom(roomCode, 'Guest');
      setRoomPlayers(result.room.players);
      setRoomMaxPlayers(result.room.maxPlayers);
      setRoomStatus(result.room.status as 'waiting' | 'full' | 'active');
      setIsHost(false);
      setIsJoined(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to join this room.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateRoom = async () => {
    if (roomCode.length !== 4) {
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');
      const result = await loungeApi.createPokerRoom(roomCode, maxPlayers, 'Host');
      setRoomPlayers(result.room.players);
      setRoomMaxPlayers(result.room.maxPlayers);
      setRoomStatus(result.room.status as 'waiting' | 'full' | 'active');
      setIsHost(true);
      setIsJoined(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create this room.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewHand = async (code = roomCode) => {
    try {
      setIsSubmitting(true);
      setErrorMessage('');
      const hand = await loungeApi.newPokerHand(code, isHost ? 'Host' : 'Guest', isHost);
      setHandId(hand.id);
      setPlayerCards(hand.playerCards);
      setCommunityCards(hand.communityCards);
      setRevealStage(hand.revealStage);
      setPlayerCardsRevealed(false);
      setRoomStatus('active');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to start a new hand.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevealNext = async () => {
    if (!isHost) {
      setErrorMessage('Only dealer can reveal cards each round.');
      return;
    }

    if (!handId || revealStage >= 3) {
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');
      const hand = await loungeApi.revealPoker(handId);
      setCommunityCards(hand.communityCards);
      setRevealStage(hand.revealStage);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to reveal next card.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isJoined) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto px-6 pt-32 pb-32 flex flex-col items-center"
      >
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-8">
          <Users size={40} className="text-primary" />
        </div>
        <h1 className="font-headline text-4xl font-extrabold text-center mb-4">Join a Room</h1>
        <p className="text-center text-on-surface-variant mb-8 font-medium">Enter a 4-digit code to join your friends at the table.</p>
        
        <div className="w-full flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2 bg-surface-container-low rounded-2xl p-1">
            <button
              onClick={() => setMode('join')}
              className={`py-2 rounded-xl font-headline font-bold text-xs tracking-widest transition-all ${mode === 'join' ? 'bg-primary text-on-primary' : 'text-on-surface-variant'}`}
            >
              JOIN
            </button>
            <button
              onClick={() => setMode('create')}
              className={`py-2 rounded-xl font-headline font-bold text-xs tracking-widest transition-all ${mode === 'create' ? 'bg-primary text-on-primary' : 'text-on-surface-variant'}`}
            >
              CREATE
            </button>
          </div>

          {mode === 'create' && (
            <div className="bg-surface-container-low rounded-2xl p-4 border border-surface-container-high">
              <p className="text-xs font-bold tracking-[0.2em] text-outline uppercase mb-3">Players</p>
              <div className="grid grid-cols-4 gap-2">
                {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((count) => (
                  <button
                    key={count}
                    onClick={() => setMaxPlayers(count)}
                    className={`py-2 rounded-xl font-bold text-sm transition-all ${maxPlayers === count ? 'bg-primary text-on-primary' : 'bg-white border border-surface-container-high'}`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>
          )}

          <input 
            type="text" 
            maxLength={4}
            placeholder="0000"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.replace(/\D/g, ''))}
            className="w-full py-5 bg-surface-container-low border-2 border-surface-container-high rounded-2xl text-center text-4xl font-black tracking-[0.5em] focus:border-primary focus:outline-none transition-all"
          />
          <button 
            onClick={mode === 'create' ? handleCreateRoom : handleJoin}
            disabled={roomCode.length !== 4 || isSubmitting}
            className="w-full py-5 bg-primary text-on-primary rounded-2xl font-headline font-extrabold text-lg tracking-widest hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50"
          >
            {isSubmitting ? (mode === 'create' ? 'CREATING...' : 'JOINING...') : (mode === 'create' ? 'CREATE ROOM' : 'JOIN TABLE')}
          </button>
          {errorMessage && (
            <p className="text-center text-sm text-error font-medium">{errorMessage}</p>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-5xl mx-auto px-6 pt-12 pb-32"
    >
      <div className="flex justify-between items-center mb-12">
        <div>
          <div className="inline-flex items-center gap-2 bg-secondary-container/60 px-3 py-1 rounded-full mb-4">
            <Users size={12} className="text-on-secondary-container" />
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-on-secondary-container">Room: {roomCode}</span>
          </div>
          <div className="inline-flex items-center gap-2 bg-surface-container-low px-3 py-1 rounded-full mb-4 ml-2">
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-on-surface-variant">Players: {roomPlayers}/{roomMaxPlayers || '-'}</span>
          </div>
          <h1 className="font-headline text-5xl font-extrabold tracking-tighter text-on-surface">德州扑克</h1>
        </div>
        {isHost ? (
          <button 
            onClick={() => handleNewHand(roomCode)}
            disabled={isSubmitting || !isRoomFull || isGameStarted}
            className="px-5 py-3 bg-primary text-on-primary rounded-2xl font-headline font-bold text-xs uppercase tracking-[0.2em] disabled:opacity-50"
            title="Start Game"
          >
            {isRoomFull ? (isGameStarted ? 'GAME STARTED' : 'START GAME') : 'WAIT FOR FULL ROOM'}
          </button>
        ) : (
          <button 
            onClick={() => setPlayerCardsRevealed(!playerCardsRevealed)}
            className="p-4 bg-surface-container-low rounded-2xl hover:bg-surface-container-high transition-colors"
            title="Toggle My Cards"
          >
            <RotateCcw size={20} />
          </button>
        )}
      </div>

      {!isGameStarted && (
        <div className="mb-6 bg-surface-container-low rounded-2xl px-6 py-4 text-center border border-surface-container-high">
          <p className="font-headline font-bold text-on-surface mb-1">{isHost ? '你是房主' : '等待房主开局'}</p>
          <p className="text-sm text-on-surface-variant">{isRoomFull ? '房间已满，房主可开始发牌。' : `当前人数 ${roomPlayers}/${roomMaxPlayers || '-'}，等待人满...`}</p>
        </div>
      )}

      <div className="bg-primary/5 rounded-[3rem] p-12 flex flex-col items-center justify-center min-h-[480px] relative overflow-hidden border border-primary/10">
        {/* Poker Table Background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(var(--color-primary-rgb),0.1),transparent)] pointer-events-none"></div>
        <div className="absolute w-[120%] h-[120%] border-[40px] border-primary/5 rounded-[50%] -top-[10%] -left-[10%] pointer-events-none opacity-20"></div>

        {/* Community Cards */}
        <div className="flex gap-3 mb-12 z-10">
          <AnimatePresence mode="popLayout">
            {[0, 1, 2, 3, 4].map((idx) => (
              <motion.div 
                key={`community-${idx}`}
                initial={{ scale: 0.8, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="w-20 h-28 sm:w-24 sm:h-36 bg-white rounded-2xl editorial-shadow border border-surface-container-high flex flex-col items-center justify-between p-3 sm:p-4 relative overflow-hidden"
              >
                {communityCards[idx] ? (
                  <>
                    <span className={`self-start font-headline font-black text-lg sm:text-xl leading-none ${communityCards[idx].c}`}>{communityCards[idx].v}</span>
                    <span className={`material-symbols-outlined text-3xl sm:text-4xl ${communityCards[idx].c}`} style={{ fontVariationSettings: "'FILL' 1" }}>{communityCards[idx].s}</span>
                    <span className={`self-end rotate-180 font-headline font-black text-lg sm:text-xl leading-none ${communityCards[idx].c}`}>{communityCards[idx].v}</span>
                  </>
                ) : (
                  <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                    <div className="w-12 h-16 border-2 border-primary/20 rounded-lg flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary/20">playing_cards</span>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Action Button */}
        <div className="z-10 mb-12">
          {isGameStarted && revealStage < 3 ? (
            <button 
              onClick={handleRevealNext}
              disabled={isSubmitting || !isHost}
              className="px-8 py-4 bg-primary text-on-primary rounded-full font-headline font-bold text-sm uppercase tracking-widest shadow-xl active:scale-95 transition-all"
            >
              {revealStage === 0 ? '翻牌 (Flop)' : revealStage === 1 ? '转牌 (Turn)' : '河牌 (River)'}
            </button>
          ) : isGameStarted ? (
            <div className="px-8 py-4 bg-secondary-container text-on-secondary-container rounded-full font-headline font-bold text-sm uppercase tracking-widest">
              All Cards Revealed
            </div>
          ) : (
            <div className="px-8 py-4 bg-surface-container-high text-on-surface-variant rounded-full font-headline font-bold text-sm uppercase tracking-widest">
              Waiting for host to start
            </div>
          )}
        </div>

        {/* Player Cards */}
        <div className="absolute -bottom-16 flex gap-2 -rotate-2">
          {playerCards.map((card, idx) => (
            <motion.div 
              key={`player-card-${idx}`}
              whileHover={{ y: -20, rotate: 0 }}
              onClick={() => setPlayerCardsRevealed(!playerCardsRevealed)}
              className={`w-24 h-36 rounded-2xl border-2 shadow-2xl flex flex-col items-center justify-between p-4 ${idx === 0 ? '-mr-10 z-10' : 'z-0'} cursor-pointer transition-all ${playerCardsRevealed ? 'bg-white border-surface-container-high' : 'bg-primary border-primary'}`}
            >
              {playerCardsRevealed ? (
                <>
                  <span className={`self-start font-headline font-black text-xl leading-none ${card.c}`}>{card.v}</span>
                  <span className={`material-symbols-outlined text-4xl ${card.c}`} style={{ fontVariationSettings: "'FILL' 1" }}>{card.s}</span>
                  <span className={`self-end rotate-180 font-headline font-black text-xl leading-none ${card.c}`}>{card.v}</span>
                </>
              ) : (
                <div className="flex items-center justify-center w-full h-full">
                  <span className="material-symbols-outlined text-4xl text-on-primary">playing_cards</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {errorMessage && (
        <p className="text-center text-sm text-error font-medium mt-4">{errorMessage}</p>
      )}

      <div className="fixed bottom-32 w-full max-w-lg left-1/2 -translate-x-1/2 flex gap-4 px-6">
        <button className="flex-1 py-4 bg-surface-container-high rounded-2xl text-on-surface-variant font-headline font-bold text-xs uppercase tracking-[0.2em] hover:bg-surface-container-highest transition-all active:scale-95">
          Fold
        </button>
        <button className="flex-1 py-4 bg-secondary-container rounded-2xl text-on-secondary-container font-headline font-bold text-xs uppercase tracking-[0.2em] hover:opacity-90 transition-all active:scale-95">
          Call
        </button>
        <button className="flex-1 py-4 bg-primary text-on-primary rounded-2xl font-headline font-bold text-xs uppercase tracking-[0.2em] hover:opacity-90 transition-all active:scale-95 shadow-lg">
          Raise
        </button>
      </div>
    </motion.div>
  );
};

const LadyCardsView = () => {
  type SuitColor = 'text-error' | 'text-on-surface';
  type DeckCard = {
    v: string;
    symbol: string;
    color: SuitColor;
  };

  const suits: Array<{ symbol: string; color: SuitColor }> = [
    { symbol: '♥', color: 'text-error' },
    { symbol: '♠', color: 'text-on-surface' },
    { symbol: '♦', color: 'text-error' },
    { symbol: '♣', color: 'text-on-surface' },
  ];

  const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  const buildDeck = (): DeckCard[] => {
    const deck: DeckCard[] = [];

    for (const suit of suits) {
      for (const value of values) {
        deck.push({
          v: value,
          symbol: suit.symbol,
          color: suit.color,
        });
      }
    }

    deck.push({ v: '★', symbol: '🃏', color: 'text-on-surface' });
    deck.push({ v: '★★', symbol: '🃏', color: 'text-error' });

    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    return deck;
  };

  const [deck, setDeck] = useState<DeckCard[]>(buildDeck);
  const [drawnIndices, setDrawnIndices] = useState<Set<number>>(new Set());
  const [currentCard, setCurrentCard] = useState<DeckCard>(deck[0]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const remainingCount = deck.length - drawnIndices.size;
  const isDeckEmpty = remainingCount === 0;

  const drawCard = () => {
    if (isDeckEmpty) {
      setErrorMessage('All cards drawn.');
      return;
    }

    setIsDrawing(true);
    setErrorMessage('');

    setTimeout(() => {
      let randomIdx: number;
      do {
        randomIdx = Math.floor(Math.random() * deck.length);
      } while (drawnIndices.has(randomIdx));

      setDrawnIndices((prev) => new Set([...prev, randomIdx]));
      setCurrentCard(deck[randomIdx]);
      setIsDrawing(false);
    }, 450);
  };

  const reshuffle = () => {
    const newDeck = buildDeck();
    setDeck(newDeck);
    setDrawnIndices(new Set());
    setCurrentCard(newDeck[0]);
    setErrorMessage('');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-5xl mx-auto px-6 pt-12 pb-32 flex flex-col items-center"
    >
      <div className="mb-8 text-sm font-medium text-on-surface-variant">{remainingCount}/54</div>

      <motion.div
        animate={isDrawing ? { rotateY: 180, scale: 0.92, opacity: 0.7 } : { rotateY: 0, scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="relative w-full max-w-[340px] aspect-[2/3] bg-white rounded-[2.5rem] editorial-shadow border border-surface-container-high overflow-hidden"
      >
        <div className="absolute top-8 left-8 flex flex-col items-center leading-none">
          <span className={`font-headline text-4xl font-black ${currentCard.color}`}>{currentCard.v}</span>
          <span className={`text-2xl ${currentCard.color}`}>{currentCard.symbol}</span>
        </div>

        <div className="absolute bottom-8 right-8 flex flex-col items-center leading-none rotate-180">
          <span className={`font-headline text-4xl font-black ${currentCard.color}`}>{currentCard.v}</span>
          <span className={`text-2xl ${currentCard.color}`}>{currentCard.symbol}</span>
        </div>

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-44 h-44 rounded-full border border-surface-container-high bg-surface-container-low flex flex-col items-center justify-center">
            <div className="absolute inset-3 rounded-full border border-dashed border-surface-container-highest opacity-40" />
            <span className={`font-headline text-8xl font-black leading-none ${currentCard.color}`}>{currentCard.v}</span>
            <span className={`text-6xl leading-none ${currentCard.color}`}>{currentCard.symbol}</span>
          </div>
        </div>
      </motion.div>

      <div className="mt-12 w-full max-w-[340px] flex flex-col gap-4">
        <button
          onClick={drawCard}
          disabled={isDrawing || isDeckEmpty}
          className="w-full py-6 bg-primary text-on-primary font-headline font-bold rounded-2xl active:scale-[0.98] transition-all shadow-xl text-lg disabled:opacity-50"
        >
          {isDrawing ? 'Drawing...' : isDeckEmpty ? 'Deck Empty' : 'Draw'}
        </button>
        {isDeckEmpty && (
          <button
            onClick={reshuffle}
            className="w-full py-6 bg-secondary text-on-secondary font-headline font-bold rounded-2xl active:scale-[0.98] transition-all shadow-xl text-lg"
          >
            Reshuffle
          </button>
        )}
        {errorMessage && <p className="text-center text-sm text-error font-medium">{errorMessage}</p>}
      </div>
    </motion.div>
  );
};

// --- Main App ---

export default function App() {
  const [currentView, setCurrentView] = useState<GameType>('LOBBY');
  const [activeTab, setActiveTab] = useState('home');
  const [credits] = useState(1250);
  const [rooms, setRooms] = useState<GameRoom[]>(ROOMS);
  const [isRoomsLoading, setIsRoomsLoading] = useState(true);

  useEffect(() => {
    const loadRooms = async () => {
      try {
        setIsRoomsLoading(true);
        const fetchedRooms = await loungeApi.getRooms();
        if (fetchedRooms.length > 0) {
          setRooms(fetchedRooms);
        }
      } catch (error) {
        console.error('Failed to load rooms from backend:', error);
      } finally {
        setIsRoomsLoading(false);
      }
    };

    loadRooms();
  }, []);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'home') setCurrentView('LOBBY');
  };

  return (
    <div className="min-h-screen bg-surface selection:bg-secondary/20">
      <TopAppBar 
        credits={credits} 
        onBack={() => setCurrentView('LOBBY')} 
      />
      
      <main className="relative">
        <AnimatePresence mode="wait">
          {currentView === 'LOBBY' && (
            <motion.div key="lobby">
              <LobbyView onSelectGame={setCurrentView} rooms={rooms} isLoading={isRoomsLoading} />
            </motion.div>
          )}
          {currentView === 'DICE' && (
            <motion.div key="dice">
              <DiceGameView />
            </motion.div>
          )}
          {currentView === 'POKER' && (
            <motion.div key="poker">
              <PokerGameView />
            </motion.div>
          )}
          {currentView === 'LADY_CARDS' && (
            <motion.div key="lady">
              <LadyCardsView />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Background Decoration */}
      <div className="fixed top-0 right-0 -z-10 w-1/2 h-screen opacity-[0.03] pointer-events-none overflow-hidden">
        <svg className="h-full w-full" viewBox="0 0 100 100">
          <path d="M50 0 L100 50 L50 100 L0 50 Z" fill="currentColor" className="text-primary" />
        </svg>
      </div>
    </div>
  );
}
