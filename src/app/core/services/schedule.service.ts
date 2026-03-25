import { Injectable, signal } from '@angular/core';
import {
  SchedUser, User, ShiftType, SHIFT_TYPES, UserSchedule, OooBlock,
  GROUPS, LOCATIONS, MODELS, ROLES, MANAGERS, AVATAR_COLORS, MANAGER_DATA, SHIFT_DEFS
} from '../models/scheduler.models';

const STORAGE_KEY = 'sched_users';

@Injectable({ providedIn: 'root' })
export class ScheduleService {

  // ── Timeline users ──────────────────────────────────────────────
  readonly schedUsers: SchedUser[] = [
    { id:1, name:'Aisha Rahman',   role:'Lead Engineer', color:'#1565C0', group:'Engineering',  site:'New York',      model:'Full-Time', email:'aisha.rahman@company.com',   phone:'+1 212 555 0101', slack:'@aisha.rahman'   },
    { id:2, name:'Marcus Cole',    role:'Backend Dev',   color:'#6A1B9A', group:'Engineering',  site:'San Francisco', model:'Full-Time', email:'marcus.cole@company.com',    phone:'+1 415 555 0182', slack:'@marcus.cole'    },
    { id:3, name:'Priya Nair',     role:'Frontend Dev',  color:'#F57F17', group:'Product',      site:'London',        model:'Contract',  email:'priya.nair@company.com',     phone:'+44 20 7946 0301',slack:'@priya.nair'     },
    { id:4, name:'Jordan Lee',     role:'DevOps Eng.',   color:'#B71C1C', group:'DevOps',       site:'New York',      model:'Full-Time', email:'jordan.lee@company.com',     phone:'+1 212 555 0149', slack:'@jordan.lee'     },
    { id:5, name:'Sofia Martinez', role:'QA Engineer',   color:'#00695C', group:'QA',           site:'Berlin',        model:'Part-Time', email:'sofia.martinez@company.com', phone:'+49 30 12345678', slack:'@sofia.martinez' },
    { id:6, name:'Kenji Watanabe', role:'Architect',     color:'#283593', group:'Architecture', site:'Tokyo',         model:'Full-Time', email:'kenji.watanabe@company.com', phone:'+81 3 5555 0166', slack:'@kenji.watanabe' },
    { id:7, name:'Nadia Osei',     role:'Scrum Master',  color:'#AD1457', group:'Management',   site:'London',        model:'Full-Time', email:'nadia.osei@company.com',     phone:'+44 20 7946 0207',slack:'@nadia.osei'     },
    { id:8, name:'Tyler Brooks',   role:'UX Designer',   color:'#2E7D32', group:'Design',       site:'San Francisco', model:'Contract',  email:'tyler.brooks@company.com',   phone:'+1 415 555 0198', slack:'@tyler.brooks'   },
  ];

  // ── All users (generated, persisted to localStorage) ────────────
  private _allUsers = signal<User[]>(this.loadUsers());
  readonly allUsers = this._allUsers.asReadonly();

  // ── Week offset ──────────────────────────────────────────────────
  private _weekOffset = signal(0);
  readonly weekOffset = this._weekOffset.asReadonly();

  setWeekOffset(n: number): void { this._weekOffset.set(n); }
  changeWeek(delta: number): void { this._weekOffset.update(v => v + delta); }

  // ── Date helpers ─────────────────────────────────────────────────
  getMonday(offset: number, base = new Date()): Date {
    const d = new Date(base);
    const dow = d.getDay() || 7;
    d.setDate(d.getDate() - dow + 1 + offset * 7);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  addDays(d: Date, n: number): Date {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
  }

  fmtDate(d: Date): string {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${d.getDate()} ${months[d.getMonth()]}`;
  }

  weekNum(d: Date): number {
    const jan = new Date(d.getFullYear(), 0, 1);
    return Math.ceil((((d.getTime() - jan.getTime()) / 864e5) + jan.getDay() + 1) / 7);
  }

  // ── Shift logic ──────────────────────────────────────────────────
  getShift(uid: number, date: Date): ShiftType {
    const s = uid * 31 + date.getFullYear() * 500 + date.getMonth() * 40 + date.getDate() * 7;
    return SHIFT_TYPES[((s * 1103515245 + 12345) & 0x7fffffff) % SHIFT_TYPES.length];
  }

  getIsOvertime(uid: number, date: Date): boolean {
    const s = uid * 53 + date.getFullYear() * 300 + date.getMonth() * 70 + date.getDate() * 11;
    return ((s * 1664525 + 1013904223) & 0x7fffffff) % 4 === 0;
  }

  getOoo(uid: number, date: Date, shift: ShiftType): OooBlock | null {
    // OOO only applies within day and night shifts
    if (shift !== 'day' && shift !== 'night') return null;
    const def = SHIFT_DEFS[shift];
    const s = uid * 97 + date.getFullYear() * 200 + date.getMonth() * 60 + date.getDate() * 13;
    // ~25% chance of OOO
    if (((s * 1664525 + 1013904223) & 0x7fffffff) % 4 !== 0) return null;
    // Work in linear hours to avoid midnight wraparound (night: 21–29)
    const shiftEndLinear = shift === 'night' ? def.end + 24 : def.end;
    // Duration: 1h, 2h, 3h or 4h (weighted — 3h and 4h are less frequent)
    const durRoll = ((s * 22695477 + 12345) & 0x7fffffff) % 8;
    const duration = durRoll < 3 ? 1 : durRoll < 6 ? 2 : durRoll < 7 ? 3 : 4;
    // OOO must fit inside the shift with at least 1h buffer on each side
    const minOooStart = def.start + 1;
    const maxOooStart = shiftEndLinear - duration - 1;
    if (maxOooStart <= minOooStart) return null;
    const range = maxOooStart - minOooStart;
    const oooStartLinear = minOooStart + (((s * 22695477 + 1) & 0x7fffffff) % range);
    const oooEndLinear   = oooStartLinear + duration;
    // Convert back to clock hours (0–23)
    return { start: oooStartLinear % 24, end: oooEndLinear % 24 };
  }

  // ── Build schedule for a week ────────────────────────────────────
  buildSchedule(users: SchedUser[], offset: number): UserSchedule[] {
    const monday = this.getMonday(offset);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const days = Array.from({ length: 7 }, (_, i) => this.addDays(monday, i));

    const prevSunday = this.addDays(monday, -1);
    return users.map(u => ({
      user: u,
      days: days.map((date, i) => {
        const shift = this.getShift(u.id, date);
        const prevDate = i > 0 ? days[i - 1] : prevSunday;
        const prevShift = this.getShift(u.id, prevDate);
        const prevShiftOvertime = this.getIsOvertime(u.id, prevDate);
        const prevOoo = this.getOoo(u.id, prevDate, prevShift);
        return {
          date,
          shift,
          prevShift,
          prevShiftOvertime,
          prevOoo,
          isOvertime: this.getIsOvertime(u.id, date),
          isToday: date.getTime() === today.getTime(),
          isWeekend: date.getDay() === 0 || date.getDay() === 6,
          isLastDay: i === days.length - 1,
          ooo: this.getOoo(u.id, date, shift),
        };
      })
    }));
  }

  // ── User CRUD ────────────────────────────────────────────────────
  getUserById(id: string): User | undefined {
    return this._allUsers().find(u => u.id === id);
  }

  getUserByName(name: string): User | undefined {
    return this._allUsers().find(u => u.name === name);
  }

  addUser(u: Omit<User, 'id' | 'color'>): User {
    const users = this._allUsers();
    const uNums = users.filter(u => u.id.startsWith('U-')).map(u => parseInt(u.id.slice(2), 10));
    const nextNum = uNums.length === 0 ? 1 : Math.max(...uNums) + 1;
    const newId = `U-${String(nextNum).padStart(3, '0')}`;
    const color = AVATAR_COLORS[users.length % AVATAR_COLORS.length];
    const newUser: User = { ...u, id: newId, color };
    this._allUsers.update(list => [...list, newUser]);
    this.persistUsers();
    return newUser;
  }

  updateUser(id: string, changes: Partial<User>): void {
    this._allUsers.update(list =>
      list.map(u => u.id === id ? { ...u, ...changes } : u)
    );
    this.persistUsers();
  }

  deleteUser(id: string): void {
    this._allUsers.update(list => list.filter(u => u.id !== id));
    this.persistUsers();
  }

  resetToDefaults(): void {
    localStorage.removeItem(STORAGE_KEY);
    this._allUsers.set(this.generateUsers(120));
  }

  // ── Persistence ──────────────────────────────────────────────────
  private loadUsers(): User[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          const users = parsed.map(u => this.migrateUser(u as Record<string, unknown>));
          // Ensure manager users exist (migration for existing stored data)
          const managerUsers: User[] = MANAGER_DATA.map((m, i) => ({
            id: `M-${String(i + 1).padStart(3, '0')}`,
            name: m.name, email: m.email, phone: m.phone, slack: m.slack,
            group: m.group, location: m.location, model: 'Full-Time',
            role: 'Engineering Manager', manager: '', color: m.color,
          }));
          const withoutOldManagers = users.filter(u => !u.id.startsWith('M-'));
          return [...managerUsers, ...withoutOldManagers];
        }
      }
    } catch {
      // corrupted storage — fall through to fresh generation
    }
    return this.generateUsers(120);
  }

  private persistUsers(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._allUsers()));
  }

  private migrateUser(raw: Record<string, unknown>): User {
    return {
      id:       String(raw['id']       ?? ''),
      name:     String(raw['name']     ?? ''),
      email:    String(raw['email']    ?? ''),
      phone:    String(raw['phone']    ?? ''),
      slack:    String(raw['slack']    ?? ''),
      group:    String(raw['group']    ?? ''),
      location: String(raw['location'] ?? ''),
      model:    String(raw['model']    ?? ''),
      role:     String(raw['role']     ?? ''),
      manager:  String(raw['manager']  ?? ''),
      color:    String(raw['color']    ?? AVATAR_COLORS[0]),
    };
  }

  // ── User generation ──────────────────────────────────────────────
  private rand(seed: number, max: number): number {
    return ((seed * 1103515245 + 12345) & 0x7fffffff) % max;
  }

  private generateUsers(n: number): User[] {
    const fn = ['Alice','Bob','Carol','David','Eve','Frank','Grace','Henry','Isabella','James','Kate','Liam','Mia','Noah','Olivia','Paul','Quinn','Rachel','Samuel','Tara','Uma','Victor','Wendy','Xander','Yara','Zach'];
    const ln = ['Rahman','Cole','Nair','Lee','Martinez','Watanabe','Osei','Brooks','Johnson','Chen','Davis','Kim','Singh','Patel','Williams','Brown','Jones','Garcia','Wilson','Moore'];
    const prefixes = ['+1 212','+1 415','+44 20','+49 30','+81 3','+65 6'];

    const managerUsers: User[] = MANAGER_DATA.map((m, i) => ({
      id:       `M-${String(i + 1).padStart(3, '0')}`,
      name:     m.name,
      email:    m.email,
      phone:    m.phone,
      slack:    m.slack,
      group:    m.group,
      location: m.location,
      model:    'Full-Time',
      role:     'Engineering Manager',
      manager:  '',
      color:    m.color,
    }));

    const regularUsers: User[] = Array.from({ length: n }, (_, i) => {
      const s = (i + 1) * 17;
      const first = fn[this.rand(s, fn.length)];
      const last  = ln[this.rand(s * 3, ln.length)];
      const prefix = prefixes[this.rand(s * 23, prefixes.length)];
      return {
        id:       `U-${String(i + 1).padStart(3, '0')}`,
        name:     `${first} ${last}`,
        email:    `${first.toLowerCase()}.${last.toLowerCase()}@company.com`,
        phone:    `${prefix} 555 ${String(1000 + this.rand(s * 29, 8999)).slice(0, 4)}`,
        slack:    `@${first.toLowerCase()}.${last.toLowerCase()}`,
        group:    GROUPS[this.rand(s * 5, GROUPS.length)],
        location: LOCATIONS[this.rand(s * 7, LOCATIONS.length)],
        model:    MODELS[this.rand(s * 11, MODELS.length)],
        role:     ROLES[this.rand(s * 13, ROLES.length)],
        manager:  MANAGERS[this.rand(s * 17, MANAGERS.length)],
        color:    AVATAR_COLORS[this.rand(s * 19, AVATAR_COLORS.length)],
      };
    });

    return [...managerUsers, ...regularUsers];
  }
}
