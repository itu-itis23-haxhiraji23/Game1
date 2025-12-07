/******************************************************
 * Inci's kedushi's – cozy birthday clicker
 * NO external Motion lib needed.
 * - Custom "motion" wrappers with hover/tap animations
 * - Birthday popup + music
 * - Upgrades, companions, rebirth, gallery
 * - Pixel mode
 * - Save / load via localStorage
 ******************************************************/

const { useState, useEffect, useRef } = React;

/* ----------------------------------------------------
   Tiny Motion Wrapper (no library)
   lets us use <motion.div whileHover whileTap ... />
---------------------------------------------------- */

function createMotionComponent(tag) {
  return function MotionComponent(props) {
    const {
      whileHover,
      whileTap,
      initial,
      animate,
      transition, // not used, but accepted
      style,
      onMouseEnter,
      onMouseLeave,
      onMouseDown,
      onMouseUp,
      ...rest
    } = props;

    const [currentStyle, setCurrentStyle] = useState(initial || animate || {});

    const mergedStyle = {
      transition: "all 0.2s ease-out",
      ...(style || {}),
      ...(currentStyle || {}),
    };

    function handleEnter(e) {
      if (whileHover) {
        setCurrentStyle((prev) => ({ ...(animate || prev), ...whileHover }));
      }
      onMouseEnter && onMouseEnter(e);
    }

    function handleLeave(e) {
      setCurrentStyle(animate || initial || {});
      onMouseLeave && onMouseLeave(e);
    }

    function handleDown(e) {
      if (whileTap) {
        setCurrentStyle((prev) => ({ ...(animate || prev), ...whileTap }));
      }
      onMouseDown && onMouseDown(e);
    }

    function handleUp(e) {
      if (whileHover) {
        setCurrentStyle((prev) => ({ ...(animate || prev), ...whileHover }));
      } else {
        setCurrentStyle(animate || initial || {});
      }
      onMouseUp && onMouseUp(e);
    }

    return React.createElement(tag, {
      ...rest,
      style: mergedStyle,
      onMouseEnter: handleEnter,
      onMouseLeave: handleLeave,
      onMouseDown: handleDown,
      onMouseUp: handleUp,
    });
  };
}

const motion = {
  div: createMotionComponent("div"),
  img: createMotionComponent("img"),
  button: createMotionComponent("button"),
  label: createMotionComponent("label"),
};

const AnimatePresence = ({ children }) =>
  React.createElement(React.Fragment, null, children);

/* ----------------------------------------------------
   Sound hook
---------------------------------------------------- */

function useSound(src, volume = 1.0, { loop = false } = {}) {
  const audioRef = useRef(null);

  useEffect(() => {
    if (!src) return;
    const audio = new Audio(src);
    audio.volume = volume;
    audio.loop = loop;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, [src, volume, loop]);

  return () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  };
}

/* ----------------------------------------------------
   Helpers
---------------------------------------------------- */

function formatPets(x) {
  if (x < 1000) return x.toFixed(1);
  const units = ["", "K", "M", "B", "T"];
  let u = 0;
  let v = x;
  while (v >= 1000 && u < units.length - 1) {
    v /= 1000;
    u++;
  }
  return v.toFixed(2) + units[u];
}

function computePotentialHearts(bestRun) {
  if (bestRun < 1000) return 0;
  const val = Math.log10(bestRun / 1000);
  return Math.max(0, Math.floor(val));
}

/* ----------------------------------------------------
   Upgrades
---------------------------------------------------- */

const UPGRADE_DEFS = [
  {
    id: "softPaws",
    name: "Soft Paws",
    desc: "+0.50 pets per click",
    type: "addClick",
    value: 0.5,
    baseCost: 15,
    growth: 1.35,
  },
  {
    id: "sleepushi",
    name: "Sleepushi",
    desc: "+2.0 pets per click",
    type: "addClick",
    value: 2,
    baseCost: 80,
    growth: 1.45,
  },
  {
    id: "blanket",
    name: "Supa Cozy Blanket",
    desc: "+25% per-click pets",
    type: "multClick",
    value: 0.25,
    baseCost: 150,
    growth: 1.55,
  },
  {
    id: "sunbeam",
    name: "Sunny Window",
    desc: "+0.5 pets per second",
    type: "addPassive",
    value: 0.5,
    baseCost: 20,
    growth: 1.3,
  },
  {
    id: "autoPetter",
    name: "Auto Petter",
    desc: "+2.0 pets per second",
    type: "addPassive",
    value: 2,
    baseCost: 120,
    growth: 1.5,
  },
  {
    id: "catCafe",
    name: "Cat Café",
    desc: "+6.0 pets per second",
    type: "addPassive",
    value: 6,
    baseCost: 400,
    growth: 1.6,
  },
  {
    id: "influencer",
    name: "Little Princessushi",
    desc: "+25% passive pets",
    type: "multPassive",
    value: 0.25,
    baseCost: 600,
    growth: 1.7,
  },
  {
    id: "treatBag",
    name: "Food Stealer",
    desc: "+20% to ALL pets",
    type: "multGlobal",
    value: 0.2,
    baseCost: 900,
    growth: 1.75,
  },
  {
    id: "throne",
    name: "Thronushi",
    desc: "+35% to ALL pets",
    type: "multGlobal",
    value: 0.35,
    baseCost: 2000,
    growth: 1.9,
  },
];

function getUpgradeCost(def, level) {
  return Math.floor(def.baseCost * Math.pow(def.growth, level));
}

/* ----------------------------------------------------
   Popups
---------------------------------------------------- */

function BirthdayPopup({ onClose, playBirthday, popupSound }) {
  const handleStart = () => {
    popupSound();
    playBirthday();
    onClose();
  };

  return (
    <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <motion.div
        className="popup-card"
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <h2>Happy birthday my love 💗</h2>
        <p>
          I made this cozy cat garden just for you, kedushi. Thank you for being
          in my life.
        </p>
        <button className="popup-btn" onClick={handleStart}>
          Start playing ✨
        </button>
      </motion.div>
    </motion.div>
  );
}

function EndingPopup({ onClose }) {
  useEffect(() => {
    if (typeof confetti === "function") {
      const colors = ["#ffd6a5", "#ffb3da", "#f3dde2", "#e8b2c0", "#ffffff"];
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { x: 0.1, y: 1 },
        colors,
      });
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { x: 0.9, y: 1 },
        colors,
      });
    }
  }, []);

  return (
    <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <motion.div
        className="popup-card"
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <div className="ending-sparkles" />
        <img src="maincat.png" alt="Birthday cat" className="cake-illu" />
        <h2 className="fancy-font">Happy Birthday Incushi 🎂</h2>
        <p>
          You pet Zeze and BMO so much that the whole garden turned into a
          perfect birthday universe. No matter how many runs reset, I keep
          choosing you.
        </p>
        <button className="popup-btn" onClick={onClose}>
          Keep playing with the babies 🐾
        </button>
      </motion.div>
    </motion.div>
  );
}

/* ----------------------------------------------------
   UI pieces
---------------------------------------------------- */

function PetArea({ petsPerClick, onPet, petSound }) {
  const [particles, setParticles] = useState([]);

  function spawnParticle(x, y) {
    const id = Math.random();
    setParticles((prev) => [...prev, { id, x, y }]);
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => p.id !== id));
    }, 750);
  }

  function handlePet(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    spawnParticle(rect.left + rect.width / 2, rect.top + rect.height / 2);
    petSound();
    onPet();
  }

  return (
    <motion.div className="main-area" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <motion.img
        src="maincat.png"
        alt="Cat"
        className="main-cat"
        onClick={handlePet}
        whileHover={{ transform: "scale(1.05) rotate(-1deg)" }}
        whileTap={{ transform: "scale(1.03) translateY(-4px) rotate(1deg)" }}
      />
      <motion.button
        className="pet-btn"
        onClick={handlePet}
        whileHover={{ transform: "scale(1.05)" }}
        whileTap={{ transform: "scale(0.96)" }}
      >
        Pet the kitty 💕
      </motion.button>

      {particles.map((p) => (
        <div key={p.id} className="float-pet" style={{ left: p.x, top: p.y }}>
          +{petsPerClick.toFixed(1)}
        </div>
      ))}
    </motion.div>
  );
}

function CompanionsRow({ zezeUnlocked, bmoUnlocked }) {
  return (
    <motion.div
      className="companions-row"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <motion.div
        className="companion-card"
        whileHover={{ transform: "translateY(-3px) scale(1.01)" }}
      >
        <img
          src="zeze1.jpg"
          alt="Zeze"
          onError={(e) => (e.target.style.display = "none")}
        />
        <div>
          <div className="companion-name">Zeze</div>
          <div className="companion-sub">
            {zezeUnlocked
              ? "mysterious void · +10% passive"
              : "mysterious void · unlock at 2,000 pets"}
          </div>
          {zezeUnlocked && <div className="companion-badge">Unlocked</div>}
        </div>
      </motion.div>

      <motion.div
        className="companion-card"
        whileHover={{ transform: "translateY(-3px) scale(1.01)" }}
      >
        <img
          src="bmo2.jpg"
          alt="BMO"
          onError={(e) => (e.target.style.display = "none")}
        />
        <div>
          <div className="companion-name">BMO</div>
          <div className="companion-sub">
            {bmoUnlocked
              ? "dramatic ahh cat · +10% click"
              : "dramatic ahh cat · unlock at 15,000 pets"}
          </div>
          {bmoUnlocked && <div className="companion-badge">Unlocked</div>}
        </div>
      </motion.div>
    </motion.div>
  );
}

function UpgradesPanel({
  totalPets,
  setTotalPets,
  petsPerClick,
  setPetsPerClick,
  petsPerSecond,
  setPetsPerSecond,
  upgradeLevels,
  setUpgradeLevels,
  upgradeSound,
}) {
  function buyUpgrade(index) {
    const def = UPGRADE_DEFS[index];
    const level = upgradeLevels[index];
    const cost = getUpgradeCost(def, level);
    if (totalPets < cost) return;

    upgradeSound();
    setTotalPets((p) => p - cost);

    setUpgradeLevels((levels) => {
      const arr = [...levels];
      arr[index] = arr[index] + 1;
      return arr;
    });

    switch (def.type) {
      case "addClick":
        setPetsPerClick((v) => v + def.value);
        break;
      case "multClick":
        setPetsPerClick((v) => v * (1 + def.value));
        break;
      case "addPassive":
        setPetsPerSecond((v) => v + def.value);
        break;
      case "multPassive":
        setPetsPerSecond((v) => v * (1 + def.value));
        break;
      case "multGlobal":
        setPetsPerClick((v) => v * (1 + def.value));
        setPetsPerSecond((v) => v * (1 + def.value));
        break;
      default:
        break;
    }
  }

  return (
    <motion.div
      className="panel panel-upgrades"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h2 className="panel-title">Upgrades</h2>
      <div className="upgrade-grid">
        {UPGRADE_DEFS.map((def, i) => {
          const level = upgradeLevels[i];
          const cost = getUpgradeCost(def, level);
          const affordable = totalPets >= cost;
          const highlight = level === 0 && affordable;
          return (
            <motion.div
              key={def.id}
              className={"upgrade" + (highlight ? " upgrade--highlight" : "")}
              whileHover={{ transform: "translateY(-2px) scale(1.01)" }}
            >
              <div>
                <strong className="up-name">{def.name}</strong>
                <p className="up-desc">{def.desc}</p>
                <p className="up-level">Level {level}</p>
              </div>
              <motion.button
                className="buy"
                disabled={!affordable}
                onClick={() => buyUpgrade(i)}
                whileHover={
                  affordable ? { transform: "scale(1.08)" } : undefined
                }
                whileTap={
                  affordable ? { transform: "scale(0.95)" } : undefined
                }
              >
                {formatPets(cost)}
              </motion.button>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

function RebirthPanel({
  hearts,
  rebirths,
  bestPetsRun,
  setHearts,
  setRebirths,
  setTotalPets,
  setBestPetsRun,
  setPetsPerClick,
  setPetsPerSecond,
  setUpgradeLevels,
  setZezeUnlocked,
  setBmoUnlocked,
  rebirthSound,
}) {
  const potential = computePotentialHearts(bestPetsRun);
  const gain = Math.max(0, potential - hearts);

  function handleRebirth() {
    if (gain <= 0) return;
    if (
      !window.confirm(
        `Curl up into a new dream?\n\nYou will gain +${gain} heart${
          gain > 1 ? "s" : ""
        } and reset this run.`
      )
    )
      return;

    rebirthSound();

    setHearts((h) => h + gain);
    setRebirths((r) => r + 1);
    setTotalPets(0);
    setBestPetsRun(0);
    setUpgradeLevels(Array(UPGRADE_DEFS.length).fill(0));
    setZezeUnlocked(false);
    setBmoUnlocked(false);

    const baseClick = 1;
    const baseSec = 0;
    const boost = 1 + (hearts + gain) * 0.05;
    setPetsPerClick(baseClick * boost);
    setPetsPerSecond(baseSec * boost);
  }

  return (
    <motion.div
      className="panel"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h2 className="panel-title">Dreamy rebirth</h2>
      <p>
        Hearts: {hearts} (each gives +5% to all pets). Rebirths: {rebirths}.
      </p>
      <p>
        Best run: {formatPets(bestPetsRun)} pets.{" "}
        {gain > 0
          ? `You can gain +${gain} more heart${
              gain > 1 ? "s" : ""
            } if you rebirth now.`
          : "Earn more pets to unlock new hearts."}
      </p>
      <button className="buy" disabled={gain <= 0} onClick={handleRebirth}>
        Curl up &amp; dream ✨
      </button>
    </motion.div>
  );
}

function GalleryPanel() {
  const imgs = ["zeze1.jpg", "zeze2.jpg", "bmo2.jpg", "bmo3.jpg"];
  return (
    <motion.div
      className="panel panel-gallery"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h2 className="panel-title">Cat moments ✨</h2>
      <div className="gallery">
        {imgs.map((src) => (
          <motion.img
            key={src}
            src={src}
            alt={src}
            onError={(e) => (e.target.style.display = "none")}
            whileHover={{ transform: "translateY(-3px) scale(1.02)" }}
          />
        ))}
      </div>
    </motion.div>
  );
}

/* ----------------------------------------------------
   MAIN APP
---------------------------------------------------- */

function App() {
  const [totalPets, setTotalPets] = useState(0);
  const [bestPetsRun, setBestPetsRun] = useState(0);
  const [petsPerClick, setPetsPerClick] = useState(1);
  const [petsPerSecond, setPetsPerSecond] = useState(0);

  const [hearts, setHearts] = useState(0);
  const [rebirths, setRebirths] = useState(0);

  const [zezeUnlocked, setZezeUnlocked] = useState(false);
  const [bmoUnlocked, setBmoUnlocked] = useState(false);

  const [upgradeLevels, setUpgradeLevels] = useState(
    Array(UPGRADE_DEFS.length).fill(0)
  );

  const [pixelMode, setPixelMode] = useState(false);
  const [showBirthdayPopup, setShowBirthdayPopup] = useState(true);
  const [showEndingPopup, setShowEndingPopup] = useState(false);

  /* sounds */
  const clickSfx = useSound("click.mp3", 0.6);
  const upgradeSfx = useSound("upgrade.mp3", 0.7);
  const rebirthSfx = useSound("rebirth.mp3", 0.7);
  const popupSfx = useSound("popup.mp3", 0.7);
  const birthdayMusic = useSound("birthday.mp3", 0.6, { loop: false });

  /* load once */
  useEffect(() => {
    const raw = localStorage.getItem("inciCozyCatGardenSave");
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      setTotalPets(data.totalPets ?? 0);
      setBestPetsRun(data.bestPetsRun ?? 0);
      setPetsPerClick(data.petsPerClick ?? 1);
      setPetsPerSecond(data.petsPerSecond ?? 0);
      setHearts(data.hearts ?? 0);
      setRebirths(data.rebirths ?? 0);
      setZezeUnlocked(data.zezeUnlocked ?? false);
      setBmoUnlocked(data.bmoUnlocked ?? false);
      if (Array.isArray(data.upgradeLevels)) {
        setUpgradeLevels(
          data.upgradeLevels.length === UPGRADE_DEFS.length
            ? data.upgradeLevels
            : Array(UPGRADE_DEFS.length).fill(0)
        );
      }
      if (typeof data.pixelMode === "boolean") setPixelMode(data.pixelMode);
    } catch (e) {
      // ignore
    }
  }, []);

  /* save */
  useEffect(() => {
    const save = {
      totalPets,
      bestPetsRun,
      petsPerClick,
      petsPerSecond,
      hearts,
      rebirths,
      zezeUnlocked,
      bmoUnlocked,
      upgradeLevels,
      pixelMode,
    };
    localStorage.setItem("inciCozyCatGardenSave", JSON.stringify(save));
  }, [
    totalPets,
    bestPetsRun,
    petsPerClick,
    petsPerSecond,
    hearts,
    rebirths,
    zezeUnlocked,
    bmoUnlocked,
    upgradeLevels,
    pixelMode,
  ]);

  /* passive income */
  useEffect(() => {
    const id = setInterval(() => {
      if (petsPerSecond <= 0) return;
      setTotalPets((prev) => {
        const next = prev + petsPerSecond / 10;
        setBestPetsRun((b) => (next > b ? next : b));
        return next;
      });
    }, 100);
    return () => clearInterval(id);
  }, [petsPerSecond]);

  /* unlock companions */
  useEffect(() => {
    if (!zezeUnlocked && bestPetsRun >= 2000) {
      setZezeUnlocked(true);
      setPetsPerSecond((v) => v * 1.1);
    }
    if (!bmoUnlocked && bestPetsRun >= 15000) {
      setBmoUnlocked(true);
      setPetsPerClick((v) => v * 1.1);
    }
  }, [bestPetsRun, zezeUnlocked, bmoUnlocked]);

  /* ending popup trigger */
  useEffect(() => {
    if (hearts >= 5 || bestPetsRun >= 200000) {
      setShowEndingPopup(true);
    }
  }, [hearts, bestPetsRun]);

  /* pixel mode body class */
  useEffect(() => {
    if (pixelMode) document.body.classList.add("pixel-mode");
    else document.body.classList.remove("pixel-mode");
  }, [pixelMode]);

  /* attempt birthday music on initial load (once) */
  useEffect(() => {
    birthdayMusic();
  }, []); // play once on page load

  function handlePet() {
    setTotalPets((p) => {
      const next = p + petsPerClick;
      setBestPetsRun((b) => (next > b ? next : b));
      return next;
    });
  }

  return (
    <motion.div
      className="page"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="title-row">
        <h1 className="title">Inci's kedushis 🐾💗</h1>
        <motion.label
          className="mode-toggle"
          whileHover={{ transform: "scale(1.05)" }}
          whileTap={{ transform: "scale(0.96)" }}
        >
          <input
            type="checkbox"
            checked={pixelMode}
            onChange={(e) => setPixelMode(e.target.checked)}
          />
          Pixel mode
        </motion.label>
      </div>

      <div className="stats-row">
        <div className="stat">
          <span>{formatPets(totalPets)}</span>
          <label>Pets</label>
        </div>
        <div className="stat">
          <span>{petsPerClick.toFixed(2)}</span>
          <label>Per Click</label>
        </div>
        <div className="stat">
          <span>{petsPerSecond.toFixed(2)}</span>
          <label>Per Second</label>
        </div>
        <div className="stat">
          <span>{hearts}</span>
          <label>Hearts</label>
        </div>
      </div>
      <div className="stats-caption">
        Hearts give +5% to all pets each run ✨
      </div>

      <PetArea
        petsPerClick={petsPerClick}
        onPet={handlePet}
        petSound={clickSfx}
      />

      <CompanionsRow
        zezeUnlocked={zezeUnlocked}
        bmoUnlocked={bmoUnlocked}
      />

      <UpgradesPanel
        totalPets={totalPets}
        setTotalPets={setTotalPets}
        petsPerClick={petsPerClick}
        setPetsPerClick={setPetsPerClick}
        petsPerSecond={petsPerSecond}
        setPetsPerSecond={setPetsPerSecond}
        upgradeLevels={upgradeLevels}
        setUpgradeLevels={setUpgradeLevels}
        upgradeSound={upgradeSfx}
      />

      <RebirthPanel
        hearts={hearts}
        rebirths={rebirths}
        bestPetsRun={bestPetsRun}
        setHearts={setHearts}
        setRebirths={setRebirths}
        setTotalPets={setTotalPets}
        setBestPetsRun={setBestPetsRun}
        setPetsPerClick={setPetsPerClick}
        setPetsPerSecond={setPetsPerSecond}
        setUpgradeLevels={setUpgradeLevels}
        setZezeUnlocked={setZezeUnlocked}
        setBmoUnlocked={setBmoUnlocked}
        rebirthSound={rebirthSfx}
      />

      <GalleryPanel />

      <AnimatePresence>
        {showBirthdayPopup && (
          <BirthdayPopup
            onClose={() => setShowBirthdayPopup(false)}
            playBirthday={birthdayMusic}
            popupSound={popupSfx}
          />
        )}
        {showEndingPopup && (
          <EndingPopup onClose={() => setShowEndingPopup(false)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ----------------------------------------------------
   Mount
---------------------------------------------------- */

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
