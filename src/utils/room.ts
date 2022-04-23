/**
 * 由 XY 坐标获取 roomName
 * @see https://github.com/screeps/engine/blob/78631905d975700d02786d9b666b9f97b1f6f8f9/src/utils.js#L359
 */
export function getRoomNameFromXY(x: number, y: number): string {
  const sx = x < 0 ? `W${-x - 1}` : `E${x}`
  const sy = y < 0 ? `N${-y - 1}` : `S${y}`
  return `${sx}${sy}`
}

/**
 * 由 roomName 获取 XY 坐标
 * @see https://github.com/screeps/engine/blob/78631905d975700d02786d9b666b9f97b1f6f8f9/src/utils.js#L375
 */
export function getXYFromRoomName(roomName: string): [number, number] {
  let xx = parseInt(roomName.slice(1), 10)
  let verticalPos = 2
  if (xx >= 100)
    verticalPos = 4
  else if (xx >= 10)
    verticalPos = 3

  let yy = parseInt(roomName.slice(verticalPos + 1), 10)
  const horizontalDir = roomName.charAt(0)
  const verticalDir = roomName.charAt(verticalPos)

  if (horizontalDir === 'W' || horizontalDir === 'w')
    xx = -xx - 1
  if (verticalDir === 'N' || verticalDir === 'n')
    yy = -yy - 1

  return [xx, yy]
}

export interface RoomCoordPos {
  coord: string[]
  pos: number[]
}

const regRoom = /^([WE])(\d{1,2})([NS])(\d{1,2})$/
/**
 * 格式化房间名称信息
 * @param roomName 房间名
 * @returns 一个对象 例: W1N2 -----> {coor:["W","N"], num:[1,2]}
 */
export function getCoordPosFromRoomName(roomName: string): RoomCoordPos {
  const result = roomName.match(regRoom)
  if (!result)
    throw new Error(`[getCoordPosFromRoomName] 解析房间名错误 roomName:${roomName}`)
  return {
    coord: [result[1], result[3]],
    pos: [parseInt(result[2]), parseInt(result[4])],
  }
}

/**
 * 将 CoordPos 转换为 XY
 */
export function getXYFromRoomCoordPos(roomCoordPos: RoomCoordPos): [number, number] {
  const { coord, pos } = roomCoordPos
  const x = coord[0] === 'W' ? -pos[0] - 1 : pos[0]
  const y = coord[1] === 'N' ? -pos[1] - 1 : pos[1]
  return [x, y]
}

/**
 * 获取两个房间之间最近的星门房
 */
export function closestPortalRoom(roomName1: string, roomName2: string): string {
  const room1 = getCoordPosFromRoomName(roomName1)
  const room2 = getCoordPosFromRoomName(roomName2)
  const roomXY1 = getXYFromRoomCoordPos(room1)
  const roomXY2 = getXYFromRoomCoordPos(room2)

  // linear distance between room and roomXY1 + linear distance between room and roomXY2
  const calcDistance = (room: [number, number]) =>
    Math.sqrt((room[0] - roomXY1[0]) ** 2 + (room[1] - roomXY1[1]) ** 2)
    + Math.sqrt((room[0] - roomXY2[0]) ** 2 + (room[1] - roomXY2[1]) ** 2)

  const rooms = [
    // room1 附近的四个星门房
    { coord: room1.coord, pos: [room1.pos[0] % 10, room1.pos[1] % 10] },
    { coord: room1.coord, pos: [(room1.pos[0] % 10) + 1, room1.pos[1] % 10] },
    { coord: room1.coord, pos: [room1.pos[0] % 10, (room1.pos[1] % 10) + 1] },
    { coord: room1.coord, pos: [(room1.pos[0] % 10) + 1, (room1.pos[1] % 10) + 1] },
    // room2 附近的四个星门房
    { coord: room2.coord, pos: [room2.pos[0] % 10, room2.pos[1] % 10] },
    { coord: room2.coord, pos: [(room2.pos[0] % 10) + 1, room2.pos[1] % 10] },
    { coord: room2.coord, pos: [room2.pos[0] % 10, (room2.pos[1] % 10) + 1] },
    { coord: room2.coord, pos: [(room2.pos[0] % 10) + 1, (room2.pos[1] % 10) + 1] },
  ]
    // 转换为坐标
    .map(getXYFromRoomCoordPos)
    // 按距离排序
    .sort((a, b) => calcDistance(a) - calcDistance(b))

  // 转换回房间名
  return getRoomNameFromXY(rooms[0][0], rooms[0][1])
}

/**
 * 判断房间 thisRoom 是否可以直接通过出口到达房间 disRoom
 * @param thisRoom 当前房间
 * @param disRoom 目标房价
 * @returns boolean
 * 方向常量 ↑:1 →:3 ↓:5 ←:7
 */
export function isRoomNextTo(thisRoom: string, disRoom: string): boolean {
  const thisRoomData = getCoordPosFromRoomName(thisRoom)
  const disRoomData = getCoordPosFromRoomName(disRoom)

  if (thisRoomData.coord[0] === disRoomData.coord[0] && thisRoomData.coord[1] === disRoomData.coord[1]) {
    const xDist = Math.abs(thisRoomData.pos[0] - disRoomData.pos[0])
    const yDist = Math.abs(thisRoomData.pos[1] - disRoomData.pos[1])

    if ((xDist === 0 && yDist === 1) || (xDist === 1 && yDist === 0)) {
      const result = Game.rooms[thisRoom].findExitTo(disRoom)
      if (result !== -2 && result !== -10) {
        // 判断一个房间相对另一个房间的方向是否和返回的出口方向一致
        let direction: number | undefined
        // x方向相邻
        if (xDist === 1) {
          const count = thisRoomData.pos[0] - disRoomData.pos[0]
          // W区
          if (thisRoomData.coord[0] === 'W') {
            switch (count) {
              case 1: { direction = 3; break }
              case -1: { direction = 7; break }
            }
          }
          // E区
          else if (thisRoomData.coord[0] === 'E') {
            switch (count) {
              case 1: { direction = 7; break }
              case -1: { direction = 3; break }
            }
          }
        }
        // y方向相邻
        else if (yDist === 1) {
          const count = thisRoomData.pos[1] - disRoomData.pos[1]
          // N区
          if (thisRoomData.coord[1] === 'N') {
            switch (count) {
              case 1: { direction = 5; break }
              case -1: { direction = 1; break }
            }
          }
          // S区
          else if (thisRoomData.coord[1] === 'S') {
            switch (count) {
              case 1: { direction = 1; break }
              case -1: { direction = 5; break }
            }
          }
        }

        if (!direction)
          return false
        else if (direction === result)
          return true
      }
    }
  }

  return false
}

/**
 * 获取相邻房间相对于本房间的方向
 * @param thisRoom 当前房间
 * @param disRoom 目标房价
 * @returns number
 * 方向常量 ↑:1 →:3 ↓:5 ←:7
 */
export function calcNextRoomDirection(thisRoom: string, disRoom: string): TOP | RIGHT | BOTTOM | LEFT | undefined {
  const thisRoomData = getCoordPosFromRoomName(thisRoom)
  const disRoomData = getCoordPosFromRoomName(disRoom)

  if (thisRoomData.coord[0] === disRoomData.coord[0] && thisRoomData.coord[1] === disRoomData.coord[1]) {
    const xDist = Math.abs(thisRoomData.pos[0] - disRoomData.pos[0])
    const yDist = Math.abs(thisRoomData.pos[1] - disRoomData.pos[1])

    if ((xDist === 0 && yDist === 1) || (xDist === 1 && yDist === 0)) {
      const result = Game.rooms[thisRoom].findExitTo(disRoom)
      if (result !== -2 && result !== -10) {
        // 判断一个房间相对另一个房间的方向是否和返回的出口方向一致
        let direction: TOP | RIGHT | BOTTOM | LEFT | undefined
        // x方向相邻
        if (xDist === 1) {
          const count = thisRoomData.pos[0] - disRoomData.pos[0]
          // W区
          if (thisRoomData.coord[0] === 'W') {
            switch (count) {
              case 1: { direction = RIGHT; break }
              case -1: { direction = LEFT; break }
            }
          }
          // E区
          else if (thisRoomData.coord[0] === 'E') {
            switch (count) {
              case 1: { direction = LEFT; break }
              case -1: { direction = RIGHT; break }
            }
          }
        }
        // y方向相邻
        else if (yDist === 1) {
          const count = thisRoomData.pos[1] - disRoomData.pos[1]
          // N区
          if (thisRoomData.coord[1] === 'N') {
            switch (count) {
              case 1: { direction = BOTTOM; break }
              case -1: { direction = TOP; break }
            }
          }
          // S区
          else if (thisRoomData.coord[1] === 'S') {
            switch (count) {
              case 1: { direction = TOP; break }
              case -1: { direction = BOTTOM; break }
            }
          }
        }

        return direction
      }
    }
  }
}

/**
 * 判断是否处于房间入口指定格数内
 * @param creep
 * @returns
 */
export function isRoomInRange(thisPos: RoomPosition, disRoom: string, range: number): boolean {
  const thisRoom = thisPos.roomName

  const direction = calcNextRoomDirection(thisRoom, disRoom)
  if (!direction)
    return false

  if (!range || range <= 0 || range >= 49)
    return false

  switch (direction) {
    case TOP: {
      return thisPos.y <= range
    }
    case BOTTOM: {
      return thisPos.y >= (49 - range)
    }
    case LEFT: {
      return thisPos.x <= range
    }
    case RIGHT: {
      return thisPos.x >= (49 - range)
    }
    default: {
      return false
    }
  }
}
