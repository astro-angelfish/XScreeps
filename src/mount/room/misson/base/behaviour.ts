/* 房间原型拓展   --任务  --基本功能 */
export default class RoomMissonBehaviourExtension extends Room {
    // 搬运基本任务
    public Task_Carry(misson:MissionModel):void{
        /* 搬运任务需求 sourcePosX,Y sourceRoom targetPosX,Y targetRoom num  rType  */
        // 没有任务数据 或者数据不全就取消任务
        if (!misson.Data) this.DeleteMission(misson.id)
        if (!misson.CreepBind) this.DeleteMission(misson.id)
        /* 生产相关爬虫 */
        for (var cRole in misson.CreepBind)
        {
            /* manage 和 transport是例外，他们是常驻 */
            if (cRole == 'manage' || cRole == 'transport')
            continue
            // for (var i=0;i<misson.CreepBind[cRole].num;i++)
            //     this.AddSpawnList(cRole,global.CreepBodyData[this.name][cRole],10)
        }
    }

    // 建造任务
    public Constru_Build():void{
        if (Game.time % 51) return
        if (this.controller.level < 5) return
        var myConstrusion = new RoomPosition(Memory.RoomControlData[this.name].center[0],Memory.RoomControlData[this.name].center[1],this.name).findClosestByRange(FIND_MY_CONSTRUCTION_SITES)
        if (myConstrusion)
        {
            /* 添加一个进孵化队列 */
            this.NumSpawn('build',1)
        }
        else
        {
            delete this.memory.SpawnConfig['build']
        }
    }

    
}