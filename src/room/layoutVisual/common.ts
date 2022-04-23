import dev from './dev'
import RoomVisual from './roomVisual'

export const drawByConfig = function(str: string) {
  let data: any
  let xx: number
  let yy: number

  if (str === 'LayoutVisual') {
    xx = -25
    yy = -25
    data = dev
  }
  else {
    return
  }

  const flag = Game.flags[str]
  if (!flag)
    return

  const roomName = flag.pos.roomName
  const terrian = new Room.Terrain(roomName)
  const rv = new RoomVisual(roomName)
  //    let poss = data.buildings['extension']['pos'];

  for (const type in data.buildings) {
    const poss = data.buildings[type].pos

    for (const pos of poss) {
      const x = pos.x + xx + flag.pos.x
      const y = pos.y + yy + flag.pos.y
      try {
        if (terrian.get(x, y) !== TERRAIN_MASK_WALL)
          rv.structure(x, y, type)
      }
      catch (e) {
        log(`err:${x},${y},${type}`)
        throw e
      }
    }
  }
  // 墙
  const pos = flag.pos
  for (let i = pos.x - 9; i < pos.x + 10; i++) {
    for (let j = pos.y - 9; j < pos.y + 10; j++) {
      if (![0, 1, 48, 49].includes(i) && ![0, 1, 48, 49].includes(j) && (Math.abs(i - pos.x) === 9 || Math.abs(j - pos.y) === 9) && terrian.get(i, j) !== TERRAIN_MASK_WALL)
        rv.structure(i, j, STRUCTURE_RAMPART)
    }
  }
  rv.connRoads()
}

export function log(str: string, color = 'white') {
  console.log(`<span style="color:${color}">${str}</span>`)
}
