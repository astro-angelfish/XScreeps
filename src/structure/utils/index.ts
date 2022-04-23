/**
 * 识别lab 合成 or 底物  [轮子]
 */
export function groupLabsInRoom(roomName: string): {
  raw1: Id<StructureLab>
  raw2: Id<StructureLab>
  com: Id<StructureLab>[]
} | null {
  const room = Game.rooms[roomName]
  if (!room)
    return null

  // 寻找所有 lab
  const labs = room.find(FIND_STRUCTURES)
    .filter(i => i.structureType === STRUCTURE_LAB) as StructureLab[]

  if (labs.length < 3)
    return null

  let centerLabs: [StructureLab, StructureLab] | undefined
  let otherLabs: StructureLab[] = []
  for (let i = 0; i < labs.length; i++) {
    const labA = labs[i]
    for (let j = i + 1; j < labs.length; j++) {
      const labB = labs[j]

      if (!labA.pos.inRangeTo(labB, 5))
        continue

      // 获取所有能接触到的 lab
      const other = labs.filter(i => i !== labA && i !== labB
        && labA.pos.inRangeTo(i, 2) && labB.pos.inRangeTo(i, 2))

      // 找一个能接触到个数最大的
      if (other.length > otherLabs.length) {
        centerLabs = [labA, labB]
        otherLabs = other
      }
    }
  }

  if (!centerLabs || centerLabs.length < 2 || otherLabs.length < 1)
    return null

  return {
    raw1: centerLabs[0].id,
    raw2: centerLabs[1].id,
    com: otherLabs.map(v => v.id),
  }
}
