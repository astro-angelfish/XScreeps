interface Room {
    Public_Carry(creepData:BindData,delayTick:number,sR:string,sX:number,sY:number,tR:string,tX:number,tY:number,rType?:ResourceConstant,num?:number):MissionModel
    public_repair(Rtype:'global' | 'special' | 'nuker',num:number,boostType:ResourceConstant,vindicate:boolean):MissionModel
    public_planC(disRoom:string,Cnum:number,upNum:number,shard?:shardName,):MissionModel
    Public_link(structure:string[],disStructure:string,level:number,delayTick?:number):MissionModel
    Public_dismantle(disRoom:string,num:number,interval?:number,boost?:boolean):MissionModel
    Check_Lab(misson:MissionModel,role:string,tankType:'storage' | 'terminal' | 'complex')
    Public_quick(num:number,boostType:ResourceConstant | null):MissionModel
    Public_expand(disRoom:string,num:number,cnum?:number):MissionModel
    Public_support(disRoom:string,sType:'double' | 'aio' | 'squard',shard?:string):MissionModel
    Public_control(disRoom:string,shard:shardName,interval:number):MissionModel
    Public_helpBuild(disRoom:string,num:number,shard?:string,time?:number):MissionModel
    Public_Sign(disRoom:string,shard:string,str:string):MissionModel
    Public_Send(disRoom:string,rType:ResourceConstant,num:number):MissionModel
    Public_Buy(res:ResourceConstant,num:number,range:number,max?:number):MissionModel
    public_Compound(num:number,disResource:ResourceConstant,bindData:string[]):MissionModel
    Public_aio(disRoom:string,disShard:shardName,num:number,interval:number,boost:boolean)
    public_OutMine(sourceRoom:string,x:number,y:number,disRoom:string):MissionModel
    public_PowerHarvest(disRoom:string,x:number,y:number,num:number):MissionModel
    public_DepositHarvest(disRoom:string,x:number,y:number,rType:DepositConstant):MissionModel
}