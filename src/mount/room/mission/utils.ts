export const defineMission = <T extends Omit<MissionModel, 'id'>>(i: T): Omit<MissionModel, 'id'> => i
