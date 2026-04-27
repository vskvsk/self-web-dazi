<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'complete', result: any): void
}>()

interface Fruit {
  id: number
  word: string
  x: number
  y: number
  speed: number
  rotation: number
  sliced: boolean
  sliceAngle: number
  vy1: number
  vy2: number
  typedIndex: number
}

const gameAreaRef = ref<HTMLElement | null>(null)
const gameWidth = ref(600)
const gameHeight = ref(400)

const score = ref(0)
const isPlaying = ref(false)
const isGameOver = ref(false)
const fruits = ref<Fruit[]>([])
const currentInput = ref('')
const slicedCount = ref(0)
const missedCount = ref(0)
let nextFruitId = 0
let gameLoop: number | null = null
let spawnTimer: number | null = null

const wpm = computed(() => {
  if (slicedCount.value === 0) return 0
  return Math.round(slicedCount.value * 10)
})

const accuracy = computed(() => {
  const total = slicedCount.value + missedCount.value
  if (total === 0) return 100
  return Math.round((slicedCount.value / total) * 100)
})

const fruitEmojis = ['🍎', '🍊', '🍋', '🍇', '🍓', '🍑', '🍒', '🥝', '🍍', '🥭']

const words = [
  'apple', 'orange', 'lemon', 'grape', 'berry', 'peach', 'cherry', 'kiwi', 'mango', 'slice',
  'cut', 'fresh', 'sweet', 'juice', 'fruit', 'ripe', 'peel', 'seed', 'skin', 'pulp'
]

function getRandomWord(): string {
  return words[Math.floor(Math.random() * words.length)]
}

function spawnFruit() {
  if (!isPlaying.value || isGameOver.value) return

  const word = getRandomWord()
  const emoji = fruitEmojis[Math.floor(Math.random() * fruitEmojis.length)]
  const x = 60 + Math.random() * (gameWidth.value - 120)
  fruits.value.push({
    id: nextFruitId++,
    word,
    x,
    y: -80,
    speed: 2 + Math.random() * 1,
    rotation: (Math.random() - 0.5) * 10,
    sliced: false,
    sliceAngle: 0,
    vy1: -3,
    vy2: 3,
    typedIndex: 0
  })
}

function startGame() {
  score.value = 0
  slicedCount.value = 0
  missedCount.value = 0
  isPlaying.value = true
  isGameOver.value = false
  fruits.value = []
  currentInput.value = ''
  nextFruitId = 0

  if (gameAreaRef.value) {
    gameWidth.value = gameAreaRef.value.offsetWidth
    gameHeight.value = gameAreaRef.value.offsetHeight
  }

  gameLoop = requestAnimationFrame(update)
  spawnFruit()
  spawnTimer = window.setInterval(() => {
    if (isPlaying.value && !isGameOver.value && fruits.value.filter(f => !f.sliced).length < 5) {
      spawnFruit()
    }
  }, 2000)
}

function update() {
  if (!isPlaying.value || isGameOver.value) return

  fruits.value.forEach(fruit => {
    if (!fruit.sliced) {
      fruit.y += fruit.speed
      fruit.rotation += 1
    } else {
      fruit.y += fruit.vy1
      fruit.sliceAngle += 5
    }
  })

  fruits.value = fruits.value.filter(fruit => {
    if (fruit.sliced) {
      return fruit.y > -100 && fruit.y < gameHeight.value + 100
    }
    if (fruit.y > gameHeight.value + 50) {
      missedCount.value++
      if (missedCount.value >= 10) {
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
    fruits.value.forEach(f => {
      if (f.word.startsWith(currentInput.value)) {
        f.typedIndex = currentInput.value.length
      }
    })
    return
  }

  if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
    e.preventDefault()
    const char = e.key.toLowerCase()
    currentInput.value += char

    let matched = false
    fruits.value.forEach(fruit => {
      if (!fruit.sliced && fruit.word.startsWith(currentInput.value)) {
        fruit.typedIndex = currentInput.value.length
        if (fruit.word === currentInput.value) {
          slicedCount.value++
          score.value += fruit.word.length * 5
          fruit.sliced = true
          currentInput.value = ''

          fruits.value.forEach(f => {
            if (!f.sliced) f.typedIndex = 0
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
  <div class="fruit-catch">
    <div class="game-header">
      <div class="stats">
        <div class="stat">
          <span class="label">得分</span>
          <span class="value score">{{ score }}</span>
        </div>
        <div class="stat">
          <span class="label">切开</span>
          <span class="value">{{ slicedCount }}</span>
        </div>
        <div class="stat">
          <span class="label">失误</span>
          <span class="value error">{{ missedCount }}/10</span>
        </div>
      </div>
      <button class="btn btn-secondary" @click="emit('back')">退出</button>
    </div>

    <div v-if="!isPlaying && !isGameOver" class="start-screen">
      <div class="fruit-icon">🍎</div>
      <h2>水果忍者</h2>
      <p>水果带着字符掉落，输入字符切开它们！</p>
      <p class="tips">输入水果上的单词<br/>水果掉出屏幕会损失生命</p>
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
          <span class="label">切开水果</span>
          <span class="value">{{ slicedCount }}</span>
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
      <div class="background">
        <div class="blade-effect" v-if="currentInput.length > 0"></div>
      </div>

      <div
        v-for="fruit in fruits"
        :key="fruit.id"
        class="fruit-container"
        :style="{ left: fruit.x + 'px', top: fruit.y + 'px' }"
      >
        <template v-if="!fruit.sliced">
          <div class="fruit" :style="{ transform: `rotate(${fruit.rotation}deg)` }">
            <span class="fruit-emoji">{{ fruitEmojis[0] }}</span>
          </div>
          <div class="word-display">
            <span class="typed">{{ fruit.word.slice(0, fruit.typedIndex) }}</span>
            <span class="remaining">{{ fruit.word.slice(fruit.typedIndex) }}</span>
          </div>
        </template>
        <template v-else>
          <div class="sliced-fruit left" :style="{ transform: `rotate(-${fruit.sliceAngle}deg)` }">
            <span class="fruit-emoji">{{ fruitEmojis[0] }}</span>
            <div class="slice-half left-half"></div>
          </div>
          <div class="sliced-fruit right" :style="{ transform: `rotate(${fruit.sliceAngle}deg)` }">
            <span class="fruit-emoji">{{ fruitEmojis[0] }}</span>
            <div class="slice-half right-half"></div>
          </div>
          <div class="juice-effect"></div>
        </template>
      </div>

      <div class="input-display">
        <span class="input-text">{{ currentInput }}</span>
        <span class="cursor">|</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fruit-catch {
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

.stat .value.error {
  color: var(--error-color);
}

.start-screen,
.game-over {
  text-align: center;
  padding: 60px 20px;
  background: var(--bg-color);
  border: 2px solid var(--border-color);
  border-radius: 16px;
}

.fruit-icon {
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
  background: linear-gradient(180deg, #fef3c7 0%, #fde68a 50%, #f59e0b 100%);
  border-radius: 16px;
  overflow: hidden;
  position: relative;
}

.background {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.blade-effect {
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 4px;
  height: 100%;
  background: linear-gradient(0deg, transparent, rgba(255, 255, 255, 0.8), transparent);
  transform: translateX(-50%);
  animation: slash 0.3s ease-out;
}

@keyframes slash {
  0% { opacity: 0; height: 0; }
  50% { opacity: 1; }
  100% { opacity: 0; height: 100%; }
}

.fruit-container {
  position: absolute;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.fruit {
  width: 70px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.1s;
}

.fruit-emoji {
  font-size: 60px;
  filter: drop-shadow(2px 4px 6px rgba(0, 0, 0, 0.3));
}

.word-display {
  background: rgba(255, 255, 255, 0.95);
  padding: 6px 14px;
  border-radius: 20px;
  margin-top: 5px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
  font-family: monospace;
  font-size: 16px;
  font-weight: bold;
}

.word-display .typed {
  color: var(--success-color);
}

.word-display .remaining {
  color: var(--text-color);
}

.sliced-fruit {
  position: absolute;
  top: 0;
  width: 35px;
  height: 70px;
  overflow: hidden;
}

.sliced-fruit.left {
  left: 0;
}

.sliced-fruit.right {
  right: 0;
}

.sliced-fruit .fruit-emoji {
  font-size: 60px;
}

.slice-half {
  position: absolute;
  top: 0;
  width: 100%;
  height: 100%;
  background: inherit;
}

.left-half {
  right: 0;
  background: linear-gradient(90deg, transparent 50%, rgba(255, 200, 100, 0.8) 50%);
}

.right-half {
  left: 0;
  background: linear-gradient(90deg, rgba(255, 200, 100, 0.8) 50%, transparent 50%);
}

.juice-effect {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 60px;
  height: 60px;
  background: radial-gradient(circle, rgba(255, 200, 100, 0.8), transparent);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: juice 0.5s ease-out forwards;
}

@keyframes juice {
  0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
}

.input-display {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  border: 3px solid var(--primary-color);
  padding: 12px 24px;
  border-radius: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  min-width: 200px;
  text-align: center;
}

.input-text {
  font-family: monospace;
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
