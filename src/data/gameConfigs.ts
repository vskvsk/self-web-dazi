export interface GameConfig {
  id: string
  name: string
  description: string
  icon: string
  color: string
}

export const gameConfigs: GameConfig[] = [
  {
    id: 'frog-crossing',
    name: '青蛙过河',
    description: '帮助小青蛙跳过池塘，正确输入字符让它安全跳到荷叶上',
    icon: '🐸',
    color: '#22c55e'
  },
  {
    id: 'balloon-pop',
    name: '打字气球',
    description: '气球带着单词飘向天空，输入正确单词让气球爆炸',
    icon: '🎈',
    color: '#ef4444'
  },
  {
    id: 'airplane-battle',
    name: '飞机大战',
    description: '敌机来袭，输入机身上的单词击落它们',
    icon: '✈️',
    color: '#3b82f6'
  },
  {
    id: 'alien-invasion',
    name: '外星入侵',
    description: '外星人入侵地球，输入单词消灭它们',
    icon: '👾',
    color: '#a855f7'
  },
  {
    id: 'pinball-typing',
    name: '弹珠打字',
    description: '控制弹珠在台面上弹跳，在正确位置输入字符',
    icon: '🎱',
    color: '#f59e0b'
  },
  {
    id: 'fruit-catch',
    name: '水果忍者',
    description: '水果带着字符掉落，输入字符切开它们',
    icon: '🍎',
    color: '#ec4899'
  }
]

export function getGameById(id: string): GameConfig | undefined {
  return gameConfigs.find(game => game.id === id)
}
