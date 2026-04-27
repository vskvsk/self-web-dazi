<script setup lang="ts">
import { ref } from 'vue'
import { gameConfigs, type GameConfig } from '../data/gameConfigs'
import FrogCrossing from './games/FrogCrossing.vue'
import BalloonPop from './games/BalloonPop.vue'
import AirplaneBattle from './games/AirplaneBattle.vue'
import AlienInvasion from './games/AlienInvasion.vue'
import PinballTyping from './games/PinballTyping.vue'
import FruitCatch from './games/FruitCatch.vue'

const emit = defineEmits<{
  (e: 'back'): void
}>()

const currentGame = ref<string | null>(null)

const gameComponents: Record<string, any> = {
  'frog-crossing': FrogCrossing,
  'balloon-pop': BalloonPop,
  'airplane-battle': AirplaneBattle,
  'alien-invasion': AlienInvasion,
  'pinball-typing': PinballTyping,
  'fruit-catch': FruitCatch
}

function startGame(gameId: string) {
  currentGame.value = gameId
}

function handleBack() {
  currentGame.value = null
}
</script>

<template>
  <div class="typing-games">
    <!-- Game Selection View -->
    <div v-if="!currentGame" class="games-container">
      <div class="games-header">
        <h2>打字游戏</h2>
        <p class="subtitle">选择一款游戏开始练习打字</p>
      </div>

      <div class="games-grid">
        <div
          v-for="game in gameConfigs"
          :key="game.id"
          class="game-card"
          :style="{ '--card-color': game.color }"
          @click="startGame(game.id)"
        >
          <div class="game-icon">{{ game.icon }}</div>
          <h3 class="game-name">{{ game.name }}</h3>
          <p class="game-description">{{ game.description }}</p>
          <button class="play-btn">开始游戏</button>
        </div>
      </div>

      <div class="back-section">
        <button class="btn btn-secondary" @click="emit('back')">返回首页</button>
      </div>
    </div>

    <!-- Game View -->
    <div v-else class="game-view">
      <component
        :is="gameComponents[currentGame]"
        @back="handleBack"
      />
    </div>
  </div>
</template>

<style scoped>
.typing-games {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 20px;
}

.games-container {
  animation: fadeIn 0.3s ease-out;
}

.games-header {
  text-align: center;
  margin-bottom: 40px;
}

.games-header h2 {
  font-size: 36px;
  color: var(--primary-color);
  margin-bottom: 8px;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 18px;
}

.games-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

.game-card {
  background: var(--bg-color);
  border: 2px solid var(--border-color);
  border-radius: 16px;
  padding: 32px 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.game-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--card-color);
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.game-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  border-color: var(--card-color);
}

.game-card:hover::before {
  transform: scaleX(1);
}

.game-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.game-name {
  font-size: 22px;
  color: var(--text-color);
  margin-bottom: 12px;
}

.game-description {
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 20px;
}

.play-btn {
  background: var(--card-color);
  color: white;
  border: none;
  padding: 12px 32px;
  border-radius: 25px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.play-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.back-section {
  text-align: center;
}

.game-view {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Kids theme support */
[data-style="kids"] .game-card {
  border-radius: 24px;
  border: 4px solid var(--border-color);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
}

[data-style="kids"] .game-card:hover {
  transform: translateY(-10px) rotate(1deg);
}

[data-style="kids"] .game-icon {
  animation: bounce 2s ease-in-out infinite;
}

[data-style="kids"] .play-btn {
  border-radius: 30px;
  font-family: var(--font-family);
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
</style>
