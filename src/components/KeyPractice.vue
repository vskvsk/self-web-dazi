<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { keyLayouts, type KeyLayout } from '../data/keyLayouts'

const emit = defineEmits<{
  (e: 'complete', result: any): void
  (e: 'back'): void
}>()

const currentLayout = ref<KeyLayout>(keyLayouts[0])
const expectedChar = ref('')
const currentIndex = ref(0)
const correctCount = ref(0)
const errorCount = ref(0)
const startTime = ref<number | null>(null)
const isCompleted = ref(false)
const showHint = ref(true)
const charResults = ref<boolean[]>([])

const displayChars = computed(() => {
  return expectedChar.value.split('').map((char, index) => {
    if (index < currentIndex.value) {
      return { char, className: charResults.value[index] ? 'typed' : 'typed error' }
    } else if (index === currentIndex.value) {
      return { char, className: 'current' }
    }
    return { char, className: '' }
  })
})

const wpm = computed(() => {
  if (!startTime.value || correctCount.value === 0) return 0
  const minutes = (Date.now() - startTime.value) / 60000
  if (minutes === 0) return 0
  return Math.round((correctCount.value / 5) / minutes)
})

const accuracy = computed(() => {
  if (correctCount.value + errorCount.value === 0) return 100
  return Math.round((correctCount.value / (correctCount.value + errorCount.value)) * 100)
})

onMounted(() => {
  generatePractice()
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})

function generatePractice() {
  const allChars: string[] = []
  currentLayout.value.rows.forEach(row => {
    row.keys.forEach(key => {
      allChars.push(key.char)
      if (key.shift) allChars.push(key.shift)
    })
  })

  let practiceStr = ''
  for (let i = 0; i < 20; i++) {
    const randomChar = allChars[Math.floor(Math.random() * allChars.length)]
    practiceStr += randomChar
  }

  expectedChar.value = practiceStr
  currentIndex.value = 0
  charResults.value = []
  showHint.value = true
}

function handleKeyDown(e: KeyboardEvent) {
  if (isCompleted.value) return

  if (e.key === 'Backspace') {
    e.preventDefault()
    if (currentIndex.value > 0) {
      currentIndex.value--
    }
    return
  }

  if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
    e.preventDefault()

    if (startTime.value === null) {
      startTime.value = Date.now()
    }

    if (showHint.value) {
      showHint.value = false
    }

    const expected = expectedChar.value[currentIndex.value]
    if (e.key === expected) {
      correctCount.value++
      charResults.value.push(true)
      currentIndex.value++

      if (currentIndex.value >= expectedChar.value.length) {
        isCompleted.value = true
        emit('complete', {
          wpm: wpm.value,
          accuracy: accuracy.value,
          correct: correctCount.value,
          errors: errorCount.value,
          layoutName: currentLayout.value.name
        })
      }
    } else {
      errorCount.value++
      charResults.value.push(false)
      currentIndex.value++

      if (currentIndex.value >= expectedChar.value.length) {
        isCompleted.value = true
        emit('complete', {
          wpm: wpm.value,
          accuracy: accuracy.value,
          correct: correctCount.value,
          errors: errorCount.value,
          layoutName: currentLayout.value.name
        })
      }
    }
  }
}

function changeLayout(layout: KeyLayout) {
  currentLayout.value = layout
  generatePractice()
  reset()
}

function reset() {
  correctCount.value = 0
  errorCount.value = 0
  currentIndex.value = 0
  charResults.value = []
  startTime.value = null
  isCompleted.value = false
  showHint.value = true
}

function retry() {
  generatePractice()
  reset()
}
</script>

<template>
  <div class="key-practice">
    <div class="practice-header">
      <div class="layout-selector">
        <button
          v-for="layout in keyLayouts"
          :key="layout.name"
          :class="['layout-btn', { active: currentLayout.name === layout.name }]"
          @click="changeLayout(layout)"
        >
          {{ layout.name }}
        </button>
      </div>
      <div class="practice-actions">
        <button class="btn btn-secondary" @click="emit('back')">退出</button>
        <button class="btn btn-secondary" @click="retry">重练</button>
      </div>
    </div>

    <div class="stats-bar">
      <div class="stat">
        <span class="stat-label">速度</span>
        <span class="stat-value">{{ wpm }} WPM</span>
      </div>
      <div class="stat">
        <span class="stat-label">准确率</span>
        <span class="stat-value">{{ accuracy }}%</span>
      </div>
      <div class="stat">
        <span class="stat-label">正确</span>
        <span class="stat-value correct">{{ correctCount }}</span>
      </div>
      <div class="stat">
        <span class="stat-label">错误</span>
        <span class="stat-value error">{{ errorCount }}</span>
      </div>
    </div>

    <div class="practice-area">
      <div class="text-display">
        <span
          v-for="(item, index) in displayChars"
          :key="index"
          :class="['char', item.className]"
        >{{ item.char === ' ' ? '\u00A0' : item.char }}</span>
      </div>
      <p class="start-hint" v-if="showHint && currentIndex === 0">
        按下键盘上的相应键开始练习<br/>
        <span class="hint-keys">{{ expectedChar[0] }}</span>
      </p>
    </div>

    <div class="keyboard-display">
      <div class="keyboard-hint">
        <span class="hint-label">当前练习：{{ currentLayout.description }}</span>
      </div>
      <div
        v-for="(row, rowIndex) in currentLayout.rows"
        :key="rowIndex"
        class="key-row"
      >
        <span
          v-for="(key, keyIndex) in row.keys"
          :key="keyIndex"
          :class="['key', { 'next-key': expectedChar[currentIndex] === key.char || expectedChar[currentIndex] === key.shift }]"
        >
          <span class="key-char">{{ key.char }}</span>
          <span v-if="key.shift" class="key-shift">{{ key.shift }}</span>
        </span>
      </div>
    </div>

    <div v-if="isCompleted" class="completion-modal">
      <div class="modal-content">
        <h2>练习完成！</h2>
        <div class="result-stats">
          <div class="result-item">
            <span class="result-label">打字速度</span>
            <span class="result-value">{{ wpm }} WPM</span>
          </div>
          <div class="result-item">
            <span class="result-label">准确率</span>
            <span class="result-value">{{ accuracy }}%</span>
          </div>
          <div class="result-item">
            <span class="result-label">正确</span>
            <span class="result-value correct">{{ correctCount }}</span>
          </div>
          <div class="result-item">
            <span class="result-label">错误</span>
            <span class="result-value error">{{ errorCount }}</span>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-primary" @click="retry">再来一次</button>
          <button class="btn btn-secondary" @click="emit('back')">返回</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.key-practice {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 20px;
}

.practice-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 16px 24px;
  background: var(--bg-secondary);
  border-radius: 12px;
}

.layout-selector {
  display: flex;
  gap: 12px;
}

.layout-btn {
  padding: 8px 16px;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-color);
  color: var(--text-color);
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.layout-btn:hover {
  border-color: var(--primary-color);
}

.layout-btn.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.practice-actions {
  display: flex;
  gap: 12px;
}

.stats-bar {
  display: flex;
  justify-content: center;
  gap: 48px;
  padding: 16px;
  background: var(--bg-secondary);
  border-radius: 12px;
  margin-bottom: 24px;
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
  color: var(--primary-color);
}

.stat-value.correct {
  color: var(--success-color);
}

.stat-value.error {
  color: var(--error-color);
}

.practice-area {
  background: var(--bg-color);
  border: 2px solid var(--border-color);
  border-radius: 16px;
  padding: 40px;
  min-height: 120px;
  margin-bottom: 24px;
}

.text-display {
  font-size: 32px;
  line-height: 1.8;
  text-align: left;
  width: 100%;
  word-wrap: break-word;
  white-space: pre-wrap;
  letter-spacing: 8px;
}

.start-hint {
  color: var(--text-secondary);
  font-size: 18px;
  margin-top: 20px;
  text-align: center;
}

.hint-keys {
  display: inline-block;
  font-size: 28px;
  color: var(--primary-color);
  background: var(--bg-secondary);
  padding: 8px 16px;
  border-radius: 8px;
  margin-top: 12px;
  font-weight: bold;
}

.char {
  display: inline;
}

.char.typed {
  color: var(--success-color);
}

.char.typed.error {
  color: var(--error-color);
}

.char.current {
  background: var(--primary-color);
  color: white;
  padding: 2px 4px;
  border-radius: 2px;
}

.keyboard-display {
  background: var(--bg-color);
  border: 2px solid var(--border-color);
  border-radius: 16px;
  padding: 32px;
}

.keyboard-hint {
  text-align: center;
  margin-bottom: 16px;
}

.hint-label {
  color: var(--text-secondary);
  font-size: 14px;
}

.key-row {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-bottom: 6px;
}

.key {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.2s;
}

.key.next-key {
  background: var(--primary-color);
  border-color: var(--primary-color);
  color: white;
  transform: scale(1.1);
}

.key-char {
  font-weight: bold;
}

.key-shift {
  font-size: 10px;
  color: var(--text-secondary);
}

.key.next-key .key-shift {
  color: rgba(255, 255, 255, 0.8);
}

.completion-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--bg-color);
  border-radius: 16px;
  padding: 40px;
  text-align: center;
  max-width: 400px;
  width: 90%;
}

.modal-content h2 {
  font-size: 24px;
  margin-bottom: 24px;
}

.result-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.result-item {
  padding: 16px;
  background: var(--bg-secondary);
  border-radius: 8px;
}

.result-label {
  display: block;
  color: var(--text-secondary);
  font-size: 14px;
  margin-bottom: 8px;
}

.result-value {
  font-size: 24px;
  font-weight: bold;
  color: var(--primary-color);
}

.result-value.correct {
  color: var(--success-color);
}

.result-value.error {
  color: var(--error-color);
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}
</style>