import { useState, useCallback, useMemo, useEffect } from "react";

const BOARD_SIZE = 5;
const MAX_HEIGHT = 5;

const COL_COLORS = [
  { name: 'A', bg: '#ff4d4d', border: '#cc3333', text: '#fff', light: 'rgba(255,77,77,0.15)', glow: 'rgba(255,77,77,0.4)' },
  { name: 'B', bg: '#ffcc00', border: '#cca300', text: '#000', light: 'rgba(255,204,0,0.15)', glow: 'rgba(255,204,0,0.4)' },
  { name: 'C', bg: '#33cc33', border: '#269926', text: '#fff', light: 'rgba(51,204,51,0.15)', glow: 'rgba(51,204,51,0.4)' },
  { name: 'D', bg: '#3399ff', border: '#2677cc', text: '#fff', light: 'rgba(51,153,255,0.15)', glow: 'rgba(51,153,255,0.4)' },
  { name: 'E', bg: '#b366ff', border: '#8a3fcc', text: '#fff', light: 'rgba(179,102,255,0.15)', glow: 'rgba(179,102,255,0.4)' },
];

const getWinningLines = () => {
  const lines = [];
  for (let x = 0; x < BOARD_SIZE; x++) {
    for (let y = 0; y < BOARD_SIZE; y++) {
      for (let z = 0; z < MAX_HEIGHT; z++) {
        if (x + 3 < BOARD_SIZE) lines.push([[x,y,z],[x+1,y,z],[x+2,y,z],[x+3,y,z]]);
        if (y + 3 < BOARD_SIZE) lines.push([[x,y,z],[x,y+1,z],[x,y+2,z],[x,y+3,z]]);
        if (z + 3 < MAX_HEIGHT) lines.push([[x,y,z],[x,y,z+1],[x,y,z+2],[x,y,z+3]]);
        if (x + 3 < BOARD_SIZE && y + 3 < BOARD_SIZE) lines.push([[x,y,z],[x+1,y+1,z],[x+2,y+2,z],[x+3,y+3,z]]);
        if (x + 3 < BOARD_SIZE && y - 3 >= 0) lines.push([[x,y,z],[x+1,y-1,z],[x+2,y-2,z],[x+3,y-3,z]]);
        if (x + 3 < BOARD_SIZE && z + 3 < MAX_HEIGHT) lines.push([[x,y,z],[x+1,y,z+1],[x+2,y,z+2],[x+3,y,z+3]]);
        if (x + 3 < BOARD_SIZE && z - 3 >= 0) lines.push([[x,y,z],[x+1,y,z-1],[x+2,y,z-2],[x+3,y,z-3]]);
        if (y + 3 < BOARD_SIZE && z + 3 < MAX_HEIGHT) lines.push([[x,y,z],[x,y+1,z+1],[x,y+2,z+2],[x,y+3,z+3]]);
        if (y + 3 < BOARD_SIZE && z - 3 >= 0) lines.push([[x,y,z],[x,y+1,z-1],[x,y+2,z-2],[x,y+3,z-3]]);
        if (x+3 < BOARD_SIZE && y+3 < BOARD_SIZE && z+3 < MAX_HEIGHT) lines.push([[x,y,z],[x+1,y+1,z+1],[x+2,y+2,z+2],[x+3,y+3,z+3]]);
        if (x+3 < BOARD_SIZE && y-3 >= 0 && z+3 < MAX_HEIGHT) lines.push([[x,y,z],[x+1,y-1,z+1],[x+2,y-2,z+2],[x+3,y-3,z+3]]);
        if (x+3 < BOARD_SIZE && y+3 < BOARD_SIZE && z-3 >= 0) lines.push([[x,y,z],[x+1,y+1,z-1],[x+2,y+2,z-2],[x+3,y+3,z-3]]);
        if (x+3 < BOARD_SIZE && y-3 >= 0 && z-3 >= 0) lines.push([[x,y,z],[x+1,y-1,z-1],[x+2,y-2,z-2],[x+3,y-3,z-3]]);
      }
    }
  }
  return lines;
};

const ALL_LINES = getWinningLines();

function checkWinner(board) {
  for (const line of ALL_LINES) {
    const first = board[line[0][0]][line[0][1]][line[0][2]];
    if (!first) continue;
    if (line.every(([x,y,z]) => board[x][y][z] === first)) {
      return { winner: first, line };
    }
  }
  return null;
}

function countThreats(board, player) {
  // Count immediate winning threats (3-in-a-row with 1 playable empty)
  let threats = 0;
  for (const line of ALL_LINES) {
    let pCount = 0, empty = 0, oCount = 0, playableEmpty = 0;
    for (const [x, y, z] of line) {
      const cell = board[x][y][z];
      if (cell === player) pCount++;
      else if (cell === null) {
        empty++;
        if (z === 0 || board[x][y][z-1] !== null) playableEmpty++;
      } else oCount++;
    }
    if (pCount === 3 && empty === 1 && oCount === 0 && playableEmpty === 1) threats++;
  }
  return threats;
}

function evaluateBoard(board, player) {
  const opponent = player === 'W' ? 'B' : 'W';
  let score = 0;

  // Track threats for fork detection
  let playerThreats = 0;   // playable 3-in-a-row
  let opponentThreats = 0;
  let playerNearThreats = 0; // 3-in-a-row not yet playable but one move away
  let opponentNearThreats = 0;

  for (const line of ALL_LINES) {
    let pCount = 0, oCount = 0, empty = 0, playable = true, playableCount = 0;
    for (const [x, y, z] of line) {
      const cell = board[x][y][z];
      if (cell === player) pCount++;
      else if (cell === opponent) oCount++;
      else {
        empty++;
        if (z > 0 && board[x][y][z-1] === null) playable = false;
        else playableCount++;
      }
    }
    if (pCount > 0 && oCount > 0) continue; // blocked line, skip

    if (pCount === 4) return 100000;
    if (oCount === 4) return -100000;

    // Threat tracking for forks
    if (pCount === 3 && empty === 1) {
      if (playableCount === 1) { playerThreats++; score += 600; }
      else { playerNearThreats++; score += 150; }
    }
    if (oCount === 3 && empty === 1) {
      if (playableCount === 1) { opponentThreats++; score -= 550; }
      else { opponentNearThreats++; score -= 130; }
    }

    // 2-in-a-row with room to grow
    if (pCount === 2 && empty === 2 && oCount === 0) {
      score += playableCount >= 1 ? 35 : 15;
    }
    if (oCount === 2 && empty === 2 && pCount === 0) {
      score -= playableCount >= 1 ? 28 : 12;
    }

    // Seeds: 1-in-a-row on open lines
    if (pCount === 1 && empty === 3 && oCount === 0) score += 4;
    if (oCount === 1 && empty === 3 && pCount === 0) score -= 3;
  }

  // FORK BONUS: multiple simultaneous threats = exponentially better
  if (playerThreats >= 2) score += 8000; // unstoppable fork
  else if (playerThreats === 1 && playerNearThreats >= 1) score += 2000; // near-fork
  if (opponentThreats >= 2) score -= 7500;
  else if (opponentThreats === 1 && opponentNearThreats >= 1) score -= 1800;

  // Center control with height bonus
  const cx = 2, cy = 2;
  for (let x = 0; x < BOARD_SIZE; x++) for (let y = 0; y < BOARD_SIZE; y++) for (let z = 0; z < MAX_HEIGHT; z++) {
    const cell = board[x][y][z];
    if (!cell) continue;
    const centerDist = Math.abs(x - cx) + Math.abs(y - cy);
    const centerBonus = Math.max(0, 5 - centerDist);
    // Lower positions are more valuable (control the base)
    const heightBonus = Math.max(0, 3 - z);
    if (cell === player) score += centerBonus * 3 + heightBonus * 2;
    else score -= centerBonus * 2 + heightBonus;
  }

  return score;
}

function getValidMoves(board) {
  const moves = [];
  for (let x = 0; x < BOARD_SIZE; x++) for (let y = 0; y < BOARD_SIZE; y++) {
    let z = 0;
    while (z < MAX_HEIGHT && board[x][y][z] !== null) z++;
    if (z < MAX_HEIGHT) moves.push([x, y, z]);
  }
  return moves;
}

// Iterative deepening minimax with alpha-beta pruning
function minimax(board, depth, alpha, beta, maximizing, player) {
  const opponent = player === 'W' ? 'B' : 'W';
  const score = evaluateBoard(board, player);
  if (Math.abs(score) >= 100000 || depth === 0) return { score };
  const moves = getValidMoves(board);
  if (moves.length === 0) return { score: 0 };

  // Move ordering: evaluate each move and sort for better pruning
  const scoredMoves = moves.map(([x, y, z]) => {
    board[x][y][z] = maximizing ? player : opponent;
    const s = evaluateBoard(board, player);
    board[x][y][z] = null;
    return { move: [x, y, z], heuristic: s };
  });
  scoredMoves.sort((a, b) => maximizing ? b.heuristic - a.heuristic : a.heuristic - b.heuristic);

  // Only explore top moves at higher depths for speed
  const maxBranch = depth >= 4 ? 10 : depth >= 3 ? 15 : moves.length;
  const candidates = scoredMoves.slice(0, maxBranch);

  let bestMove = candidates[0].move;
  if (maximizing) {
    let maxEval = -Infinity;
    for (const { move } of candidates) {
      board[move[0]][move[1]][move[2]] = player;
      const { score: e } = minimax(board, depth-1, alpha, beta, false, player);
      board[move[0]][move[1]][move[2]] = null;
      if (e > maxEval) { maxEval = e; bestMove = move; }
      alpha = Math.max(alpha, e);
      if (beta <= alpha) break;
    }
    return { score: maxEval, move: bestMove };
  } else {
    let minEval = Infinity;
    for (const { move } of candidates) {
      board[move[0]][move[1]][move[2]] = opponent;
      const { score: e } = minimax(board, depth-1, alpha, beta, true, player);
      board[move[0]][move[1]][move[2]] = null;
      if (e < minEval) { minEval = e; bestMove = move; }
      beta = Math.min(beta, e);
      if (beta <= alpha) break;
    }
    return { score: minEval, move: bestMove };
  }
}

function detectFork(board, move, player) {
  const [x, y, z] = move;
  board[x][y][z] = player;
  const threats = countThreats(board, player);
  board[x][y][z] = null;
  return threats;
}

// Count how many "near-fork" setups a player has:
// positions where 2+ lines have 2-in-a-row with playable space
function countForkPotential(board, player) {
  const opponent = player === 'W' ? 'B' : 'W';
  // Map each empty playable cell to how many 2-in-a-row lines it completes
  const cellPressure = new Map();
  for (const line of ALL_LINES) {
    let pCount = 0, oCount = 0, emptyPlayable = [];
    for (const [x, y, z] of line) {
      const cell = board[x][y][z];
      if (cell === player) pCount++;
      else if (cell === opponent) oCount++;
      else if (z === 0 || board[x][y][z-1] !== null) emptyPlayable.push(`${x}-${y}-${z}`);
    }
    // 2-in-a-row with 2 empty and unblocked = building toward fork
    if (pCount === 2 && oCount === 0 && emptyPlayable.length >= 1) {
      for (const key of emptyPlayable) {
        cellPressure.set(key, (cellPressure.get(key) || 0) + 1);
      }
    }
    // 3-in-a-row near threat
    if (pCount === 3 && oCount === 0 && emptyPlayable.length >= 1) {
      for (const key of emptyPlayable) {
        cellPressure.set(key, (cellPressure.get(key) || 0) + 3);
      }
    }
  }
  // Cells where 2+ lines converge = fork potential
  let forkCells = 0;
  let maxPressure = 0;
  for (const [, count] of cellPressure) {
    if (count >= 2) forkCells++;
    maxPressure = Math.max(maxPressure, count);
  }
  return { forkCells, maxPressure };
}

function getTopMoves(board, player, count = 3) {
  const moves = getValidMoves(board);
  if (moves.length === 0) return [];
  const opponent = player === 'W' ? 'B' : 'W';

  // 1. Check for immediate wins
  for (const [x, y, z] of moves) {
    board[x][y][z] = player;
    if (evaluateBoard(board, player) >= 100000) {
      board[x][y][z] = null;
      return [{ move: [x,y,z], score: 100000, reason: "🏆 WINNING MOVE!", danger: null }];
    }
    board[x][y][z] = null;
  }

  // 2. Check for must-blocks
  const mustBlocks = [];
  for (const [x, y, z] of moves) {
    board[x][y][z] = opponent;
    if (evaluateBoard(board, opponent) >= 100000) {
      board[x][y][z] = null;
      mustBlocks.push([x, y, z]);
    } else {
      board[x][y][z] = null;
    }
  }
  if (mustBlocks.length === 1) {
    const [x, y, z] = mustBlocks[0];
    board[x][y][z] = player;
    const { score } = minimax(board, 4, -Infinity, Infinity, false, player);
    board[x][y][z] = null;
    return [{ move: [x,y,z], score, reason: "🛡️ MUST BLOCK — opponent wins here next!", danger: null }];
  }
  if (mustBlocks.length >= 2) {
    const results = mustBlocks.map(([x,y,z]) => {
      board[x][y][z] = player;
      const { score } = minimax(board, 4, -Infinity, Infinity, false, player);
      board[x][y][z] = null;
      return { move: [x,y,z], score, reason: "🛡️ DOUBLE THREAT — opponent has a fork!", danger: "Opponent has forked you. Try undoing to an earlier position." };
    });
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, count);
  }

  // Assess current danger level
  const currentOppPotential = countForkPotential(board, opponent);

  // 3. Full analysis — depth 5 with 2-ply opponent fork lookahead
  const SEARCH_DEPTH = 5;
  const results = [];
  for (const [x, y, z] of moves) {
    const forkCount = detectFork(board, [x,y,z], player);

    // Deep opponent modeling: play our move, then check opponent's best 3 responses
    board[x][y][z] = player;
    const oppMoves = getValidMoves(board);

    // Check opponent fork potential after our move
    const oppPotentialAfter = countForkPotential(board, opponent);

    // Check if opponent can immediately fork after our move
    let maxOppFork = 0;
    let oppBestForkIn2 = 0; // Can opponent set up a fork in 2 moves?

    // Sort opponent moves by their heuristic value
    const oppScored = oppMoves.map(([ox,oy,oz]) => {
      board[ox][oy][oz] = opponent;
      const s = evaluateBoard(board, opponent);
      board[ox][oy][oz] = null;
      return { move: [ox,oy,oz], s };
    });
    oppScored.sort((a, b) => b.s - a.s);

    // Check top 5 opponent responses
    for (const { move: om } of oppScored.slice(0, 5)) {
      const f = detectFork(board, om, opponent);
      maxOppFork = Math.max(maxOppFork, f);

      // Go one deeper: after opponent's move, can they fork on their NEXT turn?
      if (f < 2) {
        board[om[0]][om[1]][om[2]] = opponent;
        const ourResponses = getValidMoves(board);
        // For each of our responses, what can opponent do?
        for (const [rx,ry,rz] of ourResponses.slice(0, 5)) {
          board[rx][ry][rz] = player;
          const opp2Moves = getValidMoves(board);
          for (const [o2x,o2y,o2z] of opp2Moves.slice(0, 5)) {
            const f2 = detectFork(board, [o2x,o2y,o2z], opponent);
            oppBestForkIn2 = Math.max(oppBestForkIn2, f2);
          }
          board[rx][ry][rz] = null;
        }
        board[om[0]][om[1]][om[2]] = null;
      }
    }
    board[x][y][z] = null;

    // Does this move disrupt opponent's fork building?
    const disruptionBonus = (currentOppPotential.forkCells - oppPotentialAfter.forkCells) * 80
      + (currentOppPotential.maxPressure - oppPotentialAfter.maxPressure) * 40;

    board[x][y][z] = player;
    const { score } = minimax(board, SEARCH_DEPTH, -Infinity, Infinity, false, player);
    board[x][y][z] = null;

    let adjustedScore = score;
    if (forkCount >= 2) adjustedScore += 5000;
    if (maxOppFork >= 2) adjustedScore -= 4000;
    if (oppBestForkIn2 >= 2) adjustedScore -= 1500;
    adjustedScore += disruptionBonus;

    let reason, danger = null;
    if (forkCount >= 2) reason = "🔱 FORK — creates multiple unstoppable threats!";
    else if (forkCount === 1 && adjustedScore > 200) reason = "🔥 Threat + strong position";
    else if (disruptionBonus > 100) reason = "🛡️ Disrupts opponent's fork setup";
    else if (maxOppFork >= 2) { reason = "⚠️ Opponent can fork after this!"; danger = "This move allows an opponent fork next turn."; }
    else if (oppBestForkIn2 >= 2) { reason = "⚠️ Opponent building toward fork in 2 turns"; danger = "Opponent converging on a fork — consider disruption."; }
    else if (adjustedScore > 500) reason = "🔥 Strong attacking setup";
    else if (adjustedScore > 200) reason = "⚡ Builds toward multiple threats";
    else if (adjustedScore > 50) reason = "📐 Solid positional play";
    else if (adjustedScore > -50) reason = "🔄 Neutral — consider alternatives";
    else reason = "⚠️ Defensive — opponent has pressure";

    results.push({ move: [x,y,z], score: adjustedScore, reason, danger, forkCount, maxOppFork, oppBestForkIn2, disruptionBonus });
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, count);
}

export default function SmartFourAdvisor() {
  const [board, setBoard] = useState(() => {
    const b = [];
    for (let x = 0; x < BOARD_SIZE; x++) { b[x] = []; for (let y = 0; y < BOARD_SIZE; y++) b[x][y] = Array(MAX_HEIGHT).fill(null); }
    return b;
  });
  const [firstPlayer, setFirstPlayer] = useState('B');
  const [currentPlayer, setCurrentPlayer] = useState('B');
  const [recommendations, setRecommendations] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [moveHistory, setMoveHistory] = useState([]);
  const [yourColor, setYourColor] = useState('B');
  const [gameResult, setGameResult] = useState(null);
  const [hoveredRec, setHoveredRec] = useState(null);

  const deepCopy = (b) => b.map(col => col.map(row => [...row]));
  const getHeight = useCallback((x, y) => { let z = 0; while (z < MAX_HEIGHT && board[x][y][z] !== null) z++; return z; }, [board]);

  const placePiece = useCallback((x, y, color) => {
    if (gameResult) return;
    const z = getHeight(x, y);
    if (z >= MAX_HEIGHT) return;
    const nb = deepCopy(board);
    nb[x][y][z] = color;
    setBoard(nb);
    setMoveHistory(prev => [...prev, { x, y, z, color }]);
    setCurrentPlayer(color === 'W' ? 'B' : 'W');
    setRecommendations([]);
    setHoveredRec(null);
    const result = checkWinner(nb);
    if (result) setGameResult(result);
  }, [board, gameResult, getHeight]);

  const undoMove = useCallback(() => {
    if (moveHistory.length === 0) return;
    const last = moveHistory[moveHistory.length - 1];
    const nb = deepCopy(board);
    nb[last.x][last.y][last.z] = null;
    setBoard(nb);
    setMoveHistory(prev => prev.slice(0, -1));
    setCurrentPlayer(last.color);
    setRecommendations([]);
    setGameResult(null);
    setHoveredRec(null);
  }, [board, moveHistory]);

  const resetBoard = useCallback(() => {
    const b = [];
    for (let x = 0; x < BOARD_SIZE; x++) { b[x] = []; for (let y = 0; y < BOARD_SIZE; y++) b[x][y] = Array(MAX_HEIGHT).fill(null); }
    setBoard(b);
    setMoveHistory([]);
    setCurrentPlayer(firstPlayer);
    setRecommendations([]);
    setGameResult(null);
    setHoveredRec(null);
  }, [firstPlayer]);

  const analyze = useCallback(() => {
    if (gameResult) return;
    setAnalyzing(true);
    setTimeout(() => {
      const top = getTopMoves(deepCopy(board), yourColor, 3);
      setRecommendations(top);
      setAnalyzing(false);
    }, 50);
  }, [board, yourColor, gameResult]);

  const totalPieces = moveHistory.length;

  useEffect(() => {
    if (gameResult || currentPlayer !== yourColor || totalPieces === 0) return;
    setAnalyzing(true);
    const timer = setTimeout(() => {
      const top = getTopMoves(deepCopy(board), yourColor, 3);
      setRecommendations(top);
      setAnalyzing(false);
    }, 50);
    return () => clearTimeout(timer);
  }, [board, currentPlayer, yourColor, totalPieces, gameResult]);

  const recMoveSet = useMemo(() => {
    const s = new Map();
    recommendations.forEach((r, i) => s.set(`${r.move[0]}-${r.move[1]}`, { rank: i, z: r.move[2] }));
    return s;
  }, [recommendations]);

  const winCells = useMemo(() => {
    if (!gameResult) return new Set();
    const s = new Set();
    gameResult.line.forEach(([x,y,z]) => s.add(`${x}-${y}-${z}`));
    return s;
  }, [gameResult]);

  const youWon = gameResult && gameResult.winner === yourColor;

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0a12', color: '#e0e0e0',
      fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
      padding: '24px 12px',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;700;800&display=swap');
        @keyframes pulse { 0%,100%{box-shadow:0 0 8px rgba(0,255,136,0.4)} 50%{box-shadow:0 0 20px rgba(0,255,136,0.7)} }
        @keyframes winGlow { 0%,100%{box-shadow:0 0 6px rgba(255,215,0,0.4)} 50%{box-shadow:0 0 18px rgba(255,215,0,0.8)} }
        @keyframes loseGlow { 0%,100%{box-shadow:0 0 6px rgba(255,50,50,0.3)} 50%{box-shadow:0 0 18px rgba(255,50,50,0.6)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        .rec-card:hover { background: rgba(255,255,255,0.06) !important; }
        .cell:hover { filter: brightness(1.2); }
      `}</style>

      {/* Header */}
      <div style={{ maxWidth: 680, margin: '0 auto 16px', textAlign: 'center' }}>
        <h1 style={{
          fontSize: 24, fontWeight: 800, margin: 0,
          background: 'linear-gradient(135deg, #00ff88, #00aaff)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>SMART FOUR ADVISOR</h1>
        <p style={{ fontSize: 10, color: '#555', marginTop: 3, letterSpacing: '2px', textTransform: 'uppercase' }}>3D Move Analysis Engine</p>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Game Over Banner */}
        {gameResult && (
          <div style={{
            padding: '14px 18px', borderRadius: 12, textAlign: 'center',
            background: youWon ? 'rgba(0,255,136,0.08)' : 'rgba(255,50,50,0.08)',
            border: `2px solid ${youWon ? 'rgba(0,255,136,0.3)' : 'rgba(255,50,50,0.3)'}`,
          }}>
            <div style={{ fontSize: 26, marginBottom: 4 }}>{youWon ? '🎉' : '😤'}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: youWon ? '#00ff88' : '#ff4444' }}>
              {youWon ? 'YOU WIN!' : 'GAME OVER — Computer wins'}
            </div>
            <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
              {youWon ? 'Nice work!' : 'Undo to rewind and try a different line, or Reset.'}
            </div>
          </div>
        )}

        {/* Controls */}
        <div style={{
          display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center',
          padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>You:</span>
            {['W','B'].map(c => (
              <button key={c} onClick={() => { setYourColor(c); setRecommendations([]); }} style={{
                padding: '2px 9px', borderRadius: 5, border: '1px solid', fontSize: 11, fontFamily: 'inherit', cursor: 'pointer',
                borderColor: yourColor === c ? '#00ff88' : '#333',
                background: yourColor === c ? 'rgba(0,255,136,0.1)' : 'transparent',
                color: yourColor === c ? '#00ff88' : '#888',
              }}>{c === 'W' ? '⬜' : '⬛'}</button>
            ))}
          </div>
          <div style={{ width: 1, height: 18, background: '#222' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>1st:</span>
            {['W','B'].map(c => (
              <button key={c} onClick={() => { if (!totalPieces) { setFirstPlayer(c); setCurrentPlayer(c); } }} style={{
                padding: '2px 9px', borderRadius: 5, border: '1px solid', fontSize: 11, fontFamily: 'inherit',
                cursor: totalPieces ? 'not-allowed' : 'pointer', opacity: totalPieces ? 0.4 : 1,
                borderColor: firstPlayer === c ? '#00aaff' : '#333',
                background: firstPlayer === c ? 'rgba(0,170,255,0.1)' : 'transparent',
                color: firstPlayer === c ? '#00aaff' : '#888',
              }}>{c === 'W' ? '⬜' : '⬛'}</button>
            ))}
          </div>
          <div style={{ width: 1, height: 18, background: '#222' }} />
          {!gameResult && (
            <span style={{
              fontSize: 10, padding: '2px 8px', borderRadius: 5,
              background: currentPlayer === 'W' ? 'rgba(255,255,255,0.08)' : 'rgba(26,26,46,0.6)',
              color: currentPlayer === 'W' ? '#ddd' : '#999', border: '1px solid rgba(255,255,255,0.08)',
            }}>
              {currentPlayer === 'W' ? '⬜' : '⬛'} {currentPlayer === yourColor ? 'Your turn' : 'Opponent'}
            </span>
          )}
          <span style={{ fontSize: 10, color: '#444' }}>#{totalPieces + 1}</span>
        </div>

        {/* BOARD AREA: Main board + Side layer views */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>

          {/* Main Board — top-down, click to auto-place */}
          <div>
            <div style={{ textAlign: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 10, color: '#666', textTransform: 'uppercase', letterSpacing: 1 }}>Board · tap to place</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* Column color headers */}
              <div style={{ display: 'flex', gap: 4, marginBottom: 4, paddingLeft: 22 }}>
                {COL_COLORS.map((col, x) => (
                  <div key={x} style={{
                    width: 52, textAlign: 'center', fontSize: 13, fontWeight: 800,
                    color: col.bg, textShadow: `0 0 8px ${col.glow}`,
                  }}>{col.name}</div>
                ))}
              </div>

              {Array.from({ length: BOARD_SIZE }, (_, y) => (
                <div key={y} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                  <span style={{ width: 16, textAlign: 'right', fontSize: 11, color: '#555', fontWeight: 700 }}>{y + 1}</span>
                  {Array.from({ length: BOARD_SIZE }, (_, x) => {
                    const height = getHeight(x, y);
                    const canPlay = height < MAX_HEIGHT && !gameResult;
                    const col = COL_COLORS[x];
                    const topPiece = height > 0 ? board[x][y][height - 1] : null;
                    const rec = recMoveSet.get(`${x}-${y}`);
                    const isTopRec = rec !== undefined && rec.z === height;
                    const isHovered = hoveredRec !== null && rec !== undefined && rec.rank === hoveredRec;
                    const hasWin = gameResult && Array.from({length: MAX_HEIGHT}).some((_,z) => winCells.has(`${x}-${y}-${z}`));

                    return (
                      <div key={x} className="cell"
                        onClick={() => canPlay && placePiece(x, y, currentPlayer)}
                        style={{
                          width: 52, height: 52,
                          borderRadius: 8,
                          background: `linear-gradient(180deg, ${col.light} 0%, rgba(255,255,255,0.02) 100%)`,
                          borderBottom: `3px solid ${col.bg}`,
                          borderLeft: '1px solid rgba(255,255,255,0.04)',
                          borderRight: '1px solid rgba(255,255,255,0.04)',
                          borderTop: '1px solid rgba(255,255,255,0.04)',
                          outline: isHovered ? '2px solid #00ff88' : hasWin ? `2px solid ${youWon ? '#ffd700' : '#ff4444'}` : 'none',
                          cursor: canPlay ? 'pointer' : 'default',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          position: 'relative',
                          transition: 'all 0.15s',
                          animation: hasWin ? (youWon ? 'winGlow 1.5s ease-in-out infinite' : 'loseGlow 1.5s ease-in-out infinite') : 'none',
                        }}
                      >
                        {/* Show top piece or recommendation ghost */}
                        {topPiece ? (
                          <div style={{
                            width: 36, height: 36, borderRadius: 6,
                            background: topPiece === 'W' ? '#f0f0f0' : '#1a1a2e',
                            border: `2px solid ${hasWin ? (youWon ? '#ffd700' : '#ff4444') : (topPiece === 'W' ? '#bbb' : '#444')}`,
                            boxShadow: hasWin ? `0 0 10px ${youWon ? 'rgba(255,215,0,0.6)' : 'rgba(255,50,50,0.6)'}` : topPiece === 'W' ? 'inset 0 -2px 3px rgba(0,0,0,0.1)' : 'inset 0 -2px 3px rgba(0,0,0,0.3)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 10, color: topPiece === 'W' ? '#999' : '#666', fontWeight: 700,
                          }}>
                            {height > 1 && <span style={{ fontSize: 8, position: 'absolute', top: 3, right: 5, color: '#555' }}>×{height}</span>}
                          </div>
                        ) : isTopRec && !gameResult ? (
                          <div style={{
                            width: 36, height: 36, borderRadius: 6,
                            border: `2px dashed ${rec.rank === 0 ? '#00ff88' : rec.rank === 1 ? '#ffaa00' : '#ff6b6b'}`,
                            background: rec.rank === 0 ? 'rgba(0,255,136,0.15)' : rec.rank === 1 ? 'rgba(255,170,0,0.12)' : 'rgba(255,107,107,0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 14, fontWeight: 800,
                            color: rec.rank === 0 ? '#00ff88' : rec.rank === 1 ? '#ffaa00' : '#ff6b6b',
                            animation: rec.rank === 0 ? 'pulse 1.5s ease-in-out infinite' : 'none',
                          }}>{rec.rank + 1}</div>
                        ) : (
                          <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.1)' }}>·</span>
                        )}

                        {/* Recommendation overlay on occupied cell */}
                        {topPiece && isTopRec && !gameResult && (
                          <div style={{
                            position: 'absolute', top: -4, right: -4,
                            width: 18, height: 18, borderRadius: '50%',
                            background: rec.rank === 0 ? '#00ff88' : rec.rank === 1 ? '#ffaa00' : '#ff6b6b',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 10, fontWeight: 800, color: '#000',
                            animation: rec.rank === 0 ? 'pulse 1.5s ease-in-out infinite' : 'none',
                          }}>{rec.rank + 1}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Side Layer Views */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 9, color: '#555', textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center', marginBottom: 2 }}>
              Layers
            </span>
            {Array.from({ length: MAX_HEIGHT }, (_, i) => MAX_HEIGHT - 1 - i).map(z => {
              const hasPieces = board.some(col => col.some(row => row[z] !== null));
              const hasRecOnLayer = recommendations.some(r => r.move[2] === z);
              return (
                <div key={z} style={{
                  padding: 4, borderRadius: 6,
                  background: hasRecOnLayer ? 'rgba(0,255,136,0.06)' : 'transparent',
                  border: hasRecOnLayer ? '1px solid rgba(0,255,136,0.2)' : '1px solid rgba(255,255,255,0.04)',
                  transition: 'all 0.15s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{
                      fontSize: 9, color: hasRecOnLayer ? '#00ff88' : '#555',
                      width: 14, textAlign: 'right', fontWeight: 700,
                    }}>{z + 1}</span>
                    <div style={{
                      display: 'grid', gridTemplateColumns: `repeat(${BOARD_SIZE}, 12px)`, gap: 1,
                    }}>
                      {Array.from({ length: BOARD_SIZE }, (_, y) =>
                        Array.from({ length: BOARD_SIZE }, (_, x) => {
                          const cell = board[x][y][z];
                          const isWin = winCells.has(`${x}-${y}-${z}`);
                          const rec = recMoveSet.get(`${x}-${y}`);
                          const isRec = rec !== undefined && rec.z === z;
                          const colColor = COL_COLORS[x];
                          return (
                            <div key={`${x}-${y}`} style={{
                              width: 12, height: 12, borderRadius: 2,
                              background: cell === 'W' ? '#e0e0e0'
                                : cell === 'B' ? '#1a1a2e'
                                : isRec ? (rec.rank === 0 ? 'rgba(0,255,136,0.3)' : 'rgba(255,170,0,0.2)')
                                : 'rgba(255,255,255,0.03)',
                              border: isWin ? `1px solid ${youWon ? '#ffd700' : '#ff4444'}`
                                : cell ? (cell === 'W' ? '1px solid #aaa' : '1px solid #444')
                                : isRec ? `1px solid ${rec.rank === 0 ? '#00ff88' : '#ffaa00'}`
                                : `1px solid rgba(255,255,255,0.06)`,
                              boxShadow: isWin ? `0 0 4px ${youWon ? 'rgba(255,215,0,0.5)' : 'rgba(255,50,50,0.5)'}` : 'none',
                            }} />
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div style={{ fontSize: 8, color: '#444', textAlign: 'center', marginTop: 2 }}>1 = ground</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          {!gameResult && (
            <button onClick={analyze} disabled={analyzing} style={{
              padding: '8px 18px', borderRadius: 8, border: 'none',
              background: analyzing ? '#1a1a2e' : 'linear-gradient(135deg, #00ff88, #00cc6a)',
              color: analyzing ? '#666' : '#000', fontSize: 12, fontWeight: 800,
              fontFamily: 'inherit', cursor: analyzing ? 'wait' : 'pointer', transition: 'all 0.2s',
            }}>
              {analyzing ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid #444', borderTopColor: '#00ff88', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  ANALYZING...
                </span>
              ) : '🔍 ANALYZE'}
            </button>
          )}
          <button onClick={undoMove} disabled={!moveHistory.length} style={{
            padding: '8px 14px', borderRadius: 8, background: 'transparent', border: '1px solid #333',
            color: moveHistory.length ? '#aaa' : '#444', fontSize: 11, fontFamily: 'inherit',
            cursor: moveHistory.length ? 'pointer' : 'default',
          }}>↩ Undo</button>
          <button onClick={resetBoard} style={{
            padding: '8px 14px', borderRadius: 8, background: 'transparent', border: '1px solid #333',
            color: '#aaa', fontSize: 11, fontFamily: 'inherit', cursor: 'pointer',
          }}>🗑 Reset</button>
        </div>

        {/* Danger Alert */}
        {recommendations.length > 0 && !gameResult && recommendations.some(r => r.danger) && (
          <div style={{
            padding: '10px 14px', borderRadius: 10, 
            background: 'rgba(255,170,0,0.08)', border: '1px solid rgba(255,170,0,0.25)',
            display: 'flex', alignItems: 'flex-start', gap: 10,
          }}>
            <span style={{ fontSize: 18 }}>⚠️</span>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#ffaa00', textTransform: 'uppercase', letterSpacing: 1 }}>
                Threat Detected
              </div>
              <div style={{ fontSize: 11, color: '#bb8800', marginTop: 2, lineHeight: 1.5 }}>
                {recommendations.find(r => r.danger)?.danger} Focus on disruption over attack.
              </div>
            </div>
          </div>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && !gameResult && (
          <div style={{
            background: 'rgba(255,255,255,0.03)', borderRadius: 12,
            border: '1px solid rgba(0,255,136,0.15)', padding: 12,
          }}>
            <h3 style={{ fontSize: 10, fontWeight: 700, margin: '0 0 8px', color: '#00ff88', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              Recommended Moves
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {recommendations.map((rec, i) => {
                const col = COL_COLORS[rec.move[0]];
                return (
                  <div key={i} className="rec-card"
                    onClick={() => { placePiece(rec.move[0], rec.move[1], yourColor); setRecommendations([]); }}
                    onMouseEnter={() => setHoveredRec(i)}
                    onMouseLeave={() => setHoveredRec(null)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 10px', borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s',
                      background: i === 0 ? 'rgba(0,255,136,0.06)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${i === 0 ? 'rgba(0,255,136,0.2)' : 'rgba(255,255,255,0.05)'}`,
                    }}
                  >
                    <span style={{ fontSize: 15, fontWeight: 800, minWidth: 18, color: i === 0 ? '#00ff88' : i === 1 ? '#ffaa00' : '#ff6b6b' }}>
                      {i + 1}
                    </span>
                    <span style={{
                      padding: '2px 8px', borderRadius: 5, background: col.bg, color: col.text,
                      fontSize: 12, fontWeight: 800, minWidth: 36, textAlign: 'center',
                    }}>{col.name}{rec.move[1] + 1}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: '#ccc' }}>
                        Layer {rec.move[2] + 1}
                        {rec.move[2] > 0 && <span style={{ color: '#666', fontSize: 9, marginLeft: 4 }}>↑ stacked</span>}
                      </div>
                      <div style={{ fontSize: 10, color: '#777', marginTop: 1 }}>{rec.reason}</div>
                    </div>
                    <span style={{ fontSize: 9, color: i === 0 ? '#00ff88' : '#555', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>Play ▶</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div style={{ padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ fontSize: 10, fontWeight: 700, color: '#444', letterSpacing: 1.5, margin: '0 0 5px', textTransform: 'uppercase' }}>How to Use</h3>
          <div style={{ fontSize: 11, color: '#555', lineHeight: 1.6 }}>
            <p style={{ margin: '0 0 2px' }}>Tap any cell to place a piece — stacking is automatic.</p>
            <p style={{ margin: '0 0 2px' }}>Recommendations appear when it's your turn. Tap one to play it.</p>
            <p style={{ margin: 0 }}>Numbers on pieces = layer (1 = ground). Columns: <span style={{color:'#ff4d4d'}}>A</span> <span style={{color:'#ffcc00'}}>B</span> <span style={{color:'#33cc33'}}>C</span> <span style={{color:'#3399ff'}}>D</span> <span style={{color:'#b366ff'}}>E</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
