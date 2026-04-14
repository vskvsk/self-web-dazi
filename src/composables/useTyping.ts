import { ref, computed } from 'vue'

export interface TypingState {
  text: string
  currentIndex: number
  errors: number
  startTime: number | null
  endTime: number | null
  isCompleted: boolean
  isPaused: boolean
}

export interface KeyPressResult {
  correct: boolean
  currentIndex: number
  errors: number
}

export function useTyping(text: string) {
  const state = ref<TypingState>({
    text,
    currentIndex: 0,
    errors: 0,
    startTime: null,
    endTime: null,
    isCompleted: false,
    isPaused: false
  })

  const typedChars = ref<boolean[]>([])

  const correctCount = computed(() => {
    return typedChars.value.filter(c => c).length
  })

  const wpm = computed(() => {
    if (!state.value.startTime || state.value.currentIndex === 0) return 0
    const elapsedMinutes = (Date.now() - state.value.startTime) / 60000
    if (elapsedMinutes === 0) return 0
    return Math.round((state.value.currentIndex / 5) / elapsedMinutes)
  })

  const accuracy = computed(() => {
    if (state.value.currentIndex === 0) return 100
    return Math.round((correctCount.value / state.value.currentIndex) * 100)
  })

  const elapsedSeconds = computed(() => {
    if (!state.value.startTime) return 0
    return Math.floor((Date.now() - state.value.startTime) / 1000)
  })

  const progress = computed(() => {
    return Math.round((state.value.currentIndex / state.value.text.length) * 100)
  })

  const typedText = computed(() => state.value.text.slice(0, state.value.currentIndex))
  const remainingText = computed(() => state.value.text.slice(state.value.currentIndex))

  function handleKeyPress(char: string): KeyPressResult {
    if (state.value.isCompleted || state.value.isPaused) {
      return { correct: false, currentIndex: state.value.currentIndex, errors: state.value.errors }
    }

    if (state.value.startTime === null) {
      state.value.startTime = Date.now()
    }

    const expectedChar = state.value.text[state.value.currentIndex]
    const isCorrect = char === expectedChar

    if (isCorrect) {
      state.value.currentIndex++
    } else {
      state.value.currentIndex++
      state.value.errors++
    }

    typedChars.value.push(isCorrect)

    if (state.value.currentIndex >= state.value.text.length) {
      state.value.endTime = Date.now()
      state.value.isCompleted = true
    }

    return { correct: isCorrect, currentIndex: state.value.currentIndex, errors: state.value.errors }
  }

  function handleBackspace(): boolean {
    if (state.value.currentIndex > 0 && !state.value.isCompleted) {
      state.value.currentIndex--
      typedChars.value.pop()
      return true
    }
    return false
  }

  function pause() {
    state.value.isPaused = true
  }

  function resume() {
    state.value.isPaused = false
  }

  function reset() {
    state.value = {
      text,
      currentIndex: 0,
      errors: 0,
      startTime: null,
      endTime: null,
      isCompleted: false,
      isPaused: false
    }
    typedChars.value = []
  }

  function setText(newText: string) {
    state.value.text = newText
    state.value.currentIndex = 0
    state.value.errors = 0
    state.value.startTime = null
    state.value.endTime = null
    state.value.isCompleted = false
    state.value.isPaused = false
    typedChars.value = []
  }

  return {
    state,
    typedChars,
    correctCount,
    wpm,
    accuracy,
    elapsedSeconds,
    progress,
    typedText,
    remainingText,
    handleKeyPress,
    handleBackspace,
    pause,
    resume,
    reset,
    setText
  }
}
