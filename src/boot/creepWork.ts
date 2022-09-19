import { RoleData, RoleLevelData } from "@/constant/SpawnConstant"
import { CalculateEnergy, colors, GenerateAbility } from "@/utils"

export const creepRunner = function (creep: Creep): void {

  if (creep.memory.Rerunt) {
    /*指令级别的操作闲置*/
    if (creep.memory.Rerunt > Game.time) { Memory.creepscpu[creep.name] = ''; return; }
    else delete creep.memory.Rerunt
  }
  // 模仿原神角色说话，要求爬命名时必须使用shenli的命名方法
  if (creep.owner.username === 'shenli') {
    if (Math.random() < 0.4) creep.sayHi(creep.room.memory.state);
  }
  var cpu_test = false
  if (Memory.Systemswitch.Showtestcreep) {
    cpu_test = true
  }
  let cpu_list = [];
  if (cpu_test) { cpu_list.push(Game.cpu.getUsed()) }
  if (creep.spawning) {
    /* 爬虫出生角色可视化 */
    creep.room.visual.text(`${creep.memory.role}`, creep.pos.x, creep.pos.y, { color: '#ffffff', font: 0.5, align: 'center', stroke: '#ff9900' })
  }
  /* 跨shard找回记忆 */
  if (!creep.memory.role) {
    var InshardMemory = global.intershardData
    if (InshardMemory['creep'][creep.name]) {
      creep.memory = InshardMemory['creep'][creep.name].MemoryData
      InshardMemory.creep[creep.name].state = 1
    }
    return
  }
  if (!RoleData[creep.memory.role]) return
  // 自适应体型生产的爬虫执行恢复体型的相关逻辑
  if (!global.Adaption[creep.memory.belong] && creep.memory.adaption) {
    if (creep.store.getUsedCapacity() == 0) {
      let room = Game.rooms[creep.memory.belong]
      if (!room) return
      let bodyData = RoleLevelData[creep.memory.role][room.controller.level].bodypart
      if (creep.body.length >= bodyData[0] + bodyData[1] + bodyData[2] + bodyData[3] + bodyData[4] + bodyData[5] + bodyData[6] + bodyData[7]) {
        creep.memory.adaption = false;
      }
      if (!creep.memory.adaption) {
        let allSpawnenergy = CalculateEnergy(GenerateAbility(bodyData[0], bodyData[1], bodyData[2], bodyData[3], bodyData[4], bodyData[5], bodyData[6], bodyData[7],))
        if (bodyData && room.energyAvailable >= allSpawnenergy && room.memory.SpawnList && room.memory.SpawnList.length <= 0) {
          creep.suicide()
          global.Adaption[creep.memory.belong] = true
        }
      }
    }
    /* adaption爬虫执行自S */
  }
  if (cpu_test) { cpu_list.push(Game.cpu.getUsed()) }
  /* 非任务类型爬虫 */
  if (RoleData[creep.memory.role].fun) {
    RoleData[creep.memory.role].fun(creep)
  }
  /* 任务类型爬虫 */
  else {
    creep.ManageMisson()
  }
  if (cpu_test) {
    cpu_list.push(Game.cpu.getUsed())
    Memory.creepscpu[creep.name] = (cpu_list[1] - cpu_list[0]).toFixed(3) + "|" + (cpu_list[2] - cpu_list[1]).toFixed(3) + "|" + creep.memory.role;
    if (cpu_list[2] - cpu_list[0] > 0.3) {
      let MissionDataName = '未领取';
      if (creep.memory.MissionData?.name) {
        MissionDataName = creep.memory.MissionData.name;
      }
      console.log(
        creep.name,
        creep.room.name,
        '初始化' + (cpu_list[1] - cpu_list[0]).toFixed(3),
        '任务执行' + (cpu_list[2] - cpu_list[1]).toFixed(3),
        '总计' + (cpu_list[2] - cpu_list[0]).toFixed(3),
        creep.memory.role,
        MissionDataName,
        creep.memory.working
      )
    }

  }
}