<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'complete', result: any): void
}>()

interface Alien {
  id: number
  word: string
  x: number
  y: number
  speed: number
  typedIndex: number
  alive: boolean
  explosionFrame: number
}

const gameAreaRef = ref<HTMLElement | null>(null)
const gameWidth = ref(600)
const gameHeight = ref(400)

const lives = ref(3)
const score = ref(0)
const isPlaying = ref(false)
const isGameOver = ref(false)
const aliens = ref<Alien[]>([])
const currentInput = ref('')
const destroyedCount = ref(0)
let nextAlienId = 0
let gameLoop: number | null = null
let spawnTimer: number | null = null

const wpm = computed(() => {
  if (destroyedCount.value === 0) return 0
  return Math.round(destroyedCount.value * 12)
})

const accuracy = computed(() => {
  return 100
})

const words = [
  'zap', 'boom', 'bang', 'pew', 'pow', 'destroy', 'invade', 'attack', 'alien', 'ufo',
  'space', 'laser', 'blast', 'comet', 'orbit', 'galaxy', 'rocket', 'planet', 'star', 'moon'
]

function spawnAlien() {
  if (!isPlaying.value || isGameOver.value) return

  const word = words[Math.floor(Math.random() * words.length)]
  const cols = 6
  const colWidth = gameWidth.value / cols
  const col = Math.floor(Math.random() * cols)
  const x = col * colWidth + colWidth / 2

  aliens.value.push({
    id: nextAlienId++,
    word,
    x,
    y: -50,
    speed: 0.3 + Math.random() * 0.2,
    typedIndex: 0,
    alive: true,
    explosionFrame: 0
  })
}

function startGame() {
  lives.value = 3
  score.value = 0
  destroyedCount.value = 0
  isPlaying.value = true
  isGameOver.value = false
  aliens.value = []
  currentInput.value = ''
  nextAlienId = 0

  if (gameAreaRef.value) {
    gameWidth.value = gameAreaRef.value.offsetWidth
    gameHeight.value = gameAreaRef.value.offsetHeight
  }

  gameLoop = requestAnimationFrame(update)
  spawnAlien()
  spawnTimer = window.setInterval(() => {
    if (isPlaying.value && !isGameOver.value) {
      spawnAlien()
    }
  }, 2000)
}

function update() {
  if (!isPlaying.value || isGameOver.value) return

  aliens.value.forEach(alien => {
    if (alien.alive) {
      alien.y += alien.speed
    }
  })

  aliens.value = aliens.value.filter(alien => {
    if (!alien.alive) {
      alien.explosionFrame++
      return alien.explosionFrame < 10
    }
    if (alien.y > gameHeight.value - 60) {
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
    aliens.value.forEach(a => {
      if (a.alive && a.word.startsWith(currentInput.value)) {
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
    aliens.value.forEach(alien => {
      if (alien.alive && alien.word.startsWith(currentInput.value)) {
        alien.typedIndex = currentInput.value.length
        if (alien.word === currentInput.value) {
          alien.alive = false
          destroyedCount.value++
          score.value += alien.word.length * 10
          currentInput.value = ''

          aliens.value.forEach(a => {
            if (a.alive) a.typedIndex = 0
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
  <div class="alien-invasion">
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
          <span class="label">消灭</span>
          <span class="value">{{ destroyedCount }}</span>
        </div>
      </div>
      <button class="btn btn-secondary" @click="emit('back')">退出</button>
    </div>

    <div v-if="!isPlaying && !isGameOver" class="start-screen">
      <div class="alien-icon">👾</div>
      <h2>外星入侵</h2>
      <p>外星人入侵地球，输入单词消灭它们！</p>
      <p class="tips">输入外星人身上的单词<br/>外星人到达底部会损失生命</p>
      <button class="btn btn-primary" @click="startGame">开始游戏</button>
    </div>

    <div v-if="isGameOver" class="game-over">
      <h2>地球沦陷</h2>
      <div class="result-stats">
        <div class="result-item">
          <span class="label">最终得分</span>
          <span class="value">{{ score }}</span>
        </div>
        <div class="result-item">
          <span class="label">消灭外星人</span>
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
      <div class="stars">
        <div v-for="i in 30" :key="i" class="star" :style="{
          left: Math.random() * 100 + '%',
          top: Math.random() * 100 + '%',
          animationDelay: Math.random() * 2 + 's'
        }"></div>
      </div>

      <div
        v-for="alien in aliens"
        :key="alien.id"
        class="alien"
        :class="{ exploding: !alien.alive }"
        :style="{ left: alien.x + 'px', top: alien.y + 'px' }"
      >
        <template v-if="alien.alive">
          <div class="alien-body">
            <div class="alien-eyes">
              <span class="eye">👽</span>
            </div>
          </div>
          <div class="word-display">
            <span class="typed">{{ alien.word.slice(0, alien.typedIndex) }}</span>
            <span class="remaining">{{ alien.word.slice(alien.typedIndex) }}</span>
          </div>
        </template>
        <template v-else>
          <div class="explosion">💥</div>
        </template>
      </div>

      <div class="defense-line"></div>

      <div class="input-display">
        <span class="input-text">{{ currentInput }}</span>
        <span class="cursor">|</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.alien-invasion {
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

.alien-icon {
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
  background: linear-gradient(180deg, #000000 0%, #0a0a20 50%, #1a1a3a 100%);
  border-radius: 16px;
  overflow: hidden;
  position: relative;
}

.stars {
  position: absolute;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.star {
  position: absolute;
  width: 2px;
  height: 2px;
  background: white;
  border-radius: 50%;
  animation: twinkle 2s ease-in-out infinite;
}

@keyframes twinkle {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}

.alien {
  position: absolute;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.alien-body {
  width: 60px;
  height: 50px;
  background: linear-gradient(135deg, #9333ea 0%, #c026d3 100%);
  border-radius: 50% 50% 30% 30%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 15px rgba(147, 51, 234, 0.5);
  animation: hover 1s ease-in-out infinite;
}

@keyframes hover {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

.alien-eyes {
  display: flex;
  gap: 10px;
}

.eye {
  font-size: 20px;
}

.word-display {
  background: rgba(0, 0, 0, 0.8);
  border: 2px solid #9333ea;
  padding: 6px 14px;
  border-radius: 8px;
  margin-top: 8px;
  box-shadow: 0 0 15px rgba(147, 51, 234, 0.5);
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

.alien.exploding {
  animation: explode 0.3s ease-out;
}

@keyframes explode {
  0% { transform: translateX(-50%) scale(1); opacity: 1; }
  50% { transform: translateX(-50%) scale(1.5); opacity: 0.5; }
  100% { transform: translateX(-50%) scale(2); opacity: 0; }
}

.explosion {
  font-size: 40px;
}

.defense-line {
  position: absolute;
  bottom: 80px;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, transparent, var(--success-color), transparent);
  box-shadow: 0 0 20px var(--success-color);
}

.input-display {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  border: 2px solid var(--primary-color);
  padding: 12px 24px;
  border-radius: 25px;
  box-shadow: 0 0 20px rgba(147, 51, 234, 0.3);
  min-width: 200px;
  text-align: center;
}

.input-text {
  font-family: 'Courier New', monospace;
  font-size: 24px;
  font-weight: bold;
  color: #9333ea;
}

.cursor {
  font-size: 24px;
  color: #9333ea;
  animation: blink 0.5s infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}
</style>
