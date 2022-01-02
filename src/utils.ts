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

// 用于对bodypartconstant[] 列表进行自适应化，使得爬虫房间能生产该爬虫，具体逻辑为寻找该bodypart中数量最多的，对其进行减法运算，直到达到目的，但数量到1时将不再减少
export function adaption_body(arr:BodyPartConstant[],critical_num:number):BodyPartConstant[]
{
  // 获取基本能力列表
  var temp_list = []
  for (var i of arr)
  {
    if (!isInArray(temp_list,i))
    {
      temp_list.push(i)
    }
  }
  while (CalculateEnergy(arr) > critical_num)
  {
    var all_1:boolean = false
    for (var s=0;s < temp_list.length;s++)
    {
      if (getSameNum(temp_list[s],arr)> 1)
      {
        var index = arr.indexOf(temp_list[s])
        if(index > -1) {
          arr.splice(index,1);
        }
        all_1 = true
      }
    }
    if (!all_1) break
  }
  return arr
}

/**
     * 获取数组中相同元素的个数
     * @param val 相同的元素
     * @param arr 传入数组
     */
export function getSameNum(val,arr):number
{
  var processArr = []
  for (var i of arr)
  {
    if (i == val) processArr.push(i)
  }
  return processArr.length
}

/* 判断孵化所需能量 */
export function CalculateEnergy(abilityList:BodyPartConstant[]):number
{
  var num = 0
  for (var part of abilityList)
  {
    if (part == WORK) num += 100
    if (part == MOVE) num += 50
    if (part == CARRY) num += 50
    if (part == ATTACK) num += 80
    if (part == RANGED_ATTACK) num += 150
    if (part == HEAL) num += 250
    if (part == CLAIM) num += 600
    if (part == TOUGH) num += 10
  }
  return num
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