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

    // 资源link资源转移至centerlink中
    public Task_CenterLink():void{
        if ((global.Gtime[this.name]- Game.time) % 13) return
        if (!this.memory.StructureIdData.source_links) this.memory.StructureIdData.source_links = []
        if (!this.memory.StructureIdData.center_link || this.memory.StructureIdData.source_links.length <= 0) return
        if (this.MissionNum('Structure','链传送能') >= 1) return
        let center_link = Game.getObjectById(this.memory.StructureIdData.center_link) as StructureLink
        if (!center_link){delete this.memory.StructureIdData.center_link;return}
        for (let id of this.memory.StructureIdData.source_links )
        {
            let source_link = Game.getObjectById(id) as StructureLink
            if (!source_link)
            {
                let index = this.memory.StructureIdData.source_links.indexOf(id)
                this.memory.StructureIdData.source_links.splice(index,1)
                return
            }
            if (source_link.store.getUsedCapacity('energy') >= 600)
            {
                var thisTask = this.Public_link([source_link.id],center_link.id,10)
                this.AddMission(thisTask)
                return
            }
        }
    }

    
}