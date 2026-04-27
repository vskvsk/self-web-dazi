<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useTyping } from '../composables/useTyping'
import { useStorage } from '../composables/useStorage'
import { getRandomArticle } from '../data/articles'
import type { TypingRecord } from '../composables/useStorage'

const props = defineProps<{
  username: string
  targetRecord: TypingRecord
}>()

const emit = defineEmits<{
  (e: 'complete', result: any): void
  (e: 'back'): void
}>()

const storage = useStorage()

const testText = ref('')
const isActive = ref(false)
const isComposing = ref(false)
const timeLeft = ref(60)
const testInput = ref<HTMLInputElement | null>(null)
const textContentRef = ref<HTMLElement | null>(null)
const opponentCanvas = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
let resizeObserver: ResizeObserver | null = null
let timer: number | null = null

// 预估对手的完成时间
const estimatedTargetTime = computed(() => {
  if (!props.targetRecord) return 0
  return props.targetRecord.duration
})

// 当前时间
const elapsedTime = ref(0)

const {
  state,
  typedChars,
  correctCount,
  wpm,
  accuracy,
  progress,
  handleKeyPress,
  handleBackspace,
  setText
} = useTyping('')

const totalChars = computed(() => state.value.text.length)
const correctChars = computed(() => correctCount.value)

const currentWpm = computed(() => {
  if (elapsedTime.value === 0) return 0
  return Math.round((state.value.currentIndex / 5) / (elapsedTime.value / 60))
})

// 对手的实时进度（匀速）
const targetProgress = computed(() => {
  if (!props.targetRecord) return 0
  if (elapsedTime.value === 0) return 0
  const progressRatio = elapsedTime.value / estimatedTargetTime.value
  return Math.min(progressRatio * 100, 100)
})

// 对手当前打到的字符位置
const targetCurrentIndex = computed(() => {
  if (!props.targetRecord || totalChars.value === 0) return 0
  return Math.floor((targetProgress.value / 100) * totalChars.value)
})

// 对手是否已完成
const targetCompleted = computed(() => {
  return targetProgress.value >= 100
})

// 我是否领先
const isLeading = computed(() => {
  if (targetCompleted.value) return false
  if (state.value.isCompleted) return true
  return state.value.currentIndex > targetCurrentIndex.value
})

// 差距
const gap = computed(() => {
  return state.value.currentIndex - targetCurrentIndex.value
})

const displayText = computed(() => {
  return state.value.text.split('').map((char, index) => {
    let className = ''

    if (index < state.value.currentIndex) {
      className = typedChars.value[index] ? 'correct' : 'error'
    } else if (index === state.value.currentIndex) {
      className = 'current'
    }

    return { char, className }
  })
})

// Canvas 绘制对手进度线（按文字行排列）
function drawOpponentProgress() {
  if (!ctx || !opponentCanvas.value || !textContentRef.value) return
  const canvas = opponentCanvas.value
  const container = textContentRef.value
  const dpr = window.devicePixelRatio || 1

  canvas.width = container.offsetWidth * dpr
  canvas.height = container.offsetHeight * dpr
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  if (targetProgress.value <= 0) return

  const fontSize = parseFloat(getComputedStyle(container).fontSize) || 24
  const lineHeight = parseFloat(getComputedStyle(container).lineHeight) || (fontSize * 1.8)
  const rawText = state.value.text

  ctx.font = getComputedStyle(container).font || `${fontSize}px monospace`
  ctx.fillStyle = '#c8c8c8'
  ctx.textBaseline = 'top'

  const lines = rawText.split('\n')
  let charOffset = 0
  let currentY = 0
  const lineH = lineHeight

  for (let i = 0; i < lines.length; i++) {
    const lineText = lines[i]
    if (lineText.length === 0) {
      currentY += lineH
      continue
    }

    const lineWidth = ctx.measureText(lineText).width
    // 包括换行符 \n，它在 rawText 中占一个位置
    const lineStartChar = charOffset
    const lineEndChar = charOffset + lineText.length // exclusive，指向 \n 或文本末尾

    if (targetProgress.value >= 100) {
      drawRoundedLine(ctx, 0, currentY + lineH - 4 * dpr, lineWidth, 4 * dpr, 2 * dpr)
    } else if (targetProgress.value <= 0) {
      // noop
    } else {
      // 进度指向的字符索引（包含 \n）
      const progressCharIndex = Math.floor((targetProgress.value / 100) * rawText.length)
      if (progressCharIndex <= lineStartChar) {
        // not reached
      } else if (progressCharIndex >= lineEndChar) {
        // 行已走完，整行满
        drawRoundedLine(ctx, 0, currentY + lineH - 4 * dpr, lineWidth, 4 * dpr, 2 * dpr)
      } else {
        // 进度在行中间，\n 不渲染字符，用它前面一个字符来估算宽度
        const localIndex = progressCharIndex - lineStartChar
        const progressText = lineText.slice(0, localIndex)
        const progressWidth = ctx.measureText(progressText).width
        if (progressWidth > 0) {
          drawRoundedLine(ctx, 0, currentY + lineH - 4 * dpr, progressWidth, 4 * dpr, 2 * dpr)
        }
      }
    }

    currentY += lineH
    charOffset = lineEndChar + 1 // +1 跳过 \n
  }
}

function drawRoundedLine(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (w <= 0 || h <= 0) return
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + w - radius, y)
  ctx.arcTo(x + w, y, x + w, y + radius, radius)
  ctx.lineTo(x + w, y + h - radius)
  ctx.arcTo(x + w, y + h, x + w - radius, y + h, radius)
  ctx.lineTo(x + radius, y + h)
  ctx.arcTo(x, y + h, x, y + h - radius, radius)
  ctx.lineTo(x, y + radius)
  ctx.arcTo(x, y, x + radius, y, radius)
  ctx.closePath()
  ctx.fill()
}

const formattedElapsed = computed(() => {
  const minutes = Math.floor(elapsedTime.value / 60)
  const seconds = elapsedTime.value % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
})

// PK 结果
const pkResult = ref<'win' | 'lose' | 'draw' | null>(null)

onMounted(() => {
  initTest()
  nextTick(() => {
    testInput.value?.focus()
    initOpponentCanvas()
    watchOpponentProgress()
  })
})

function initOpponentCanvas() {
  if (!opponentCanvas.value) return
  ctx = opponentCanvas.value.getContext('2d')
  resizeObserver = new ResizeObserver(() => {
    drawOpponentProgress()
  })
  if (textContentRef.value) {
    resizeObserver.observe(textContentRef.value)
  }
  drawOpponentProgress()
}

function watchOpponentProgress() {
  watch(targetProgress, () => {
    drawOpponentProgress()
  })
}

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
})

function initTest() {
  const article = getRandomArticle(props.targetRecord.language)
  testText.value = article.content
  setText(article.content)
  timeLeft.value = props.targetRecord.duration
  isActive.value = false
  elapsedTime.value = 0
  pkResult.value = null
}

function startTest() {
  if (!isActive.value) {
    isActive.value = true
    timer = window.setInterval(() => {
      elapsedTime.value++
      timeLeft.value--
      if (timeLeft.value <= 0 || state.value.isCompleted) {
        endTest()
      }
    }, 1000)
  }
}

function endTest() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  isActive.value = false

  const myWpm = wpm.value
  const targetWpm = props.targetRecord.wpm

  if (myWpm > targetWpm) {
    pkResult.value = 'win'
  } else if (myWpm < targetWpm) {
    pkResult.value = 'lose'
  } else {
    pkResult.value = 'draw'
  }

  const result = {
    username: props.username,
    language: props.targetRecord.language,
    wpm: wpm.value,
    accuracy: accuracy.value,
    totalChars: totalChars.value,
    correctChars: correctChars.value,
    errors: state.value.errors,
    duration: elapsedTime.value,
    articleTitle: props.targetRecord.articleTitle
  }

  storage.saveRecord(result)
  emit('complete', result)
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.ctrlKey || e.metaKey || e.altKey) return

  if (e.key === 'Backspace') {
    if (!isActive.value) return
    e.preventDefault()
    handleBackspace()
    return
  }

  if (e.key === 'Enter') {
    if (isComposing.value) {
      e.preventDefault()
    }
    return
  }

  if (e.key.length === 1) {
    e.preventDefault()
    if (!isActive.value) {
      startTest()
    }
    handleKeyPress(e.key)
  }
}

function handleCompositionStart() {
  isComposing.value = true
}

function handleCompositionEnd(e: CompositionEvent) {
  isComposing.value = false
  const composedText = e.data || ''

  if (composedText) {
    for (const char of composedText) {
      handleKeyPress(char)
    }
  }

  if (testInput.value) {
    testInput.value.value = ''
  }
}

function handleInput(e: Event) {
  if (isComposing.value) return

  const target = e.target as HTMLInputElement
  const value = target.value

  if (!value) return

  for (const char of value) {
    if (!isActive.value) {
      startTest()
    }
    handleKeyPress(char)
  }

  target.value = ''
}

function retryTest() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  initTest()
  nextTick(() => {
    testInput.value?.focus()
  })
}

function focusInput() {
  testInput.value?.focus()
}
</script>

<template>
  <div class="typing-pk">
    <!-- PK 头部信息 -->
    <div class="pk-header">
      <div class="pk-title">
        <span class="pk-badge">PK 模式</span>
      </div>

      <!-- 选手对比 -->
      <div class="players-row">
        <div class="player-info me">
          <span class="player-name">{{ username }}</span>
          <span class="player-wpm">{{ currentWpm }} WPM</span>
        </div>
        <div class="vs-divider">VS</div>
        <div class="player-info opponent">
          <span class="player-wpm">{{ targetRecord.wpm }} WPM</span>
          <span class="player-name">{{ targetRecord.username }}</span>
        </div>
      </div>

      <!-- 状态 -->
      <div class="status-bar" :class="{ leading: isLeading, behind: !isLeading && !targetCompleted, finished: targetCompleted }">
        <span v-if="isActive">
          <span v-if="isLeading">领先 {{ gap }} 字符</span>
          <span v-else-if="!targetCompleted">落后 {{ Math.abs(gap) }} 字符</span>
          <span v-else>对手已完成</span>
        </span>
        <span v-else>等待开始</span>
      </div>
    </div>

    <!-- PK 结果提示 -->
    <div v-if="pkResult" class="pk-result-overlay">
      <div class="pk-result-card" :class="pkResult">
        <div class="result-icon">
          <span v-if="pkResult === 'win'">🏆</span>
          <span v-else-if="pkResult === 'lose'">😅</span>
          <span v-else>🤝</span>
        </div>
        <h2 v-if="pkResult === 'win'">你赢了！</h2>
        <h2 v-else-if="pkResult === 'lose'">下次再战！</h2>
        <h2 v-else>平局！</h2>
        <div class="result-comparison">
          <div class="result-side me">
            <span class="result-name">{{ username }}</span>
            <span class="result-wpm">{{ wpm }} WPM</span>
          </div>
          <div class="result-divider">vs</div>
          <div class="result-side opponent">
            <span class="result-name">{{ targetRecord.username }}</span>
            <span class="result-wpm">{{ targetRecord.wpm }} WPM</span>
          </div>
        </div>
        <div class="result-actions">
          <button class="btn btn-primary" @click="retryTest">再来一局</button>
          <button class="btn btn-secondary" @click="emit('back')">返回首页</button>
        </div>
      </div>
    </div>

    <!-- 打字界面 -->
    <template v-else>
      <div class="test-header">
        <div class="test-info">
          <span class="info-item">
            <span class="info-label">已用时</span>
            <span class="info-value">{{ formattedElapsed }}</span>
          </span>
          <span class="info-item">
            <span class="info-label">速度</span>
            <span class="info-value">{{ currentWpm }} WPM</span>
          </span>
          <span class="info-item">
            <span class="info-label">准确率</span>
            <span class="info-value">{{ accuracy }}%</span>
          </span>
          <span class="info-item">
            <span class="info-label">进度</span>
            <span class="info-value">{{ progress }}%</span>
          </span>
        </div>
        <div class="test-actions">
          <button class="btn btn-secondary" @click="emit('back')">退出</button>
          <button class="btn btn-primary" @click="retryTest">重试</button>
        </div>
      </div>

      <!-- 打字区域 -->
      <div class="typing-area" @click="focusInput">
        <div class="text-content" ref="textContentRef">
          <span
            v-for="(item, index) in displayText"
            :key="index"
            :class="['char', item.className]"
          >{{ item.char === ' ' ? '\u00A0' : item.char }}</span>
          <canvas ref="opponentCanvas" class="opponent-canvas"></canvas>
        </div>

        <p class="start-hint" v-if="!isActive && state.currentIndex === 0">
          {{ targetRecord.language === 'zh' ? '使用输入法输入中文...' : '点击任意键开始测试...' }}
        </p>
      </div>

      <div class="input-container">
        <input
          ref="testInput"
          type="text"
          class="hidden-input"
          @keydown="handleKeyDown"
          @compositionstart="handleCompositionStart"
          @compositionend="handleCompositionEnd"
          @input="handleInput"
          autocomplete="off"
          autocorrect="off"
          autocapitalize="off"
          spellcheck="false"
        />
      </div>

      <div class="stats-bar">
        <div class="stat">
          <span class="stat-label">正确</span>
          <span class="stat-value correct">{{ correctChars }}</span>
        </div>
        <div class="stat">
          <span class="stat-label">错误</span>
          <span class="stat-value error">{{ state.errors }}</span>
        </div>
        <div class="stat">
          <span class="stat-label">总计</span>
          <span class="stat-value">{{ totalChars }}</span>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.typing-pk {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 20px;
  position: relative;
}

/* PK 头部 */
.pk-header {
  margin-bottom: 24px;
}

.pk-title {
  text-align: center;
  margin-bottom: 16px;
}

.pk-badge {
  background: linear-gradient(135deg, #ff6b6b, #ff4757);
  color: white;
  padding: 8px 24px;
  border-radius: 20px;
  font-size: 18px;
  font-weight: bold;
  display: inline-block;
}

/* 选手对比 */
.players-row {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 32px;
  margin-bottom: 12px;
}

.player-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  border-radius: 12px;
  border: 2px solid;
}

.player-info.me {
  border-color: var(--primary-color);
  background: rgba(26, 115, 232, 0.1);
}

.player-info.opponent {
  border-color: #888;
  background: rgba(136, 136, 136, 0.1);
}

.player-name {
  font-weight: bold;
  font-size: 18px;
}

.player-info.me .player-name {
  color: var(--primary-color);
}

.player-info.opponent .player-name {
  color: #888;
}

.player-wpm {
  font-size: 20px;
  font-weight: bold;
  color: var(--text-color);
}

.vs-divider {
  font-size: 18px;
  font-weight: bold;
  color: var(--text-secondary);
  padding: 8px 16px;
  background: var(--bg-secondary);
  border-radius: 8px;
}

/* 状态栏 */
.status-bar {
  text-align: center;
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 16px;
  font-weight: 600;
  background: var(--bg-secondary);
  color: var(--text-secondary);
}

.status-bar.leading {
  background: rgba(76, 175, 80, 0.15);
  color: var(--success-color);
}

.status-bar.behind {
  background: rgba(255, 152, 0, 0.15);
  color: #f59e0b;
}

.status-bar.finished {
  background: rgba(244, 67, 54, 0.15);
  color: var(--error-color);
}

/* PK 结果 */
.pk-result-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.pk-result-card {
  background: var(--bg-color);
  border-radius: 24px;
  padding: 48px;
  text-align: center;
  max-width: 500px;
  width: 90%;
}

.pk-result-card.win {
  border: 3px solid gold;
  box-shadow: 0 0 40px rgba(255, 215, 0, 0.3);
}

.pk-result-card.lose {
  border: 3px solid var(--border-color);
}

.pk-result-card.draw {
  border: 3px solid var(--primary-color);
}

.result-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.pk-result-card h2 {
  font-size: 32px;
  margin-bottom: 24px;
}

.pk-result-card.win h2 {
  color: gold;
}

.result-comparison {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  margin-bottom: 32px;
}

.result-side {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.result-name {
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 8px;
}

.result-side.me .result-name {
  color: var(--primary-color);
}

.result-side.opponent .result-name {
  color: #888;
}

.result-wpm {
  font-size: 28px;
  font-weight: bold;
}

.result-divider {
  font-size: 20px;
  color: var(--text-secondary);
}

.result-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

/* 测试界面 */
.test-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding: 16px 24px;
  background: var(--bg-secondary);
  border-radius: 12px;
}

.test-info {
  display: flex;
  gap: 32px;
}

.info-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.info-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.info-value {
  font-size: 20px;
  font-weight: bold;
  color: var(--primary-color);
}

.test-actions {
  display: flex;
  gap: 12px;
}

/* 打字区域 */
.typing-area {
  background: var(--bg-color);
  border: 2px solid var(--border-color);
  border-radius: 16px;
  padding: 40px;
  min-height: 300px;
  margin-bottom: 24px;
  cursor: text;
}

.text-content {
  font-size: 24px;
  line-height: 1.8;
  text-align: left;
  width: 100%;
  word-wrap: break-word;
  white-space: pre-wrap;
  position: relative;
}

.start-hint {
  color: var(--text-secondary);
  font-size: 18px;
  margin-top: 20px;
  text-align: center;
}

.char {
  display: inline;
}

.char.correct {
  color: var(--success-color);
}

.char.error {
  color: var(--error-color);
}

.char.current {
  background: var(--primary-color);
  color: white;
  padding: 2px 0;
  border-radius: 2px;
}

.opponent-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.input-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.stats-bar {
  display: flex;
  justify-content: center;
  gap: 48px;
  padding: 16px;
  background: var(--bg-secondary);
  border-radius: 12px;
}

.stat {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-label {
  color: var(--text-secondary);
  font-size: 14px;
}

.stat-value {
  font-size: 18px;
  font-weight: bold;
}

.stat-value.correct {
  color: var(--success-color);
}

.stat-value.error {
  color: var(--error-color);
}
</style>
