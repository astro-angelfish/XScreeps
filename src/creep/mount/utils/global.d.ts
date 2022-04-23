/**
 * 功能相关声明
 */
interface Creep{
  processBasicWorkState(rType: ResourceConstant): void
  processBasicHarvest(source_: Source): void
  processBasicTransfer(distination: Structure, rType: ResourceConstant): void
  processBasicUpgrade(): void
  processBasicBuild(distination: ConstructionSite): void
  processBasicRepair(distination: Structure): void
  processBasicWithdraw(distination: Structure, rType: ResourceConstant): void
  processBoost(boostBody: string[]): boolean
  optTower(otype: 'heal'|'attack', creep: Creep): void
  isInDefend(creep: Creep): boolean
  getClosestCreep(creep: Creep[], hurt?: boolean): Creep | undefined
  calcRangedMassAttackDamage(target: Creep | PowerCreep | Structure): number
}
