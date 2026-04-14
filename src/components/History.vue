<script setup lang="ts">
import { computed } from 'vue'
import { useStorage } from '../composables/useStorage'

const props = defineProps<{
  username: string
}>()

const emit = defineEmits<{
  (e: 'back'): void
}>()

const storage = useStorage()

const records = computed(() => {
  if (!props.username) return []
  return storage.getRecordsByUsername(props.username)
})

const bestRecord = computed(() => {
  if (!props.username) return null
  return storage.getBestRecord(props.username, undefined)
})

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function clearHistory() {
  if (confirm('确定要清除所有历史记录吗？')) {
    storage.clearRecords()
  }
}
</script>

<template>
  <div class="history-page">
    <div class="history-header">
      <h2>{{ username }} 的打字记录</h2>
      <button class="btn btn-secondary" @click="emit('back')">返回</button>
    </div>

    <div v-if="bestRecord" class="best-record card">
      <h3>最佳成绩</h3>
      <div class="best-stats">
        <div class="best-stat">
          <span class="best-label">最高速度</span>
          <span class="best-value">{{ bestRecord.wpm }} WPM</span>
        </div>
        <div class="best-stat">
          <span class="best-label">最佳准确率</span>
          <span class="best-value">{{ bestRecord.accuracy }}%</span>
        </div>
        <div class="best-stat">
          <span class="best-label">打字语言</span>
          <span class="best-value">{{ bestRecord.language === 'en' ? '英文' : '中文' }}</span>
        </div>
      </div>
    </div>

    <div class="records-section">
      <div class="section-header">
        <h3>历史记录</h3>
        <button class="btn btn-secondary" @click="clearHistory" v-if="records.length > 0">清除记录</button>
      </div>

      <div v-if="records.length === 0" class="no-records">
        <p>暂无历史记录</p>
        <p class="hint">开始一次打字测试来创建您的第一条记录</p>
      </div>

      <div v-else class="records-table">
        <table>
          <thead>
            <tr>
              <th>日期</th>
              <th>语言</th>
              <th>速度(WPM)</th>
              <th>准确率</th>
              <th>总字数</th>
              <th>正确</th>
              <th>错误</th>
              <th>用时</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="record in records" :key="record.id">
              <td>{{ formatDate(record.date) }}</td>
              <td>{{ record.language === 'en' ? '英文' : '中文' }}</td>
              <td class="highlight">{{ record.wpm }}</td>
              <td :class="{ good: record.accuracy >= 95, warning: record.accuracy < 80 }">
                {{ record.accuracy }}%
              </td>
              <td>{{ record.totalChars }}</td>
              <td class="correct">{{ record.correctChars }}</td>
              <td class="error">{{ record.errors }}</td>
              <td>{{ Math.floor(record.duration / 60) }}'{{ record.duration % 60 }}"</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.history-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 20px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.history-header h2 {
  font-size: 28px;
}

.best-record {
  margin-bottom: 32px;
  text-align: center;
}

.best-record h3 {
  font-size: 20px;
  margin-bottom: 16px;
  color: var(--text-secondary);
}

.best-stats {
  display: flex;
  justify-content: center;
  gap: 48px;
}

.best-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.best-label {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.best-value {
  font-size: 28px;
  font-weight: bold;
  color: var(--primary-color);
}

.records-section {
  margin-bottom: 32px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h3 {
  font-size: 20px;
}

.no-records {
  text-align: center;
  padding: 48px;
  background: var(--bg-secondary);
  border-radius: 12px;
}

.no-records p {
  font-size: 18px;
  color: var(--text-secondary);
}

.no-records .hint {
  font-size: 14px;
  margin-top: 8px;
}

.records-table {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  background: var(--bg-color);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: var(--card-shadow);
}

thead {
  background: var(--bg-secondary);
}

th {
  padding: 16px 12px;
  text-align: left;
  font-weight: 600;
  color: var(--text-secondary);
  font-size: 14px;
}

td {
  padding: 14px 12px;
  border-top: 1px solid var(--border-color);
}

tbody tr:hover {
  background: var(--bg-secondary);
}

.highlight {
  font-weight: bold;
  color: var(--primary-color);
}

.good {
  color: var(--success-color);
}

.warning {
  color: var(--warning-color);
}

.correct {
  color: var(--success-color);
}

.error {
  color: var(--error-color);
}
</style>