<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import TypingTest from './TypingTest.vue'
import KeyPractice from './KeyPractice.vue'
import History from './History.vue'
import Leaderboard from './Leaderboard.vue'
import CustomArticles from './CustomArticles.vue'
import { useStorage } from '../composables/useStorage'
import { getArticlesByLanguageWithCustom, type Article } from '../data/articles'

type TypingMode = 'english' | 'chinese' | 'competition'
type TestType = 'practice' | 'competition'
type ViewMode = 'home' | 'test' | 'result' | 'history' | 'keyPractice' | 'leaderboard'
type Theme = 'default' | 'kids'

const storage = useStorage()

const currentView = ref<ViewMode>('home')
const username = ref('')
const typingMode = ref<TypingMode>('english')
const testType = ref<TestType>('practice')
const selectedArticle = ref<Article | null>(null)
const testDuration = ref(1)
const lastResult = ref<any>(null)
const currentTheme = ref<Theme>('default')
const settings = ref({
  fontSize: 'normal' as 'normal' | 'large',
  darkMode: false,
  showTrail: false,
  continueLast: false
})
const customArticles = ref<Article[]>([])

const currentLanguage = computed(() => typingMode.value === 'competition' ? 'en' : (typingMode.value === 'english' ? 'en' : 'zh'))
const articles = computed(() => getArticlesByLanguageWithCustom(currentLanguage.value, customArticles.value))
const currentArticle = computed(() => selectedArticle.value || articles.value[0])

const languageMap: Record<TypingMode, 'en' | 'zh'> = {
  english: 'en',
  chinese: 'zh',
  competition: 'en'
}

onMounted(() => {
  const savedSettings = storage.getSettings()
  settings.value = { ...settings.value, ...savedSettings }
  username.value = storage.getUsername() || ''
  currentTheme.value = savedSettings.theme || 'default'
  customArticles.value = storage.getCustomArticles()

  applyTheme()
})

// 设置变更时自动保存
watch(() => [settings.value.fontSize, settings.value.darkMode, settings.value.showTrail, settings.value.continueLast], () => {
  storage.saveSettings({ ...settings.value, theme: currentTheme.value })
}, { deep: true })

function applyTheme() {
  document.documentElement.setAttribute('data-theme', settings.value.darkMode ? 'dark' : 'light')
  document.documentElement.setAttribute('data-style', currentTheme.value)
}

function startTest() {
  if (!username.value.trim()) {
    alert('请输入用户名')
    return
  }
  storage.setUsername(username.value)
  currentView.value = 'test'
}

function handleTestComplete(result: any) {
  lastResult.value = result
  currentView.value = 'result'
}

function handleKeyPracticeComplete(result: any) {
  lastResult.value = result
  currentView.value = 'result'
}

function toggleDarkMode() {
  settings.value.darkMode = !settings.value.darkMode
  applyTheme()
  storage.saveSettings(settings.value)
}

function toggleTheme() {
  currentTheme.value = currentTheme.value === 'default' ? 'kids' : 'default'
  applyTheme()
  storage.saveSettings({ ...settings.value, theme: currentTheme.value })
}

function goHome() {
  currentView.value = 'home'
}

function viewHistory() {
  currentView.value = 'history'
}

function viewLeaderboard() {
  currentView.value = 'leaderboard'
}

function goToTest() {
  currentView.value = 'test'
}

function goToKeyPractice() {
  currentView.value = 'keyPractice'
}

function handleCustomArticleSelect(article: Article) {
  selectedArticle.value = article
}
</script>

<template>
  <div class="app">
    <header class="header">
      <div class="container header-content">
        <h1 class="logo" @click="goHome">打字测试</h1>
        <nav class="nav">
          <span class="username-display" v-if="username">{{ username }}</span>
          <button class="btn btn-secondary" @click="goToKeyPractice" v-if="currentView === 'home'">键位练习</button>
          <button class="btn btn-secondary" @click="viewLeaderboard" v-if="currentView === 'home'">排行榜</button>
          <button class="btn btn-secondary" @click="viewHistory" v-if="currentView === 'home'">历史记录</button>
          <button class="btn btn-secondary" @click="goHome" v-if="currentView !== 'home'">返回首页</button>
          <button class="btn btn-secondary icon-btn" @click="toggleTheme" :title="currentTheme === 'default' ? '儿童风格' : '默认风格'">
            {{ currentTheme === 'default' ? '🎨' : '🎀' }}
          </button>
          <button class="btn btn-secondary icon-btn" @click="toggleDarkMode">
            {{ settings.darkMode ? '☀️' : '🌙' }}
          </button>
        </nav>
      </div>
    </header>

    <main class="main">
      <!-- 首页 -->
      <div v-if="currentView === 'home'" class="home-page">
        <div class="hero">
          <h2>在线打字速度测试</h2>
          <p>无需注册，直接开始测试你的打字速度</p>
        </div>

        <div class="setup-card card">
          <div class="form-group">
            <label>用户名</label>
            <input
              type="text"
              v-model="username"
              placeholder="输入用户名开始测试"
              class="username-input"
            />
          </div>

          <div class="form-group">
            <label>测试类型</label>
            <div class="mode-selector">
              <button
                class="mode-btn"
                :class="{ active: typingMode === 'english' }"
                @click="typingMode = 'english'"
              >
                英文打字
              </button>
              <button
                class="mode-btn"
                :class="{ active: typingMode === 'chinese' }"
                @click="typingMode = 'chinese'"
              >
                中文打字
              </button>
              <button
                class="mode-btn"
                :class="{ active: testType === 'competition' }"
                @click="testType = 'competition'; typingMode = 'competition'"
              >
                竞赛模式
              </button>
            </div>
          </div>

          <div class="form-group">
            <label>选择文章</label>
            <select v-model="selectedArticle">
              <option :value="null">随机文章</option>
              <option v-for="article in articles" :key="article.id" :value="article">
                {{ article.title }} ({{ article.difficulty === 'easy' ? '简单' : article.difficulty === 'medium' ? '中等' : '困难' }})
              </option>
            </select>
          </div>

          <CustomArticles
            @select="handleCustomArticleSelect"
          />

          <div class="form-group">
            <label>测试时间：{{ testDuration }} 分钟</label>
            <input
              type="range"
              v-model="testDuration"
              min="1"
              max="50"
              class="duration-slider"
            />
          </div>

          <div class="options-group">
            <label class="checkbox-group">
              <input type="checkbox" v-model="settings.fontSize" true-value="large" false-value="normal" />
              <span>增大字体</span>
            </label>
            <label class="checkbox-group">
              <input type="checkbox" v-model="settings.showTrail" />
              <span>显示上次轨迹</span>
            </label>
            <label class="checkbox-group">
              <input type="checkbox" v-model="settings.continueLast" />
              <span>继续上次打字</span>
            </label>
          </div>

          <button class="btn btn-primary start-btn" @click="startTest">
            开始测试
          </button>
        </div>
      </div>

      <!-- 打字测试 -->
      <TypingTest
        v-if="currentView === 'test'"
        :username="username"
        :language="languageMap[typingMode]"
        :article="currentArticle"
        :duration="testDuration"
        :font-size="settings.fontSize"
        :show-trail="settings.showTrail"
        :continue-last="settings.continueLast"
        @complete="handleTestComplete"
        @back="goHome"
      />

      <!-- 键位练习 -->
      <KeyPractice
        v-if="currentView === 'keyPractice'"
        @complete="handleKeyPracticeComplete"
        @back="goHome"
      />

      <!-- 结果页面 -->
      <div v-if="currentView === 'result'" class="result-page">
        <div class="result-card card">
          <h2>测试完成！</h2>
          <div class="result-stats">
            <div class="stat-item">
              <span class="stat-label">打字速度</span>
              <span class="stat-value">{{ lastResult?.wpm || 0 }} WPM</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">准确率</span>
              <span class="stat-value">{{ lastResult?.accuracy || 100 }}%</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">总字数</span>
              <span class="stat-value">{{ lastResult?.totalChars || 0 }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">正确字数</span>
              <span class="stat-value">{{ lastResult?.correctChars || 0 }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">错误字数</span>
              <span class="stat-value error">{{ lastResult?.errors || 0 }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">用时</span>
              <span class="stat-value">{{ lastResult?.duration || 0 }} 秒</span>
            </div>
          </div>
          <div class="result-actions">
            <button class="btn btn-primary" @click="goToTest">再测一次</button>
            <button class="btn btn-secondary" @click="goHome">返回首页</button>
          </div>
        </div>
      </div>

      <!-- 历史记录 -->
      <History
        v-if="currentView === 'history'"
        :username="username"
        @back="goHome"
      />

      <!-- 排行榜 -->
      <Leaderboard
        v-if="currentView === 'leaderboard'"
        language="all"
        :limit="10"
      />
    </main>

    <footer class="footer">
      <div class="container">
        <p>打字测试 - 提高你的打字速度</p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background-color: var(--bg-color);
  border-bottom: 1px solid var(--border-color);
  padding: 16px 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: 24px;
  font-weight: bold;
  color: var(--primary-color);
  cursor: pointer;
}

.nav {
  display: flex;
  align-items: center;
  gap: 12px;
}

.username-display {
  color: var(--text-secondary);
  font-weight: 500;
}

.icon-btn {
  padding: 8px 12px;
  font-size: 18px;
}

.main {
  flex: 1;
  padding: 40px 0;
}

.home-page {
  max-width: 600px;
  margin: 0 auto;
}

.hero {
  text-align: center;
  margin-bottom: 32px;
}

.hero h2 {
  font-size: 32px;
  margin-bottom: 8px;
}

.hero p {
  color: var(--text-secondary);
}

.setup-card {
  padding: 32px;
}

.form-group {
  margin-bottom: 24px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.username-input {
  width: 100%;
  padding: 12px 16px;
  font-size: 18px;
}

.mode-selector {
  display: flex;
  gap: 12px;
}

.mode-btn {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-color);
  color: var(--text-color);
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.2s;
}

.mode-btn:hover {
  border-color: var(--primary-color);
}

.mode-btn.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.duration-slider {
  width: 100%;
  height: 8px;
  -webkit-appearance: none;
  appearance: none;
  background: var(--border-color);
  border-radius: 4px;
  outline: none;
}

.duration-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  background: var(--primary-color);
  border-radius: 50%;
  cursor: pointer;
}

.options-group {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 32px;
}

.start-btn {
  width: 100%;
  padding: 16px;
  font-size: 18px;
}

.result-page {
  max-width: 600px;
  margin: 0 auto;
}

.result-card {
  text-align: center;
  padding: 40px;
}

.result-card h2 {
  font-size: 28px;
  margin-bottom: 32px;
}

.result-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-bottom: 32px;
}

.stat-item {
  padding: 16px;
  background: var(--bg-secondary);
  border-radius: 8px;
}

.stat-label {
  display: block;
  color: var(--text-secondary);
  font-size: 14px;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: var(--primary-color);
}

.stat-value.error {
  color: var(--error-color);
}

.result-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.footer {
  padding: 20px 0;
  text-align: center;
  color: var(--text-secondary);
  border-top: 1px solid var(--border-color);
}
</style>