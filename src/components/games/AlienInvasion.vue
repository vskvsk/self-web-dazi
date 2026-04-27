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

interface Ufo {
  id: number
  word: string
  x: number
  y: number
  speed: number
  typedIndex: number
  alive: boolean
  explosionFrame: number
  direction: number
  minX: number
  maxX: number
}

interface Laser {
  id: number
  x: number
  y: number
  targetId: number
  targetType: 'alien' | 'ufo'
  startX: number
  startY: number
  directionX: number
  directionY: number
}

const gameAreaRef = ref<HTMLElement | null>(null)
const gameWidth = ref(600)
const gameHeight = ref(400)

const lives = ref(3)
const score = ref(0)
const isPlaying = ref(false)
const isGameOver = ref(false)
const aliens = ref<Alien[]>([])
const ufos = ref<Ufo[]>([])
const lasers = ref<Laser[]>([])
const currentInput = ref('')
const destroyedCount = ref(0)
let nextAlienId = 0
let nextUfoId = 0
let nextLaserId = 0
let gameLoop: number | null = null
let spawnTimer: number | null = null
let ufoSpawnTimer: number | null = null

const wpm = computed(() => {
  if (destroyedCount.value === 0) return 0
  return Math.round(destroyedCount.value * 12)
})

const words = [
  'zap', 'boom', 'bang', 'pew', 'pow', 'destroy', 'invade', 'attack', 'alien', 'ufo',
  'space', 'laser', 'blast', 'comet', 'orbit', 'galaxy', 'rocket', 'planet', 'star', 'moon'
]

const ufoWords = [
  'mothership', 'teleport', 'wormhole', 'asteroid', 'nebula', 'voyager', 'gravity',
  'supernova', 'blackhole', 'quantum', 'photon', 'plasma', 'warpdrive', 'hyperspace'
]

function spawnUfo() {
  if (!isPlaying.value || isGameOver.value) return

  const word = ufoWords[Math.floor(Math.random() * ufoWords.length)]
  // UFO 从顶部中间区域出现
  const minX = gameWidth.value * 0.1
  const maxX = gameWidth.value * 0.9
  const x = minX + Math.random() * (maxX - minX)

  // UFO 更大的移动范围
  const moveRange = 100 + Math.random() * 80

  ufos.value.push({
    id: nextUfoId++,
    word,
    x,
    y: -60,
    speed: 0.4 + Math.random() * 0.3, // 比普通外星人快
    typedIndex: 0,
    alive: true,
    explosionFrame: 0,
    direction: Math.random() > 0.5 ? 1 : -1,
    minX: Math.max(minX, x - moveRange),
    maxX: Math.min(maxX, x + moveRange)
  })
}

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
  ufos.value = []
  lasers.value = []
  currentInput.value = ''
  nextAlienId = 0
  nextUfoId = 0
  nextLaserId = 0

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

  // UFO 较少出现
  ufoSpawnTimer = window.setInterval(() => {
    if (isPlaying.value && !isGameOver.value) {
      spawnUfo()
    }
  }, 8000)
}

function update() {
  if (!isPlaying.value || isGameOver.value) return

  // 更新外星人
  aliens.value.forEach(alien => {
    if (alien.alive) {
      alien.y += alien.speed
    }
  })

  // 更新 UFO（横向移动）
  ufos.value.forEach(ufo => {
    if (ufo.alive) {
      ufo.y += ufo.speed
      ufo.x += ufo.direction * 0.8 // 横向移动

      // 碰到边界反弹
      if (ufo.x <= ufo.minX || ufo.x >= ufo.maxX) {
        ufo.direction *= -1
        ufo.x = Math.max(ufo.minX, Math.min(ufo.maxX, ufo.x))
      }
    }
  })

  // 更新激光（斜向移动）
  const laserSpeed = 12
  lasers.value.forEach(laser => {
    laser.x += laser.directionX * laserSpeed
    laser.y += laser.directionY * laserSpeed
  })

  // 激光碰撞检测
  lasers.value = lasers.value.filter(laser => {
    let hit = false

    if (laser.targetType === 'alien') {
      const target = aliens.value.find(a => a.id === laser.targetId)
      if (target && target.alive) {
        const dx = laser.x - target.x
        const dy = laser.y - target.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 40) {
          target.alive = false
          score.value += target.word.length * 10
          destroyedCount.value++
          hit = true
        }
      } else {
        hit = true
      }
    } else if (laser.targetType === 'ufo') {
      const target = ufos.value.find(u => u.id === laser.targetId)
      if (target && target.alive) {
        const dx = laser.x - target.x
        const dy = laser.y - target.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 50) {
          target.alive = false
          score.value += target.word.length * 20
          destroyedCount.value++
          hit = true
        }
      } else {
        hit = true
      }
    }

    // 激光飞出屏幕
    return !hit && laser.y > -20 && laser.y < gameHeight.value + 20 &&
           laser.x > -20 && laser.x < gameWidth.value + 20
  })

  // 过滤已死亡的外星人
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

  // 过滤已死亡的 UFO
  ufos.value = ufos.value.filter(ufo => {
    if (!ufo.alive) {
      ufo.explosionFrame++
      return ufo.explosionFrame < 15 // UFO 爆炸时间更长
    }
    if (ufo.y > gameHeight.value - 60) {
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
    ufos.value.forEach(u => {
      if (u.alive && u.word.startsWith(currentInput.value)) {
        u.typedIndex = currentInput.value.length
      }
    })
    return
  }

  if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
    e.preventDefault()
    const char = e.key.toLowerCase()
    currentInput.value += char

    // 检查外星人匹配
    let matched = false
    aliens.value.forEach(alien => {
      if (alien.alive && alien.word.startsWith(currentInput.value)) {
        alien.typedIndex = currentInput.value.length
        if (alien.word === currentInput.value) {
          // 计算激光方向和起始位置（从底部中间斜向目标）
          const cannonX = gameWidth.value / 2
          const cannonY = gameHeight.value - 45
          const dx = alien.x - cannonX
          const dy = alien.y - cannonY
          const dist = Math.sqrt(dx * dx + dy * dy)

          lasers.value.push({
            id: nextLaserId++,
            x: cannonX,
            y: cannonY,
            startX: cannonX,
            startY: cannonY,
            targetId: alien.id,
            targetType: 'alien',
            directionX: dx / dist,
            directionY: dy / dist
          })
          currentInput.value = ''
          matched = true

          aliens.value.forEach(a => {
            if (a.alive) a.typedIndex = 0
          })
        }
        matched = true
      }
    })

    // 检查 UFO 匹配
    if (!matched) {
      ufos.value.forEach(ufo => {
        if (ufo.alive && ufo.word.startsWith(currentInput.value)) {
          ufo.typedIndex = currentInput.value.length
          if (ufo.word === currentInput.value) {
            // 计算激光方向和起始位置（从底部中间斜向目标）
            const cannonX = gameWidth.value / 2
            const cannonY = gameHeight.value - 45
            const dx = ufo.x - cannonX
            const dy = ufo.y - cannonY
            const dist = Math.sqrt(dx * dx + dy * dy)

            lasers.value.push({
              id: nextLaserId++,
              x: cannonX,
              y: cannonY,
              startX: cannonX,
              startY: cannonY,
              targetId: ufo.id,
              targetType: 'ufo',
              directionX: dx / dist,
              directionY: dy / dist
            })
            currentInput.value = ''
            matched = true

            ufos.value.forEach(u => {
              if (u.alive) u.typedIndex = 0
            })
          }
          matched = true
        }
      })
    }

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
  if (ufoSpawnTimer) clearInterval(ufoSpawnTimer)
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
  if (ufoSpawnTimer) clearInterval(ufoSpawnTimer)
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

      <!-- 激光效果 -->
      <div
        v-for="laser in lasers"
        :key="laser.id"
        class="laser"
        :style="{
          left: laser.x + 'px',
          top: laser.y + 'px',
          transform: `translate(-50%, -50%) rotate(${(Math.atan2(laser.directionY, laser.directionX) * 180 / Math.PI + 360) % 360}deg)`
        }"
      >
        <div class="laser-beam"></div>
      </div>

      <!-- 外星人 -->
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

      <!-- UFO 飞碟 -->
      <div
        v-for="ufo in ufos"
        :key="ufo.id"
        class="ufo"
        :class="{ exploding: !ufo.alive }"
        :style="{ left: ufo.x + 'px', top: ufo.y + 'px' }"
      >
        <template v-if="ufo.alive">
          <div class="ufo-body">
            <div class="ufo-dome"></div>
            <div class="ufo-lights">
              <span class="ufo-light" v-for="i in 5" :key="i"></span>
            </div>
          </div>
          <div class="ufo-beam"></div>
          <div class="word-display ufo-word">
            <span class="typed">{{ ufo.word.slice(0, ufo.typedIndex) }}</span>
            <span class="remaining">{{ ufo.word.slice(ufo.typedIndex) }}</span>
          </div>
        </template>
        <template v-else>
          <div class="explosion ufo-explosion">☄️💥</div>
        </template>
      </div>

      <div class="defense-line"></div>

      <!-- 激光炮 -->
      <div class="laser-cannon">
        <div class="cannon-base"></div>
        <div class="cannon-barrel"></div>
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

.laser {
  position: absolute;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 10;
}

.laser-beam {
  width: 30px;
  height: 8px;
  background: linear-gradient(to right, transparent, #ff6b6b, #ffd93d, #fff);
  border-radius: 4px;
  box-shadow: 0 0 10px #ff6b6b, 0 0 20px #ffd93d, 0 0 30px #ff6b6b;
  transform-origin: left center;
  position: relative;
}

.laser-beam::after {
  content: '';
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 8px;
  height: 8px;
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 0 10px #fff, 0 0 20px #ffd93d;
}

.ufo {
  position: absolute;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.ufo-body {
  width: 100px;
  height: 40px;
  background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #1d4ed8 100%);
  border-radius: 50%;
  position: relative;
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.8);
  animation: ufo-hover 0.5s ease-in-out infinite;
}

@keyframes ufo-hover {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.ufo-dome {
  position: absolute;
  top: -15px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 25px;
  background: linear-gradient(135deg, #93c5fd 0%, #60a5fa 100%);
  border-radius: 50% 50% 0 0;
  box-shadow: 0 0 15px rgba(147, 197, 253, 0.8);
}

.ufo-lights {
  position: absolute;
  bottom: -5px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 10px;
}

.ufo-light {
  width: 8px;
  height: 8px;
  background: #fbbf24;
  border-radius: 50%;
  animation: ufo-light-blink 0.3s infinite;
  box-shadow: 0 0 10px #fbbf24;
}

.ufo-light:nth-child(2) { animation-delay: 0.1s; }
.ufo-light:nth-child(3) { animation-delay: 0.2s; }
.ufo-light:nth-child(4) { animation-delay: 0.15s; }
.ufo-light:nth-child(5) { animation-delay: 0.25s; }

@keyframes ufo-light-blink {
  0%, 100% { opacity: 1; background: #fbbf24; }
  50% { opacity: 0.5; background: #f59e0b; }
}

.ufo-beam {
  width: 0;
  height: 0;
  border-left: 30px solid transparent;
  border-right: 30px solid transparent;
  border-top: 80px solid rgba(147, 197, 253, 0.2);
  margin-top: -5px;
}

.word-display.ufo-word {
  border-color: #3b82f6;
  box-shadow: 0 0 15px rgba(59, 130, 246, 0.5);
}

.ufo.exploding {
  animation: ufo-explode 0.5s ease-out;
}

@keyframes ufo-explode {
  0% { transform: translateX(-50%) scale(1); opacity: 1; }
  50% { transform: translateX(-50%) scale(1.8); opacity: 0.6; }
  100% { transform: translateX(-50%) scale(2.5); opacity: 0; }
}

.ufo-explosion {
  font-size: 60px;
  animation: ufo-explosion-flash 0.5s ease-out;
}

@keyframes ufo-explosion-flash {
  0% { transform: scale(0.5); opacity: 1; }
  30% { transform: scale(1.5); opacity: 1; }
  100% { transform: scale(2); opacity: 0; }
}

.laser-cannon {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.cannon-base {
  width: 60px;
  height: 30px;
  background: linear-gradient(135deg, #4b5563 0%, #1f2937 100%);
  border-radius: 8px 8px 4px 4px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
}

.cannon-barrel {
  width: 16px;
  height: 35px;
  background: linear-gradient(180deg, #6b7280 0%, #374151 50%, #6b7280 100%);
  border-radius: 4px;
  margin-top: -32px;
  transition: all 0.1s;
  transform-origin: center bottom;
}

.cannon-barrel.firing {
  background: linear-gradient(90deg, #ef4444 0%, #f97316 50%, #ef4444 100%);
  box-shadow: 0 0 20px #ef4444, 0 0 40px #f97316;
}

.cannon-glow {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 20px;
  background: radial-gradient(circle, #fbbf24 0%, transparent 70%);
  animation: cannon-glow-pulse 0.2s infinite;
}

@keyframes cannon-glow-pulse {
  0%, 100% { opacity: 0.8; transform: translateX(-50%) scale(1); }
  50% { opacity: 1; transform: translateX(-50%) scale(1.2); }
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
</style>
