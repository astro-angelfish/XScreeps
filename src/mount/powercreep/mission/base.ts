import { checkDispatch, checkSendMission, getRoomDispatchNum } from '@/module/fun/funtion'
import { colorfyLog, sortByKey } from '@/utils'

export default class PowerCreepMissionBase extends PowerCreep {
  /**
   * pc 处理任务专用函数
   */
  public manageMission(): void {
    // 获取名字
    const name = this.name
    const info = name.split('/')
    // pc姓名 如： E41S45/home/shard3/1
    if (info.length !== 3) {
      this.say('名字有问题!')
      return
    }

    // 所属房间
    if (!this.memory.belong)
      this.memory.belong = info[0]
    // 角色
    if (!this.memory.role)
      this.memory.role = info[1]
    // 所属shard
    if (!this.memory.shard)
      this.memory.shard = info[2]

    const belongRoom = Game.rooms[this.memory.belong]
    if (!belongRoom?.controller)
      return

    const thisSpawn = belongRoom.memory.structureIdData?.powerSpawnID ? Game.getObjectById(belongRoom.memory.structureIdData.powerSpawnID) : null
    if (!thisSpawn)
      return

    if (!this.memory.spawn)
      this.memory.spawn = thisSpawn.id

    // 房间没开 power 去开 power
    if (!belongRoom.controller.isPowerEnabled) {
      // 没有允许 Power 就自动激活 power 开关
      if (!this.pos.isNearTo(belongRoom.controller))
        this.goTo(belongRoom.controller.pos, 1)
      else this.enableRoom(belongRoom.controller)
      return
    }

    // 快没生命了去 renew
    if (this.room!.name === this.memory.belong && this.memory.shard === Game.shard.name) {
      if (this.ticksToLive! < 1000) {
        if (!this.pos.isNearTo(thisSpawn))
          this.goTo(thisSpawn.pos, 1)
        else this.renew(thisSpawn)
        return
      }
    }

    if (!this.memory.missionData)
      this.memory.missionData = {}

    if (!belongRoom.memory.mission.PowerCreep)
      belongRoom.memory.mission.PowerCreep = []

    if (Object.keys(this.memory.missionData).length <= 0) {
      // 领取任务
      const taskList = belongRoom.memory.mission.PowerCreep
        .filter(task => task.creepBind && Object.keys(task.creepBind).includes(this.memory.role!))
      // 根据优先等级排列，领取最优先的任务
      taskList.sort(sortByKey('level'))

      // 还没有绑定的任务，就等待接取任务
      for (const t of taskList) {
        if (t.creepBind?.[this.memory.role] && t.creepBind[this.memory.role].bind.length < t.creepBind[this.memory.role].num) {
          // 绑定任务了就输入任务数据
          t.processing = true // 领取任务后，任务开始计时
          t.creepBind[this.memory.role].bind.push(this.name)
          this.memory.missionData.id = t.id // 任务id
          this.memory.missionData.name = t.name // 任务名
          this.memory.missionData.delay = 150 // 爬虫处理任务的超时时间
          this.memory.missionData.Data = t.data || {} // 任务数据传输
          break
        }
      }

      if (Object.keys(this.memory.missionData).length <= 0) {
        // 没有任务就生产 ops
        if (this.powers[PWR_GENERATE_OPS] && !this.powers[PWR_GENERATE_OPS].cooldown)
          this.usePower(PWR_GENERATE_OPS)
        // 如果 ops 过多，就转移 ops
        if (this.store.getUsedCapacity('ops') === this.store.getCapacity()) {
          const storage = belongRoom.memory.structureIdData?.storageID ? Game.getObjectById(belongRoom.memory.structureIdData.storageID) : null
          if (!storage)
            return

          if (this.transfer(storage, 'ops', Math.ceil(this.store.getUsedCapacity('ops') / 4)) === ERR_NOT_IN_RANGE)
            this.goTo(storage.pos, 1)
        }
      }

      return
    }

    // 处理任务
    this.memory.missionData.delay-- // 爬虫内置Tick计时
    if (this.memory.missionData.delay <= 0) {
      this.memory.missionData = {}
      return
    }

    switch (this.memory.missionData.name) {
      case '仓库扩容':{ this.processPwrStorageMission(); break }
      case '塔防增强':{ this.processPwrTowerMission(); break }
      case '合成加速':{ this.processPwrLabMission(); break }
      case '扩展填充':{ this.processPwrExtensionMission(); break }
      case '虫卵强化':{ this.processPwrSpawnMission(); break }
      case '工厂强化':{ this.processPwrFactoryMission(); break }
      case 'power强化':{ this.processPwrPowerSpawnMission(); break }
    }
  }

  /**
   * queen 类型 pc 执行任务前执行的准备
   */
  public prepareOps(): boolean {
    if (!this.memory.belong)
      return false
    const belongRoom = Game.rooms[this.memory.belong]
    if (!belongRoom)
      return false

    const storage = belongRoom.memory.structureIdData?.storageID ? Game.getObjectById(belongRoom.memory.structureIdData.storageID) : null
    if (!storage)
      return false

    // 先去除杂质
    for (const i in this.store) {
      if (i !== 'ops') {
        this.processBasicTransfer(storage, i as ResourceConstant)
        return false
      }
    }

    const num = this.store.getUsedCapacity('ops')
    if (num < 200 || num < Math.ceil(this.store.getCapacity() / 4)) {
      this.usePower(PWR_GENERATE_OPS)

      // 过少就去提取 ops 资源
      if ((storage.store.ops || 0) < 2500) {
        // 资源调度
        if (belongRoom.countMissionByName('Structure', '资源购买') <= 0) {
          // 已经存在其它房间的传送信息的情况
          if (getRoomDispatchNum(belongRoom.name) < 2
           && !checkSendMission(belongRoom.name, 'ops')
           && !checkDispatch(belongRoom.name, 'ops')) {
            console.log(colorfyLog(`[资源调度] 房间 ${this.memory.belong} 没有足够的资源 [ops]，将执行资源调度!`, 'yellow'))
            const dispatchTask: RDData = {
              sourceRoom: belongRoom.name,
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
      if (storage.store.getUsedCapacity('ops') > 0) {
        if (this.withdraw(storage, 'ops', Math.ceil(this.store.getCapacity() / 2)) === ERR_NOT_IN_RANGE)
          this.goTo(storage.pos, 1)
      }

      return false
    }

    return true
  }
}
