<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useTyping } from '../composables/useTyping'
import { useStorage } from '../composables/useStorage'
import { getRandomArticle, type Article } from '../data/articles'

const props = defineProps<{
  username: string
  language: 'en' | 'zh'
  article: Article | null
  duration: number
  fontSize: 'normal' | 'large'
  showTrail: boolean
}>()

const emit = defineEmits<{
  (e: 'complete', result: any): void
  (e: 'back'): void
}>()

const storage = useStorage()

const testText = ref('')
const isActive = ref(false)
const timeLeft = ref(60)
let timer: number | null = null

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
const errors = computed(() => state.value.errors)

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

const formattedTime = computed(() => {
  const minutes = Math.floor(timeLeft.value / 60)
  const seconds = timeLeft.value % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
})

onMounted(() => {
  initTest()
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  if (timer) {
    clearInterval(timer)
  }
})

function initTest() {
  const article = props.article || getRandomArticle(props.language as 'en' | 'zh')
  testText.value = article.content
  setText(article.content)
  timeLeft.value = props.duration * 60
  isActive.value = false
}

function startTest() {
  isActive.value = true
  timer = window.setInterval(() => {
    timeLeft.value--
    if (timeLeft.value <= 0) {
      endTest()
    }
  }, 1000)
}

function endTest() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  isActive.value = false

  const result = {
    username: props.username,
    language: props.language,
    wpm: wpm.value,
    accuracy: accuracy.value,
    totalChars: totalChars.value,
    correctChars: correctChars.value,
    errors: errors.value,
    duration: props.duration * 60 - timeLeft.value,
    articleTitle: props.article?.title || '随机文章'
  }

  storage.saveRecord(result)
  emit('complete', result)
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Backspace') {
    if (!isActive.value) return
    e.preventDefault()
    handleBackspace()
    return
  }

  if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
    e.preventDefault()
    if (!isActive.value) {
      startTest()
    }
    handleKeyPress(e.key)
  }
}

function retryTest() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  initTest()
}
</script>

<template>
  <div class="typing-test" :class="{ 'large-font': fontSize === 'large' }">
    <div class="test-header">
      <div class="test-info">
        <span class="info-item">
          <span class="info-label">用时</span>
          <span class="info-value">{{ formattedTime }}</span>
        </span>
        <span class="info-item">
          <span class="info-label">速度</span>
          <span class="info-value">{{ wpm }} WPM</span>
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

    <div class="typing-area">
      <div class="text-content">
        <span
          v-for="(item, index) in displayText"
          :key="index"
          :class="['char', item.className]"
        >{{ item.char === ' ' ? '\u00A0' : item.char }}</span>
      </div>
      <p class="start-hint" v-if="!isActive && state.currentIndex === 0">点击任意键开始测试...</p>
    </div>

    <div class="stats-bar">
      <div class="stat">
        <span class="stat-label">正确</span>
        <span class="stat-value correct">{{ correctChars }}</span>
      </div>
      <div class="stat">
        <span class="stat-label">错误</span>
        <span class="stat-value error">{{ errors }}</span>
      </div>
      <div class="stat">
        <span class="stat-label">总计</span>
        <span class="stat-value">{{ totalChars }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.typing-test {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 20px;
}

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

.typing-area {
  background: var(--bg-color);
  border: 2px solid var(--border-color);
  border-radius: 16px;
  padding: 40px;
  min-height: 300px;
  margin-bottom: 24px;
}

.large-font .typing-area {
  padding: 60px;
}

.text-content {
  font-size: 24px;
  line-height: 1.8;
  text-align: left;
  width: 100%;
  word-wrap: break-word;
  white-space: pre-wrap;
}

.large-font .text-content {
  font-size: 32px;
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