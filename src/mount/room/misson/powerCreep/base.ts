/* 超能powercreep相关任务 */
export default class PowerCreepMisson extends Room {
    /* Pc任务管理器 */
    public PowerCreep_TaskManager():void{
        if (this.controller.level < 8) return
        var storage_ = global.Stru[this.name]['storage'] as StructureStorage
        if (!storage_) return
        var pc = Game.powerCreeps[`${this.name}/queen/${Game.shard.name}`]
        var pcspawn = global.Stru[this.name]['powerspawn'] as StructurePowerSpawn
        if (!pc)
            return
        else
        {
            /* 看看是否存活，没存活就孵化 */
            if (!pc.ticksToLive && pcspawn)
            {
                pc.spawn(pcspawn)
                return
            }
        }
        this.enhance_storage()
    }
    /* 挂载增强storage的任务 */
    public enhance_storage():void{
        if (Game.time % 7) return
        if (this.memory.switch.StopEnhanceStorage) return
        var storage_ = global.Stru[this.name]['storage'] as StructureStorage
        if (!storage_) return
        let pc = Game.powerCreeps[`${this.name}/queen/${Game.shard.name}`]
        if (!pc || !pc.powers[PWR_OPERATE_STORAGE]) return
        let effectDelay:boolean = false
        if (!storage_.effects) storage_.effects = []
        for (var effect_ of storage_.effects)
        {
            if (effect_.effect == PWR_OPERATE_STORAGE && effect_.ticksRemaining <= 0)
            effectDelay = true
        }
        if ((!storage_.effects ||storage_.effects.length <=0 || effectDelay) && this.MissionNum('PowerCreep','仓库扩容') <= 0)
        {
            /* 发布任务 */
            var thisTask:MissionModel = {
                name:"仓库扩容",
                delayTick:40,
                range:'PowerCreep',
            }
            thisTask.CreepBind = {'queen':{num:1,bind:[]}}
            this.AddMission(thisTask)
        }
    }

    /* 挂载增强lab的任务 */

    /* 挂载防御塔任务 */

    /* 挂载填充拓展任务 */

    /* 挂载spawn加速任务 */

    /* 挂载升级工厂任务 */
    
}