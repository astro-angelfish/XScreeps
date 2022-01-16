import { RoleData } from "@/constant/SpawnConstant"

/* [通用]爬虫运行主程序 */
export default()=>{
    /* powercreep */
    for (var pc in Game.powerCreeps)
    {
      let thisCreep = Game.powerCreeps[c]
      if (!thisCreep) continue
      
    }

    /* creep */
    for (var c in Game.creeps)
    {   
      let thisCreep = Game.creeps[c]
      if (!thisCreep) continue
      /* 跨shard找回记忆 */
      if (!thisCreep.memory.role)
      {
        continue 
      }
      if (!RoleData[thisCreep.memory.role]) continue
      /* 非任务类型爬虫 */
      if (RoleData[thisCreep.memory.role].fun)
      {
        RoleData[thisCreep.memory.role].fun(thisCreep)
      }
      /* 任务类型爬虫 */
      else
      {
        thisCreep.ManageMisson()
      }
    }
}