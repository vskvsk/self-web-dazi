<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'complete', result: any): void
}>()

interface FallingChar {
  char: string
  x: number
  y: number
  speed: number
  lane: number
}

const gameAreaRef = ref<HTMLElement | null>(null)
const gameWidth = ref(600)
const gameHeight = ref(400)
const lanes = 8
const laneWidth = computed(() => gameWidth.value / lanes)

const lives = ref(3)
const score = ref(0)
const isPlaying = ref(false)
const isGameOver = ref(false)
const currentChar = ref<FallingChar | null>(null)
const frogPosition = ref(3)
const typedChars = ref<{ char: string; x: number; y: number; correct: boolean }[]>([])
const lastTypedChar = ref<{ char: string; x: number; y: number } | null>(null)

const wpm = computed(() => {
  if (typedChars.value.length === 0) return 0
  const correctCount = typedChars.value.filter(c => c.correct).length
  return Math.round(correctCount / 1)
})

const accuracy = computed(() => {
  if (typedChars.value.length === 0) return 100
  const correctCount = typedChars.value.filter(c => c.correct).length
  return Math.round((correctCount / typedChars.value.length) * 100)
})

const chars = 'asdfjkl;qwertyuiopzxcvbnm,.'.split('')
let gameLoop: number | null = null
let charTimer: number | null = null

function generateChar() {
  const char = chars[Math.floor(Math.random() * chars.length)]
  const lane = Math.floor(Math.random() * lanes)
  currentChar.value = {
    char,
    x: lane * laneWidth.value + laneWidth.value / 2,
    y: 0,
    speed: 1 + Math.random() * 0.5,
    lane
  }
}

function startGame() {
  lives.value = 3
  score.value = 0
  isPlaying.value = true
  isGameOver.value = false
  frogPosition.value = 3
  typedChars.value = []
  currentChar.value = null
  generateChar()
  gameLoop = requestAnimationFrame(update)
  charTimer = window.setInterval(() => {
    if (isPlaying.value && !isGameOver.value) {
      generateChar()
    }
  }, 2000)
}

function update() {
  if (!isPlaying.value || isGameOver.value) return

  if (currentChar.value) {
    currentChar.value.y += currentChar.value.speed

    if (currentChar.value.y >= gameHeight.value - 60) {
      if (Math.abs(currentChar.value.lane - frogPosition.value) <= 0) {
        lives.value--
        currentChar.value = null
        if (lives.value <= 0) {
          endGame()
          return
        }
      } else {
        currentChar.value = null
        generateChar()
      }
    }
  }

  gameLoop = requestAnimationFrame(update)
}

function handleKeyDown(e: KeyboardEvent) {
  if (!isPlaying.value || isGameOver.value) return

  if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
    e.preventDefault()

    if (currentChar.value) {
      const expected = currentChar.value.char
      if (e.key === expected) {
        const correct = Math.abs(currentChar.value.lane - frogPosition.value) <= 1
        typedChars.value.push({
          char: e.key,
          x: currentChar.value.x,
          y: currentChar.value.y,
          correct
        })
        lastTypedChar.value = {
          char: e.key,
          x: currentChar.value.x,
          y: currentChar.value.y
        }
        setTimeout(() => {
          lastTypedChar.value = null
        }, 300)

        score.value += correct ? 10 : 0
        frogPosition.value = currentChar.value.lane
        currentChar.value = null
        generateChar()
      } else {
        lives.value--
        if (lives.value <= 0) {
          endGame()
        }
      }
    }
  }

  if (e.key === 'ArrowLeft' && frogPosition.value > 0) {
    frogPosition.value--
  }
  if (e.key === 'ArrowRight' && frogPosition.value < lanes - 1) {
    frogPosition.value++
  }
}

function endGame() {
  isPlaying.value = false
  isGameOver.value = true
  if (gameLoop) cancelAnimationFrame(gameLoop)
  if (charTimer) clearInterval(charTimer)
}

function retry() {
  startGame()
}

function handleComplete() {
  emit('complete', {
    wpm: wpm.value,
    accuracy: accuracy.value,
    score: score.value,
    lives: lives.value
  })
}

onMounted(() => {
  if (gameAreaRef.value) {
    gameWidth.value = gameAreaRef.value.offsetWidth
    gameHeight.value = gameAreaRef.value.offsetHeight
  }
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  if (gameLoop) cancelAnimationFrame(gameLoop)
  if (charTimer) clearInterval(charTimer)
})
</script>

<template>
  <div class="frog-crossing">
    <div class="game-header">
      <div class="stats">
        <div class="stat">
          <span class="label">生命</span>
          <span class="value">{{ '❤️'.repeat(lives) }}</span>
        </div>
        <div class="stat">
          <span class="label">得分</span>
          <span class="value score">{{ score }}</span>
        </div>
      </div>
      <button class="btn btn-secondary" @click="emit('back')">退出</button>
    </div>

    <div v-if="!isPlaying && !isGameOver" class="start-screen">
      <div class="frog-icon">🐸</div>
      <h2>青蛙过河</h2>
      <p>帮助小青蛙跳过池塘！</p>
      <p class="tips">使用方向键 ← → 移动青蛙<br/>输入屏幕上方的字符让青蛙跳到对应位置</p>
      <button class="btn btn-primary" @click="startGame">开始游戏</button>
    </div>

    <div v-if="isGameOver" class="game-over">
      <h2>游戏结束</h2>
      <div class="result-stats">
        <div class="result-item">
          <span class="label">最终得分</span>
          <span class="value">{{ score }}</span>
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
      <div class="pond">
        <div
          v-for="i in lanes"
          :key="i"
          class="lane"
        ></div>
        <div
          v-for="(item, index) in typedChars"
          :key="'typed-' + index"
          class="typed-char"
          :class="{ correct: item.correct }"
          :style="{ left: item.x + 'px', top: item.y + 'px' }"
        >{{ item.char }}</div>
        <div
          v-if="lastTypedChar"
          class="flying-char"
          :style="{ left: lastTypedChar.x + 'px', top: lastTypedChar.y + 'px' }"
        >{{ lastTypedChar.char }}</div>
        <div
          v-if="currentChar"
          class="falling-char"
          :style="{ left: currentChar.x + 'px', top: currentChar.y + 'px' }"
        >{{ currentChar.char }}</div>
        <div
          class="frog"
          :style="{ left: (frogPosition * laneWidth + laneWidth / 2 - 25) + 'px' }"
        >🐸</div>
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
  font-size: 20px;
  font-weight: bold;
  color: var(--primary-color);
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
  animation: hop 1s ease-in-out infinite;
}

@keyframes hop {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
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
  font-size: 14px;
  margin-bottom: 24px !important;
  line-height: 1.8;
}

.result-stats {
  display: flex;
  justify-content: center;
  gap: 32px;
  margin: 32px 0;
}

.result-item {
  text-align: center;
}

.result-item .label {
  display: block;
  color: var(--text-secondary);
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
  height: 450px;
  background: linear-gradient(180deg, #87CEEB 0%, #98FB98 50%, #228B22 100%);
  border-radius: 16px;
  overflow: hidden;
  position: relative;
}

.pond {
  width: 100%;
  height: 100%;
  position: relative;
}

.lane {
  position: absolute;
  left: 0;
  right: 0;
  height: 25%;
  border-bottom: 2px dashed rgba(255, 255, 255, 0.3);
}

.lane:nth-child(odd) {
  background: rgba(34, 139, 34, 0.2);
}

.lane:nth-child(even) {
  background: rgba(135, 206, 235, 0.3);
}

.lane:last-child {
  border-bottom: none;
  background: linear-gradient(180deg, #228B22 0%, #006400 100%);
}

.falling-char {
  position: absolute;
  transform: translate(-50%, -50%);
  font-size: 32px;
  font-weight: bold;
  color: white;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  animation: pulse 0.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); }
  50% { transform: translate(-50%, -50%) scale(1.1); }
}

.typed-char {
  position: absolute;
  transform: translate(-50%, -50%);
  font-size: 24px;
  color: var(--error-color);
}

.typed-char.correct {
  color: var(--success-color);
}

.flying-char {
  position: absolute;
  transform: translate(-50%, -50%);
  font-size: 28px;
  animation: fly 0.3s ease-out forwards;
}

@keyframes fly {
  0% { opacity: 1; }
  100% { opacity: 0; transform: translate(-50%, -150%); }
}

.frog {
  position: absolute;
  bottom: 10px;
  font-size: 48px;
  transition: left 0.2s ease;
}
</style>
