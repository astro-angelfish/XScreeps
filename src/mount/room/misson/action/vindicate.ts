/* 房间原型拓展   --行为  --维护任务 */
export default class RoomMissonVindicateExtension extends Room {
    public Task_Repair(mission:MissionModel):void{
        if (mission.Data.RepairType == 'global')
        {

        }
        else if (mission.Data.RepairType == 'special')
        {

        }
        else if (mission.Data.RepairType == 'nuker')
        {

        }
    }
}