import { ref } from 'vue'
import type { Article } from '../data/articles'

export interface TypingRecord {
  id: string
  username: string
  language: 'en' | 'zh'
  wpm: number
  accuracy: number
  totalChars: number
  correctChars: number
  errors: number
  duration: number
  date: string
  articleTitle: string
}

const STORAGE_KEY = 'typing-test-records'
const USERNAME_KEY = 'typing-test-username'
const SETTINGS_KEY = 'typing-test-settings'
const CUSTOM_ARTICLES_KEY = 'typing-test-custom-articles'
const LAST_PROGRESS_KEY = 'typing-test-last-progress'

export interface LastProgress {
  text: string
  currentIndex: number
  typedChars: boolean[]
  language: 'en' | 'zh'
  articleTitle: string
  timestamp: number
}

export function useStorage() {
  const records = ref<TypingRecord[]>([])

  function loadRecords(): TypingRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      if (data) {
        records.value = JSON.parse(data)
        return records.value
      }
    } catch (error) {
      console.error('Failed to load records:', error)
    }
    return []
  }

  function saveRecord(record: Omit<TypingRecord, 'id' | 'date'>): TypingRecord {
    const newRecord: TypingRecord = {
      ...record,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString()
    }

    records.value = [newRecord, ...records.value].slice(0, 100)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records.value))

    return newRecord
  }

  function clearRecords() {
    records.value = []
    localStorage.removeItem(STORAGE_KEY)
  }

  function getRecordsByUsername(username: string): TypingRecord[] {
    return records.value.filter(r => r.username === username)
  }

  function getBestRecord(username: string, language?: 'en' | 'zh'): TypingRecord | undefined {
    const filtered = language
      ? records.value.filter(r => r.username === username && r.language === language)
      : records.value.filter(r => r.username === username)

    return filtered.reduce((best, current) =>
      current.wpm > (best?.wpm || 0) ? current : best
    , undefined as TypingRecord | undefined)
  }

  function getUsername(): string {
    return localStorage.getItem(USERNAME_KEY) || ''
  }

  function setUsername(name: string) {
    localStorage.setItem(USERNAME_KEY, name)
  }

  function getSettings(): {
    fontSize: 'normal' | 'large'
    darkMode: boolean
    showTrail: boolean
    continueLast: boolean
    theme?: 'default' | 'kids'
  } {
    try {
      const data = localStorage.getItem(SETTINGS_KEY)
      if (data) {
        return JSON.parse(data)
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
    return {
      fontSize: 'normal',
      darkMode: false,
      showTrail: false,
      continueLast: false
    }
  }

  function saveSettings(settings: {
    fontSize: 'normal' | 'large'
    darkMode: boolean
    showTrail: boolean
    continueLast: boolean
    theme?: 'default' | 'kids'
  }) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  }

  function getCustomArticles(): Article[] {
    try {
      const data = localStorage.getItem(CUSTOM_ARTICLES_KEY)
      if (data) {
        return JSON.parse(data)
      }
    } catch (error) {
      console.error('Failed to load custom articles:', error)
    }
    return []
  }

  function saveCustomArticle(article: Omit<Article, 'id'>): Article {
    const customArticles = getCustomArticles()
    const newArticle: Article = {
      ...article,
      id: 'custom-' + Date.now().toString(36)
    }
    customArticles.push(newArticle)
    localStorage.setItem(CUSTOM_ARTICLES_KEY, JSON.stringify(customArticles))
    return newArticle
  }

  function deleteCustomArticle(id: string) {
    const customArticles = getCustomArticles()
    const filtered = customArticles.filter(a => a.id !== id)
    localStorage.setItem(CUSTOM_ARTICLES_KEY, JSON.stringify(filtered))
  }

  function saveLastProgress(progress: LastProgress) {
    localStorage.setItem(LAST_PROGRESS_KEY, JSON.stringify(progress))
  }

  function getLastProgress(): LastProgress | null {
    try {
      const data = localStorage.getItem(LAST_PROGRESS_KEY)
      if (data) {
        const progress = JSON.parse(data) as LastProgress
        // 如果进度超过24小时，清除它
        const isExpired = Date.now() - progress.timestamp > 24 * 60 * 60 * 1000
        if (isExpired) {
          localStorage.removeItem(LAST_PROGRESS_KEY)
          return null
        }
        return progress
      }
    } catch (error) {
      console.error('Failed to load last progress:', error)
    }
    return null
  }

  function clearLastProgress() {
    localStorage.removeItem(LAST_PROGRESS_KEY)
  }

  loadRecords()

  return {
    records,
    loadRecords,
    saveRecord,
    clearRecords,
    getRecordsByUsername,
    getBestRecord,
    getUsername,
    setUsername,
    getSettings,
    saveSettings,
    getCustomArticles,
    saveCustomArticle,
    deleteCustomArticle,
    saveLastProgress,
    getLastProgress,
    clearLastProgress
  }
}