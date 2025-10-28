// Refs
const gridEl = document.getElementById('grid');
const timeLeftEl = document.getElementById('time-left');
const resultEl = document.getElementById('result');
const livesEl = document.getElementById('lives');
const startPauseBtn = document.getElementById('start-pause');
const resetBtn = document.getElementById('reset');

// Constants
const COLS = 9, ROWS = 9, SIZE = COLS * ROWS;
const START_INDEX = 76;
const GOAL_INDEX  = 4;
const TICK_MS = 520;
const TIME_LIMIT = 20;
let lives = 3;

// Build grid
let squares = [];
for (let i = 0; i < SIZE; i++) {
  const d = document.createElement('div');
  squares.push(d);
  gridEl.appendChild(d);
}

// Lanes
function rowRange(r){ return { start: r*COLS, end: r*COLS + (COLS-1) }; }
const lanes = [
  { row:0, type:'goal',  dir: 0 },
  { row:1, type:'water', dir:+1 },
  { row:2, type:'water', dir:-1 },
  { row:3, type:'water', dir:+1 },
  { row:4, type:'safe',  dir: 0 },
  { row:5, type:'road',  dir:-1 },
  { row:6, type:'road',  dir:+1 },
  { row:7, type:'road',  dir:-1 },
  { row:8, type:'safe',  dir: 0 },
];

lanes.forEach(({row, type})=>{
  const {start} = rowRange(row);
  for (let c=0;c<COLS;c++){
    const i = start + c;
    squares[i].className = '';
    squares[i].classList.add(type);
  }
});
squares[GOAL_INDEX].classList.add('goal');

// Patterns
function setPattern(row, className, pattern){
  const {start} = rowRange(row);
  for (let c=0;c<COLS;c++){
    squares[start+c].classList.remove(className);
    if (pattern[c % pattern.length]) squares[start+c].classList.add(className);
  }
}

let patterns = {
  logsR: [1,1,1,0,0,  1,1,0,0],
  logsL: [1,1,1,0,  1,1,0,0,0],
  carsR: [1,1,0,  0,1,1,0,  0],
  carsL: [1,1,0,0,  1,0, 0,0,0]
};

setPattern(1,'log', patterns.logsR);
setPattern(2,'log', patterns.logsL);
setPattern(3,'log', patterns.logsR);
setPattern(5,'car', patterns.carsL);
setPattern(6,'car', patterns.carsR);
setPattern(7,'car', patterns.carsL);

// Frog
let frogIndex = START_INDEX;
squares[frogIndex].classList.add('frog');

function indexToRC(i){ return { r: Math.floor(i/COLS), c: i%COLS }; }
function rcToIndex(r,c){ return r*COLS + c; }

function hopOnce(){
  squares[frogIndex].classList.add('hop');
  setTimeout(()=>squares[frogIndex].classList.remove('hop'), 140);
}

function moveFrog(e){
  if (gameOver) return;
  const {r,c} = indexToRC(frogIndex);
  squares[frogIndex].classList.remove('frog');
  if (e.key === 'ArrowLeft'  && c>0)        frogIndex--;
  if (e.key === 'ArrowRight' && c<COLS-1)   frogIndex++;
  if (e.key === 'ArrowUp'    && r>0)        frogIndex -= COLS;
  if (e.key === 'ArrowDown'  && r<ROWS-1)   frogIndex += COLS;
  squares[frogIndex].classList.add('frog');
  hopOnce();
  checkState();
}

// Obstacles tick
function shiftRow(row, cls, dir){
  const {start} = rowRange(row);
  const cells = [];
  for (let i=0;i<COLS;i++) cells.push(squares[start+i].classList.contains(cls));
  if (dir > 0) cells.unshift(cells.pop()); else cells.push(cells.shift());
  for (let i=0;i<COLS;i++){
    squares[start+i].classList.toggle(cls, cells[i]);
  }
}

function autoMove(){
  [1,2,3].forEach(r => shiftRow(r,'log', lanes.find(l=>l.row===r).dir));
  [5,6,7].forEach(r => shiftRow(r,'car', lanes.find(l=>l.row===r).dir));

  const {r,c} = indexToRC(frogIndex);
  if ([1,2,3].includes(r)){
    const onLog = squares[frogIndex].classList.contains('log');
    if (onLog){
      const dir = lanes.find(l=>l.row===r).dir;
      const newC = c + dir;
      if (newC < 0 || newC >= COLS){
        drown();
      } else {
        squares[frogIndex].classList.remove('frog');
        frogIndex = rcToIndex(r, newC);
        squares[frogIndex].classList.add('frog');
      }
    } else {
      drown();
    }
  }
  checkState();
}

// Timer/state
let tickTimer = null;
let secondTimer = null;
let timeLeft = TIME_LIMIT;
let gameOver = false;

function start(){
  if (gameOver) return;
  if (!tickTimer) tickTimer = setInterval(autoMove, TICK_MS);
  if (!secondTimer) secondTimer = setInterval(()=>{
    timeLeft--; timeLeftEl.textContent = timeLeft;
    if (timeLeft <= 0) lose("Time's up!");
  }, 1000);
}
function pause(){
  clearInterval(tickTimer); tickTimer=null;
  clearInterval(secondTimer); secondTimer=null;
}
function reset(){
  pause(); gameOver=false; resultEl.textContent='';
  squares.forEach(s => s.classList.remove('frog','danger'));
  setPattern(1,'log', patterns.logsR);
  setPattern(2,'log', patterns.logsL);
  setPattern(3,'log', patterns.logsR);
  setPattern(5,'car', patterns.carsL);
  setPattern(6,'car', patterns.carsR);
  setPattern(7,'car', patterns.carsL);
  frogIndex = START_INDEX;
  squares[frogIndex].classList.add('frog');
  timeLeft = TIME_LIMIT; timeLeftEl.textContent = timeLeft;
}
function lose(msg){
  if (gameOver) return;
  lives--; livesEl.textContent = lives;
  if (lives <= 0){
    resultEl.textContent = 'YOU LOSE';
    gameOver = true; pause();
  } else {
    resultEl.textContent = msg + ' (-1 life)';
    setTimeout(()=>{ resultEl.textContent=''; }, 1200);
    reset(); start();
  }
}
function drown(){ lose('Drowned'); }
function hitCar(){ lose('Squashed'); }

function checkState(){
  if (frogIndex === GOAL_INDEX){
    resultEl.textContent = 'YOU WIN!'; gameOver = true; pause(); return;
  }
  if (squares[frogIndex].classList.contains('car')) hitCar();
}

// Events
document.addEventListener('keydown', moveFrog);
startPauseBtn?.addEventListener('click', ()=>{
  if (tickTimer || secondTimer) pause(); else start();
});
resetBtn?.addEventListener('click', ()=>{ reset(); });

// Init HUD
timeLeftEl && (timeLeftEl.textContent = TIME_LIMIT);
livesEl && (livesEl.textContent = lives);
