import { OptCost } from './constant'
import { checkDispatch, checkSend, getRoomDispatchNum } from '@/module/fun/funtion'
import { colorfyLog, isInArray, sortByKey } from '@/utils'

export default class PowerCreepMissionBase extends PowerCreep {
  // pc处理任务专用函数
  public manageMission(): void {
    /* 获取名字 */
    const name = this.name
    const info = name.split('/')
    /* pc姓名 如： E41S45/home/shard3/1 */
    if (info.length != 3) { this.say('名字有问题!'); return }
    if (!this.memory.belong)
      this.memory.belong = info[0] // 所属房间
    if (!this.memory.role)
      this.memory.role = info[1] // 角色
    if (!this.memory.shard)
      this.memory.shard = info[2] as string // 所属shard
    if (!Game.rooms[this.memory.belong])
      return
    const thisSpawn = global.structureCache[this.memory.belong].powerspawn as StructurePowerSpawn
    if (!thisSpawn)
      return
    if (!this.memory.spawn)
      this.memory.spawn = thisSpawn.id

    // 房间没开power去开power
    if (!Game.rooms[this.memory.belong].controller.isPowerEnabled) {
      /* 没有允许Power就自动激活power开关 */
      if (!this.pos.isNearTo(Game.rooms[this.memory.belong].controller))
        this.goTo(Game.rooms[this.memory.belong].controller.pos, 1)
      else this.enableRoom(Game.rooms[this.memory.belong].controller)
      return
    }
    // 快没生命了去renew
    if (this.room.name == this.memory.belong && this.memory.shard == Game.shard.name) {
      if (this.ticksToLive < 1000) {
        if (!this.pos.isNearTo(thisSpawn))
          this.goTo(thisSpawn.pos, 1)
        else this.renew(thisSpawn)
        return
      }
    }
    if (!this.memory.MissionData)
      this.memory.MissionData = {}
    if (!Game.rooms[this.memory.belong].memory.mission.PowerCreep)
      Game.rooms[this.memory.belong].memory.mission.PowerCreep = []
    if (Object.keys(this.memory.MissionData).length <= 0) {
      /* 领取任务 */
      const taskList = Game.rooms[this.memory.belong].memory.mission.PowerCreep
      const thisTaskList: MissionModel[] = []
      for (const Stask of taskList) {
        if (Stask.creepBind && isInArray(Object.keys(Stask.creepBind), this.memory.role))
          thisTaskList.push(Stask)
      }
      /* 根据优先等级排列，领取最优先的任务 */
      thisTaskList.sort(sortByKey('level'))
      /* 还没有绑定的任务，就等待接取任务 */
      LoopBind:
      for (const t of thisTaskList) {
        if (t.creepBind && t.creepBind[this.memory.role] && t.creepBind[this.memory.role].bind.length < t.creepBind[this.memory.role].num) {
          /* 绑定任务了就输入任务数据 */
          t.processing = true // 领取任务后，任务开始计时
          t.creepBind[this.memory.role].bind.push(this.name)
          this.memory.MissionData.id = t.id // 任务id
          this.memory.MissionData.name = t.name // 任务名
          this.memory.MissionData.delay = 150 // 爬虫处理任务的超时时间
          this.memory.MissionData.Data = t.data ? t.data : {} // 任务数据传输
          break LoopBind
        }
      }
      if (Object.keys(this.memory.MissionData).length <= 0) {
        /* 没有任务就生产ops */
        if (this.powers[PWR_GENERATE_OPS] && !this.powers[PWR_GENERATE_OPS].cooldown)
          this.usePower(PWR_GENERATE_OPS)
        // 如果ops过多，就转移ops
        if (this.store.getUsedCapacity('ops') == this.store.getCapacity()) {
          const storage_ = global.structureCache[this.memory.belong].storage as StructureStorage
          if (!storage_)
            return
          if (this.transfer(storage_, 'ops', Math.ceil(this.store.getUsedCapacity('ops') / 4)) == ERR_NOT_IN_RANGE)
            this.goTo(storage_.pos, 1)
        }
      }
    }
    else {
      /* 处理任务 */
      this.memory.MissionData.delay-- // 爬虫内置Tick计时
      if (this.memory.MissionData.delay <= 0) {
        this.memory.MissionData = {}
        return
      }
      switch (this.memory.MissionData.name) {
        case '仓库扩容':{ this.handle_pwr_storage(); break }
        case '塔防增强':{ this.handle_pwr_tower(); break }
        case '合成加速':{ this.handle_pwr_lab(); break }
        case '扩展填充':{ this.handle_pwr_extension(); break }
        case '虫卵强化':{ this.handle_pwr_spawn(); break }
        case '工厂强化':{ this.handle_pwr_factory(); break }
        case 'power强化':{ this.handle_pwr_powerspawn(); break }
      }
    }
  }

  // queen类型pc执行任务前执行的准备
  public OpsPrepare(): boolean {
    const storage_ = global.structureCache[this.memory.belong].storage as StructureStorage
    if (!storage_)
      return false
    // 先去除杂质
    for (const i in this.store) {
      if (i != 'ops') {
        this.transfer_(storage_, i as ResourceConstant)
        return
      }
    }
    const num = this.store.getUsedCapacity('ops')
    if (num < 200 || num < Math.ceil(this.store.getCapacity() / 4)) {
      this.usePower(PWR_GENERATE_OPS)
      // 过少就去提取ops资源
      if (storage_.store.getUsedCapacity('ops') < 2500) {
        // 资源调度
        const room_ = Game.rooms[this.memory.belong]
        if (room_.MissionNum('Structure', '资源购买') <= 0) {
          if (getRoomDispatchNum(room_.name) < 2 && !checkSend(room_.name, 'ops') && !checkDispatch(room_.name, 'ops')) // 已经存在其它房间的传送信息的情况
          {
            console.log(colorfyLog(`[资源调度] 房间${this.memory.belong}没有足够的资源[${'ops'}],将执行资源调度!`, 'yellow'))
            const dispatchTask: RDData = {
              sourceRoom: room_.name,
              rType: 'ops',
              num: 10000,
              delayTick: 200,
              conditionTick: 35,
              buy: true,
              mtype: 'deal',
            }
            Memory.resourceDispatchData.push(dispatchTask)
          }
        }
      }
      if (storage_.store.getUsedCapacity('ops') > 0) {
        if (this.withdraw(storage_, 'ops', Math.ceil(this.store.getCapacity() / 2)) == ERR_NOT_IN_RANGE)
          this.goTo(storage_.pos, 1)
      }
      return false
    }
    else { return true }
  }
}
