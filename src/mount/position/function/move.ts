/* 位置原型拓展   --方法  --移动 */
export default class PositionFunctionMoveExtension extends RoomPosition {
  /**
   * 获取当前位置目标方向的 pos 对象
   */
  public directionToPos(direction: DirectionConstant): RoomPosition | undefined {
    let targetX = this.x
    let targetY = this.y

    if (direction !== LEFT && direction !== RIGHT) {
      if (direction > LEFT || direction < RIGHT)
        targetY--
      else targetY++
    }

    if (direction !== TOP && direction !== BOTTOM) {
      if (direction < BOTTOM)
        targetX++
      else targetX--
    }

    if (targetX < 0 || targetY > 49 || targetX > 49 || targetY < 0)
      return undefined
    else
      return new RoomPosition(targetX, targetY, this.roomName)
  }

  /**
   * 获取到另一 RoomPosition 的直线距离\
   * 注意只照顾同一房间的情况
   */
  public straightDistanceTo(pos: RoomPosition): number {
    return Math.sqrt((this.x - pos.x) ** 2 + (this.y - pos.y) ** 2)
  }
}
