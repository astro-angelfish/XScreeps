/* 存放全局方法 */

/*  判定是否在列表里 */
export function isInArray(arr:any[],value:any):boolean
{
  for (var i=0;i<arr.length;i++){
    if (value === arr[i])
    {
      return true
    }
  }
  return false
}

/* 用于多structure类型的filter判断 */
export function filter_structure(structure:Structure,arr:StructureConstant[]):boolean
{
  return isInArray(arr,structure.structureType)
}

/* 寻找列表中hit最小且没有超过指定值的建筑  模式0 为hit最小， 模式1为hit差值最小 模式2为hits/hitsMax比值最小*/
export function LeastHit(arr:Structure[],mode:number = 0,radio?:number):Structure | undefined
{
  if (arr.length > 0)
  {
    var ret:Structure = arr[0]
    if (mode == 0)
    {
      for (var index of arr)
      {
        if (index.hits < ret.hits) ret = index
      }
      return ret
    }
    if (mode == 1)
    {
      for (var index of arr)
      {
        if ((index.hitsMax - index.hits) > (ret.hitsMax - ret.hits)) ret = index
      }
      return ret
    }
    if (mode == 2)
    {
      for (var index of arr)
      {
        if ((index.hits/index.hitsMax) < (ret.hits/ret.hitsMax)) ret = index
      }
      if (radio){
        if (ret.hits/ret.hitsMax < radio) return ret
        else return undefined
      }
      else{
        return ret
      }
    }
  }
  return undefined
}

/* 获取两点间距离(勾股定理) */
export function getDistance(po1:RoomPosition,po2:RoomPosition):number{
    return Math.sqrt((po1.x-po2.x)**2 + (po1.y-po2.y)**2 )
  }

/* 生成爬虫指定体型 */
export function GenerateAbility(work?:number,carry?:number,move?:number,attack?:number,
  range_attack?:number,heal?:number,claim?:number,tough?:number):BodyPartConstant[]
{
  var body_list = []
  // 生成优先级，越往前越优先
  if (tough) body_list = AddList(body_list,tough,TOUGH)
  if (work) body_list = AddList(body_list,work,WORK)
  if (attack) body_list = AddList(body_list,attack,ATTACK)
  if (range_attack) body_list = AddList(body_list,range_attack,RANGED_ATTACK)
  if (carry) body_list = AddList(body_list,carry,CARRY)
  if (move) body_list = AddList(body_list,move,MOVE)
  if (heal) body_list = AddList(body_list,heal,HEAL)
  if (claim) body_list = AddList(body_list,claim,CLAIM)
  return body_list
}

/* 向列表中添加指定数量元素 */
export function AddList(arr:any[],time_:number,element:any):any[]
{
  var list_ = arr
  for (var i= 0;i<time_;i++)
  {
    list_.push(element)
  }
  return list_
}