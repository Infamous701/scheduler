export type ShiftType = 'day' | 'night' | 'remote' | 'pto' | 'holiday' | 'virtual' | 'off';

export interface ShiftDef {
  start: number;
  end: number;
  label: string;
  cssClass: string;
  hours: number;
  allDay: boolean;
}

export const SHIFT_DEFS: Record<ShiftType, ShiftDef> = {
  day:     { start: 7,  end: 19, label: 'DAY',     cssClass: 'sb-d', hours: 12, allDay: false },
  night:   { start: 19, end: 7,  label: 'NIGHT',   cssClass: 'sb-n', hours: 12, allDay: false },
  remote:  { start: 9,  end: 17, label: 'REMOTE',  cssClass: 'sb-r', hours: 8,  allDay: false },
  pto:     { start: 0,  end: 24, label: 'PTO',     cssClass: 'sb-p', hours: 0,  allDay: true  },
  holiday: { start: 0,  end: 24, label: 'HOLIDAY', cssClass: 'sb-h', hours: 0,  allDay: true  },
  virtual: { start: 9,  end: 17, label: 'VIRTUAL', cssClass: 'sb-v', hours: 8,  allDay: false },
  off:     { start: 0,  end: 0,  label: 'OFF',     cssClass: '',     hours: 0,  allDay: false  },
};

export const SHIFT_TYPES: ShiftType[] = ['day', 'night', 'remote', 'pto', 'holiday', 'virtual', 'off'];

export interface SchedUser {
  id: number;
  name: string;
  role: string;
  color: string;
  group: string;
  site: string;
  model: string;
  email: string;
  phone: string;
  slack: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  slack: string;
  group: string;
  location: string;
  model: string;
  role: string;
  manager: string;
  color: string;
}

export interface DaySchedule {
  date: Date;
  shift: ShiftType;
  isOvertime: boolean;
  isToday: boolean;
  isWeekend: boolean;
}

export interface UserSchedule {
  user: SchedUser;
  days: DaySchedule[];
}

export interface TimelineFilters {
  name: string;
  id: string;
  group: string;
  site: string;
  model: string;
  role: string;
  shift: string;
}

export interface UserFilters {
  name: string;
  id: string;
  group: string;
  location: string;
  model: string;
  role: string;
  manager: string;
}

export const GROUPS    = ['Engineering','Product','Design','QA','DevOps','Architecture','Management'];
export const LOCATIONS = ['New York','San Francisco','London','Berlin','Tokyo','Sydney','Singapore','Remote'];
export const MODELS    = ['Full-Time','Part-Time','Contract','Intern'];
export const ROLES     = ['Lead Engineer','Backend Dev','Frontend Dev','DevOps Engineer','QA Engineer','Architect','Scrum Master','UX Designer','Product Manager','Engineering Manager'];
export const MANAGERS  = ['Alice Johnson','Bob Chen','Carol Davis','David Kim','Eve Müller'];

export const AVATAR_COLORS = [
  '#1565C0','#6A1B9A','#F57F17','#B71C1C','#00695C',
  '#283593','#AD1457','#2E7D32','#4527A0','#00838F','#558B2F','#E65100'
];

export const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  'Lead Engineer':      { bg: '#E8F5E9', color: '#1B5E20' },
  'Backend Dev':        { bg: '#EDE7F6', color: '#311B92' },
  'Frontend Dev':       { bg: '#FFF3E0', color: '#E65100' },
  'DevOps Engineer':    { bg: '#FCE4EC', color: '#880E4F' },
  'QA Engineer':        { bg: '#E3F2FD', color: '#0D47A1' },
  'Architect':          { bg: '#F3E5F5', color: '#6A1B9A' },
  'Scrum Master':       { bg: '#E0F2F1', color: '#004D40' },
  'UX Designer':        { bg: '#FFF8E1', color: '#F57F17' },
  'Product Manager':    { bg: '#FAFAFA', color: '#212121' },
  'Engineering Manager':{ bg: '#E8EAF6', color: '#1A237E' },
};
