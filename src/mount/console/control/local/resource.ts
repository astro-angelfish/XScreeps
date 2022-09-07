/* 展示全局资源相关     轮子-非自己开发! */
import { resourceList, resourceColorMap } from './constant';

type CatteryResource = {
  [key in ResourceConstant]?: number;
};

type LabResource = {
  [key in MineralCompoundConstant]?: number;
};

const addStore = (resource: CatteryResource, store: CatteryResource) => {
  for (const key in store) {
    if (store[key] > 0) resource[key] = (resource[key] || 0) + store[key];
  }
  return resource;
};

const addRoomList = (text: string, resType: ResourceConstant, allRes: {}, roomRes: {}): string => {
  let str = text;
  if (allRes[resType]) {
    str += `<div class='resource-room' style='position: absolute; display: none; top: 100%; right: 0; padding: 5px; background: #333; color: #ccc; border: 1px solid #ccc; border-radius: 5px; z-index: 10;'>`;
    for (const key in roomRes) {
      if (roomRes[key][resType])
        str += `${_.padRight(key, 6)}: ${_.padLeft((roomRes[key][resType] || 0).toLocaleString(), 9)}<br/>`;
    }
    str += '</div>';
  }
  return str;
};

const addList = (list: ResourceConstant[], allRes: {}, roomRes: {}, color?: string): string => {
  let str = `<div style='position: relative; color: ${color};'>`;
  list.forEach((res) => (str += uniqueColor(_.padLeft(res, 15), res)));
  str += '<br/>';
  list.forEach(
    (res) => (str += uniqueColor(addRoomList(_.padLeft((allRes[res] || 0).toLocaleString(), 15), res, allRes, roomRes), res)),
  );
  str += '<br/></div>';
  return str;
};

const getStr = (allRes: {}, roomRes: {}, labOnly?: boolean | false): string => {
  let str = '';
  if (!labOnly) {
    str += '<br/>基础资源:<br/>';
    str += addList(resourceList.base, allRes, roomRes);
    str += '<br/>压缩资源:<br/>';
    str += addList(resourceList.bar, allRes, roomRes);
    str += '<br/>商品资源:<br/>';
    str += addList(resourceList.commodityBase, allRes, roomRes);
    str += addList(resourceList.commodityMetal, allRes, roomRes, resourceColorMap[RESOURCE_ZYNTHIUM]);
    str += addList(resourceList.commodityBiomass, allRes, roomRes, resourceColorMap[RESOURCE_LEMERGIUM]);
    str += addList(resourceList.commoditySilicon, allRes, roomRes, resourceColorMap[RESOURCE_UTRIUM]);
    str += addList(resourceList.commodityMist, allRes, roomRes, resourceColorMap[RESOURCE_KEANIUM]);
    str += '<br/>LAB资源:<br/>';
  }
  str += addList(resourceList.boostBase, allRes, roomRes);
  str += addList(resourceList.boostU, allRes, roomRes, resourceColorMap[RESOURCE_UTRIUM]);
  str += addList(resourceList.boostK, allRes, roomRes, resourceColorMap[RESOURCE_KEANIUM]);
  str += addList(resourceList.boostL, allRes, roomRes, resourceColorMap[RESOURCE_LEMERGIUM]);
  str += addList(resourceList.boostZ, allRes, roomRes, resourceColorMap[RESOURCE_ZYNTHIUM]);
  str += addList(resourceList.boostG, allRes, roomRes, resourceColorMap[RESOURCE_GHODIUM_MELT]);
  str += `<script>$('.resource-name').hover(function() { $(this).find('.resource-room').show() }, function() { $(this).find('.resource-room').hide() })</script>`;
  return str;
};

const getCatteryResource = (room: Room): CatteryResource => {
  const resource: CatteryResource = {};
  if (room.storage) addStore(resource, room.storage.store);
  if (room.terminal) addStore(resource, room.terminal.store);
  return resource;
};

const getLabData = (room: Room): LabResource => {
  const resource: LabResource = {};
  let labData = room.memory.Labautomatic.automaticData;
  if (labData && labData.length > 0) {
    for (const data of labData) {
      resource[data.Type] = (resource[data.Type] || 0) + data.Num;
    }
  }
  return resource;
};

const uniqueColor = (str: string, resType: ResourceConstant): string => {
  return `<span class='resource-name' style='position: relative; color: ${
    resourceColorMap[resType] || 'inherited'
  }'>${str}</span>`;
};


export const allResource = (roomName?: string): void => {
  const time = Game.cpu.getUsed();
  const myRooms: Room[] = (roomName) ? ([Game.rooms[roomName]]) : (Object.values(Game.rooms).filter((cattery) => cattery.controller?.my));
  const roomRes: { [key in string]: CatteryResource } = {};
  myRooms.forEach((cattery) => {
    roomRes[cattery.name] = getCatteryResource(cattery);
  });

  const allRes = myRooms.reduce((all, room) => addStore(all, roomRes[room.name]), {});

  let str = getStr(allRes, roomRes);  
  console.log(str);
  console.log(`cpu: ${Game.cpu.getUsed() - time}`);
};


export const allLabData = (): void => {
  const time = Game.cpu.getUsed();
  const myRooms: Room[] = Object.values(Game.rooms).filter((room) => room.controller?.my);
  const labData: { [key in string]: LabResource } = {};
  myRooms.forEach((room) => {
    labData[room.name] = getLabData(room);
  });

  const allRes = myRooms.reduce((all, room) => addStore(all, labData[room.name]), {});

  let str = getStr(allRes, labData, true); 
  console.log(str);
  console.log(`cpu: ${Game.cpu.getUsed() - time}`);
};