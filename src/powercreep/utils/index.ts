const opwrMap: Partial<Record<StructureConstant, PowerConstant>> = {
  tower: PWR_OPERATE_TOWER,
  spawn: PWR_OPERATE_SPAWN,
  extension: PWR_OPERATE_EXTENSION,
  terminal: PWR_OPERATE_TERMINAL,
  storage: PWR_OPERATE_STORAGE,
  factory: PWR_OPERATE_FACTORY,
  lab: PWR_OPERATE_LAB,
  powerSpawn: PWR_OPERATE_POWER,
}

/**
 * queen 类型 buff 是否加持
 */
export function isOPWR(struct: Structure): boolean {
  if (!struct.effects || struct.effects.length <= 0)
    return false

  const effect = opwrMap[struct.structureType]
  if (!effect)
    return true

  return getAllEffects(struct).includes(effect)
}

export function getAllEffects(struct: Structure): (PowerConstant | EffectConstant)[] {
  if (!struct.effects || struct.effects.length <= 0)
    return []
  return struct.effects.map(eff => eff.effect)
}
