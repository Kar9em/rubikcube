const container = document.getElementById('cubeContainer');
const timerDisplay = document.getElementById('timerDisplay');
const victoryOverlay = document.getElementById('victoryOverlay');
const finalTimeDisplay = document.getElementById('finalTime');

let rotX = -25, rotY = 45;
let isDragging = false;
let prevMouseX = 0, prevMouseY = 0;
let cubelets = [];
let isAnimating = false;

let timerInterval = null;
let startTime = 0;
let isGameActive = false;
let hasBeenScrambled = false;

let moveHistory = [];
let isSolving = false;

container.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;

document.addEventListener('mousedown', (e) => {
    if (e.target.tagName === 'BUTTON' || e.target.classList.contains('face')) return;
    isDragging = true;
    prevMouseX = e.clientX;
    prevMouseY = e.clientY;
});

document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    let deltaX = e.clientX - prevMouseX;
    let deltaY = e.clientY - prevMouseY;
    rotY += deltaX * 0.5;
    rotX -= deltaY * 0.5;
    container.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
    prevMouseX = e.clientX;
    prevMouseY = e.clientY;
});

document.addEventListener('mouseup', () => { isDragging = false; });

document.addEventListener('touchstart', (e) => {
    if (e.target.tagName === 'BUTTON' || e.target.classList.contains('face')) return;
    isDragging = true;
    prevMouseX = e.touches.clientX;
    prevMouseY = e.touches.clientY;
}, { passive: true });

document.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    let deltaX = e.touches.clientX - prevMouseX;
    let deltaY = e.touches.clientY - prevMouseY;
    rotY += deltaX * 0.5;
    rotX -= deltaY * 0.5;
    container.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
    prevMouseX = e.touches.clientX;
    prevMouseY = e.touches.clientY;
}, { passive: true });

document.addEventListener('touchend', () => { isDragging = false; });

document.addEventListener('keydown', (e) => {
    if (isSolving) return;
    const keyMap = {
        'u': 'U', 'U': 'u',
        'd': 'D', 'D': 'd',
        'l': 'L', 'L': 'l',
        'r': 'R', 'R': 'r',
        'f': 'F', 'F': 'f',
        'b': 'B', 'B': 'b'
    };
    if (keyMap[e.key]) {
        e.preventDefault();
        triggerMove(keyMap[e.key]);
    }
});

let touchStartX = 0, touchStartY = 0, activeFace = null;

document.addEventListener('touchstart', (e) => {
    if (isSolving) return;
    if (e.target.classList.contains('face')) {
        activeFace = e.target;
        touchStartX = e.touches.clientX;
        touchStartY = e.touches.clientY;
    }
}, { passive: true });

document.addEventListener('touchend', (e) => {
    if (!activeFace || isSolving) return;
    let deltaX = e.changedTouches.clientX - touchStartX;
    let deltaY = e.changedTouches.clientY - touchStartY;
    
    if (Math.abs(deltaX) > 30 || Math.abs(deltaY) > 30) {
        let faceType = activeFace.className.split(' ');
        let swipeDir = Math.abs(deltaX) > Math.abs(deltaY) ? (deltaX > 0 ? 'RIGHT' : 'LEFT') : (deltaY > 0 ? 'DOWN' : 'UP');
        handleSwipeMove(faceType, swipeDir);
    }
    activeFace = null;
});

function handleSwipeMove(face, dir) {
    if (face.includes('F')) {
        if (dir === 'RIGHT') triggerMove('D'); if (dir === 'LEFT') triggerMove('U');
        if (dir === 'UP') triggerMove('R'); if (dir === 'DOWN') triggerMove('L');
    } else if (face.includes('U')) {
        if (dir === 'RIGHT') triggerMove('B'); if (dir === 'LEFT') triggerMove('F');
        if (dir === 'UP') triggerMove('L'); if (dir === 'DOWN') triggerMove('R');
    } else if (face.includes('R')) {
        if (dir === 'RIGHT') triggerMove('B'); if (dir === 'LEFT') triggerMove('F');
        if (dir === 'UP') triggerMove('U'); if (dir === 'DOWN') triggerMove('D');
    } else if (face.includes('L')) {
        if (dir === 'RIGHT') triggerMove('F'); if (dir === 'LEFT') triggerMove('B');
        if (dir === 'UP') triggerMove('U'); if (dir === 'DOWN') triggerMove('D');
    } else if (face.includes('D')) {
        if (dir === 'RIGHT') triggerMove('F'); if (dir === 'LEFT') triggerMove('B');
        if (dir === 'UP') triggerMove('L'); if (dir === 'DOWN') triggerMove('R');
    } else if (face.includes('B')) {
        if (dir === 'RIGHT') triggerMove('U'); if (dir === 'LEFT') triggerMove('D');
        if (dir === 'UP') triggerMove('R'); if (dir === 'DOWN') triggerMove('L');
    }
}

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    startTime = Date.now();
    isGameActive = true;
    timerInterval = setInterval(() => {
        let elapsed = Math.floor((Date.now() - startTime) / 1000);
        let mins = Math.floor(elapsed / 60).toString().padStart(2, '0');
        let secs = (elapsed % 60).toString().padStart(2, '0');
        timerDisplay.textContent = `${mins}:${secs}`;
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
    isGameActive = false;
}

function createCube() {
    container.innerHTML = '';
    cubelets = [];
    moveHistory = [];
    isSolving = false;
    const faces = ['F', 'B', 'L', 'R', 'U', 'D'];

    for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
            for (let z = -1; z <= 1; z++) {
                if (x === 0 && y === 0 && z === 0) continue;

                let el = document.createElement('div');
                el.className = 'cubelet';

                faces.forEach(f => {
                    let faceEl = document.createElement('div');
                    faceEl.className = `face ${f}`;
                    el.appendChild(faceEl);
                });

                let c = {
                    matrix: [
                        1, 0, 0, 0,
                        0, 1, 0, 0,
                        0, 0, 1, 0,
                        x * 102, y * 102, z * 102, 1
                    ],
                    el: el
                };

                applyMatrix(c);
                container.appendChild(el);
                cubelets.push(c);
            }
        }
    }
}

function applyMatrix(c) {
    c.el.style.transform = `matrix3d(${c.matrix.join(',')})`;
}

function multiplyMatrices(a, b) {
    let result = new Array(16).fill(0);
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            for (let k = 0; k < 4; k++) {
                result[i * 4 + j] += a[i * 4 + k] * b[k * 4 + j];
            }
        }
    }
    return result;
}

function getRotationMatrix(axis, angleDeg) {
    let rad = (angleDeg * Math.PI) / 180;
    let cos = Math.cos(rad);
    let sin = Math.sin(rad);
    if (axis === 'x') return [1, 0, 0, 0, 0, cos, sin, 0, 0, -sin, cos, 0, 0, 0, 0, 1];
    if (axis === 'y') return [cos, 0, -sin, 0, 0, 1, 0, 0, sin, 0, cos, 0, 0, 0, 0, 1];
    if (axis === 'z') return [cos, sin, 0, 0, -sin, cos, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}

function triggerMove(m, autoCheck = true, logHistory = true) {
    if (isAnimating) return;
    
    let axis = 'y', angle = 90, checkValue = 0;

    if (m === 'U' || m === 'u') { checkValue = -102; axis = 'y'; angle = m === 'U' ? -90 : 90; }
    if (m === 'D' || m === 'd') { checkValue = 102; axis = 'y'; angle = m === 'D' ? 90 : -90; }
    if (m === 'R' || m === 'r') { checkValue = 102; axis = 'x'; angle = m === 'R' ? -90 : 90; }
    if (m === 'L' || m === 'l') { checkValue = -102; axis = 'x'; angle = m === 'L' ? 90 : -90; }
    if (m === 'F' || m === 'f') { checkValue = 102; axis = 'z'; angle = m === 'F' ? -90 : 90; }
    if (m === 'B' || m === 'b') { checkValue = -102; axis = 'z'; angle = m === 'B' ? 90 : -90; }

    let targetIdx = axis === 'x' ? 12 : axis === 'y' ? 13 : 14;
    let rotationMat = getRotationMatrix(axis, angle);

    isAnimating = true;

    if (logHistory) {
        moveHistory.push(m);
    }

    if (hasBeenScrambled && !isGameActive && !isSolving) {
        startTimer();
    }

    let affected = cubelets.filter(c => Math.abs(c.matrix[targetIdx] - checkValue) < 5);
    let remaining = affected.length;

    affected.forEach(c => {
        c.el.style.transition = 'transform 0.15s ease';
        let tempMat = multiplyMatrices(c.matrix, rotationMat);
        c.el.style.transform = `matrix3d(${tempMat.join(',')})`;
        
        setTimeout(() => {
            c.el.style.transition = 'none';
            c.matrix = tempMat;
            applyMatrix(c);
            remaining--;
            if (remaining === 0) {
                isAnimating = false;
                if (autoCheck && hasBeenScrambled && isGameActive && !isSolving) {
                    checkIfSolved();
                }
            }
        }, 150);
    });
}

function scramble() {
    if (isAnimating || isSolving) return;
    stopTimer();
    hasBeenScrambled = false;
    timerDisplay.textContent = "00:00";
    
    let moves = ['U', 'D', 'L', 'R', 'F', 'B', 'u', 'd', 'l', 'r', 'f', 'b'];
    let count = 0;
    let interval = setInterval(() => {
        if (!isAnimating) {
            let m = moves[Math.floor(Math.random() * moves.length)];
            triggerMove(m, false, true); 
            count++;
            if (count > 20) {
                clearInterval(interval);
                hasBeenScrambled = true;
            }
        }
    }, 60);
}

function getInverseMove(m) {
    return m === m.toLowerCase() ? m.toUpperCase() : m.toLowerCase();
}

function autoSolve() {
    if (isAnimating || isSolving || moveHistory.length === 0) return;
    
    stopTimer();
    isSolving = true;
    hasBeenScrambled = false;

    let solveInterval = setInterval(() => {
        if (!isAnimating) {
            if (moveHistory.length === 0) {
                clearInterval(solveInterval);
                isSolving = false;
                timerDisplay.textContent = "00:00";
                return;
            }
            let lastMove = moveHistory.pop();
            let inverseMove = getInverseMove(lastMove);
            triggerMove(inverseMove, false, false);
}
}, 180);
}
function checkIfSolved() {
const orientations = [
{ name: 'F', idx: 8, sign: 1 },
{ name: 'B', idx: 8, sign: -1 },
{ name: 'R', idx: 0, sign: 1 },
{ name: 'L', idx: 0, sign: -1 },
{ name: 'U', idx: 4, sign: 1 },
{ name: 'D', idx: 4, sign: -1 }
];
for (let face of orientations) {
let normalVectors = [];
cubelets.forEach(c => {
let targetPosIdx = face.name === 'R' || face.name === 'L' ? 12 : face.name === 'U' || face.name === 'D' ? 13 : 14;
let expectedCoord = face.sign * 102;
if (Math.abs(c.matrix[targetPosIdx] - expectedCoord) < 5) {
let v = [c.matrix[face.idx], c.matrix[face.idx + 1], c.matrix[face.idx + 2]];
normalVectors.push(v);
}
});
if (normalVectors.length > 0) {
let base = normalVectors[0];
let matching = normalVectors.every(v =>
Math.abs(v[0] - base[0]) < 0.1 &&
Math.abs(v[1] - base[1]) < 0.1 &&
Math.abs(v[2] - base[2]) < 0.1
);
if (!matching) return false;
}
}
stopTimer();
finalTimeDisplay.textContent = timerDisplay.textContent;
victoryOverlay.classList.add('show');
return true;
}
function resetCube() {
if (isAnimating || isSolving) return;
stopTimer();
hasBeenScrambled = false;
isGameActive = false;
timerDisplay.textContent = "00:00";
createCube();
}
function closeVictory() {
victoryOverlay.classList.remove('show');
resetCube();
}
createCube();