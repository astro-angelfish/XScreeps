import { isInArray, unzipPosition, zipPosition } from "@/utils";

/* 房间原型拓展   --智能战争 */
export default class RoomMissonDefendExtension extends Room {
    /*智能战争初始化保持*/
    public Task_Aiwar(mission: MissionModel): void {
        if (this.MissionNum('Creep', '智能哨兵') > 0) return
        /*派发智能哨兵任务*/
        var thisTask: MissionModel = {
            name: '智能哨兵',
            range: 'Creep',
            delayTick: 50000,
            level: 10,
            Data: {
                disRoom: mission.Data.disRoom,
                shard: mission.Data.shard,
                bodylevel: mission.Data.bodylevel
            },
        }
        if (mission.Data.boost) {/*强化任务*/
            thisTask.Data.boost = mission.Data.boost;
        }
        if (mission.Data.shardData) {/*位面传送*/
            thisTask.Data.shardData = mission.Data.shardData;
        }
        thisTask.CreepBind = { 'Ai-sentry': { num: 1, bind: [], interval: 1000, MSB: true } }
        switch (mission.Data.bodylevel) {
            case 'T3':
                thisTask.LabMessage = { 'XLHO2': 'boost', 'XZHO2': 'boost', 'XGHO2': 'boost' }
                break;
        }
        this.AddMission(thisTask)
    }

    
}