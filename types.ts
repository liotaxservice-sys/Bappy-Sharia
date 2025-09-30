
export type UserRole = 'Worker' | 'Supervisor' | 'Manager' | 'Boss';

export interface RecordData {
  date: string;
  houseName: string;
  farmName: string;
  ageWk: number;
  femaleBodyWeight: number;
  maleBodyWeight: number;
  femaleUniformity: number;
  maleUniformity: number;
  maleFlockSize: number;
  femaleFlockSize: number;
  maleMortality: number;
  femaleMortality: number;
  maleCulls: number;
  femaleCulls: number;
  maleFeedIntake: number;
  femaleFeedIntake: number;
  waterIntake: number;
}

export interface FarmRecord extends RecordData {
  id: string;
  timestamp?: any;
}

export interface Filters {
    house: string;
    ageWeek: string;
    cwoy: string;
}
