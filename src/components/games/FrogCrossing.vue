<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'complete', result: any): void
}>()

interface LilyPad {
  id: number
  word: string
  typedIndex: number
  x: number
  y: number
  row: number
  direction: number
  speed: number
  reached: boolean
}

interface JumpAnimation {
  endX: number
  endY: number
  progress: number
}

const gameAreaRef = ref<HTMLElement | null>(null)
const gameWidth = ref(600)
const gameHeight = ref(520)
const rows = 10
const startBankHeight = 60
const goalHeight = 60
const waterHeight = computed(() => gameHeight.value - startBankHeight - goalHeight)
const rowHeight = computed(() => waterHeight.value / rows)

const timeLeft = ref(60)
const score = ref(0)
const isPlaying = ref(false)
const isGameOver = ref(false)
const isCompleted = ref(false)
const lilyPads = ref<LilyPad[]>([])
const frogPosition = ref({ x: 0, y: 0 })
const frogRow = ref(-1)
const frogPadId = ref<number | null>(null)
const isJumping = ref(false)
const jumpAnim = ref<JumpAnimation | null>(null)
const typedChars = ref(0)
const correctChars = ref(0)
const jumpCount = ref(0)
let nextId = 0
let gameLoop: number | null = null
let timerInterval: number | null = null

const currentPad = computed(() => {
  if (frogPadId.value === null) return null
  return lilyPads.value.find(p => p.id === frogPadId.value)
})

const nextRowPads = computed(() => {
  const nextRow = frogRow.value + 1
  if (nextRow >= rows) return []
  return lilyPads.value.filter(p => p.row === nextRow && !p.reached)
})

function canTypeOnPad(pad: LilyPad): boolean {
  const nextRow = frogRow.value + 1
  return pad.row === nextRow && !pad.reached
}

const reachedGoal = computed(() => frogRow.value === rows - 1 && frogPadId.value !== null)

const wpm = computed(() => {
  if (typedChars.value === 0) return 0
  return Math.round(correctChars.value * 2)
})

const accuracy = computed(() => {
  if (typedChars.value === 0) return 100
  return Math.round((correctChars.value / typedChars.value) * 100)
})

const words = [
  'cat', 'dog', 'sun', 'hat', 'run', 'big', 'red', 'box', 'cup', 'pen',
  'apple', 'book', 'cake', 'door', 'fish', 'game', 'hand', 'jump', 'king', 'lamp',
  'bird', 'tree', 'frog', 'duck', 'bear', 'milk', 'moon', 'nest', 'owl', 'pig',
  'star', 'rain', 'snow', 'wind', 'leaf', 'rock', 'sand', 'wave', 'flag', 'ship',
  'happy', 'house', 'mouse', 'plant', 'quiet', 'river', 'snake', 'tiger', 'water', 'zebra',
  'beach', 'chair', 'dance', 'earth', 'flame', 'grape', 'horse', 'juice', 'kite', 'lemon'
]

function getRandomWord(): string {
  return words[Math.floor(Math.random() * words.length)]
}

function getRowY(row: number): number {
  // row 0 在底部（靠近起点），row 4 在顶部（靠近对岸）
  return goalHeight + rowHeight.value * (rows - row - 0.5)
}

function createLilyPad(row: number): LilyPad {
  const word = getRandomWord()
  const direction = Math.random() > 0.5 ? 1 : -1
  const x = direction > 0 ? -100 : gameWidth.value + 100
  return {
    id: nextId++,
    word,
    typedIndex: 0,
    x,
    y: getRowY(row),
    row,
    direction,
    speed: 0.8 + Math.random() * 0.8,
    reached: false
  }
}

function initLilyPads() {
  lilyPads.value = []
  for (let row = 0; row < rows; row++) {
    const pad = createLilyPad(row)
    pad.x = Math.random() * (gameWidth.value - 200) + 100
    lilyPads.value.push(pad)
  }
}

async function startGame() {
  timeLeft.value = 60
  score.value = 0
  typedChars.value = 0
  correctChars.value = 0
  jumpCount.value = 0
  isPlaying.value = true
  isGameOver.value = false
  isCompleted.value = false
  isJumping.value = false
  jumpAnim.value = null
  frogRow.value = -1
  frogPadId.value = null
  nextId = 0

  await nextTick()

  if (gameAreaRef.value) {
    gameWidth.value = gameAreaRef.value.offsetWidth
    gameHeight.value = gameAreaRef.value.offsetHeight
  }

  initLilyPads()

  // 青蛙在起点位置（底部起点线上）
  frogPosition.value = {
    x: 80,
    y: gameHeight.value - startBankHeight / 2
  }

  gameLoop = requestAnimationFrame(update)
  timerInterval = window.setInterval(() => {
    if (isPlaying.value && !isGameOver.value) {
      timeLeft.value--
      if (timeLeft.value <= 0) {
        endGame()
      }
    }
  }, 1000)
}

function update() {
  if (!isPlaying.value || isGameOver.value) return

  if (!isJumping.value) {
    lilyPads.value.forEach(pad => {
      pad.x += pad.direction * pad.speed
      // 载有青蛙的荷叶到达边缘时弹回
      if (pad.id === frogPadId.value) {
        if (pad.x < 0) {
          pad.x = 0
          pad.direction = 1
        } else if (pad.x > gameWidth.value) {
          pad.x = gameWidth.value
          pad.direction = -1
        }
      }
    })

    // 青蛙跟随载它的荷叶移动
    if (frogPadId.value !== null && currentPad.value) {
      const pad = currentPad.value
      frogPosition.value.x = Math.max(20, Math.min(gameWidth.value - 20, pad.x))
      frogPosition.value.y = pad.y
    }

    for (let row = 0; row < rows; row++) {
      const hasActivePad = lilyPads.value.some(p => p.row === row)
      if (!hasActivePad && row !== frogRow.value) {
        lilyPads.value.push(createLilyPad(row))
      }
    }

    lilyPads.value = lilyPads.value.filter(pad => {
      if (pad.x < -150 || pad.x > gameWidth.value + 150) {
        if (pad.id === frogPadId.value) {
          return true
        }
        return false
      }
      return true
    })
  } else if (jumpAnim.value) {
    jumpAnim.value.progress += 0.04
    const t = jumpAnim.value.progress

    const startY = frogRow.value < 0
      ? gameHeight.value - startBankHeight / 2
      : getRowY(frogRow.value)
    const startX = frogPosition.value.x

    if (t >= 1) {
      frogPosition.value.x = jumpAnim.value.endX
      frogPosition.value.y = jumpAnim.value.endY
      isJumping.value = false
      jumpAnim.value = null

      // 检查是否到达对岸
      if (frogRow.value === rows - 1) {
        isCompleted.value = true
        // 到达对岸后游戏结束
        endGame()
        emit('complete', {
          score: score.value,
          jumps: jumpCount.value,
          wpm: wpm.value,
          accuracy: accuracy.value
        })
      }
    } else {
      const easeT = 1 - Math.pow(1 - t, 3)
      const jumpHeight = Math.sin(t * Math.PI) * 100

      frogPosition.value.x = startX + (jumpAnim.value.endX - startX) * easeT
      frogPosition.value.y = startY + (jumpAnim.value.endY - startY) * easeT - jumpHeight
    }
  }

  gameLoop = requestAnimationFrame(update)
}

function handleKeyDown(e: KeyboardEvent) {
  if (!isPlaying.value || isGameOver.value || isJumping.value) return

  if (e.key === 'Backspace') {
    e.preventDefault()
    for (const pad of nextRowPads.value) {
      if (pad.typedIndex > 0) {
        pad.typedIndex--
        break
      }
    }
    return
  }

  if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
    e.preventDefault()
    const char = e.key.toLowerCase()

    const targetPad = nextRowPads.value.find(pad => {
      const nextChar = pad.word[pad.typedIndex]
      return nextChar === char
    })

    if (targetPad) {
      typedChars.value++
      correctChars.value++
      targetPad.typedIndex++

      if (targetPad.typedIndex === targetPad.word.length) {
        score.value += targetPad.word.length * 10
        jumpCount.value++

        targetPad.reached = true
        frogRow.value = targetPad.row
        frogPadId.value = targetPad.id

        jumpAnim.value = {
          endX: targetPad.x,
          endY: targetPad.y,
          progress: 0
        }
        isJumping.value = true
      }
    } else {
      nextRowPads.value.forEach(pad => {
        if (pad.typedIndex > 0) {
          pad.typedIndex--
        }
      })
    }
  }
}

function endGame() {
  isPlaying.value = false
  isGameOver.value = true
  if (gameLoop) cancelAnimationFrame(gameLoop)
  if (timerInterval) clearInterval(timerInterval)
}

function retry() {
  startGame()
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  if (gameLoop) cancelAnimationFrame(gameLoop)
  if (timerInterval) clearInterval(timerInterval)
})
</script>

<template>
  <div class="frog-crossing">
    <div class="game-header">
      <div class="stats">
        <div class="stat timer">
          <span class="label">剩余时间</span>
          <span class="value" :class="{ warning: timeLeft <= 10 }">{{ timeLeft }}s</span>
        </div>
        <div class="stat">
          <span class="label">得分</span>
          <span class="value score">{{ score }}</span>
        </div>
        <div class="stat">
          <span class="label">跳跃</span>
          <span class="value">{{ jumpCount }}</span>
        </div>
      </div>
      <button class="btn btn-secondary" @click="emit('back')">退出</button>
    </div>

    <div v-if="!isPlaying && !isGameOver" class="start-screen">
      <div class="frog-icon">🐸</div>
      <h2>青蛙过河</h2>
      <p>帮助小青蛙跳过池塘到达对岸！</p>
      <p class="tips">
        观察荷叶上的单词<br/>
        输入完整的单词让青蛙跳到荷叶上<br/>
        从下往上逐层跳跃到达对岸<br/>
        60秒内尽可能多地跳跃！
      </p>
      <button class="btn btn-primary" @click="startGame">开始游戏</button>
    </div>

    <div v-if="isGameOver" class="game-over">
      <h2>{{ isCompleted ? '恭喜到达对岸！' : '游戏结束！' }}</h2>
      <div class="result-stats">
        <div class="result-item highlight">
          <span class="label">最终得分</span>
          <span class="value">{{ score }}</span>
        </div>
        <div class="result-item">
          <span class="label">跳跃次数</span>
          <span class="value">{{ jumpCount }}</span>
        </div>
        <div class="result-item">
          <span class="label">打字速度</span>
          <span class="value">{{ wpm }} WPM</span>
        </div>
        <div class="result-item">
          <span class="label">准确率</span>
          <span class="value">{{ accuracy }}%</span>
        </div>
      </div>
      <div class="actions">
        <button class="btn btn-primary" @click="retry">再来一次</button>
        <button class="btn btn-secondary" @click="emit('back')">返回</button>
      </div>
    </div>

    <div v-if="isPlaying" ref="gameAreaRef" class="game-area">
      <div class="goal">
        <span>对岸</span>
        <span class="goal-hint" v-if="frogRow < rows - 1">跳到第{{ frogRow + 2 }}层荷叶即可到达</span>
        <span class="goal-hint success" v-else>已到达对岸！</span>
      </div>

      <div v-if="isCompleted" class="completion-banner">
        🎉 恭喜！您已成功到达对岸！
      </div>

      <div class="rows-container">
        <div
          v-for="i in rows"
          :key="i"
          class="row"
          :class="{ 'next-row': frogRow + 1 === i - 1 }"
          :style="{ bottom: (startBankHeight + (i - 1) * rowHeight) + 'px', height: rowHeight + 'px' }"
        >
          <div class="row-label">{{ rows - i + 1 }}</div>
          <div class="water-line"></div>
        </div>
      </div>

      <div
        v-for="pad in lilyPads"
        :key="pad.id"
        class="lily-pad"
        :class="{
          'can-type': canTypeOnPad(pad),
          reached: pad.reached,
          'frog-here': pad.id === frogPadId
        }"
        :style="{ left: pad.x + 'px', top: pad.y + 'px' }"
      >
        <div class="pad-base">🍀</div>
        <div class="pad-word" v-if="!pad.reached || pad.id === frogPadId">
          <span class="typed">{{ pad.word.slice(0, pad.typedIndex) }}</span>
          <span class="remaining">{{ pad.word.slice(pad.typedIndex) }}</span>
        </div>
      </div>

      <div
        class="frog"
        :class="{ jumping: isJumping }"
        :style="{ left: frogPosition.x + 'px', top: frogPosition.y + 'px' }"
      >
        🐸
      </div>

      <div class="start-bank" v-if="frogRow < 0">
        <span class="bank-label">起点</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.frog-crossing {
  width: 100%;
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px 24px;
  background: var(--bg-secondary);
  border-radius: 12px;
}

.stats {
  display: flex;
  gap: 32px;
}

.stat {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat .label {
  color: var(--text-secondary);
}

.stat .value {
  font-size: 24px;
  font-weight: bold;
  color: var(--primary-color);
}

.stat.timer .value {
  color: var(--primary-color);
  min-width: 60px;
}

.stat.timer .value.warning {
  color: var(--error-color);
  animation: blink 0.5s ease-in-out infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.stat .value.score {
  color: var(--success-color);
}

.start-screen,
.game-over {
  text-align: center;
  padding: 60px 20px;
  background: var(--bg-color);
  border: 2px solid var(--border-color);
  border-radius: 16px;
}

.frog-icon {
  font-size: 80px;
  margin-bottom: 20px;
  animation: hop 0.8s ease-in-out infinite;
}

@keyframes hop {
  0%, 100% { transform: translateY(0) rotate(-5deg); }
  50% { transform: translateY(-25px) rotate(5deg); }
}

.start-screen h2,
.game-over h2 {
  font-size: 28px;
  color: var(--primary-color);
  margin-bottom: 12px;
}

.start-screen p {
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.tips {
  font-size: 15px;
  margin-bottom: 24px !important;
  line-height: 1.8;
}

.result-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin: 32px 0;
}

.result-item {
  text-align: center;
  padding: 16px;
  background: var(--bg-secondary);
  border-radius: 12px;
}

.result-item.highlight {
  background: linear-gradient(135deg, var(--success-color) 0%, #16a34a 100%);
}

.result-item.highlight .label,
.result-item.highlight .value {
  color: white;
}

.result-item .label {
  display: block;
  color: var(--text-secondary);
  font-size: 14px;
  margin-bottom: 8px;
}

.result-item .value {
  font-size: 28px;
  font-weight: bold;
  color: var(--primary-color);
}

.actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.game-area {
  height: 520px;
  background: linear-gradient(180deg,
    #051f35 0%,
    #072d47 20%,
    #0a3d5c 40%,
    #0d4d6a 60%,
    #1a5a7a 80%,
    #87CEEB 100%
  );
  border-radius: 16px;
  overflow: hidden;
  position: relative;
}

.goal {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: linear-gradient(90deg, #8B4513 0%, #A0522D 50%, #8B4513 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: bold;
  color: white;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
  z-index: 2;
  border-bottom: 3px solid #654321;
}

.goal-hint {
  font-size: 12px;
  font-weight: normal;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 2px;
}

.goal-hint.success {
  color: #90EE90;
  font-weight: bold;
}

.rows-container {
  position: absolute;
  top: 60px;
  left: 0;
  right: 0;
  bottom: 60px;
}

.row {
  position: absolute;
  left: 0;
  right: 0;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.15);
}

.row.next-row {
  background: rgba(34, 197, 94, 0.1);
  border-bottom-color: rgba(34, 197, 94, 0.3);
}

.row-label {
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  font-weight: bold;
}

.water-line {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 2px;
  background: repeating-linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.1) 20px,
    transparent 40px
  );
  animation: waterFlow 2s linear infinite;
}

@keyframes waterFlow {
  0% { transform: translateX(0); }
  100% { transform: translateX(40px); }
}

.lily-pad {
  position: absolute;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 5;
}

.pad-base {
  font-size: 48px;
  filter: drop-shadow(2px 4px 6px rgba(0, 0, 0, 0.4));
  transition: transform 0.2s, filter 0.2s;
}

.lily-pad.can-type .pad-base {
  transform: scale(1.15);
  filter: drop-shadow(0 0 12px rgba(34, 197, 94, 0.7)) drop-shadow(2px 4px 6px rgba(0, 0, 0, 0.4));
}

.lily-pad.frog-here .pad-base {
  transform: scale(1.2);
  filter: drop-shadow(0 0 15px rgba(255, 200, 0, 0.8)) drop-shadow(2px 4px 6px rgba(0, 0, 0, 0.4));
}

.pad-word {
  background: rgba(0, 0, 0, 0.75);
  padding: 6px 12px;
  border-radius: 8px;
  margin-top: 4px;
  font-family: 'Courier New', monospace;
  font-size: 16px;
  font-weight: bold;
  letter-spacing: 1px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  white-space: nowrap;
}

.lily-pad.can-type .pad-word {
  background: rgba(34, 139, 34, 0.9);
  border-color: var(--success-color);
  box-shadow: 0 0 10px rgba(34, 197, 94, 0.5);
}

.pad-word .typed {
  color: var(--success-color);
  text-shadow: 0 0 5px rgba(34, 197, 94, 0.8);
}

.pad-word .remaining {
  color: white;
}

.frog {
  position: absolute;
  transform: translate(-50%, -50%);
  font-size: 44px;
  z-index: 20;
  filter: drop-shadow(2px 4px 8px rgba(0, 0, 0, 0.5));
}

.frog.jumping {
  animation: frogJump 0.05s ease-out infinite;
}

@keyframes frogJump {
  0%, 100% { transform: translate(-50%, -50%) rotate(-5deg); }
  50% { transform: translate(-50%, -50%) rotate(5deg); }
}

.start-bank {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: linear-gradient(180deg, #8B4513 0%, #654321 100%);
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  border-top: 4px solid #A0522D;
}

.bank-label {
  font-size: 14px;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.8);
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

.completion-banner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  color: #333;
  padding: 20px 40px;
  border-radius: 16px;
  font-size: 24px;
  font-weight: bold;
  z-index: 100;
  box-shadow: 0 8px 32px rgba(255, 215, 0, 0.5);
  animation: bounceIn 0.5s ease-out;
}

@keyframes bounceIn {
  0% { transform: translate(-50%, -50%) scale(0); }
  50% { transform: translate(-50%, -50%) scale(1.1); }
  100% { transform: translate(-50%, -50%) scale(1); }
}
</style>
