import { ref } from 'vue'

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
  }) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
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
    saveSettings
  }
}