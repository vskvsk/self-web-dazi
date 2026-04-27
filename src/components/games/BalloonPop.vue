<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'complete', result: any): void
}>()

interface Balloon {
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
const balloons = ref<Balloon[]>([])
const explosions = ref<{ id: number; x: number; y: number; frame: number }[]>([])
const currentInput = ref('')
const failedWords = ref(0)
let nextBalloonId = 0
let explosionId = 0
let gameLoop: number | null = null
let gameStartTime = 0
let gameTime = 0
let lastSpawnTime = 0

const wpm = computed(() => {
  const totalChars = balloons.value.reduce((sum, b) => sum + b.word.length, 0)
  if (totalChars === 0) return 0
  return Math.round(totalChars / 2)
})

const accuracy = computed(() => {
  const total = score.value + failedWords.value * 10
  if (total === 0) return 100
  return Math.round((score.value / total) * 100)
})

const easyWords = [
  'cat', 'dog', 'sun', 'hat', 'run', 'big', 'red', 'box', 'cup', 'pen',
  'apple', 'book', 'cake', 'door', 'fish', 'game', 'hand', 'jump', 'king', 'lamp',
  'bird', 'tree', 'frog', 'duck', 'bear', 'milk', 'moon', 'nest', 'owl', 'pig'
]

const mediumWords = [
  'happy', 'house', 'mouse', 'plant', 'quiet', 'river', 'snake', 'tiger', 'water', 'zebra',
  'apple', 'beach', 'chair', 'dance', 'earth', 'flame', 'grape', 'horse', 'juice', 'kite'
]

const hardWords = [
  'purple', 'orange', 'garden', 'flower', 'forest', 'bridge', 'castle', 'dragon', 'energy', 'frozen',
  'island', 'jungle', 'knight', 'ladder', 'magnet', 'nature', 'ocean', 'palace', 'rocket', 'shadow'
]

function getRandomWord(): string {
  const rand = Math.random()
  if (rand < 0.3) {
    return easyWords[Math.floor(Math.random() * easyWords.length)]
  } else if (rand < 0.7) {
    return mediumWords[Math.floor(Math.random() * mediumWords.length)]
  } else {
    return hardWords[Math.floor(Math.random() * hardWords.length)]
  }
}

function spawnBalloon() {
  if (!isPlaying.value || isGameOver.value) return

  const word = getRandomWord()
  const x = 60 + Math.random() * (gameWidth.value - 120)

  // 根据游戏时间增加基础速度（每30秒速度增加约30%）
  const speedMultiplier = 1 + (gameTime / 30000) * 0.3
  const baseSpeed = (0.5 + Math.random() * 0.3) * speedMultiplier
  // 限制最大速度，防止过快
  const maxSpeed = 2.0
  const speed = Math.min(baseSpeed, maxSpeed)

  balloons.value.push({
    id: nextBalloonId++,
    word,
    x,
    y: 500,
    speed,
    typedIndex: 0
  })
}

function startGame() {
  lives.value = 3
  score.value = 0
  failedWords.value = 0
  isPlaying.value = true
  isGameOver.value = false
  balloons.value = []
  explosions.value = []
  currentInput.value = ''
  nextBalloonId = 0
  gameStartTime = 0
  gameTime = 0
  lastSpawnTime = 0

  if (gameAreaRef.value) {
    gameWidth.value = gameAreaRef.value.offsetWidth
  }

  gameLoop = requestAnimationFrame(update)
  spawnBalloon()
}

function update(timestamp: number) {
  if (!isPlaying.value || isGameOver.value) return

  // 初始化游戏开始时间
  if (!gameStartTime) {
    gameStartTime = timestamp
    lastSpawnTime = timestamp
  }

  gameTime = timestamp - gameStartTime

  // 动态调整生成间隔（最快 1 秒）
  const currentSpawnInterval = Math.max(1000, 3000 - gameTime * 0.02)

  // 检查是否需要生成新气球
  if (timestamp - lastSpawnTime > currentSpawnInterval) {
    spawnBalloon()
    lastSpawnTime = timestamp
  }

  balloons.value.forEach(balloon => {
    balloon.y -= balloon.speed
  })

  // 清理过期的爆炸效果
  explosions.value = explosions.value.filter(exp => {
    exp.frame++
    return exp.frame < 15
  })

  balloons.value = balloons.value.filter(balloon => {
    if (balloon.y < -80) {
      if (balloon.typedIndex === 0) {
        failedWords.value++
        lives.value--
        if (lives.value <= 0) {
          endGame()
          return false
        }
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
    balloons.value.forEach(b => {
      if (b.word.startsWith(currentInput.value) && b.word.length > currentInput.value.length) {
        b.typedIndex = currentInput.value.length
      }
    })
    return
  }

  if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
    e.preventDefault()
    const char = e.key.toLowerCase()
    currentInput.value += char

    let matched = false
    balloons.value.forEach(balloon => {
      const typed = currentInput.value
      if (balloon.word.startsWith(typed)) {
        balloon.typedIndex = typed.length
        if (balloon.word === typed) {
          score.value += balloon.word.length * 2
          // 创建爆炸效果
          explosions.value.push({
            id: explosionId++,
            x: balloon.x,
            y: balloon.y + 30,
            frame: 0
          })
          balloons.value = balloons.value.filter(b => b.id !== balloon.id)
          currentInput.value = ''
          matched = true

          balloons.value.forEach(b => {
            b.typedIndex = 0
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
})
</script>

<template>
  <div class="balloon-pop">
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
      <div class="balloon-icon">🎈</div>
      <h2>打字气球</h2>
      <p>输入气球上的单词让它们爆炸！</p>
      <p class="tips">输入正确的单词<br/>气球飘到顶部会消失</p>
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
      <div
        v-for="balloon in balloons"
        :key="balloon.id"
        class="balloon"
        :style="{ left: balloon.x + 'px', top: balloon.y + 'px' }"
      >
        <div class="balloon-body"></div>
        <span class="balloon-string">|</span>
        <div class="word-display">
          <span class="typed">{{ balloon.word.slice(0, balloon.typedIndex) }}</span>
          <span class="remaining">{{ balloon.word.slice(balloon.typedIndex) }}</span>
        </div>
      </div>

      <!-- 爆炸效果 -->
      <div
        v-for="(exp, index) in explosions"
        :key="index"
        class="explosion"
        :class="{ exploding: true }"
        :style="{ left: exp.x + 'px', top: exp.y + 'px' }"
      >
        <span>💥</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.balloon-pop {
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

.balloon-icon {
  font-size: 80px;
  margin-bottom: 20px;
  animation: float 2s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0) rotate(-5deg); }
  50% { transform: translateY(-20px) rotate(5deg); }
}

.start-screen h2,
.game-over h2 {
  font-size: 28px;
  color: var(--error-color);
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
  background: linear-gradient(180deg, #87CEEB 0%, #E0F7FA 100%);
  border-radius: 16px;
  overflow: hidden;
  position: relative;
}

.balloon {
  position: absolute;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.balloon {
  animation: sway 2s ease-in-out infinite;
}

@keyframes sway {
  0%, 100% { transform: translateX(-50%) rotate(-3deg); }
  50% { transform: translateX(-50%) rotate(3deg); }
}

.balloon-body {
  width: 70px;
  height: 85px;
  background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 50%, #ffd93d 100%);
  border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
  position: relative;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  opacity: 0.7;
}

.balloon-body::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 12px solid #ff6b6b;
}

.balloon-string {
  font-size: 24px;
  color: #666;
  margin-top: 5px;
}

.word-display {
  background: white;
  padding: 8px 16px;
  border-radius: 20px;
  margin-top: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  font-family: monospace;
  font-size: 18px;
  font-weight: bold;
}

.word-display .typed {
  color: var(--success-color);
}

.word-display .remaining {
  color: var(--text-color);
}

.explosion {
  position: absolute;
  transform: translate(-50%, -50%);
  font-size: 40px;
  pointer-events: none;
}

.explosion.exploding {
  animation: explode 0.4s ease-out forwards;
}

@keyframes explode {
  0% {
    transform: translate(-50%, -50%) scale(0.5);
    opacity: 1;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.5);
    opacity: 0.8;
  }
  100% {
    transform: translate(-50%, -50%) scale(2);
    opacity: 0;
  }
}
</style>
