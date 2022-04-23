/* power操作常量 */

export const OptCost = {
  PWR_GENERATE_OPS: 0,
  PWR_OPERATE_SPAWN: 100,
  PWR_OPERATE_TOWER: 10,
  PWR_OPERATE_STORAGE: 100,
  PWR_OPERATE_LAB: 10,
  PWR_OPERATE_EXTENSION: 2,
  PWR_OPERATE_OBSERVER: 10,
  PWR_OPERATE_TERMINAL: 100,
  PWR_DISRUPT_SPAWN: 10,
  PWR_DISRUPT_TOWER: 10,
  PWR_DISRUPT_SOURCE: 100,
  PWR_SHIELD: 0,
  PWR_REGEN_SOURCE: 0,
  PWR_REGEN_MINERAL: 0,
  PWR_DISRUPT_TERMINAL: 50,
  PWR_OPERATE_POWER: 200,
  PWR_FORTIFY: 5,
  PWR_OPERATE_CONTROLLER: 200,
  PWR_OPERATE_FACTORY: 100,
}

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
