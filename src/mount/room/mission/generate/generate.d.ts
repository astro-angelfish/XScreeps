interface Room {
  generateCarryMission(creepData: CreepBindData, delayTick: number, sR: string, sX: number, sY: number, tR: string, tX: number, tY: number, rType?: ResourceConstant, num?: number): Omit<MissionModel, 'id'>
  generateRepairMission(Rtype: 'global' | 'special' | 'nuker', num: number, boostType?: ResourceConstant, level?: 'T0' | 'T1' | 'T2'): Omit<MissionModel, 'id'> | null
  generatePlanCMission(disRoom: string, Cnum: number, upNum: number, shard?: string,): Omit<MissionModel, 'id'>
  generateLinkMission(structure: string[], disStructure: string, level: number, delayTick?: number): Omit<MissionModel, 'id'>
  generateDismantleMission(disRoom: string, shard: string, num: number, interval?: number, boost?: boolean): Omit<MissionModel, 'id'>
  generateQuickMission(num: number, boostType?: ResourceConstant): Omit<MissionModel, 'id'>
  generateExpandMission(disRoom: string, shard: string, num: number, cnum?: number): Omit<MissionModel, 'id'>
  generateSupportMission(disRoom: string, sType: 'double' | 'aio', shard: string, num: number, boost: boolean): Omit<MissionModel, 'id'>
  generateControlMission(disRoom: string, shard: string, interval: number): Omit<MissionModel, 'id'>
  generateHelpBuildMission(disRoom: string, num: number, shard?: string, time?: number, defend?: boolean): Omit<MissionModel, 'id'> | null
  generateSignMission(disRoom: string, shard: string, str: string): Omit<MissionModel, 'id'>
  generateSendMission(disRoom: string, rType: ResourceConstant, num: number): Omit<MissionModel, 'id'> | null
  generateBuyMission(res: ResourceConstant, num: number, range: number, max?: number): Omit<MissionModel, 'id'> | null
  generateCompoundMission(num: number, disResource: ResourceConstant, bindData: string[]): Omit<MissionModel, 'id'> | null
  generateAioMission(disRoom: string, disShard: string, num: number, interval: number, boost: boolean, bodylevel?: 'T0' | 'T1' | 'T2'): Omit<MissionModel, 'id'>
  generateOutMineMission(sourceRoom: string, x: number, y: number, disRoom: string): Omit<MissionModel, 'id'> | null
  generatePowerHarvestMission(disRoom: string, x: number, y: number, num: number): Omit<MissionModel, 'id'>
  generateDepositHarvestMission(disRoom: string, x: number, y: number, rType: DepositConstant): Omit<MissionModel, 'id'>
  generateRedDefendMission(num: number): Omit<MissionModel, 'id'> | null
  generateBlueDefendMission(num: number): Omit<MissionModel, 'id'> | null
  generateDoubleDefendMission(num: number): Omit<MissionModel, 'id'> | null
  generateSquadMission(disRoom: string, shard: string, interval: number, RNum: number, ANum: number, DNum: number, HNum: number, AIONum: number, flag: string): Omit<MissionModel, 'id'> | null
  generateDoubleMission(disRoom: string, shard: string, CreepNum: number, cType: 'dismantle' | 'attack', interval: number): Omit<MissionModel, 'id'> | null
  generateResourceTransferMission(disRoom: string, resource?: ResourceConstant, num?: number): Omit<MissionModel, 'id'>
}
