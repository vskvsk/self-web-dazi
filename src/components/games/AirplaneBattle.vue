<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'complete', result: any): void
}>()

interface Airplane {
  id: number
  word: string
  x: number
  y: number
  speed: number
  typedIndex: number
}

const gameAreaRef = ref<HTMLElement | null>(null)
const gameWidth = ref(600)

const lives = ref(3)
const score = ref(0)
const isPlaying = ref(false)
const isGameOver = ref(false)
const airplanes = ref<Airplane[]>([])
const currentInput = ref('')
const destroyedCount = ref(0)
let nextAirplaneId = 0
let gameLoop: number | null = null
let spawnTimer: number | null = null

const wpm = computed(() => {
  if (destroyedCount.value === 0) return 0
  return Math.round(destroyedCount.value * 10)
})

const accuracy = computed(() => {
  return 100
})

const words = [
  'fire', 'shot', 'boom', 'wing', 'fuel', 'pilot', 'fly', 'sky', 'jet', 'runway',
  'air', 'cloud', 'flight', 'speed', 'wind', 'plane', 'takeoff', 'landing', 'engine', 'control'
]

function spawnAirplane() {
  if (!isPlaying.value || isGameOver.value) return

  const word = words[Math.floor(Math.random() * words.length)]
  const x = 60 + Math.random() * (gameWidth.value - 120)
  airplanes.value.push({
    id: nextAirplaneId++,
    word,
    x,
    y: -60,
    speed: 0.8 + Math.random() * 0.4,
    typedIndex: 0
  })
}

function startGame() {
  lives.value = 3
  score.value = 0
  destroyedCount.value = 0
  isPlaying.value = true
  isGameOver.value = false
  airplanes.value = []
  currentInput.value = ''
  nextAirplaneId = 0

  if (gameAreaRef.value) {
    gameWidth.value = gameAreaRef.value.offsetWidth
  }

  gameLoop = requestAnimationFrame(update)
  spawnAirplane()
  spawnTimer = window.setInterval(() => {
    if (isPlaying.value && !isGameOver.value) {
      spawnAirplane()
    }
  }, 2500)
}

function update() {
  if (!isPlaying.value || isGameOver.value) return

  airplanes.value.forEach(plane => {
    plane.y += plane.speed
  })

  airplanes.value = airplanes.value.filter(plane => {
    if (plane.y > 450) {
      lives.value--
      if (lives.value <= 0) {
        endGame()
        return false
      }
      return false
    }
    return true
  })

  gameLoop = requestAnimationFrame(update)
}

function handleKeyDown(e: KeyboardEvent) {
  if (!isPlaying.value || isGameOver.value) return

  if (e.key === 'Backspace') {
    e.preventDefault()
    currentInput.value = currentInput.value.slice(0, -1)
    airplanes.value.forEach(a => {
      if (a.word.startsWith(currentInput.value)) {
        a.typedIndex = currentInput.value.length
      }
    })
    return
  }

  if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
    e.preventDefault()
    const char = e.key.toLowerCase()
    currentInput.value += char

    let matched = false
    airplanes.value.forEach(plane => {
      if (plane.word.startsWith(currentInput.value)) {
        plane.typedIndex = currentInput.value.length
        if (plane.word === currentInput.value) {
          destroyedCount.value++
          score.value += plane.word.length * 5
          airplanes.value = airplanes.value.filter(a => a.id !== plane.id)
          currentInput.value = ''
          matched = true

          airplanes.value.forEach(a => {
            a.typedIndex = 0
          })
        }
        matched = true
      }
    })

    if (!matched) {
      currentInput.value = currentInput.value.slice(0, -1)
    }
  }
}

function endGame() {
  isPlaying.value = false
  isGameOver.value = true
  if (gameLoop) cancelAnimationFrame(gameLoop)
  if (spawnTimer) clearInterval(spawnTimer)
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
  if (spawnTimer) clearInterval(spawnTimer)
})
</script>

<template>
  <div class="airplane-battle">
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
        <div class="stat">
          <span class="label">击落</span>
          <span class="value">{{ destroyedCount }}</span>
        </div>
      </div>
      <button class="btn btn-secondary" @click="emit('back')">退出</button>
    </div>

    <div v-if="!isPlaying && !isGameOver" class="start-screen">
      <div class="plane-icon">✈️</div>
      <h2>飞机大战</h2>
      <p>敌机来袭，输入机身上的代码击落它们！</p>
      <p class="tips">输入敌机上的单词<br/>敌机到达底部会损失生命</p>
      <button class="btn btn-primary" @click="startGame">开始游戏</button>
    </div>

    <div v-if="isGameOver" class="game-over">
      <h2>任务失败</h2>
      <div class="result-stats">
        <div class="result-item">
          <span class="label">最终得分</span>
          <span class="value">{{ score }}</span>
        </div>
        <div class="result-item">
          <span class="label">击落敌机</span>
          <span class="value">{{ destroyedCount }}</span>
        </div>
        <div class="result-item">
          <span class="label">打字速度</span>
          <span class="value">{{ wpm }} WPM</span>
        </div>
      </div>
      <div class="actions">
        <button class="btn btn-primary" @click="retry">再来一次</button>
        <button class="btn btn-secondary" @click="emit('back')">返回</button>
      </div>
    </div>

    <div v-if="isPlaying" ref="gameAreaRef" class="game-area">
      <div class="clouds">
        <div class="cloud cloud-1"></div>
        <div class="cloud cloud-2"></div>
        <div class="cloud cloud-3"></div>
      </div>

      <div
        v-for="plane in airplanes"
        :key="plane.id"
        class="airplane"
        :style="{ left: plane.x + 'px', top: plane.y + 'px' }"
      >
        <div class="plane-body">
          <span class="plane-icon">✈️</span>
        </div>
        <div class="word-display">
          <span class="typed">{{ plane.word.slice(0, plane.typedIndex) }}</span>
          <span class="remaining">{{ plane.word.slice(plane.typedIndex) }}</span>
        </div>
      </div>

      <div class="crosshair"></div>

      <div class="input-display">
        <span class="input-text">{{ currentInput }}</span>
        <span class="cursor">|</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.airplane-battle {
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

.plane-icon {
  font-size: 80px;
  margin-bottom: 20px;
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
  height: 500px;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  border-radius: 16px;
  overflow: hidden;
  position: relative;
}

.clouds {
  position: absolute;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.cloud {
  position: absolute;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
}

.cloud-1 {
  width: 100px;
  height: 40px;
  top: 20%;
  animation: drift 20s linear infinite;
}

.cloud-2 {
  width: 150px;
  height: 50px;
  top: 40%;
  animation: drift 25s linear infinite reverse;
}

.cloud-3 {
  width: 80px;
  height: 30px;
  top: 60%;
  animation: drift 15s linear infinite;
}

@keyframes drift {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(calc(100vw + 100%)); }
}

.airplane {
  position: absolute;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: top 0.05s linear;
}

.plane-body {
  transform: rotate(180deg);
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.5));
}

.plane-icon {
  font-size: 50px;
}

.word-display {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 2px solid var(--primary-color);
  padding: 6px 14px;
  border-radius: 8px;
  margin-top: 5px;
  box-shadow: 0 0 15px rgba(59, 130, 246, 0.5);
  font-family: 'Courier New', monospace;
  font-size: 16px;
  font-weight: bold;
}

.word-display .typed {
  color: var(--success-color);
  text-shadow: 0 0 10px rgba(34, 197, 94, 0.8);
}

.word-display .remaining {
  color: white;
}

.crosshair {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60px;
  height: 60px;
  border: 2px solid rgba(59, 130, 246, 0.3);
  border-radius: 50%;
  pointer-events: none;
}

.crosshair::before,
.crosshair::after {
  content: '';
  position: absolute;
  background: rgba(59, 130, 246, 0.3);
}

.crosshair::before {
  width: 100%;
  height: 1px;
  top: 50%;
}

.crosshair::after {
  width: 1px;
  height: 100%;
  left: 50%;
}

.input-display {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(26, 26, 46, 0.9);
  border: 2px solid var(--primary-color);
  padding: 12px 24px;
  border-radius: 25px;
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
  min-width: 200px;
  text-align: center;
}

.input-text {
  font-family: 'Courier New', monospace;
  font-size: 24px;
  font-weight: bold;
  color: var(--primary-color);
}

.cursor {
  font-size: 24px;
  color: var(--primary-color);
  animation: blink 0.5s infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}
</style>
