<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'complete', result: any): void
}>()

interface Ball {
  id: number
  char: string
  x: number
  y: number
  vx: number
  vy: number
  targetX: number | null
  typed: boolean
}

const gameAreaRef = ref<HTMLElement | null>(null)
const gameWidth = ref(600)
const gameHeight = ref(400)

const score = ref(0)
const isPlaying = ref(false)
const isGameOver = ref(false)
const balls = ref<Ball[]>([])
const currentInput = ref('')
const bouncedCount = ref(0)
const missedCount = ref(0)
let nextBallId = 0
let gameLoop: number | null = null
let spawnTimer: number | null = null

const wpm = computed(() => {
  if (bouncedCount.value === 0) return 0
  return Math.round(bouncedCount.value * 8)
})

const accuracy = computed(() => {
  const total = bouncedCount.value + missedCount.value
  if (total === 0) return 100
  return Math.round((bouncedCount.value / total) * 100)
})

const chars = 'asdfjkl;qwertyuiopzxcvbnm,.'.split('')

function spawnBall() {
  if (!isPlaying.value || isGameOver.value) return

  const char = chars[Math.floor(Math.random() * chars.length)]
  const x = 50 + Math.random() * (gameWidth.value - 100)
  balls.value.push({
    id: nextBallId++,
    char,
    x,
    y: 50,
    vx: (Math.random() - 0.5) * 4,
    vy: 2,
    targetX: null,
    typed: false
  })
}

function startGame() {
  score.value = 0
  bouncedCount.value = 0
  missedCount.value = 0
  isPlaying.value = true
  isGameOver.value = false
  balls.value = []
  currentInput.value = ''
  nextBallId = 0

  if (gameAreaRef.value) {
    gameWidth.value = gameAreaRef.value.offsetWidth
    gameHeight.value = gameAreaRef.value.offsetHeight
  }

  gameLoop = requestAnimationFrame(update)
  spawnBall()
  spawnTimer = window.setInterval(() => {
    if (isPlaying.value && !isGameOver.value && balls.value.length < 8) {
      spawnBall()
    }
  }, 1500)
}

function update() {
  if (!isPlaying.value || isGameOver.value) return

  balls.value.forEach(ball => {
    if (!ball.typed) {
      ball.x += ball.vx
      ball.y += ball.vy

      if (ball.x <= 30 || ball.x >= gameWidth.value - 30) {
        ball.vx = -ball.vx
        ball.x = Math.max(30, Math.min(gameWidth.value - 30, ball.x))
      }

      if (ball.y >= gameHeight.value - 40) {
        ball.vy = -Math.abs(ball.vy) * 0.85
        ball.vx *= 0.95

        if (ball.vy > -3) {
          missedCount.value++
          ball.typed = true
          setTimeout(() => {
            balls.value = balls.value.filter(b => b.id !== ball.id)
          }, 100)
        }
      }
    } else {
      ball.vy += 2
      ball.y += ball.vy
      if (ball.y > gameHeight.value + 50) {
        balls.value = balls.value.filter(b => b.id !== ball.id)
      }
    }
  })

  if (missedCount.value >= 10) {
    endGame()
    return
  }

  gameLoop = requestAnimationFrame(update)
}

function handleKeyDown(e: KeyboardEvent) {
  if (!isPlaying.value || isGameOver.value) return

  if (e.key === 'Backspace') {
    e.preventDefault()
    return
  }

  if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
    e.preventDefault()
    const char = e.key.toLowerCase()

    const targetBall = balls.value.find(b => !b.typed && b.char === char)
    if (targetBall) {
      bouncedCount.value++
      score.value += 10
      targetBall.typed = true
      targetBall.vy = -15
      targetBall.vx = (Math.random() - 0.5) * 10
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
  <div class="pinball-typing">
    <div class="game-header">
      <div class="stats">
        <div class="stat">
          <span class="label">得分</span>
          <span class="value score">{{ score }}</span>
        </div>
        <div class="stat">
          <span class="label">反弹</span>
          <span class="value">{{ bouncedCount }}</span>
        </div>
        <div class="stat">
          <span class="label">失误</span>
          <span class="value error">{{ missedCount }}/10</span>
        </div>
      </div>
      <button class="btn btn-secondary" @click="emit('back')">退出</button>
    </div>

    <div v-if="!isPlaying && !isGameOver" class="start-screen">
      <div class="pinball-icon">🎱</div>
      <h2>弹珠打字</h2>
      <p>弹珠在台面上弹跳，输入正确的字母让它加速反弹！</p>
      <p class="tips">在弹珠上显示的字母出现时<br/>立即按下对应键让它反弹</p>
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
          <span class="label">反弹次数</span>
          <span class="value">{{ bouncedCount }}</span>
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
      <div class="pinball-table">
        <div class="bumpers">
          <div class="bumper" v-for="i in 5" :key="i" :style="{ left: (15 + i * 15) + '%' }">●</div>
        </div>

        <div
          v-for="ball in balls"
          :key="ball.id"
          class="ball"
          :class="{ typed: ball.typed }"
          :style="{ left: ball.x + 'px', top: ball.y + 'px' }"
        >
          <span class="ball-char">{{ ball.char.toUpperCase() }}</span>
        </div>

        <div class="flippers">
          <div class="flipper left"></div>
          <div class="flipper right"></div>
        </div>

        <div class="gutter"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pinball-typing {
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

.pinball-icon {
  font-size: 80px;
  margin-bottom: 20px;
  animation: bounce 1s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-15px) rotate(5deg); }
  75% { transform: translateY(-15px) rotate(-5deg); }
}

.start-screen h2,
.game-over h2 {
  font-size: 28px;
  color: var(--warning-color);
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
  border-radius: 16px;
  overflow: hidden;
}

.pinball-table {
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, #1a1a2e 0%, #2d1f3d 50%, #1a1a2e 100%);
  border-radius: 16px;
  position: relative;
  overflow: hidden;
}

.pinball-table::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.05) 0%, transparent 70%);
  pointer-events: none;
}

.bumpers {
  position: absolute;
  top: 40%;
  left: 0;
  right: 0;
  height: 60px;
}

.bumper {
  position: absolute;
  width: 20px;
  height: 20px;
  background: radial-gradient(circle, #ff6b6b 0%, #c026d3 100%);
  border-radius: 50%;
  transform: translateX(-50%);
  box-shadow: 0 0 15px rgba(255, 107, 107, 0.6);
  animation: glow 1.5s ease-in-out infinite alternate;
}

@keyframes glow {
  0% { box-shadow: 0 0 15px rgba(255, 107, 107, 0.6); }
  100% { box-shadow: 0 0 25px rgba(255, 107, 107, 0.9); }
}

.ball {
  position: absolute;
  width: 50px;
  height: 50px;
  background: radial-gradient(circle at 30% 30%, #ff6b6b, #c026d3);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 15px rgba(192, 38, 211, 0.5),
              inset 0 -5px 15px rgba(0, 0, 0, 0.3);
  transition: transform 0.1s ease;
}

.ball.typed {
  background: radial-gradient(circle at 30% 30%, #4ade80, #22c55e);
  box-shadow: 0 0 30px rgba(74, 222, 128, 0.8);
  animation: flyUp 0.5s ease-out;
}

@keyframes flyUp {
  0% { transform: translate(-50%, -50%) scale(1); }
  50% { transform: translate(-50%, -50%) scale(1.3); }
  100% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
}

.ball-char {
  font-family: 'Arial Black', sans-serif;
  font-size: 24px;
  font-weight: bold;
  color: white;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

.flippers {
  position: absolute;
  bottom: 40px;
  left: 0;
  right: 0;
  height: 30px;
}

.flipper {
  position: absolute;
  width: 80px;
  height: 15px;
  background: linear-gradient(90deg, #3b82f6, #60a5fa);
  border-radius: 8px;
  bottom: 0;
  box-shadow: 0 2px 10px rgba(59, 130, 246, 0.5);
}

.flipper.left {
  left: 20%;
  transform: rotate(-30deg);
  transform-origin: left center;
  border-radius: 8px 0 0 8px;
}

.flipper.right {
  right: 20%;
  transform: rotate(30deg);
  transform-origin: right center;
  border-radius: 0 8px 8px 0;
}

.gutter {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 20px;
  background: linear-gradient(90deg,
    transparent 0%,
    #ef4444 20%,
    #ef4444 25%,
    transparent 25%,
    transparent 75%,
    #ef4444 75%,
    #ef4444 80%,
    transparent 80%
  );
}
</style>
