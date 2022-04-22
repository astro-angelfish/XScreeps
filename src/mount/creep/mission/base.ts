import { profileMethod } from '@/utils'

/* 爬虫原型拓展   --任务  --任务基础 */
export default class CreepMissionBaseExtension extends Creep {
  @profileMethod()
  public manageMission(): void {
    if (this.spawning)
      return

    if (!this.memory.missionData)
      this.memory.missionData = {}

    const belongRoom = Game.rooms[this.memory.belong] as Room | undefined

    // 生命低于 10 就将资源上交
    if (['transport', 'manage'].includes(this.memory.role)) {
      if (Game.time % 5 === 0)
        this.memory.standed = true
      else this.memory.standed = false

      if (this.ticksToLive! < 10 && belongRoom) {
        const storage = belongRoom.memory.structureIdData?.storageID ? Game.getObjectById(belongRoom.memory.structureIdData.storageID) : null
        if (!storage)
          return

        if (this.store.getUsedCapacity() > 0)
          this.processBasicTransfer(storage, Object.keys(this.store)[0] as ResourceConstant)

        return
      }
    }

    if (Object.keys(this.memory.missionData).length <= 0 && belongRoom) {
      if (this.memory.taskRB) {
        const task = belongRoom.getMissionById(this.memory.taskRB)
        if (task?.creepBind) {
          task.creepBind[this.memory.role].bind.push(this.name)
          this.memory.missionData.id = task.id // 任务id
          this.memory.missionData.name = task.name // 任务名
          this.memory.missionData.Data = task.data ? task.data : {} // 任务数据传输
          return
        }
      }

      // 没任务的情况下考虑领任务
      if (!belongRoom.memory.mission.Creep)
        belongRoom.memory.mission.Creep = []

      const taskList = belongRoom.memory.mission.Creep
        .filter(i => i.creepBind && Object.keys(i.creepBind).includes(this.memory.role))

      // 没任务就处理剩余资源
      if (taskList.length <= 0) {
        if (this.room.name !== this.memory.belong)
          return

        if (this.store.getUsedCapacity() > 0) {
          const storage = belongRoom.memory.structureIdData?.storageID ? Game.getObjectById(belongRoom.memory.structureIdData.storageID) : null
          if (storage)
            this.processBasicTransfer(storage, Object.keys(this.store)[0] as ResourceConstant)
        }
      }

      // 还没有绑定的任务，就等待接取任务
      else {
        const task = taskList.find(t => t.creepBind?.[this.memory.role] && t.creepBind[this.memory.role].bind.length < t.creepBind[this.memory.role].num)
        if (task) {
          // 绑定任务了就输入任务
          // 领取任务后，任务开始计时数据
          task.processing = true
          task.creepBind![this.memory.role].bind.push(this.name)
          this.memory.missionData.id = task.id // 任务id
          this.memory.missionData.name = task.name // 任务名
          this.memory.missionData.Data = task.data || {} // 任务数据传输
          // this.memory.MissionData.Sata = t.Sata?t.Sata:{}
        }
        else {
          this.say('💤')
        }
      }
    }

    else {
      switch (this.memory.missionData.name) {
        case '虫卵填充':{ this.processFeedMission(); break }
        case '物流运输':{ this.processCarryMission(); break }
        case '墙体维护':{ this.processRepairMission(); break }
        case 'C计划':{ this.processPlanCMission(); break }
        case '黄球拆迁':{ this.processDismantleMission(); break }
        case '急速冲级':{ this.processQuickRushMission(); break }
        case '扩张援建':{ this.processExpandMission(); break }
        case '紧急支援':{ this.handle_support(); break }
        case '控制攻击':{ this.processControlMission(); break }
        case '紧急援建':{ this.processHelpBuildMission(); break }
        case '房间签名':{ this.processSignMission(); break }
        case '攻防一体':{ this.handle_aio(); break }
        case '原矿开采':{ this.processMineralMission(); break }
        case '外矿开采':{ this.processOutineMission(); break }
        case 'power采集':{ this.processPowerMission(); break }
        case 'deposit采集':{ this.processDepositMission(); break }
        case '红球防御':{ this.processDefendAttackMission(); break }
        case '蓝球防御':{ this.processDefendRangeMission(); break }
        case '双人防御':{ this.processDefendDoubleMission(); break }
        case '四人小队':{ this.handle_task_squard(); break }
        case '双人小队':{ this.handle_double(); break }
      }
    }
  }
}
