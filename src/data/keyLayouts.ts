export interface KeyRow {
  keys: { char: string; shift?: string; width?: number }[]
  width?: number
}

export interface KeyLayout {
  name: string
  description: string
  rows: KeyRow[]
}

export const keyLayouts: KeyLayout[] = [
  {
    name: '主键盘区',
    description: '字母键练习',
    rows: [
      {
        keys: [
          { char: '`', shift: '~' },
          { char: '1', shift: '!' },
          { char: '2', shift: '@' },
          { char: '3', shift: '#' },
          { char: '4', shift: '$' },
          { char: '5', shift: '%' },
          { char: '6', shift: '^' },
          { char: '7', shift: '&' },
          { char: '8', shift: '*' },
          { char: '9', shift: '(' },
          { char: '0', shift: ')' },
          { char: '-', shift: '_' },
          { char: '=', shift: '+' }
        ]
      },
      {
        keys: [
          { char: 'q', shift: 'Q' },
          { char: 'w', shift: 'W' },
          { char: 'e', shift: 'E' },
          { char: 'r', shift: 'R' },
          { char: 't', shift: 'T' },
          { char: 'y', shift: 'Y' },
          { char: 'u', shift: 'U' },
          { char: 'i', shift: 'I' },
          { char: 'o', shift: 'O' },
          { char: 'p', shift: 'P' },
          { char: '[', shift: '{' },
          { char: ']', shift: '}' }
        ]
      },
      {
        keys: [
          { char: 'a', shift: 'A' },
          { char: 's', shift: 'S' },
          { char: 'd', shift: 'D' },
          { char: 'f', shift: 'F' },
          { char: 'g', shift: 'G' },
          { char: 'h', shift: 'H' },
          { char: 'j', shift: 'J' },
          { char: 'k', shift: 'K' },
          { char: 'l', shift: 'L' },
          { char: ';', shift: ':' },
          { char: "'", shift: '"' }
        ]
      },
      {
        keys: [
          { char: 'z', shift: 'Z' },
          { char: 'x', shift: 'X' },
          { char: 'c', shift: 'C' },
          { char: 'v', shift: 'V' },
          { char: 'b', shift: 'B' },
          { char: 'n', shift: 'N' },
          { char: 'm', shift: 'M' },
          { char: ',', shift: '<' },
          { char: '.', shift: '>' },
          { char: '/', shift: '?' }
        ]
      }
    ]
  },
  {
    name: '数字行',
    description: '数字和符号练习',
    rows: [
      {
        keys: [
          { char: '1' },
          { char: '2' },
          { char: '3' },
          { char: '4' },
          { char: '5' },
          { char: '6' },
          { char: '7' },
          { char: '8' },
          { char: '9' },
          { char: '0' }
        ]
      },
      {
        keys: [
          { char: '!' },
          { char: '@' },
          { char: '#' },
          { char: '$' },
          { char: '%' },
          { char: '^' },
          { char: '&' },
          { char: '*' },
          { char: '(' },
          { char: ')' }
        ]
      }
    ]
  },
  {
    name: 'ASDF行',
    description: '左手基准键',
    rows: [
      {
        keys: [
          { char: 'a' },
          { char: 's' },
          { char: 'd' },
          { char: 'f' },
          { char: 'g' },
          { char: 'h' },
          { char: 'j' },
          { char: 'k' },
          { char: 'l' }
        ]
      },
      {
        keys: [
          { char: 'A' },
          { char: 'S' },
          { char: 'D' },
          { char: 'F' },
          { char: 'G' },
          { char: 'H' },
          { char: 'J' },
          { char: 'K' },
          { char: 'L' }
        ]
      }
    ]
  },
  {
    name: 'JKL;行',
    description: '右手基准键',
    rows: [
      {
        keys: [
          { char: 'q' },
          { char: 'w' },
          { char: 'e' },
          { char: 'r' },
          { char: 't' },
          { char: 'y' },
          { char: 'u' },
          { char: 'i' },
          { char: 'o' },
          { char: 'p' }
        ]
      }
    ]
  }
]

export const homeRowKeys = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';']
export const indexFingerKeys = ['f', 'g', 'j', 'h']
