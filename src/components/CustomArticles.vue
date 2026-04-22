<script setup lang="ts">
import { ref, computed } from 'vue'
import { useStorage } from '../composables/useStorage'
import type { Article } from '../data/articles'

const emit = defineEmits<{
  close: []
  select: [article: Article]
}>()

const storage = useStorage()

const showAddForm = ref(false)
const newArticle = ref({
  title: '',
  content: '',
  difficulty: 'medium' as 'easy' | 'medium' | 'hard',
  language: 'en' as 'en' | 'zh'
})
const selectedLanguage = ref<'all' | 'en' | 'zh'>('all')

const customArticles = computed(() => {
  const articles = storage.getCustomArticles()
  if (selectedLanguage.value === 'all') {
    return articles
  }
  return articles.filter(a => a.language === selectedLanguage.value)
})

const wordCount = computed(() => {
  return newArticle.value.content.trim().length
})

function openAddForm() {
  showAddForm.value = true
}

function closeAddForm() {
  showAddForm.value = false
  newArticle.value = {
    title: '',
    content: '',
    difficulty: 'medium',
    language: 'en'
  }
}

function saveArticle() {
  if (!newArticle.value.title.trim()) {
    alert('请输入文章标题')
    return
  }
  if (!newArticle.value.content.trim()) {
    alert('请输入文章内容')
    return
  }
  if (newArticle.value.content.length < 50) {
    alert('文章内容至少需要50个字')
    return
  }

  const saved = storage.saveCustomArticle(newArticle.value)
  closeAddForm()
  emit('select', saved)
}

function selectArticle(article: Article) {
  emit('select', article)
}

function deleteArticle(id: string) {
  if (confirm('确定要删除这篇文章吗？')) {
    storage.deleteCustomArticle(id)
  }
}

function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    const content = e.target?.result as string
    if (content.length >= 50) {
      const titleMatch = content.match(/^#\s*(.+)$/m)
      const title = titleMatch ? titleMatch[1] : file.name.replace(/\.[^.]+$/, '')
      const cleanContent = content.replace(/^#\s*.+$/m, '').trim()

      newArticle.value.content = cleanContent
      newArticle.value.title = title
    } else {
      alert('文件内容太少，至少需要50个字')
    }
  }
  reader.readAsText(file)
  target.value = ''
}
</script>

<template>
  <div class="custom-articles">
    <div class="header">
      <h3>我的文章库</h3>
      <div class="actions">
        <select v-model="selectedLanguage" class="lang-filter">
          <option value="all">全部</option>
          <option value="en">英文</option>
          <option value="zh">中文</option>
        </select>
        <button class="btn btn-primary" @click="openAddForm">
          + 添加文章
        </button>
      </div>
    </div>

    <!-- 添加表单 -->
    <div v-if="showAddForm" class="add-form-overlay" @click.self="closeAddForm">
      <div class="add-form">
        <h4>添加自定义文章</h4>

        <div class="form-row">
          <label>语言</label>
          <div class="radio-group">
            <label class="radio-label">
              <input type="radio" v-model="newArticle.language" value="en" />
              <span>英文</span>
            </label>
            <label class="radio-label">
              <input type="radio" v-model="newArticle.language" value="zh" />
              <span>中文</span>
            </label>
          </div>
        </div>

        <div class="form-row">
          <label>标题</label>
          <input
            type="text"
            v-model="newArticle.title"
            placeholder="输入文章标题"
            class="form-input"
          />
        </div>

        <div class="form-row">
          <label>难度</label>
          <select v-model="newArticle.difficulty" class="form-select">
            <option value="easy">简单</option>
            <option value="medium">中等</option>
            <option value="hard">困难</option>
          </select>
        </div>

        <div class="form-row">
          <label>
            内容
            <span class="word-count">字数: {{ wordCount }}</span>
          </label>
          <textarea
            v-model="newArticle.content"
            placeholder="输入文章内容（至少50个字）"
            class="form-textarea"
            rows="10"
          ></textarea>
        </div>

        <div class="form-row">
          <label>或者上传文件</label>
          <input
            type="file"
            accept=".txt,.md,.text"
            @change="handleFileUpload"
            class="file-input"
          />
        </div>

        <div class="form-actions">
          <button class="btn btn-secondary" @click="closeAddForm">取消</button>
          <button class="btn btn-primary" @click="saveArticle">保存文章</button>
        </div>
      </div>
    </div>

    <!-- 文章列表 -->
    <div v-if="customArticles.length === 0" class="empty-state">
      <p>暂无自定义文章</p>
      <p class="hint">点击"添加文章"创建你的第一篇文章</p>
    </div>

    <div v-else class="articles-list">
      <div
        v-for="article in customArticles"
        :key="article.id"
        class="article-item"
      >
        <div class="article-info">
          <div class="article-header">
            <span class="article-title">{{ article.title }}</span>
            <span class="article-lang">{{ article.language === 'en' ? 'EN' : '中文' }}</span>
          </div>
          <div class="article-meta">
            <span class="difficulty-badge" :class="article.difficulty">
              {{ article.difficulty === 'easy' ? '简单' : article.difficulty === 'medium' ? '中等' : '困难' }}
            </span>
            <span class="char-count">{{ article.content.length }} 字</span>
          </div>
          <p class="article-preview">{{ article.content.substring(0, 100) }}...</p>
        </div>
        <div class="article-actions">
          <button class="btn btn-primary btn-small" @click="selectArticle(article)">
            使用
          </button>
          <button class="btn btn-secondary btn-small" @click="deleteArticle(article.id)">
            删除
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-articles {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 2px dashed var(--border-color);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.header h3 {
  font-size: 20px;
  margin: 0;
}

.actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.lang-filter {
  padding: 8px 12px;
  border-radius: 8px;
  border: 2px solid var(--border-color);
  background: var(--bg-color);
  color: var(--text-color);
}

.add-form-overlay {
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

.add-form {
  background: var(--bg-color);
  border-radius: 16px;
  padding: 24px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.add-form h4 {
  margin: 0 0 20px;
  font-size: 20px;
}

.form-row {
  margin-bottom: 16px;
}

.form-row > label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  font-weight: 500;
}

.word-count {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: normal;
}

.radio-group {
  display: flex;
  gap: 20px;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 10px 14px;
  border: 2px solid var(--border-color);
  border-radius: 10px;
  font-size: 16px;
  background: var(--bg-color);
  color: var(--text-color);
}

.form-textarea {
  resize: vertical;
  min-height: 150px;
}

.file-input {
  width: 100%;
  padding: 10px;
  border: 2px dashed var(--border-color);
  border-radius: 10px;
  cursor: pointer;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 20px;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: var(--text-secondary);
}

.hint {
  font-size: 14px;
  margin-top: 8px;
}

.articles-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.article-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px;
  background: var(--bg-secondary);
  border-radius: 12px;
  gap: 16px;
}

.article-info {
  flex: 1;
  min-width: 0;
}

.article-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.article-title {
  font-weight: 600;
  font-size: 16px;
}

.article-lang {
  font-size: 12px;
  padding: 2px 8px;
  background: var(--primary-color);
  color: white;
  border-radius: 10px;
}

.article-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.difficulty-badge {
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 10px;
}

.difficulty-badge.easy {
  background: #dcfce7;
  color: #166534;
}

.difficulty-badge.medium {
  background: #fef9c3;
  color: #854d0e;
}

.difficulty-badge.hard {
  background: #fee2e2;
  color: #991b1b;
}

.char-count {
  font-size: 13px;
  color: var(--text-secondary);
}

.article-preview {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.article-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.btn-small {
  padding: 6px 12px;
  font-size: 14px;
}

@media (max-width: 600px) {
  .header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .actions {
    width: 100%;
  }

  .actions select {
    flex: 1;
  }

  .article-item {
    flex-direction: column;
  }

  .article-actions {
    width: 100%;
  }

  .article-actions .btn {
    flex: 1;
  }
}
</style>
