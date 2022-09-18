/**
 * 功能相关声明
 */
interface Creep {
    workstate(rType: ResourceConstant, ratio?: number): void
    harvest_(source_: Source): void
    transfer_(distination: Structure, rType: ResourceConstant, ops?: number): void
    upgrade_(ops?:number): void
    build_(distination: ConstructionSite): void
    repair_(distination: Structure, ops?: number): void
    withdraw_(distination: Structure, rType: ResourceConstant, range?: number): void
    BoostCheck(boostBody: string[], state?: boolean): boolean
    optTower(otype: 'heal' | 'attack', creep: Creep, boolean?: boolean): void
    hostileCreep_atk(creep: any): void
    isInDefend(creep: Creep): boolean
    closestCreep(creep: Creep[], hurt?: boolean): Creep
    SearchHostilecreeps(range?: number): Creep | null
    sayHi(type?: stateType): void,
    countBodyPart(bodyType: BodyPartConstant): number
}