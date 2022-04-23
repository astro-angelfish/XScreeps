interface PowerCreepMemory{
  role?: string
  belong?: string
  spawn?: string
  missionData?: any // 处理任务过程中任务的信息
  MissionState?: number
  shard?: string
  working?: boolean
}

interface PowerCreep{
  manageMission(): void
  prepareOps(): boolean

  processPwrStorageMission(): void
  processPwrTowerMission(): void
  processPwrLabMission(): void
  processPwrExtensionMission(): void
  processPwrSpawnMission(): void
  processPwrFactoryMission(): void
  processPwrPowerSpawnMission(): void

  processBasicWithdraw(distination: Structure, rType: ResourceConstant): void
  processBasicTransfer(distination: Structure, rType: ResourceConstant): void
}
