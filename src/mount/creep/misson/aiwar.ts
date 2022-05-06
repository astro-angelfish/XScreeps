import { canSustain, RangeCreep, warDataInit } from "@/module/war/war"
export default class CreepMissonWarExtension extends Creep {

    /*ai哨兵*/
    public handle_aisentry(): void {
        // console.log('AI哨兵')
        let missionData = this.memory.MissionData
        let id = missionData.id
        let data = missionData.Data
        if (!missionData) return
        var roomName = data.disRoom
        if (this.room.name == this.memory.belong) {
            switch (missionData.Data.bodylevel) {
                case 'T3':
                    // console.log('操作强化')
                    if (!this.BoostCheck(['move', 'heal', 'tough'])) return
                    break;

            }
        }

        if (this.hits < this.hitsMax && this.room.name != roomName) {
            /*跳跃到了隔壁房间自我恢复血量*/
            this.heal(this);
            return;
        }
        if (this.room.name != roomName || Game.shard.name != data.shard) {
            this.arriveTo(new RoomPosition(24, 24, roomName), 23, data.shard, data.shardData ? data.shardData : null)
        } else {
            /*搜索边界,根据自己当前的坐标位置来判定具体的边界判定*/
            let Export_id = 0;
            if (this.pos.y >= 49) {//下
                Export_id = 1;
                this.goTo(new RoomPosition(this.pos.x, 48, roomName), 0)
            } else if (this.pos.x >= 49) { //右边
                Export_id = 2;
                this.goTo(new RoomPosition(48, this.pos.x, roomName), 0)
            } else if (this.pos.y < 1) { //上
                Export_id = 3;
                this.goTo(new RoomPosition(this.pos.x, 1, roomName), 0)
            } else if (this.pos.x < 1) { //左边
                Export_id = 4;
                this.goTo(new RoomPosition(1, this.pos.x, roomName), 0)
            }

            /*保持自己在边界 如果被攻击则通过边界移动 */
            if (this.hits < this.hitsMax) {
                /*跳跃到了隔壁房间自我恢复血量*/
                this.heal(this);
            }
            /*获取三格内的单位攻击力*/
            warDataInit(Game.rooms[data.disRoom])
            let creeps = global.warData.enemy[data.disRoom].data
            // console.log(JSON.stringify(global.warData.tower[data.disRoom].data))
            let flags = global.warData.flag[data.disRoom].data
            let ranged3Attack = RangeCreep(this.pos, creeps, 3, true)  // 三格内的攻击性爬虫
            if (ranged3Attack.length > 0) {
                // 防御塔伤害数据
                let towerData = global.warData.tower[this.room.name].data
                let posStr = `${this.pos.x}/${this.pos.y}`
                let towerHurt = towerData[posStr] ? towerData[posStr]['attack'] : 0
                if (!canSustain(ranged3Attack, this, towerHurt)) {
                    this.say("危")
                    /*操作撤退*/
                    switch (Export_id) {
                        case 1:
                            this.pos.y++;
                            break;
                        case 2:
                            this.pos.x++;
                            break;
                        case 3:
                            this.pos.y--;
                            break;
                        case 4:
                            this.pos.x--;
                            break;
                    }
                    this.goTo(this.pos, 0)
                }
            }
        }
    }




}