(() => {
  "use strict";

  const COLORS = ["red", "blue", "green", "yellow"];
  const COLOR_LABELS = {
    red: "Red",
    blue: "Blue",
    green: "Green",
    yellow: "Yellow",
    wild: "Wild",
  };

  let nextCardUid = 1;

  // --- Audio Synth (Web Audio API, zero external assets) ---
  class SoundFX {
    constructor() {
      this.enabled = true;
      this.ctx = null;
    }

    ensureCtx() {
      if (!this.enabled) return null;
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    }

    tone(freq, duration = 0.08, type = "triangle", gainVal = 0.08, delay = 0) {
      const ctx = this.ensureCtx();
      if (!ctx) return;
      const now = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(gainVal, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + duration);
    }

    click() {
      this.tone(520, 0.045, "triangle", 0.06);
    }

    play() {
      this.tone(360, 0.06, "sine", 0.08);
      this.tone(540, 0.07, "triangle", 0.06, 0.03);
    }

    draw() {
      this.tone(240, 0.06, "sine", 0.06);
    }

    bonus() {
      this.tone(587, 0.09, "triangle", 0.08, 0);
      this.tone(784, 0.11, "triangle", 0.08, 0.06);
      this.tone(988, 0.14, "sine", 0.07, 0.12);
    }

    penalty() {
      this.tone(220, 0.12, "sawtooth", 0.06, 0);
      this.tone(175, 0.16, "sawtooth", 0.06, 0.08);
    }

    shout() {
      this.tone(660, 0.08, "square", 0.05, 0);
      this.tone(880, 0.16, "triangle", 0.09, 0.07);
    }

    win() {
      [523, 659, 784, 1046].forEach((f, idx) => {
        this.tone(f, 0.18, "triangle", 0.08, idx * 0.09);
      });
    }
  }

  const sfx = new SoundFX();

  // --- SVG Icons (No Emojis) ---
  const ICONS = {
    soundOn: `<svg class="ui-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>`,
    soundOff: `<svg class="ui-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>`,
    trophy: `<svg viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="#FBBF24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2"></path><path d="M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2"></path><path d="M6 3h12v7a6 6 0 0 1-12 0V3z"></path><path d="M12 16v4"></path><path d="M8 21h8"></path></svg>`,
    robotLoss: `<svg viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="#F87171" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="10" rx="2"></rect><circle cx="12" cy="5" r="2"></circle><path d="M12 7v4"></path><line x1="8" y1="15" x2="10" y2="17"></line><line x1="10" y1="15" x2="8" y2="17"></line><line x1="14" y1="15" x2="16" y2="17"></line><line x1="16" y1="15" x2="14" y2="17"></line><path d="M9 19h6"></path></svg>`,
    sparkle: `<svg class="btn-icon" viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true" style="vertical-align: middle; margin-right: 3px;"><path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z"></path></svg>`,
    check: `<svg class="btn-icon" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align: middle; margin-right: 3px;"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
    stagedCheck: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#34D399" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>`
  };

  // --- DOM References ---
  const dom = {
    difficultySelect: document.getElementById("difficultySelect"),
    matchGoalSelect: document.getElementById("matchGoalSelect"),
    bgThemeSelect: document.getElementById("bgThemeSelect"),
    customColorBox: document.getElementById("customColorBox"),
    customColorInput: document.getElementById("customColorInput"),
    customColorText: document.getElementById("customColorText"),
    soundToggleBtn: document.getElementById("soundToggleBtn"),
    rulesBtn: document.getElementById("rulesBtn"),
    newGameBtn: document.getElementById("newGameBtn"),

    botTurnChip: document.getElementById("botTurnChip"),
    humanTurnChip: document.getElementById("humanTurnChip"),
    botScorePill: document.getElementById("botScorePill"),
    humanScorePill: document.getElementById("humanScorePill"),
    botCardCount: document.getElementById("botCardCount"),
    humanCardCount: document.getElementById("humanCardCount"),
    botTotalScore: document.getElementById("botTotalScore"),
    humanTotalScore: document.getElementById("humanTotalScore"),
    goalSuffixBot: document.getElementById("goalSuffixBot"),
    goalSuffixHuman: document.getElementById("goalSuffixHuman"),
    turnBanner: document.getElementById("turnBanner"),
    lastActionText: document.getElementById("lastActionText"),

    botHand: document.getElementById("botHand"),
    botShoutBadge: document.getElementById("botShoutBadge"),
    catchBotBtn: document.getElementById("catchBotBtn"),

    drawPileBtn: document.getElementById("drawPileBtn"),
    drawCountBadge: document.getElementById("drawCountBadge"),
    drawPileHint: document.getElementById("drawPileHint"),
    centerRow: document.getElementById("centerRow"),

    selectionSummary: document.getElementById("selectionSummary"),
    undoStageBtn: document.getElementById("undoStageBtn"),
    shoutDosBtn: document.getElementById("shoutDosBtn"),
    endTurnBtn: document.getElementById("endTurnBtn"),

    playerHand: document.getElementById("playerHand"),
    bonusBanner: document.getElementById("bonusBanner"),
    clearSelectionBtn: document.getElementById("clearSelectionBtn"),
    sortHandBtn: document.getElementById("sortHandBtn"),

    wildNumModal: document.getElementById("wildNumModal"),
    wildNumGrid: document.getElementById("wildNumGrid"),
    roundOverModal: document.getElementById("roundOverModal"),
    resultEmoji: document.getElementById("resultEmoji"),
    roundOverTitle: document.getElementById("roundOverTitle"),
    roundOverSubtitle: document.getElementById("roundOverSubtitle"),
    scoreBreakdown: document.getElementById("scoreBreakdown"),
    nextRoundBtn: document.getElementById("nextRoundBtn"),

    rulesModal: document.getElementById("rulesModal"),
    closeRulesBtn: document.getElementById("closeRulesBtn"),
    toastContainer: document.getElementById("toastContainer"),
  };

  // --- Game State ---
  const state = {
    difficulty: "casual", // "casual" | "smart" | "ruthless"
    matchGoal: 200, // 200 | "single"
    gameToken: 0,

    humanScore: 0,
    botScore: 0,
    roundNumber: 1,

    drawPile: [],
    discardPile: [],
    humanHand: [],
    botHand: [],
    selectedIds: [],

    turn: "human", // "human" | "bot"
    phase: "play", // "play" | "placeBonus" | "awaitWildNum" | "bot" | "roundOver"
    hasDrawnThisTurn: false,
    newlyDrawnCardId: null,

    humanSaidShout: false,
    botSaidShout: false,
    botVulnerableShout: false,
    shoutGraceActive: false,

    lastAction: "",

    dos: {
      centerRow: [],
      stagedMatches: [], // { centerId, playedCards: [...], matchType, colorBonus, doubleColorBonus }
      bonusesRemaining: 0,
      pendingWildCard: null,
      pendingWildResolver: null,
    },
  };

  // --- Utilities ---
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function showToast(msg, variant = "normal") {
    const el = document.createElement("div");
    el.className = `toast ${variant === "warn" ? "warn" : variant === "gold" ? "gold" : ""}`;
    el.textContent = msg;
    dom.toastContainer.appendChild(el);
    setTimeout(() => {
      el.style.opacity = "0";
      el.style.transition = "opacity 0.25s ease";
      setTimeout(() => el.remove(), 260);
    }, 2700);
  }

  function setLastAction(text) {
    state.lastAction = text;
    dom.lastActionText.textContent = text;
  }

  // --- Deck Builders ---
  function makeCard(props) {
    return { id: `c${nextCardUid++}`, ...props };
  }

  function buildDosDeck() {
    const deck = [];
    for (const color of COLORS) {
      [1, 3, 4, 5].forEach((val) => {
        for (let k = 0; k < 3; k++) {
          deck.push(makeCard({ kind: "number", color, value: val }));
        }
      });
      [6, 7, 8, 9, 10].forEach((val) => {
        for (let k = 0; k < 2; k++) {
          deck.push(makeCard({ kind: "number", color, value: val }));
        }
      });
      for (let k = 0; k < 2; k++) {
        deck.push(makeCard({ kind: "wildNum", color, value: null, assignedValue: null }));
      }
    }
    for (let k = 0; k < 12; k++) {
      deck.push(makeCard({ kind: "wildDos", color: "wild", value: 2 }));
    }
    return shuffle(deck);
  }

  function drawOneCard() {
    if (state.drawPile.length === 0) {
      if (state.discardPile.length === 0) return null;
      const recycled = state.discardPile.splice(0, state.discardPile.length);
      recycled.forEach((c) => {
        if (c.kind === "wildNum") c.assignedValue = null;
      });
      state.drawPile = shuffle(recycled);
      showToast("Reshuffled Discard Pile into Draw Pile");
    }
    return state.drawPile.pop() || null;
  }

  function drawCards(targetHand, count) {
    const drawn = [];
    for (let i = 0; i < count; i++) {
      const card = drawOneCard();
      if (!card) break;
      targetHand.push(card);
      drawn.push(card);
    }
    return drawn;
  }

  // --- Card Display & Points ---
  function cardPoints(card) {
    if (card.kind === "number") return card.value;
    if (card.kind === "wildNum") return 20;
    if (card.kind === "wildDos") return 50;
    return 0;
  }

  function cardShortName(card) {
    if (card.kind === "number") return `${COLOR_LABELS[card.color]} ${card.value}`;
    if (card.kind === "wildNum") {
      return card.assignedValue ? `${COLOR_LABELS[card.color]} #(${card.assignedValue})` : `${COLOR_LABELS[card.color]} #`;
    }
    if (card.kind === "wildDos") return "Wild DOS (2)";
    return "Card";
  }

  function cardFaceDisplay(card) {
    if (card.kind === "number") {
      return { pip: String(card.value), center: String(card.value), small: false, badge: null };
    }
    if (card.kind === "wildNum") {
      const label = card.assignedValue ? String(card.assignedValue) : "#";
      return {
        pip: "#",
        center: label,
        small: false,
        badge: card.assignedValue ? "WILD #" : "ANY #",
      };
    }
    if (card.kind === "wildDos") {
      return { pip: "2", center: "DOS", small: true, badge: "WILD 2" };
    }
    return { pip: "?", center: "?", small: false, badge: null };
  }

  function createCardElement(card, options = {}) {
    const el = document.createElement(options.asButton ? "button" : "div");
    el.className = `card ${card.color}`;
    if (options.selected) el.classList.add("selected");
    if (options.dimmed) el.classList.add("dimmed");

    const face = cardFaceDisplay(card);

    const pipTL = document.createElement("span");
    pipTL.className = "card-pip tl";
    pipTL.textContent = face.pip;

    const pipBR = document.createElement("span");
    pipBR.className = "card-pip br";
    pipBR.textContent = face.pip;

    const oval = document.createElement("div");
    oval.className = "card-oval";

    const centerVal = document.createElement("span");
    centerVal.className = `card-center-val${face.small ? " small-label" : ""}`;
    centerVal.textContent = face.center;
    oval.appendChild(centerVal);

    el.appendChild(pipTL);
    el.appendChild(oval);
    el.appendChild(pipBR);

    if (face.badge) {
      const sub = document.createElement("span");
      sub.className = "card-sub-badge";
      sub.textContent = face.badge;
      el.appendChild(sub);
    }

    if (options.isNew) {
      const tag = document.createElement("span");
      tag.className = "new-card-tag";
      tag.textContent = "NEW";
      el.appendChild(tag);
    }

    return el;
  }

  // --- DOS Rules Engine ---
  function getDosTargetValue(centerCard) {
    if (centerCard.kind === "wildNum") return centerCard.assignedValue;
    return centerCard.value;
  }

  function colorsMatch(cardColor, targetColor) {
    return cardColor === "wild" || targetColor === "wild" || cardColor === targetColor;
  }

  function evaluateDosMatch(selectedCards, centerCard) {
    if (!selectedCards || selectedCards.length === 0 || selectedCards.length > 2) return null;
    const targetVal = getDosTargetValue(centerCard);

    if (selectedCards.length === 1) {
      const c = selectedCards[0];
      let numValid = false;
      if (targetVal === null) {
        numValid = true;
      } else if (c.kind === "wildNum") {
        numValid = targetVal >= 1 && targetVal <= 10;
      } else {
        numValid = c.value === targetVal;
      }
      if (!numValid) return null;

      const colorBonus = colorsMatch(c.color, centerCard.color);
      return {
        matchType: "single",
        colorBonus,
        doubleColorBonus: false,
      };
    }

    // Double Match
    const [a, b] = selectedCards;
    let sumValid = false;
    if (targetVal === null) {
      sumValid = true;
    } else if (a.kind === "wildNum" && b.kind === "wildNum") {
      sumValid = targetVal >= 2 && targetVal <= 20;
    } else if (a.kind === "wildNum") {
      const needed = targetVal - b.value;
      sumValid = needed >= 1 && needed <= 10;
    } else if (b.kind === "wildNum") {
      const needed = targetVal - a.value;
      sumValid = needed >= 1 && needed <= 10;
    } else {
      sumValid = a.value + b.value === targetVal;
    }

    if (!sumValid) return null;

    const bothColorMatch = colorsMatch(a.color, centerCard.color) && colorsMatch(b.color, centerCard.color);
    return {
      matchType: "double",
      colorBonus: bothColorMatch,
      doubleColorBonus: bothColorMatch,
    };
  }

  function hasAnyDosMatch(hand, centerRow) {
    for (const center of centerRow) {
      for (let i = 0; i < hand.length; i++) {
        if (evaluateDosMatch([hand[i]], center)) return true;
        for (let j = i + 1; j < hand.length; j++) {
          if (evaluateDosMatch([hand[i], hand[j]], center)) return true;
        }
      }
    }
    return false;
  }

  // --- Game / Round Lifecycle ---
  function startNewMatch() {
    state.humanScore = 0;
    state.botScore = 0;
    state.roundNumber = 1;
    startRound();
  }

  function startRound() {
    state.gameToken += 1;
    state.selectedIds = [];
    state.hasDrawnThisTurn = false;
    state.newlyDrawnCardId = null;
    state.humanSaidShout = false;
    state.botSaidShout = false;
    state.botVulnerableShout = false;
    state.shoutGraceActive = false;
    state.turn = "human";
    state.phase = "play";

    state.dos.centerRow = [];
    state.dos.stagedMatches = [];
    state.dos.bonusesRemaining = 0;
    state.dos.pendingWildCard = null;
    state.dos.pendingWildResolver = null;

    state.drawPile = buildDosDeck();
    state.discardPile = [];
    state.humanHand = [];
    state.botHand = [];
    drawCards(state.humanHand, 7);
    drawCards(state.botHand, 7);

    // Flip 2 number cards for initial Center Row
    const heldAside = [];
    while (state.dos.centerRow.length < 2) {
      const c = drawOneCard();
      if (!c) break;
      if (c.kind === "number") {
        state.dos.centerRow.push(c);
      } else {
        heldAside.push(c);
      }
    }
    if (heldAside.length > 0) {
      state.drawPile.unshift(...heldAside);
      shuffle(state.drawPile);
    }
    setLastAction(`Round ${state.roundNumber} started! Match Center Row piles by number.`);

    sortHand(state.humanHand);
    render();
  }

  function sortHand(hand) {
    const colorOrder = { red: 0, blue: 1, green: 2, yellow: 3, wild: 4 };
    const kindOrder = { number: 0, wildNum: 1, wildDos: 2 };
    hand.sort((a, b) => {
      if (colorOrder[a.color] !== colorOrder[b.color]) {
        return colorOrder[a.color] - colorOrder[b.color];
      }
      if (kindOrder[a.kind] !== kindOrder[b.kind]) {
        return kindOrder[a.kind] - kindOrder[b.kind];
      }
      return (a.value ?? 99) - (b.value ?? 99);
    });
  }

  // --- Human Actions: DOS ---
  function toggleHumanCardSelection(cardId) {
    if (state.turn !== "human" || state.phase === "bot" || state.phase === "roundOver") return;

    // Clicking a card during Color Match Bonus places it into Center Row
    if (state.phase === "placeBonus") {
      placeBonusCard(cardId);
      return;
    }

    if (state.phase !== "play") return;

    const idx = state.selectedIds.indexOf(cardId);
    if (idx !== -1) {
      state.selectedIds.splice(idx, 1);
      sfx.click();
    } else {
      if (state.selectedIds.length >= 2) {
        state.selectedIds.shift();
      }
      state.selectedIds.push(cardId);
      sfx.click();
    }
    render();
  }

  function stageDosMatch(centerId) {
    if (state.turn !== "human" || state.phase !== "play") return;
    if (state.dos.stagedMatches.some((m) => m.centerId === centerId)) return;

    const centerCard = state.dos.centerRow.find((c) => c.id === centerId);
    if (!centerCard) return;

    const selectedCards = state.selectedIds
      .map((id) => state.humanHand.find((c) => c.id === id))
      .filter(Boolean);

    const match = evaluateDosMatch(selectedCards, centerCard);
    if (!match) return;

    // Clear bot vulnerability once human acts
    state.botVulnerableShout = false;

    // Remove played cards from humanHand
    for (const sc of selectedCards) {
      const hIdx = state.humanHand.findIndex((c) => c.id === sc.id);
      if (hIdx !== -1) state.humanHand.splice(hIdx, 1);
    }

    state.dos.stagedMatches.push({
      centerId,
      playedCards: selectedCards,
      matchType: match.matchType,
      colorBonus: match.colorBonus,
      doubleColorBonus: match.doubleColorBonus,
    });

    state.selectedIds = [];
    if (state.humanHand.length !== 2) {
      state.humanSaidShout = false;
    }

    if (match.colorBonus) {
      sfx.bonus();
      showToast(
        match.doubleColorBonus ? "Double Color Bonus! (+1 Center, Bot +1)" : "Color Match Bonus! (+1 Center)",
        "gold"
      );
    } else {
      sfx.play();
    }

    const playedNames = selectedCards.map(cardShortName).join(" + ");
    setLastAction(`Staged ${playedNames} on ${cardShortName(centerCard)}.`);

    // If human emptied hand with this match, resolve immediately as a win!
    if (state.humanHand.length === 0) {
      endDosHumanTurn();
      return;
    }

    render();
  }

  function undoLastStagedMatch() {
    if (state.turn !== "human" || state.phase !== "play" || state.dos.stagedMatches.length === 0) return;
    const last = state.dos.stagedMatches.pop();
    state.humanHand.push(...last.playedCards);
    state.selectedIds = [];
    if (state.humanHand.length !== 2) {
      state.humanSaidShout = false;
    }
    sfx.click();
    setLastAction("Undid last staged match.");
    render();
  }

  function promptWildNumberForCenter(card) {
    return new Promise((resolve) => {
      state.phase = "awaitWildNum";
      state.dos.pendingWildCard = card;
      state.dos.pendingWildResolver = resolve;
      dom.wildNumGrid.innerHTML = "";
      for (let n = 1; n <= 10; n++) {
        const btn = document.createElement("button");
        btn.className = "num-choice-btn";
        btn.textContent = String(n);
        btn.addEventListener("click", () => {
          card.assignedValue = n;
          dom.wildNumModal.classList.add("hidden");
          state.dos.pendingWildCard = null;
          const res = state.dos.pendingWildResolver;
          state.dos.pendingWildResolver = null;
          sfx.click();
          res(n);
        });
        dom.wildNumGrid.appendChild(btn);
      }
      dom.wildNumModal.classList.remove("hidden");
      render();
    });
  }

  async function placeBonusCard(cardId) {
    const idx = state.humanHand.findIndex((c) => c.id === cardId);
    if (idx === -1) return;
    const [card] = state.humanHand.splice(idx, 1);

    if (card.kind === "wildNum") {
      await promptWildNumberForCenter(card);
    }

    state.dos.centerRow.push(card);
    state.dos.bonusesRemaining -= 1;
    sfx.play();

    if (state.humanHand.length === 0) {
      setLastAction(`Placed ${cardShortName(card)} into Center Row and emptied your hand!`);
      finishRound("human");
      return;
    }

    if (state.humanHand.length !== 2) {
      state.humanSaidShout = false;
    }

    if (state.dos.bonusesRemaining > 0) {
      state.phase = "placeBonus";
      setLastAction(`Placed ${cardShortName(card)}. Choose 1 more card for the Center Row.`);
      render();
    } else {
      await finalizeHumanDosTurnAndStartBot();
    }
  }

  async function endDosHumanTurn() {
    if (state.turn !== "human" || state.phase !== "play") return;
    if (state.dos.stagedMatches.length === 0 && !state.hasDrawnThisTurn) return;

    const token = state.gameToken;
    const matches = state.dos.stagedMatches;
    let bonuses = 0;
    let doublePenalties = 0;

    if (matches.length > 0) {
      const matchedIds = new Set();
      for (const m of matches) {
        matchedIds.add(m.centerId);
        if (m.colorBonus) bonuses += 1;
        if (m.doubleColorBonus) doublePenalties += 1;
      }

      // Move matched Center Row cards + played cards to discardPile
      const remainingCenter = [];
      for (const c of state.dos.centerRow) {
        if (matchedIds.has(c.id)) {
          state.discardPile.push(c);
        } else {
          remainingCenter.push(c);
        }
      }
      for (const m of matches) {
        state.discardPile.push(...m.playedCards);
      }
      state.dos.centerRow = remainingCenter;
      state.dos.stagedMatches = [];

      // Double Color Match penalty: Bot draws 1 per double color match
      if (doublePenalties > 0) {
        drawCards(state.botHand, doublePenalties);
        state.botSaidShout = false;
        state.botVulnerableShout = false;
        showToast(`Bot drew +${doublePenalties} from Double Color Match!`, "gold");
      }

      // Refill Center Row to at least 2 cards
      while (state.dos.centerRow.length < 2) {
        const refilled = drawOneCard();
        if (!refilled) break;
        if (refilled.kind === "wildNum") {
          // Bot is about to play, so Bot assigns a value 1..10
          refilled.assignedValue = chooseBotWildNumValue(state.botHand);
        }
        state.dos.centerRow.push(refilled);
      }
    }

    if (state.humanHand.length === 0) {
      finishRound("human");
      return;
    }

    if (bonuses > 0) {
      state.dos.bonusesRemaining = bonuses;
      state.phase = "placeBonus";
      setLastAction(`Color Match Bonus! Click ${bonuses} card${bonuses > 1 ? "s" : ""} from your hand to add to the Center Row.`);
      render();
      return;
    }

    await finalizeHumanDosTurnAndStartBot(token);
  }

  async function finalizeHumanDosTurnAndStartBot(existingToken = state.gameToken) {
    const token = existingToken;

    // Brief grace window if human is at 2 cards and hasn't called DOS yet
    if (state.humanHand.length === 2 && !state.humanSaidShout) {
      state.shoutGraceActive = true;
      state.phase = "bot";
      setLastAction("You have 2 cards left! Call DOS!...");
      render();
      await sleep(1100);
      if (token !== state.gameToken) return;
      state.shoutGraceActive = false;

      if (state.humanHand.length === 2 && !state.humanSaidShout) {
        const catchChance = state.difficulty === "casual" ? 0.45 : state.difficulty === "smart" ? 0.8 : 0.96;
        if (Math.random() < catchChance) {
          drawCards(state.humanHand, 2);
          sfx.penalty();
          showToast("BOT caught you! You forgot to call DOS! (+2 cards)", "warn");
          setLastAction("DOS-Bot caught you not calling DOS! (+2 penalty cards)");
        }
      }
    }

    state.selectedIds = [];
    state.hasDrawnThisTurn = false;
    state.newlyDrawnCardId = null;
    state.turn = "bot";
    state.phase = "bot";
    render();

    await runDosBotTurn(token);
  }

  // --- Draw Pile Click (Human) ---
  function handleHumanDrawClick() {
    if (state.turn !== "human" || state.phase !== "play") return;
    if (state.hasDrawnThisTurn) {
      showToast("You already drew a card this turn.", "warn");
      return;
    }
    if (state.dos.stagedMatches.length > 0) {
      showToast("You already matched a pile this turn — click End Turn or Undo.", "warn");
      return;
    }

    // Clear bot vulnerability once human takes an action
    state.botVulnerableShout = false;

    const drawn = drawCards(state.humanHand, 1);
    if (drawn.length === 0) {
      state.hasDrawnThisTurn = true;
      showToast("No cards left in Draw or Discard piles — you may End Turn.", "warn");
      setLastAction("Draw & Discard piles are empty. Click End Turn to pass.");
      render();
      return;
    }

    const card = drawn[0];
    state.hasDrawnThisTurn = true;
    state.newlyDrawnCardId = card.id;
    state.humanSaidShout = false;
    sfx.draw();

    if (hasAnyDosMatch(state.humanHand, state.dos.centerRow)) {
      setLastAction(`Drew ${cardShortName(card)}. You can match a Center Row card or click End Turn.`);
    } else {
      setLastAction(`Drew ${cardShortName(card)}. No matches available — click End Turn.`);
    }

    render();
  }

  // --- Shout & Catch Mechanics ---
  function handleHumanShout() {
    const targetCount = 2;
    const preCount = 3;
    const validNow =
      state.humanHand.length === targetCount ||
      (state.turn === "human" && state.humanHand.length === preCount);

    if (!validNow || state.humanSaidShout) return;
    state.humanSaidShout = true;
    sfx.shout();
    showToast("DOS! Called", "gold");
    render();
  }

  function handleCatchBot() {
    if (!state.botVulnerableShout) return;
    state.botVulnerableShout = false;
    drawCards(state.botHand, 2);
    sfx.bonus();
    showToast("Caught Bot! Bot draws +2 penalty cards!", "gold");
    setLastAction("You caught Bot forgetting to call DOS! (+2 cards)");
    render();
  }

  // --- Bot AI: DOS ---
  function chooseBotWildNumValue(hand) {
    const counts = new Map();
    for (const c of hand) {
      if (c.kind === "number" || c.kind === "wildDos") {
        counts.set(c.value, (counts.get(c.value) || 0) + 1);
      }
    }
    let bestNum = 5;
    let bestScore = -1;
    for (let n = 1; n <= 10; n++) {
      const score = counts.get(n) || 0;
      if (score > bestScore) {
        bestScore = score;
        bestNum = n;
      }
    }
    return bestNum;
  }

  function findBestDosTurn(botHand, centerRow, difficulty) {
    // Generate candidate matches per center slot
    const slotOptions = centerRow.map((center) => {
      const candidates = [];
      for (let i = 0; i < botHand.length; i++) {
        const res = evaluateDosMatch([botHand[i]], center);
        if (res) {
          candidates.push({ indices: [i], center, ...res });
        }
      }
      const doubles = [];
      for (let i = 0; i < botHand.length; i++) {
        for (let j = i + 1; j < botHand.length; j++) {
          const res = evaluateDosMatch([botHand[i], botHand[j]], center);
          if (res) {
            doubles.push({ indices: [i, j], center, ...res });
          }
        }
      }
      // Sort doubles so most valuable (color bonus, non-wild) appear first, cap at 22 per slot for speed
      doubles.sort((x, y) => {
        if (x.doubleColorBonus !== y.doubleColorBonus) return y.doubleColorBonus ? 1 : -1;
        const xWilds = x.indices.filter((idx) => botHand[idx].kind !== "number").length;
        const yWilds = y.indices.filter((idx) => botHand[idx].kind !== "number").length;
        return xWilds - yWilds;
      });
      candidates.push(...doubles.slice(0, 22));
      return candidates;
    });

    const plans = [];

    function backtrack(slotIdx, usedMask, chosen) {
      if (slotIdx === centerRow.length) {
        if (chosen.length > 0) {
          plans.push([...chosen]);
        }
        return;
      }

      // Option 1: skip this center slot
      backtrack(slotIdx + 1, usedMask, chosen);

      // Option 2: pick a candidate match for this center slot
      for (const cand of slotOptions[slotIdx]) {
        let conflict = false;
        let nextMask = usedMask;
        for (const idx of cand.indices) {
          const bit = 1 << idx;
          if (usedMask & bit) {
            conflict = true;
            break;
          }
          nextMask |= bit;
        }
        if (conflict) continue;
        chosen.push(cand);
        backtrack(slotIdx + 1, nextMask, chosen);
        chosen.pop();
      }
    }

    // If hand has > 28 cards, bitmask with 32-bit int would overflow; fallback to greedy
    if (botHand.length <= 28) {
      backtrack(0, 0, []);
    } else {
      const used = new Set();
      const greedy = [];
      for (let s = 0; s < centerRow.length; s++) {
        const valid = slotOptions[s].find((c) => c.indices.every((i) => !used.has(i)));
        if (valid) {
          valid.indices.forEach((i) => used.add(i));
          greedy.push(valid);
        }
      }
      if (greedy.length) plans.push(greedy);
    }

    if (plans.length === 0) return null;

    function scorePlan(plan) {
      let cardsPlayed = 0;
      let bonuses = 0;
      let doubleBonuses = 0;
      let pointsShed = 0;
      let wildsUsed = 0;

      for (const m of plan) {
        cardsPlayed += m.indices.length;
        if (m.colorBonus) bonuses += 1;
        if (m.doubleColorBonus) doubleBonuses += 1;
        for (const idx of m.indices) {
          const card = botHand[idx];
          pointsShed += cardPoints(card);
          if (card.kind !== "number") wildsUsed += 1;
        }
      }

      const cardsLeftAfterMatches = botHand.length - cardsPlayed;
      const effectiveCardsLeft = Math.max(0, cardsLeftAfterMatches - bonuses);

      let score = 0;
      if (effectiveCardsLeft === 0) score += 100000;
      if (effectiveCardsLeft === 2) score += 110;
      score += cardsPlayed * 100;
      score += bonuses * 95;
      score += doubleBonuses * 160;
      score += pointsShed * 1.5;

      // Smart/Ruthless save wilds unless needed for color bonus, double match, or win
      if (difficulty !== "casual") {
        score -= wildsUsed * 24;
      }
      if (difficulty === "ruthless" && state.humanHand.length <= 3) {
        score += doubleBonuses * 120; // Aggressively punish human near win
      }
      return score;
    }

    plans.sort((a, b) => scorePlan(b) - scorePlan(a));

    if (difficulty === "casual" && plans.length > 1) {
      const pickRange = Math.min(plans.length, 4);
      return plans[Math.floor(Math.random() * pickRange)];
    }
    return plans[0];
  }

  function pickBotBonusCard(botHand) {
    // Prefer shedding high-point regular number cards that don't easily pair
    const ranked = [...botHand].sort((a, b) => {
      const aWild = a.kind === "number" ? 0 : 1;
      const bWild = b.kind === "number" ? 0 : 1;
      if (aWild !== bWild) return aWild - bWild;
      return cardPoints(b) - cardPoints(a);
    });
    return ranked[0];
  }

  async function runDosBotTurn(token) {
    await sleep(650);
    if (token !== state.gameToken) return;

    let plan = findBestDosTurn(state.botHand, state.dos.centerRow, state.difficulty);

    if (!plan) {
      const drawn = drawCards(state.botHand, 1);
      if (drawn.length > 0) {
        state.botSaidShout = false;
        state.botVulnerableShout = false;
        sfx.draw();
        setLastAction("DOS-Bot couldn't match and drew 1 card.");
        render();
        await sleep(700);
        if (token !== state.gameToken) return;
        plan = findBestDosTurn(state.botHand, state.dos.centerRow, state.difficulty);
      }
    }

    if (!plan) {
      setLastAction("DOS-Bot had no match after drawing and ended its turn.");
      state.turn = "human";
      state.phase = "play";
      render();
      return;
    }

    // Collect actual card objects before mutating botHand
    const resolvedMatches = plan.map((m) => ({
      centerCard: m.center,
      playedCards: m.indices.map((i) => state.botHand[i]),
      colorBonus: m.colorBonus,
      doubleColorBonus: m.doubleColorBonus,
    }));

    const matchedCenterIds = new Set();
    let bonuses = 0;
    let doublePenalties = 0;

    for (const m of resolvedMatches) {
      if (token !== state.gameToken) return;
      for (const pc of m.playedCards) {
        const idx = state.botHand.findIndex((c) => c.id === pc.id);
        if (idx !== -1) state.botHand.splice(idx, 1);
      }
      matchedCenterIds.add(m.centerCard.id);
      if (m.colorBonus) bonuses += 1;
      if (m.doubleColorBonus) doublePenalties += 1;

      if (m.colorBonus) sfx.bonus();
      else sfx.play();

      const names = m.playedCards.map(cardShortName).join(" + ");
      setLastAction(`DOS-Bot matched ${names} onto ${cardShortName(m.centerCard)}!`);
      render();
      await sleep(620);
      if (token !== state.gameToken) return;
    }

    // Clear matched Center Row piles + played cards
    state.dos.centerRow = state.dos.centerRow.filter((c) => {
      if (matchedCenterIds.has(c.id)) {
        state.discardPile.push(c);
        return false;
      }
      return true;
    });
    for (const m of resolvedMatches) {
      state.discardPile.push(...m.playedCards);
    }

    // Apply Double Color Match penalty to human
    if (doublePenalties > 0) {
      drawCards(state.humanHand, doublePenalties);
      state.humanSaidShout = false;
      sfx.penalty();
      showToast(`Bot triggered Double Color Match! You draw +${doublePenalties}!`, "warn");
    }

    // Check immediate bot win before placing bonuses
    if (state.botHand.length === 0) {
      finishRound("bot");
      return;
    }

    // Refill Center Row to at least 2 cards
    const wildPromptsForHuman = [];
    while (state.dos.centerRow.length < 2) {
      const refilled = drawOneCard();
      if (!refilled) break;
      if (refilled.kind === "wildNum") {
        wildPromptsForHuman.push(refilled);
      }
      state.dos.centerRow.push(refilled);
    }

    // Place Bot's Color Match Bonus cards
    for (let b = 0; b < bonuses; b++) {
      if (state.botHand.length === 0) break;
      const bonusCard = pickBotBonusCard(state.botHand);
      const bIdx = state.botHand.findIndex((c) => c.id === bonusCard.id);
      state.botHand.splice(bIdx, 1);
      if (bonusCard.kind === "wildNum") {
        bonusCard.assignedValue = chooseBotWildNumValue(state.botHand);
      }
      state.dos.centerRow.push(bonusCard);
      sfx.play();
      setLastAction(`DOS-Bot placed Color Bonus card ${cardShortName(bonusCard)} into Center Row.`);
      render();
      await sleep(550);
      if (token !== state.gameToken) return;

      if (state.botHand.length === 0) {
        finishRound("bot");
        return;
      }
    }

    // Check Bot DOS call at 2 cards
    if (state.botHand.length === 2) {
      const shoutProb = state.difficulty === "casual" ? 0.55 : state.difficulty === "smart" ? 0.82 : 0.94;
      if (Math.random() < shoutProb) {
        state.botSaidShout = true;
        state.botVulnerableShout = false;
        sfx.shout();
        showToast("DOS-Bot shouted DOS!", "warn");
      } else {
        state.botSaidShout = false;
        state.botVulnerableShout = true;
      }
    } else {
      state.botSaidShout = false;
      state.botVulnerableShout = false;
    }

    // If a Wild # was flipped during refill for Human's turn, let Human choose its number
    for (const wc of wildPromptsForHuman) {
      if (token !== state.gameToken) return;
      state.turn = "human";
      await promptWildNumberForCenter(wc);
      if (token !== state.gameToken) return;
    }

    state.turn = "human";
    state.phase = "play";
    state.hasDrawnThisTurn = false;
    state.newlyDrawnCardId = null;
    render();
  }

  // --- Round End & Scoring ---
  function sumHandPoints(hand) {
    return hand.reduce((sum, c) => sum + cardPoints(c), 0);
  }

  function finishRound(winner) {
    state.phase = "roundOver";
    const loserHand = winner === "human" ? state.botHand : state.humanHand;
    const roundPoints = sumHandPoints(loserHand);

    if (winner === "human") {
      state.humanScore += roundPoints;
      sfx.win();
    } else {
      state.botScore += roundPoints;
      sfx.penalty();
    }

    const isMatchOver =
      state.matchGoal === "single" ||
      state.humanScore >= 200 ||
      state.botScore >= 200;

    dom.resultEmoji.innerHTML = winner === "human" ? ICONS.trophy : ICONS.robotLoss;
    if (isMatchOver) {
      dom.roundOverTitle.textContent = winner === "human" ? "You Won the Match!" : "Bot Won the Match!";
      dom.roundOverSubtitle.textContent =
        state.matchGoal === "single"
          ? `${winner === "human" ? "You" : "The Bot"} emptied ${winner === "human" ? "your" : "its"} hand first.`
          : `${winner === "human" ? "You" : "The Bot"} reached ${winner === "human" ? state.humanScore : state.botScore} points!`;
      dom.nextRoundBtn.textContent = "Play New Match";
    } else {
      dom.roundOverTitle.textContent = winner === "human" ? `You Won Round ${state.roundNumber}!` : `Bot Won Round ${state.roundNumber}!`;
      dom.roundOverSubtitle.textContent = `${winner === "human" ? "You" : "Bot"} scored +${roundPoints} points from opponent's remaining ${loserHand.length} card${loserHand.length === 1 ? "" : "s"}.`;
      dom.nextRoundBtn.textContent = `Start Round ${state.roundNumber + 1}`;
    }

    dom.scoreBreakdown.innerHTML = `
      <div class="score-row highlight">
        <span>Round Points Earned (${winner === "human" ? "You" : "Bot"})</span>
        <span>+${roundPoints} pts</span>
      </div>
      <div class="score-row">
        <span>Your Total Score</span>
        <span>${state.humanScore}${state.matchGoal === 200 ? " / 200" : ""}</span>
      </div>
      <div class="score-row">
        <span>Bot Total Score</span>
        <span>${state.botScore}${state.matchGoal === 200 ? " / 200" : ""}</span>
      </div>
    `;

    dom.roundOverModal.classList.remove("hidden");
    render();
  }

  // --- Rendering ---
  function render() {
    dom.botCardCount.textContent = String(state.botHand.length);
    dom.humanCardCount.textContent = String(state.humanHand.length);
    dom.botTotalScore.textContent = String(state.botScore);
    dom.humanTotalScore.textContent = String(state.humanScore);

    const goalText = state.matchGoal === 200 ? "/200" : "";
    dom.goalSuffixBot.textContent = goalText;
    dom.goalSuffixHuman.textContent = goalText;

    const isHumanTurn = state.turn === "human" && state.phase !== "roundOver" && state.phase !== "bot";
    dom.humanScorePill.classList.toggle("active-turn", isHumanTurn);
    dom.botScorePill.classList.toggle("active-turn", state.turn === "bot" || state.phase === "bot");
    dom.humanTurnChip.classList.toggle("hidden", !isHumanTurn);
    dom.botTurnChip.classList.toggle("hidden", !(state.turn === "bot" || state.phase === "bot"));

    if (state.phase === "roundOver") {
      dom.turnBanner.textContent = "Round Complete";
    } else if (state.shoutGraceActive) {
      dom.turnBanner.textContent = "Call DOS! Now!";
    } else if (state.phase === "placeBonus") {
      dom.turnBanner.textContent = `Color Bonus (${state.dos.bonusesRemaining} left)`;
    } else if (state.turn === "human") {
      dom.turnBanner.textContent = "Your Turn";
    } else {
      dom.turnBanner.textContent = "Bot's Turn...";
    }

    // Bot Hand & Alerts
    dom.botHand.innerHTML = "";
    state.botHand.forEach(() => {
      const back = document.createElement("div");
      back.className = "card card-back";
      const inner = document.createElement("div");
      inner.className = "card-back-inner";
      const logo = document.createElement("span");
      logo.className = "back-logo";
      logo.textContent = "DOS";
      inner.appendChild(logo);
      back.appendChild(inner);
      dom.botHand.appendChild(back);
    });

    dom.botShoutBadge.classList.toggle("hidden", !state.botSaidShout);
    dom.catchBotBtn.classList.toggle("hidden", !state.botVulnerableShout);

    // Draw Pile
    dom.drawCountBadge.textContent = String(state.drawPile.length);
    const shouldPulseDraw =
      isHumanTurn &&
      state.phase === "play" &&
      !state.hasDrawnThisTurn &&
      state.dos.stagedMatches.length === 0 &&
      !hasAnyDosMatch(state.humanHand, state.dos.centerRow);
    dom.drawPileBtn.classList.toggle("pulse-hint", shouldPulseDraw);
    dom.drawPileHint.textContent = state.hasDrawnThisTurn ? "Already drew" : "Click to draw";

    // Center Row
    dom.centerRow.innerHTML = "";
    const selectedCards = state.selectedIds
      .map((id) => state.humanHand.find((c) => c.id === id))
      .filter(Boolean);

    state.dos.centerRow.forEach((centerCard) => {
      const slot = document.createElement("div");
      slot.className = "center-slot";

      const staged = state.dos.stagedMatches.find((m) => m.centerId === centerCard.id);
      const evalResult = !staged && isHumanTurn && state.phase === "play"
        ? evaluateDosMatch(selectedCards, centerCard)
        : null;

      const btn = document.createElement("button");
      btn.className = "center-card-btn";
      if (evalResult) {
        btn.classList.add("targetable");
        if (evalResult.colorBonus) btn.classList.add("bonus-target");
        btn.addEventListener("click", () => stageDosMatch(centerCard.id));
      }

      const cardEl = createCardElement(centerCard);
      btn.appendChild(cardEl);

      if (staged) {
        const overlay = document.createElement("div");
        overlay.className = "staged-overlay";
        overlay.innerHTML = `
          <span class="check-icon">${ICONS.stagedCheck}</span>
          <span class="staged-cards-text">${staged.playedCards.map(cardShortName).join("<br>+ ")}</span>
        `;
        btn.appendChild(overlay);
      }

      slot.appendChild(btn);

      const tag = document.createElement("span");
      tag.className = "match-tag";
      if (staged) {
        tag.classList.add("matched");
        tag.textContent = staged.doubleColorBonus
          ? "Double Color"
          : staged.colorBonus
          ? "Color Bonus"
          : "Matched";
      } else if (evalResult) {
        if (evalResult.doubleColorBonus) {
          tag.classList.add("color-bonus");
          tag.textContent = "Double Color! (+1 Center, Bot +1)";
        } else if (evalResult.colorBonus) {
          tag.classList.add("color-bonus");
          tag.textContent = "Color Bonus! (+1 Center)";
        } else {
          tag.classList.add("valid");
          tag.textContent = evalResult.matchType === "double" ? "Double Match" : "Single Match";
        }
      } else {
        const tv = getDosTargetValue(centerCard);
        tag.textContent = tv !== null ? `Target: ${tv}` : "Any #";
      }
      slot.appendChild(tag);

      dom.centerRow.appendChild(slot);
    });

    // Action Bar
    dom.bonusBanner.classList.toggle("hidden", state.phase !== "placeBonus");
    if (state.phase === "placeBonus") {
      dom.bonusBanner.innerHTML = `${ICONS.sparkle} Color Match Bonus! Click ${state.dos.bonusesRemaining} card${state.dos.bonusesRemaining > 1 ? "s" : ""} in your hand to add to the Center Row.`;
    }

    dom.clearSelectionBtn.classList.toggle("hidden", state.selectedIds.length === 0);
    dom.undoStageBtn.classList.toggle("hidden", !(isHumanTurn && state.phase === "play" && state.dos.stagedMatches.length > 0));

    if (state.phase === "placeBonus") {
      dom.selectionSummary.textContent = `Bonus: Pick ${state.dos.bonusesRemaining} card${state.dos.bonusesRemaining > 1 ? "s" : ""} from your hand to place in the Center Row.`;
    } else if (state.selectedIds.length > 0) {
      const picked = state.selectedIds
        .map((id) => state.humanHand.find((c) => c.id === id))
        .filter(Boolean);
      const sumHint =
        picked.length === 2 && picked.every((c) => c.value !== null)
          ? ` (Sum = ${picked[0].value + picked[1].value})`
          : "";
      dom.selectionSummary.textContent = `Selected: ${picked.map(cardShortName).join(" + ")}${sumHint} — click a glowing Center pile.`;
    } else if (state.dos.stagedMatches.length > 0) {
      dom.selectionSummary.textContent = `Matched ${state.dos.stagedMatches.length} pile${state.dos.stagedMatches.length > 1 ? "s" : ""}. Match another pile or click End Turn.`;
    } else if (state.hasDrawnThisTurn) {
      dom.selectionSummary.textContent = "Card drawn! Make a match or click End Turn.";
    } else {
      dom.selectionSummary.textContent = "Select 1 card (Single Match) or 2 cards (Sum Match), then click a Center pile.";
    }

    const canEndDosTurn =
      isHumanTurn &&
      state.phase === "play" &&
      (state.dos.stagedMatches.length > 0 || state.hasDrawnThisTurn);
    dom.endTurnBtn.disabled = !canEndDosTurn;

    // Shout Button (DOS!)
    const canShout =
      !state.humanSaidShout &&
      (state.humanHand.length === 2 ||
        (isHumanTurn && state.humanHand.length === 3));

    dom.shoutDosBtn.innerHTML = state.humanSaidShout ? `${ICONS.check} DOS!` : "DOS!";
    dom.shoutDosBtn.disabled = !canShout;
    dom.shoutDosBtn.classList.toggle("ready", canShout);
    dom.shoutDosBtn.classList.toggle("called", state.humanSaidShout);

    // Player Hand
    dom.playerHand.innerHTML = "";
    state.humanHand.forEach((card) => {
      const isSelected = state.selectedIds.includes(card.id);
      const isDimmed = state.phase === "bot" || state.phase === "roundOver";

      const el = createCardElement(card, {
        selected: isSelected,
        dimmed: isDimmed,
        isNew: card.id === state.newlyDrawnCardId,
      });

      el.addEventListener("click", () => {
        toggleHumanCardSelection(card.id);
      });

      dom.playerHand.appendChild(el);
    });
  }

  // --- Event Wiring ---
  dom.difficultySelect.addEventListener("change", (e) => {
    state.difficulty = e.target.value;
    showToast(`Bot difficulty set to ${e.target.options[e.target.selectedIndex].text}`);
  });

  dom.matchGoalSelect.addEventListener("change", (e) => {
    state.matchGoal = e.target.value === "200" ? 200 : "single";
    startNewMatch();
  });

  // --- Background Theme Switcher ---
  function parseColorToHex(str) {
    if (!str) return null;
    let s = str.trim();
    if (s.startsWith("#")) s = s.slice(1);
    if (/^[0-9a-fA-F]{3}$/.test(s)) {
      return "#" + s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
    }
    if (/^[0-9a-fA-F]{6}$/.test(s)) {
      return "#" + s;
    }
    try {
      const d = document.createElement("div");
      d.style.color = "rgb(0, 0, 0)";
      d.style.color = str.trim();
      if (d.style.color && (d.style.color !== "rgb(0, 0, 0)" || str.trim().toLowerCase() === "black")) {
        document.body.appendChild(d);
        const comp = getComputedStyle(d).color;
        document.body.removeChild(d);
        const m = comp.match(/\d+/g);
        if (m && m.length >= 3) {
          const r = parseInt(m[0], 10).toString(16).padStart(2, "0");
          const g = parseInt(m[1], 10).toString(16).padStart(2, "0");
          const b = parseInt(m[2], 10).toString(16).padStart(2, "0");
          return `#${r}${g}${b}`;
        }
      }
    } catch (_) {}
    return null;
  }

  function hexToRgb(hex) {
    const clean = hex.replace("#", "");
    if (clean.length === 3) {
      return {
        r: parseInt(clean[0] + clean[0], 16),
        g: parseInt(clean[1] + clean[1], 16),
        b: parseInt(clean[2] + clean[2], 16),
      };
    }
    if (clean.length === 6) {
      return {
        r: parseInt(clean.substring(0, 2), 16),
        g: parseInt(clean.substring(2, 4), 16),
        b: parseInt(clean.substring(4, 6), 16),
      };
    }
    return null;
  }

  function applyBgTheme(theme, customHex = null) {
    if (theme === "custom" && customHex) {
      document.body.removeAttribute("data-theme");
      const c = hexToRgb(customHex);
      if (c) {
        const center = `rgb(${Math.min(255, Math.round(c.r * 1.25))}, ${Math.min(255, Math.round(c.g * 1.25))}, ${Math.min(255, Math.round(c.b * 1.25))})`;
        const edge = `rgb(${Math.round(c.r * 0.4)}, ${Math.round(c.g * 0.4)}, ${Math.round(c.b * 0.4)})`;
        const deep = `rgb(${Math.round(c.r * 0.15)}, ${Math.round(c.g * 0.15)}, ${Math.round(c.b * 0.15)})`;
        const panel = `rgba(${Math.round(c.r * 0.25)}, ${Math.round(c.g * 0.25)}, ${Math.round(c.b * 0.25)}, 0.85)`;
        const zone = `rgba(${Math.round(c.r * 0.18)}, ${Math.round(c.g * 0.18)}, ${Math.round(c.b * 0.18)}, 0.48)`;

        document.body.style.setProperty("--felt-center", center);
        document.body.style.setProperty("--felt-edge", edge);
        document.body.style.setProperty("--bg-deep", deep);
        document.body.style.setProperty("--panel-bg", panel);
        document.body.style.setProperty("--zone-bg", zone);
        document.body.style.setProperty("--center-zone-bg", `radial-gradient(circle at 50% 45%, ${center}, ${edge})`);

        const btnLighter = `rgb(${Math.min(255, Math.round(c.r * 1.35 + 30))}, ${Math.min(255, Math.round(c.g * 1.35 + 30))}, ${Math.min(255, Math.round(c.b * 1.35 + 30))})`;
        const btnBase = `rgb(${Math.min(255, Math.round(c.r * 1.05))}, ${Math.min(255, Math.round(c.g * 1.05))}, ${Math.min(255, Math.round(c.b * 1.05))})`;
        const lum = (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) / 255;
        const btnText = lum > 0.58 ? "#09101d" : "#ffffff";
        const btnShadow = `0 4px 16px rgba(${c.r}, ${c.g}, ${c.b}, 0.45)`;
        const btnBorder = `rgba(${Math.min(255, c.r + 60)}, ${Math.min(255, c.g + 60)}, ${Math.min(255, c.b + 60)}, 0.45)`;

        document.body.style.setProperty("--btn-primary-bg", `linear-gradient(135deg, ${btnLighter}, ${btnBase})`);
        document.body.style.setProperty("--btn-primary-text", btnText);
        document.body.style.setProperty("--btn-primary-shadow", btnShadow);
        document.body.style.setProperty("--btn-primary-border", btnBorder);

        const ddBg = `rgba(${Math.round(c.r * 0.2)}, ${Math.round(c.g * 0.2)}, ${Math.round(c.b * 0.2)}, 0.95)`;
        const ddBorder = `rgba(${Math.min(255, c.r + 65)}, ${Math.min(255, c.g + 65)}, ${Math.min(255, c.b + 65)}, 0.45)`;
        const ddAccent = `rgb(${Math.min(255, c.r + 80)}, ${Math.min(255, c.g + 80)}, ${Math.min(255, c.b + 80)})`;
        const ddHover = `rgba(${c.r}, ${c.g}, ${c.b}, 0.22)`;
        const ddActive = `rgba(${c.r}, ${c.g}, ${c.b}, 0.38)`;
        const ddShadow = `0 14px 34px rgba(${Math.round(c.r * 0.12)}, ${Math.round(c.g * 0.12)}, ${Math.round(c.b * 0.12)}, 0.8)`;
        const ddTriggerBg = `rgba(${Math.round(c.r * 0.25)}, ${Math.round(c.g * 0.25)}, ${Math.round(c.b * 0.25)}, 0.78)`;
        const ddTriggerHover = `rgba(${c.r}, ${c.g}, ${c.b}, 0.18)`;
        const ddFocus = `rgba(${Math.min(255, c.r + 60)}, ${Math.min(255, c.g + 60)}, ${Math.min(255, c.b + 60)}, 0.35)`;

        document.body.style.setProperty("--dropdown-bg", ddBg);
        document.body.style.setProperty("--dropdown-border", ddBorder);
        document.body.style.setProperty("--dropdown-text", "#ffffff");
        document.body.style.setProperty("--dropdown-accent", ddAccent);
        document.body.style.setProperty("--dropdown-item-hover", ddHover);
        document.body.style.setProperty("--dropdown-item-active", ddActive);
        document.body.style.setProperty("--dropdown-shadow", ddShadow);
        document.body.style.setProperty("--dropdown-trigger-bg", ddTriggerBg);
        document.body.style.setProperty("--dropdown-trigger-hover-bg", ddTriggerHover);
        document.body.style.setProperty("--dropdown-focus-ring", ddFocus);

        const customDot = document.querySelector('.custom-select-option[data-value="custom"] .theme-swatch-dot');
        if (customDot) customDot.style.background = customHex;
      }
    } else {
      document.body.style.removeProperty("--felt-center");
      document.body.style.removeProperty("--felt-edge");
      document.body.style.removeProperty("--bg-deep");
      document.body.style.removeProperty("--panel-bg");
      document.body.style.removeProperty("--zone-bg");
      document.body.style.removeProperty("--center-zone-bg");
      document.body.style.removeProperty("--btn-primary-bg");
      document.body.style.removeProperty("--btn-primary-text");
      document.body.style.removeProperty("--btn-primary-shadow");
      document.body.style.removeProperty("--btn-primary-border");
      document.body.style.removeProperty("--dropdown-bg");
      document.body.style.removeProperty("--dropdown-border");
      document.body.style.removeProperty("--dropdown-text");
      document.body.style.removeProperty("--dropdown-accent");
      document.body.style.removeProperty("--dropdown-item-hover");
      document.body.style.removeProperty("--dropdown-item-active");
      document.body.style.removeProperty("--dropdown-shadow");
      document.body.style.removeProperty("--dropdown-trigger-bg");
      document.body.style.removeProperty("--dropdown-trigger-hover-bg");
      document.body.style.removeProperty("--dropdown-focus-ring");
      document.body.setAttribute("data-theme", theme);
    }

    try {
      localStorage.setItem("dos_bg_theme", theme);
      if (customHex) localStorage.setItem("dos_custom_color", customHex);
    } catch (_) {}
  }

  if (dom.bgThemeSelect) {
    dom.bgThemeSelect.addEventListener("change", (e) => {
      const val = e.target.value;
      if (val === "custom") {
        if (dom.customColorBox) dom.customColorBox.classList.remove("hidden");
        const currentRaw = dom.customColorText?.value || dom.customColorInput?.value || "#0f3b2e";
        const parsed = parseColorToHex(currentRaw) || "#0f3b2e";
        if (dom.customColorInput) dom.customColorInput.value = parsed;
        if (dom.customColorText) {
          dom.customColorText.value = parsed.toUpperCase();
          setTimeout(() => {
            dom.customColorText.focus();
            dom.customColorText.select();
          }, 60);
        }
        applyBgTheme("custom", parsed);
      } else {
        if (dom.customColorBox) dom.customColorBox.classList.add("hidden");
        applyBgTheme(val);
        showToast(`Table color set to ${e.target.options[e.target.selectedIndex].text}`);
      }
    });
  }

  if (dom.customColorInput) {
    dom.customColorInput.addEventListener("input", (e) => {
      const hex = e.target.value;
      if (dom.customColorText) {
        dom.customColorText.value = hex.toUpperCase();
        dom.customColorText.classList.remove("invalid");
      }
      applyBgTheme("custom", hex);
    });
    dom.customColorInput.addEventListener("change", (e) => {
      const hex = e.target.value;
      if (dom.customColorText) {
        dom.customColorText.value = hex.toUpperCase();
        dom.customColorText.classList.remove("invalid");
      }
      applyBgTheme("custom", hex);
      showToast(`Custom color applied: ${hex.toUpperCase()}`);
    });
  }

  if (dom.customColorText) {
    const handleCustomTextInput = (isFinal = false) => {
      const raw = dom.customColorText.value;
      const parsed = parseColorToHex(raw);
      if (parsed) {
        dom.customColorText.classList.remove("invalid");
        if (dom.customColorInput) dom.customColorInput.value = parsed;
        applyBgTheme("custom", parsed);
        if (isFinal) {
          dom.customColorText.value = parsed.toUpperCase();
          showToast(`Custom color code applied: ${parsed.toUpperCase()}`);
        }
      } else {
        if (isFinal && raw.trim().length > 0) {
          dom.customColorText.classList.add("invalid");
          showToast("Invalid color code. Try e.g. #0F3B2E or #2563EB", "warn");
        }
      }
    };

    dom.customColorText.addEventListener("input", () => handleCustomTextInput(false));
    dom.customColorText.addEventListener("change", () => handleCustomTextInput(true));
    dom.customColorText.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleCustomTextInput(true);
      }
    });
  }

  // Restore saved theme on startup
  try {
    const savedTheme = localStorage.getItem("dos_bg_theme");
    const savedCustom = localStorage.getItem("dos_custom_color");
    if (savedTheme) {
      if (dom.bgThemeSelect) dom.bgThemeSelect.value = savedTheme;
      if (savedTheme === "custom" && savedCustom) {
        if (dom.customColorBox) dom.customColorBox.classList.remove("hidden");
        const parsed = parseColorToHex(savedCustom) || "#0f3b2e";
        if (dom.customColorInput) dom.customColorInput.value = parsed;
        if (dom.customColorText) dom.customColorText.value = parsed.toUpperCase();
        applyBgTheme("custom", parsed);
      } else {
        if (dom.customColorBox) dom.customColorBox.classList.add("hidden");
        applyBgTheme(savedTheme);
      }
    } else {
      applyBgTheme("emerald");
    }
  } catch (_) {
    applyBgTheme("emerald");
  }

  dom.soundToggleBtn.addEventListener("click", () => {
    sfx.enabled = !sfx.enabled;
    dom.soundToggleBtn.innerHTML = sfx.enabled ? ICONS.soundOn : ICONS.soundOff;
    dom.soundToggleBtn.setAttribute("aria-pressed", String(sfx.enabled));
    if (sfx.enabled) sfx.click();
  });

  dom.newGameBtn.addEventListener("click", () => {
    sfx.click();
    dom.roundOverModal.classList.add("hidden");
    dom.wildNumModal.classList.add("hidden");
    startNewMatch();
  });

  dom.drawPileBtn.addEventListener("click", handleHumanDrawClick);
  dom.endTurnBtn.addEventListener("click", endDosHumanTurn);

  dom.undoStageBtn.addEventListener("click", undoLastStagedMatch);
  dom.shoutDosBtn.addEventListener("click", handleHumanShout);
  dom.catchBotBtn.addEventListener("click", handleCatchBot);

  dom.clearSelectionBtn.addEventListener("click", () => {
    state.selectedIds = [];
    sfx.click();
    render();
  });

  dom.sortHandBtn.addEventListener("click", () => {
    sortHand(state.humanHand);
    sfx.click();
    render();
  });

  // Next Round / New Match Modal
  dom.nextRoundBtn.addEventListener("click", () => {
    dom.roundOverModal.classList.add("hidden");
    sfx.click();
    const isMatchOver =
      state.matchGoal === "single" ||
      state.humanScore >= 200 ||
      state.botScore >= 200;
    if (isMatchOver) {
      startNewMatch();
    } else {
      state.roundNumber += 1;
      startRound();
    }
  });

  // Rules Modal
  dom.rulesBtn.addEventListener("click", () => {
    sfx.click();
    dom.rulesModal.classList.remove("hidden");
  });

  dom.closeRulesBtn.addEventListener("click", () => {
    dom.rulesModal.classList.add("hidden");
  });

  dom.rulesModal.addEventListener("click", (e) => {
    if (e.target === dom.rulesModal) dom.rulesModal.classList.add("hidden");
  });

  // Custom Dropdowns matching Theme
  const THEME_SWATCHES = {
    emerald: "#10b981",
    "liquid-glass": "linear-gradient(135deg, #38bdf8, #818cf8)",
    midnight: "#3b82f6",
    crimson: "#f43f5e",
    amethyst: "#a855f7",
    charcoal: "#94a3b8",
    amber: "#f59e0b",
    ocean: "#06b6d4",
    "pitch-black": "#0e0e0e",
    custom: "conic-gradient(#f43f5e, #eab308, #22c55e, #3b82f6, #a855f7)",
  };

  const CHEVRON_SVG = `<svg class="custom-select-chevron" viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"></polyline></svg>`;

  function closeAllDropdowns(exceptWrap = null) {
    document.querySelectorAll(".select-wrap.open").forEach((wrap) => {
      if (wrap !== exceptWrap) {
        wrap.classList.remove("open");
        const dd = wrap.querySelector(".custom-select-dropdown");
        if (dd) dd.classList.add("hidden");
        const tr = wrap.querySelector(".custom-select-trigger");
        if (tr) tr.setAttribute("aria-expanded", "false");
      }
    });
  }

  function initCustomSelects() {
    const selectWraps = document.querySelectorAll(".select-wrap");

    selectWraps.forEach((wrap) => {
      const select = wrap.querySelector("select");
      if (!select || wrap.dataset.customSelectInit === "true") return;
      wrap.dataset.customSelectInit = "true";

      // Hide native select visually while keeping it functional for change events
      select.classList.add("custom-select-hidden");
      select.setAttribute("tabindex", "-1");
      select.setAttribute("aria-hidden", "true");

      const isThemeSelect = select.id === "bgThemeSelect";

      // Trigger button
      const trigger = document.createElement("button");
      trigger.type = "button";
      trigger.className = "custom-select-trigger";
      trigger.setAttribute("aria-haspopup", "listbox");
      trigger.setAttribute("aria-expanded", "false");
      trigger.setAttribute(
        "aria-label",
        select.getAttribute("aria-label") || wrap.getAttribute("title") || "Select option"
      );

      const valueSpan = document.createElement("span");
      valueSpan.className = "custom-select-value";
      const initialText = select.options[select.selectedIndex]?.text || "";
      valueSpan.textContent = initialText;

      trigger.appendChild(valueSpan);
      trigger.insertAdjacentHTML("beforeend", CHEVRON_SVG);

      wrap.insertBefore(trigger, select.nextSibling);

      // Dropdown menu
      const dropdown = document.createElement("div");
      dropdown.className = "custom-select-dropdown hidden";
      dropdown.setAttribute("role", "listbox");

      function buildOptions() {
        dropdown.innerHTML = "";
        Array.from(select.options).forEach((opt, idx) => {
          const isSelected = idx === select.selectedIndex;
          const optEl = document.createElement("div");
          optEl.className = `custom-select-option ${isSelected ? "selected" : ""}`;
          optEl.setAttribute("role", "option");
          optEl.setAttribute("data-value", opt.value);
          optEl.setAttribute("aria-selected", String(isSelected));

          if (isThemeSelect && THEME_SWATCHES[opt.value]) {
            const dot = document.createElement("span");
            dot.className = "theme-swatch-dot";
            dot.style.background = THEME_SWATCHES[opt.value];
            optEl.appendChild(dot);
          }

          const label = document.createElement("span");
          label.className = "opt-label";
          label.textContent = opt.text;
          optEl.appendChild(label);

          const check = document.createElement("span");
          check.className = "opt-check";
          check.innerHTML = isSelected ? ICONS.check : "";
          optEl.appendChild(check);

          optEl.addEventListener("click", (e) => {
            e.stopPropagation();
            if (select.value !== opt.value) {
              select.value = opt.value;
              select.dispatchEvent(new Event("change", { bubbles: true }));
            }
            closeMenu();
            if (opt.value !== "custom") {
              trigger.focus();
            }
            if (sfx.enabled) sfx.click();
          });

          dropdown.appendChild(optEl);
        });
      }

      buildOptions();
      wrap.appendChild(dropdown);

      function openMenu() {
        closeAllDropdowns(wrap);
        wrap.classList.add("open");
        dropdown.classList.remove("hidden");
        trigger.setAttribute("aria-expanded", "true");

        // Align if overflowing right viewport boundary
        dropdown.style.left = "0";
        dropdown.style.right = "auto";
        const rect = dropdown.getBoundingClientRect();
        if (rect.right > window.innerWidth - 12) {
          dropdown.style.left = "auto";
          dropdown.style.right = "0";
        }
      }

      function closeMenu() {
        wrap.classList.remove("open");
        dropdown.classList.add("hidden");
        trigger.setAttribute("aria-expanded", "false");
      }

      trigger.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (wrap.classList.contains("open")) {
          closeMenu();
        } else {
          openMenu();
        }
      });

      wrap.addEventListener("click", (e) => {
        if (e.target.closest(".custom-select-dropdown")) return;
        if (e.target !== trigger && !trigger.contains(e.target)) {
          e.preventDefault();
          trigger.click();
        }
      });

      // Synchronize trigger text & options when native select changes
      select.addEventListener("change", () => {
        const curOpt = select.options[select.selectedIndex];
        if (curOpt) {
          valueSpan.textContent = curOpt.text;
        }
        dropdown.querySelectorAll(".custom-select-option").forEach((optEl) => {
          const isSelected = optEl.getAttribute("data-value") === select.value;
          optEl.classList.toggle("selected", isSelected);
          optEl.setAttribute("aria-selected", String(isSelected));
          const check = optEl.querySelector(".opt-check");
          if (check) check.innerHTML = isSelected ? ICONS.check : "";
        });
      });

      // Keyboard navigation
      trigger.addEventListener("keydown", (e) => {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          if (!wrap.classList.contains("open")) {
            openMenu();
            return;
          }
          const options = Array.from(dropdown.querySelectorAll(".custom-select-option"));
          let curIdx = options.findIndex(
            (o) => o.classList.contains("selected") || o.classList.contains("highlighted")
          );
          if (e.key === "ArrowDown") {
            curIdx = (curIdx + 1) % options.length;
          } else {
            curIdx = (curIdx - 1 + options.length) % options.length;
          }
          options.forEach((o, i) => o.classList.toggle("highlighted", i === curIdx));
          options[curIdx]?.scrollIntoView({ block: "nearest" });
        } else if (e.key === "Enter" || e.key === " ") {
          if (wrap.classList.contains("open")) {
            const highlighted =
              dropdown.querySelector(".custom-select-option.highlighted") ||
              dropdown.querySelector(".custom-select-option.selected");
            if (highlighted) {
              e.preventDefault();
              highlighted.click();
            }
          }
        }
      });
    });

    document.addEventListener("click", (e) => {
      if (!e.target.closest(".select-wrap")) {
        closeAllDropdowns();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeAllDropdowns();
      }
    });
  }

  // Boot Game
  if (dom.difficultySelect) {
    dom.difficultySelect.value = state.difficulty;
  }
  initCustomSelects();
  startNewMatch();
})();
