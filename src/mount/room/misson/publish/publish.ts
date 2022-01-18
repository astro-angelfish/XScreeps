/* 房间原型拓展   --任务  --任务发布便捷函数 */
export default class RoomMissonPublish extends Room {
    /**
     * 搬运任务发布函数
     * @param creepData 爬虫绑定信息，例如：{'repair':{num:1,bind:[]},'build':{num:2,bind:[]}}
     * @param delayTick 任务的超时时间，如果不想设置超时可以设置为99999 
     * @param sR        提取资源的建筑所在房间
     * @param sX        提取资源的建筑X坐标
     * @param sY        提取资源的建筑Y坐标
     * @param tR        存放资源的建筑所在房间
     * @param tX        存放资源的建筑X坐标
     * @param tY        存放资源的建筑Y坐标
     * @param rType     资源类型[可选] 例如： 'energy' 或者 'XLH2O'等
     * @param num       要搬运的数量[可选]
     * @returns         任务对象
     */
    public Public_Carry(creepData:BindData,delayTick:number,sR:string,sX:number,sY:number,tR:string,tX:number,tY:number,rType?:ResourceConstant,num?:number):MissionModel{
        var thisTask:MissionModel = 
            {
                name :'物流运输',
                CreepBind:creepData,
                range:'Creep',
                delayTick:delayTick,
                cooldownTick:1,
                Data:{
                    sourceRoom:sR,
                    sourcePosX:sX,
                    sourcePosY:sY,
                    targetRoom:tR,
                    targetPosX:tX,
                    targetPosY:tY,
                }
            }
        if (rType) thisTask.Data.rType = rType
        if (num) thisTask.Data.num = num
        return thisTask
    }

    /**
     * 修墙任务的发布函数
     * @param Rtype     维修范围： global->全局维修 special->黄黑旗下建筑维修 nuker->核弹防御
     * @param num       任务相关维修爬数量
     * @param boostType boost类型 null->无boost LH/LH2O/XLH2O是boost类型
     * @param vindicate 是否减少爬虫部件(一般用于正常维护，而非战时)
     * @returns         任务对象
     */
    public public_repair(Rtype:'global' | 'special' | 'nuker',num:number,boostType:ResourceConstant,vindicate:boolean):MissionModel
    {
        var thisTask:MissionModel = {
            name:'墙体维护',
            range:'Creep',
            delayTick:99999,
            level:10,
            Data:{
                RepairType:Rtype,
                num:num,
                boostType:boostType,
                vindicate:vindicate
            },
        }
        thisTask.CreepBind = {'repair':{num:num,bind:[]}}
        if (boostType == 'LH')
        {
            var labData = this.Bind_Lab(['LH'])
            if (labData === null) return null
            thisTask.LabBind = labData
        }
        else if (boostType == 'LH2O')
        {
            var labData = this.Bind_Lab(['LH2O'])
            if (labData === null) return null
            thisTask.LabBind = labData

        }
        else if (boostType == 'XLH2O')
        {
            var labData = this.Bind_Lab(['XLH2O'])
            if (labData === null) return null
            thisTask.LabBind = labData
        }
        thisTask.maxTime = 3
        return thisTask
    }

    /**
     *                  C计划 即占领一个房间开启安全模式，建造wall，保护主房
     * @param disRoom   目标房间
     * @returns         任务对象
     */
    public public_planC(disRoom:string):MissionModel{
        var thisTask:MissionModel = {
            name:'C计划',
            range:'Creep',
            delayTick:20500,
            level:10,
            Data:{
                state:0,
                disRoom:disRoom
            },
        }
        thisTask.CreepBind = {'cclaim':{num:1,bind:[]},'cupgrade':{num:1,bind:[]}}
        return thisTask
    }

    /**
     *                  link传任务发布函数
     * @param structure 传送的link
     * @param dislink   目的link
     * @param level     传送任务等级
     * @param delayTick 过期时间
     * @returns         任务对象
     */
    public Public_link(structure:string[],dislink:string,level:number,delayTick?:number):MissionModel{
        var thisTask:MissionModel = {
            name:'链传送能',
            range:'Structure',
            delayTick:20,
            structure:structure,
            level:level,
            Data:{
                disStructure:dislink
            }
        }
        if (delayTick) thisTask.delayTick = delayTick
        return thisTask
    }
}