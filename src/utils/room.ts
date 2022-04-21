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
