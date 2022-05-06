/* 房间原型拓展   --任务  --Ai战争 */
export default class NormalWarExtension extends Room {
    public Task_Aisentry(mission: MissionModel): void {
        if ((Game.time - global.Gtime[this.name]) % 11) return
        if (!this.Check_Lab(mission, 'transport', 'complex')) return

        
    }
}