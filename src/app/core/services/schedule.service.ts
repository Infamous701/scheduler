import { Injectable, signal } from '@angular/core';
import {
  SchedUser, User, ShiftType, SHIFT_TYPES, DaySchedule, UserSchedule,
  GROUPS, LOCATIONS, MODELS, ROLES, MANAGERS, AVATAR_COLORS
} from '../models/scheduler.models';

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

  // ── All users (generated) ────────────────────────────────────────
  private _allUsers = signal<User[]>(this.generateUsers(120));
  readonly allUsers = this._allUsers.asReadonly();

  // ── Week offset ──────────────────────────────────────────────────
  private _weekOffset = signal(0);
  readonly weekOffset = this._weekOffset.asReadonly();

  setWeekOffset(n: number): void { this._weekOffset.set(n); }
  changeWeek(delta: number): void { this._weekOffset.update(v => v + delta); }

  // ── Date helpers ─────────────────────────────────────────────────
  getMonday(offset: number): Date {
    const d = new Date();
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

  initials(name: string): string {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
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

  // ── Build schedule for a week ────────────────────────────────────
  buildSchedule(users: SchedUser[], offset: number): UserSchedule[] {
    const monday = this.getMonday(offset);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const days = Array.from({ length: 7 }, (_, i) => this.addDays(monday, i));

    return users.map(u => ({
      user: u,
      days: days.map(date => ({
        date,
        shift: this.getShift(u.id, date),
        isOvertime: this.getIsOvertime(u.id, date),
        isToday: date.getTime() === today.getTime(),
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
      }))
    }));
  }

  // ── User CRUD ────────────────────────────────────────────────────
  getUserById(id: string): User | undefined {
    return this._allUsers().find(u => u.id === id);
  }

  addUser(u: Omit<User, 'id' | 'color'>): void {
    const users = this._allUsers();
    const newId = `U-${String(users.length + 1).padStart(3, '0')}`;
    const color = AVATAR_COLORS[users.length % AVATAR_COLORS.length];
    this._allUsers.update(list => [...list, { ...u, id: newId, color }]);
  }

  updateUser(id: string, changes: Partial<User>): void {
    this._allUsers.update(list =>
      list.map(u => u.id === id ? { ...u, ...changes } : u)
    );
  }

  nextUserId(): string {
    return `U-${String(this._allUsers().length + 1).padStart(3, '0')}`;
  }

  // ── User generation ──────────────────────────────────────────────
  private rand(seed: number, max: number): number {
    return ((seed * 1103515245 + 12345) & 0x7fffffff) % max;
  }

  private generateUsers(n: number): User[] {
    const fn = ['Alice','Bob','Carol','David','Eve','Frank','Grace','Henry','Isabella','James','Kate','Liam','Mia','Noah','Olivia','Paul','Quinn','Rachel','Samuel','Tara','Uma','Victor','Wendy','Xander','Yara','Zach'];
    const ln = ['Rahman','Cole','Nair','Lee','Martinez','Watanabe','Osei','Brooks','Johnson','Chen','Davis','Kim','Singh','Patel','Williams','Brown','Jones','Garcia','Wilson','Moore'];
    const prefixes = ['+1 212','+1 415','+44 20','+49 30','+81 3','+65 6'];

    return Array.from({ length: n }, (_, i) => {
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
  }
}
