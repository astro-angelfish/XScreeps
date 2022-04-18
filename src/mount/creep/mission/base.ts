/* 爬虫原型拓展   --任务  --任务基础 */

import { isInArray } from '@/utils'

export default class CreepMissionBaseExtension extends Creep {
  public manageMission(): void {
    if (this.spawning)
      return
    if (!this.memory.missionData)
      this.memory.missionData = {}
    /* 生命低于10就将资源上交 */
    if (isInArray(['transport', 'manage'], this.memory.role)) {
      if (Game.time % 5 == 0)
        this.memory.standed = true
      else this.memory.standed = false
      if (this.ticksToLive < 10) {
        const storage_ = Game.getObjectById(Game.rooms[this.memory.belong].memory.structureIdData.storageID) as StructureStorage
        if (!storage_)
          return
        if (this.store.getUsedCapacity() > 0) {
          for (const i in this.store) {
            this.transfer_(storage_, i as ResourceConstant)
            return
          }
        }
        return
      }
    }
    if (Object.keys(this.memory.missionData).length <= 0) {
      if (this.memory.taskRB) {
        const task_ = Game.rooms[this.memory.belong].getMissionById(this.memory.taskRB)
        if (task_) {
          task_.creepBind[this.memory.role].bind.push(this.name)
          this.memory.missionData.id = task_.id // 任务id
          this.memory.missionData.name = task_.name // 任务名
          this.memory.missionData.Data = task_.data ? task_.data : {} // 任务数据传输
          return
        }
      }
      /* 每任务的情况下考虑领任务 */
      if (!Game.rooms[this.memory.belong].memory.mission.Creep)
        Game.rooms[this.memory.belong].memory.mission.Creep = []
      const taskList = Game.rooms[this.memory.belong].memory.mission.Creep
      const thisTaskList: MissionModel[] = []
      for (const Stask of taskList) {
        if (Stask.creepBind && isInArray(Object.keys(Stask.creepBind), this.memory.role))
          thisTaskList.push(Stask)
      }
      if (thisTaskList.length <= 0) {
        /* 没任务就处理剩余资源 */
        if (this.room.name != this.memory.belong)
          return
        const st = this.store
        if (!st)
          return
        for (const i of Object.keys(st)) {
          const storage_ = Game.getObjectById(Game.rooms[this.memory.belong].memory.structureIdData.storageID) as StructureStorage
          if (!storage_)
            return
          this.say('🛒')
          if (this.transfer(storage_, i as ResourceConstant) == ERR_NOT_IN_RANGE)
            this.goTo(storage_.pos, 1)
          return
        }
      }
      else {
        /* 还没有绑定的任务，就等待接取任务 */
        LoopBind:
        for (const t of thisTaskList) {
          if (t.creepBind && t.creepBind[this.memory.role] && t.creepBind[this.memory.role].bind.length < t.creepBind[this.memory.role].num) {
            /* 绑定任务了就输入任务数据 */
            t.processing = true // 领取任务后，任务开始计时
            t.creepBind[this.memory.role].bind.push(this.name)
            this.memory.missionData.id = t.id // 任务id
            this.memory.missionData.name = t.name // 任务名
            this.memory.missionData.Data = t.data ? t.data : {} // 任务数据传输
            // this.memory.MissionData.Sata = t.Sata?t.Sata:{}
            break LoopBind
          }
        }
        if (Object.keys(this.memory.missionData).length <= 0)
          this.say('💤')
      }
    }
    else {
      switch (this.memory.missionData.name) {
        case '虫卵填充':{ this.handle_feed(); break }
        case '物流运输':{ this.handle_carry(); break }
        case '墙体维护':{ this.handle_repair(); break }
        case 'C计划':{ this.handle_planC(); break }
        case '黄球拆迁':{ this.handle_dismantle(); break }
        case '急速冲级':{ this.handle_quickRush(); break }
        case '扩张援建':{ this.handle_expand(); break }
        case '紧急支援':{ this.handle_support(); break }
        case '控制攻击':{ this.handle_control(); break }
        case '紧急援建':{ this.handle_helpBuild(); break }
        case '房间签名':{ this.handle_sign(); break }
        case '攻防一体':{ this.handle_aio(); break }
        case '原矿开采':{ this.handle_mineral(); break }
        case '外矿开采':{ this.handle_outmine(); break }
        case 'power采集':{ this.handle_power(); break }
        case 'deposit采集':{ this.handle_deposit(); break }
        case '红球防御':{ this.handle_defend_attack(); break }
        case '蓝球防御':{ this.handle_defend_range(); break }
        case '双人防御':{ this.handle_defend_double(); break }
        case '四人小队':{ this.handle_task_squard(); break }
        case '双人小队':{ this.handle_double(); break }
      }
    }
  }
}
