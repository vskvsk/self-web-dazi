export interface Article {
  id: string
  title: string
  content: string
  difficulty: 'easy' | 'medium' | 'hard'
  language: 'en' | 'zh'
}

export const englishArticles: Article[] = [
  {
    id: 'en-1',
    title: 'The Quick Brown Fox',
    content: 'The quick brown fox jumps over the lazy dog. This pangram contains every letter of the alphabet and is commonly used for typing practice.',
    difficulty: 'easy',
    language: 'en'
  },
  {
    id: 'en-2',
    title: 'Programming Basics',
    content: 'Programming is the art of telling a computer what to do. Good programmers write code that humans can understand. They write clean, well-organized code with meaningful variable names and clear comments.',
    difficulty: 'easy',
    language: 'en'
  },
  {
    id: 'en-3',
    title: 'Technology and Innovation',
    content: 'Technology has transformed the way we live, work, and communicate. From smartphones to artificial intelligence, innovations continue to shape our future. The digital age has brought unprecedented connectivity and access to information.',
    difficulty: 'medium',
    language: 'en'
  },
  {
    id: 'en-4',
    title: 'The Art of Typing',
    content: 'Touch typing is a skill that can greatly improve your productivity. By learning to type without looking at the keyboard, you can focus on the screen and your thoughts. With practice, your fingers will automatically find the right keys.',
    difficulty: 'medium',
    language: 'en'
  },
  {
    id: 'en-5',
    title: 'Nature and Environment',
    content: 'The natural world offers endless wonders and beauty. Mountains rise majestically against blue skies while rivers flow through verdant valleys. Forests teem with diverse wildlife, and oceans hold mysteries yet to be discovered.',
    difficulty: 'medium',
    language: 'en'
  },
  {
    id: 'en-6',
    title: 'Space Exploration',
    content: 'Humanity has always looked up at the stars with wonder and curiosity. Space exploration represents our greatest adventure as a species. From the first moon landing to ongoing missions to Mars, we continue to push the boundaries of what is possible.',
    difficulty: 'hard',
    language: 'en'
  },
  {
    id: 'en-7',
    title: 'The Power of Reading',
    content: 'Reading opens doors to new worlds and ideas. A good book can transport you to distant lands, introduce you to fascinating characters, and challenge your perspectives. Through reading, we gain knowledge, empathy, and inspiration.',
    difficulty: 'hard',
    language: 'en'
  },
  {
    id: 'en-8',
    title: 'Healthy Lifestyle',
    content: 'Maintaining a healthy lifestyle involves balanced nutrition, regular exercise, and mental well-being. Small daily choices can lead to significant long-term benefits. Sleep, hydration, and stress management are equally important for overall health.',
    difficulty: 'medium',
    language: 'en'
  },
  {
    id: 'en-9',
    title: 'The Digital Revolution',
    content: 'The digital revolution has fundamentally changed how we interact, work, and think. Social media, cloud computing, and big data have transformed industries and societies. This technological shift continues to accelerate at an unprecedented pace.',
    difficulty: 'hard',
    language: 'en'
  },
  {
    id: 'en-10',
    title: 'Learning and Growth',
    content: 'Learning is a lifelong journey that never truly ends. Each day presents opportunities for growth and discovery. Embrace challenges as chances to improve, and view failures as valuable lessons. Curiosity is the engine of progress.',
    difficulty: 'easy',
    language: 'en'
  }
]

export const chineseArticles: Article[] = [
  {
    id: 'zh-1',
    title: '春天的脚步',
    content: '春天来了，大地渐渐苏醒。小草从土里探出头来，花儿绽放出美丽的笑容。温暖的阳光洒在人们身上，鸟儿在枝头歌唱。万物复苏，生机勃勃。',
    difficulty: 'easy',
    language: 'zh'
  },
  {
    id: 'zh-2',
    title: '电脑使用技巧',
    content: '电脑是现代生活中不可或缺的工具。掌握一些基本的使用技巧可以提高工作效率。比如学会快捷键的使用，定期备份重要文件，保持系统的更新和安全。',
    difficulty: 'easy',
    language: 'zh'
  },
  {
    id: 'zh-3',
    title: '时间管理的重要性',
    content: '时间是我们最宝贵的资源之一。有效的时间管理可以帮助我们更好地完成任务，减轻压力，提高生活质量。制定计划，区分优先级，避免拖延是时间管理的关键。',
    difficulty: 'medium',
    language: 'zh'
  },
  {
    id: 'zh-4',
    title: '健康生活方式的要素',
    content: '健康是人生最大的财富。保持健康的生活方式需要从多个方面入手：均衡的饮食、适量的运动、充足的睡眠、积极的心态。这些因素相互作用，共同影响我们的身心健康。',
    difficulty: 'medium',
    language: 'zh'
  },
  {
    id: 'zh-5',
    title: '互联网时代的信息',
    content: '互联网彻底改变了我们获取和分享信息的方式。现在，只需轻点鼠标，就能访问海量的知识。然而，信息过载也带来了挑战，我们需要学会筛选、辨别和管理信息。',
    difficulty: 'medium',
    language: 'zh'
  },
  {
    id: 'zh-6',
    title: '学习新技能的乐趣',
    content: '学习新技能不仅能够提升自我，还能带来成就感和快乐。无论是学习一门新语言、掌握一种乐器，还是学习编程，都是对自己能力的挑战和突破。',
    difficulty: 'easy',
    language: 'zh'
  },
  {
    id: 'zh-7',
    title: '中国传统文化',
    content: '中华文化博大精深，源远流长。诗词歌赋、书法绘画、传统节日、民间艺术，这些文化遗产承载着先人的智慧和情感。保护和传承传统文化是每个人的责任。',
    difficulty: 'hard',
    language: 'zh'
  },
  {
    id: 'zh-8',
    title: '科技发展的未来',
    content: '人工智能、量子计算、生物技术等前沿科技正在快速发展。它们将深刻改变人类社会的方方面面。我们既要拥抱技术进步带来的便利，也要关注其潜在的伦理问题。',
    difficulty: 'hard',
    language: 'zh'
  },
  {
    id: 'zh-9',
    title: '环境保护与可持续发展',
    content: '地球是我们共同的家园。气候变化、资源枯竭、生物多样性减少，这些环境问题需要全人类共同应对。通过发展绿色能源、减少污染、循环利用等方式，我们可以实现可持续发展。',
    difficulty: 'hard',
    language: 'zh'
  },
  {
    id: 'zh-10',
    title: '旅行的意义',
    content: '旅行不仅是为了看风景，更是一种生活体验。通过旅行，我们可以开阔视野，了解不同的文化，结识新朋友，品尝各地美食。每一次旅行都是一次成长。',
    difficulty: 'medium',
    language: 'zh'
  }
]

export function getArticlesByLanguage(language: 'en' | 'zh'): Article[] {
  return language === 'en' ? englishArticles : chineseArticles
}

export function getArticleById(id: string): Article | undefined {
  return [...englishArticles, ...chineseArticles].find(article => article.id === id)
}

export function getRandomArticle(language: 'en' | 'zh', difficulty?: 'easy' | 'medium' | 'hard'): Article {
  let articles = getArticlesByLanguage(language)
  if (difficulty) {
    articles = articles.filter(a => a.difficulty === difficulty)
  }
  const randomIndex = Math.floor(Math.random() * articles.length)
  return articles[randomIndex]
}