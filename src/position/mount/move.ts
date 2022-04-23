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
  public getStraightDistanceTo(pos: RoomPosition): number {
    return Math.sqrt((this.x - pos.x) ** 2 + (this.y - pos.y) ** 2)
  }

  /**
   * Creep 是否可以移动到这个位置
   */
  public isWalkable(): boolean {
    return this.lookFor(LOOK_TERRAIN)[0] !== 'wall'
     && this.lookFor(LOOK_STRUCTURES).filter(struct =>
       struct.structureType !== STRUCTURE_CONTAINER
        && struct.structureType !== STRUCTURE_ROAD
        && (struct.structureType !== STRUCTURE_RAMPART || (struct as StructureRampart).my)).length === 0
     && this.lookFor(LOOK_CONSTRUCTION_SITES).length === 0
     && this.lookFor(LOOK_CREEPS).length === 0
  }
}
