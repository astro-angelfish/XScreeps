/**
 * 任务相关声明
 */
interface Creep {
  manageMission(): void

  // 任务
  processFeedMission(): void
  processCarryMission(): void
  processRepairMission(): void
  processPlanCMission(): void
  processDismantleMission(): void
  processQuickRushMission(): void
  processExpandMission(): void
  handle_support(): void
  processControlMission(): void
  processHelpBuildMission(): void
  processSignMission(): void
  handle_aio(): void
  processMineralMission(): void
  processOutineMission(): void
  processPowerMission(): void
  processDepositMission(): void
  processDefendAttackMission(): void
  processDefendRangeMission(): void
  processDefendDoubleMission(): void
  handle_task_squard(): void
  handle_double(): void
}

interface CreepMemory {
  missionData?: any
  double?: string // 双人小队
  captain?: boolean
  swith?: boolean
  disPos?: string
  num?: number
  bindpoint?: string
  tick?: number
  controlledBySquardFrame?: boolean
  squad?: Squad
  arrived?: boolean
  targetFlag?: string
}
