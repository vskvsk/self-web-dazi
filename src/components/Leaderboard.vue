<script setup lang="ts">
import { computed } from 'vue'
import { useStorage } from '../composables/useStorage'

const props = defineProps<{
  language?: 'en' | 'zh' | 'all'
  limit?: number
}>()

const storage = useStorage()

const records = computed(() => {
  let allRecords = storage.records.value

  if (props.language && props.language !== 'all') {
    allRecords = allRecords.filter(r => r.language === props.language)
  }

  return allRecords
    .slice(0, props.limit || 10)
    .map(r => ({
      ...r,
      rank: 0
    }))
})

const groupedRecords = computed(() => {
  const groups: Record<string, (typeof records.value)[0][]> = {}

  records.value.forEach(record => {
    const key = record.language === 'en' ? '英文' : '中文'
    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push(record)
  })

  Object.keys(groups).forEach(lang => {
    groups[lang].sort((a, b) => b.wpm - a.wpm)
    groups[lang].forEach((record, index) => {
      record.rank = index + 1
    })
  })

  return groups
})

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getMedal(rank: number): string {
  switch (rank) {
    case 1: return '🥇'
    case 2: return '🥈'
    case 3: return '🥉'
    default: return `${rank}`
  }
}
</script>

<template>
  <div class="leaderboard">
    <div class="header">
      <h2>🏆 排行榜</h2>
      <p class="subtitle">最高打字速度记录</p>
    </div>

    <div v-if="records.length === 0" class="empty-state">
      <p>暂无记录</p>
      <p class="hint">完成打字测试后即可上榜</p>
    </div>

    <div v-else class="leaderboard-content">
      <!-- 英文榜 -->
      <div v-if="groupedRecords['英文']?.length" class="category-section">
        <h3 class="category-title">🇺🇸 英文榜</h3>
        <div class="leaderboard-table">
          <div class="table-header">
            <span class="col-rank">排名</span>
            <span class="col-user">用户</span>
            <span class="col-wpm">WPM</span>
            <span class="col-accuracy">准确率</span>
            <span class="col-duration">时长</span>
            <span class="col-date">日期</span>
          </div>
          <div
            v-for="record in groupedRecords['英文']"
            :key="record.id"
            class="table-row"
            :class="{ 'top-three': record.rank <= 3 }"
          >
            <span class="col-rank">{{ getMedal(record.rank) }}</span>
            <span class="col-user">{{ record.username }}</span>
            <span class="col-wpm">{{ record.wpm }}</span>
            <span class="col-accuracy">{{ record.accuracy }}%</span>
            <span class="col-duration">{{ record.duration }}分钟</span>
            <span class="col-date">{{ formatDate(record.date) }}</span>
          </div>
        </div>
      </div>

      <!-- 中文榜 -->
      <div v-if="groupedRecords['中文']?.length" class="category-section">
        <h3 class="category-title">🇨🇳 中文榜</h3>
        <div class="leaderboard-table">
          <div class="table-header">
            <span class="col-rank">排名</span>
            <span class="col-user">用户</span>
            <span class="col-wpm">WPM</span>
            <span class="col-accuracy">准确率</span>
            <span class="col-duration">时长</span>
            <span class="col-date">日期</span>
          </div>
          <div
            v-for="record in groupedRecords['中文']"
            :key="record.id"
            class="table-row"
            :class="{ 'top-three': record.rank <= 3 }"
          >
            <span class="col-rank">{{ getMedal(record.rank) }}</span>
            <span class="col-user">{{ record.username }}</span>
            <span class="col-wpm">{{ record.wpm }}</span>
            <span class="col-accuracy">{{ record.accuracy }}%</span>
            <span class="col-duration">{{ record.duration }}分钟</span>
            <span class="col-date">{{ formatDate(record.date) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.leaderboard {
  max-width: 1000px;
  margin: 0 auto;
}

.header {
  text-align: center;
  margin-bottom: 32px;
}

.header h2 {
  font-size: 32px;
  margin-bottom: 8px;
  background: linear-gradient(135deg, #ffd93d, #ff6b6b);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 16px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-secondary);
}

.empty-state p {
  font-size: 18px;
  margin-bottom: 8px;
}

.hint {
  font-size: 14px;
  color: var(--text-secondary);
}

.leaderboard-content {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.category-section {
  background: var(--bg-color);
  border-radius: var(--border-radius);
  box-shadow: var(--card-shadow);
  overflow: hidden;
  border: 2px solid var(--border-color);
}

.category-title {
  padding: 16px 24px;
  margin: 0;
  background: linear-gradient(135deg, var(--bg-secondary), var(--bg-color));
  border-bottom: 2px solid var(--border-color);
  font-size: 20px;
}

.leaderboard-table {
  width: 100%;
}

.table-header {
  display: grid;
  grid-template-columns: 60px 1fr 80px 100px 80px 120px;
  padding: 12px 24px;
  background: var(--bg-secondary);
  font-weight: bold;
  color: var(--text-color);
  border-bottom: 1px solid var(--border-color);
}

.table-row {
  display: grid;
  grid-template-columns: 60px 1fr 80px 100px 80px 120px;
  padding: 14px 24px;
  border-bottom: 1px solid var(--border-color);
  align-items: center;
  transition: background-color 0.2s;
}

.table-row:last-child {
  border-bottom: none;
}

.table-row:hover {
  background: var(--bg-secondary);
}

.table-row.top-three {
  background: linear-gradient(90deg,
    rgba(255, 215, 0, 0.1) 0%,
    transparent 100%
  );
}

.col-rank {
  font-weight: bold;
  font-size: 18px;
  text-align: center;
}

.col-user {
  font-weight: 500;
}

.col-wpm {
  font-weight: bold;
  color: var(--primary-color);
  font-size: 18px;
}

.col-accuracy {
  color: var(--success-color);
  font-weight: 500;
}

.col-duration,
.col-date {
  color: var(--text-secondary);
  font-size: 14px;
}
</style>
