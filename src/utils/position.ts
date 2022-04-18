/* 压缩位置函数 */
export function zipPosition(position: RoomPosition): string {
  const x = position.x
  const y = position.y
  const room = position.roomName
  return `${x}/${y}/${room}`
}

/* 将压缩出来的字符串解压 例如 23/42/W1N1 */
export function unzipPosition(str: string): RoomPosition | undefined {
  const info = str.split('/')
  return info.length === 3
    ? new RoomPosition(Number(info[0]), Number(info[1]), info[2])
    : undefined
}
