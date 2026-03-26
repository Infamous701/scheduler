import { ChangeDetectionStrategy, Component, computed, signal, HostListener, inject, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

import { ScheduleService } from '../../core/services/schedule.service';
import { ContactCardComponent, ContactInfo } from '../../shared/components/contact-card/contact-card.component';
import { initials } from '../../core/utils/user.utils';
import {
  SchedUser, User, UserSchedule, ShiftType, SHIFT_DEFS, TimelineFilters
} from '../../core/models/scheduler.models';

const EMPTY_FILTERS: TimelineFilters = { name:'', id:'', group:'', location:'', model:'', role:'', shift:'' };

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-timeline',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatIconModule, MatButtonModule, MatTooltipModule,
    MatSidenavModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatCardModule, MatDividerModule,
    MatPaginatorModule,
    ContactCardComponent,
  ],
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.scss']
})
export class TimelineComponent implements OnDestroy {
  private readonly bp     = inject(BreakpointObserver);
  private readonly router = inject(Router);
  readonly svc            = inject(ScheduleService);

  readonly isMobile = toSignal(
    this.bp.observe([Breakpoints.Handset]).pipe(map(r => r.matches)),
    { initialValue: false }
  );

  private nowPctValue(): number {
    const n = new Date();
    return ((n.getHours() * 60 + n.getMinutes()) / (24 * 60)) * 100;
  }
  private nowTimeValue(): string {
    const n = new Date();
    return n.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  nowPct  = signal(this.nowPctValue());
  nowTime = signal(this.nowTimeValue());
  private readonly _clockTimer = setInterval(() => {
    this.nowPct.set(this.nowPctValue());
    this.nowTime.set(this.nowTimeValue());
  }, 60_000);
  ngOnDestroy(): void { clearInterval(this._clockTimer); }

  drawerOpen = signal(false);
  filters    = signal<TimelineFilters>({ ...EMPTY_FILTERS });
  sortDir    = signal<'asc' | 'desc'>('asc');
  page       = signal(0);
  pageSize   = signal(25);

  activeFilterCount = computed(() =>
    Object.values(this.filters()).filter(v => v !== '').length
  );

  activeFilterChips = computed(() => {
    const labels: Record<string, string> = { name:'Name', id:'ID', group:'Group', location:'Location', model:'Model', role:'Role', shift:'Shift' };
    return Object.entries(this.filters())
      .filter(([, v]) => v !== '')
      .map(([k, v]) => ({ key: k, label: labels[k], value: v }));
  });

  weekLabel = computed(() => {
    const monday = this.svc.getMonday(this.svc.weekOffset());
    return `${this.svc.fmtDate(monday)} – ${this.svc.fmtDate(this.svc.addDays(monday, 6))}`;
  });

  weekNum = computed(() => this.svc.weekNum(this.svc.getMonday(this.svc.weekOffset())));

  days = computed(() => {
    const monday = this.svc.getMonday(this.svc.weekOffset());
    const today  = new Date(); today.setHours(0,0,0,0);
    return Array.from({ length: 7 }, (_, i) => {
      const d = this.svc.addDays(monday, i);
      return { date: d, isToday: d.getTime() === today.getTime(), isWeekend: d.getDay() === 0 || d.getDay() === 6 };
    });
  });

  filteredUsers = computed<User[]>(() => {
    const f = this.filters();
    const days = this.days().map(d => d.date);
    const dir = this.sortDir() === 'asc' ? 1 : -1;

    return this.svc.allUsers()
      .filter(u => {
        if (f.name     && !u.name.toLowerCase().includes(f.name.toLowerCase())) return false;
        if (f.id       && !u.id.toLowerCase().includes(f.id.toLowerCase()))     return false;
        if (f.group    && u.group    !== f.group)    return false;
        if (f.location && u.location !== f.location) return false;
        if (f.model    && u.model    !== f.model)    return false;
        if (f.role     && u.role     !== f.role)     return false;
        if (f.shift) {
          const numId = parseInt(u.id.replace(/\D/g, ''), 10) || 0;
          if (f.shift === 'overtime') {
            const hasOT = days.some(d => {
              const sh = this.svc.getShift(numId, d);
              return this.svc.getIsOvertime(numId, d) && sh !== 'off' && sh !== 'pto' && sh !== 'holiday';
            });
            if (!hasOT) return false;
          } else {
            if (!days.some(d => this.svc.getShift(numId, d) === f.shift)) return false;
          }
        }
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name) * dir);
  });

  filteredSchedule = computed<UserSchedule[]>(() => {
    const start = this.page() * this.pageSize();
    const paged = this.filteredUsers().slice(start, start + this.pageSize());
    const offset = this.svc.weekOffset();

    return paged.map(u => {
      const numId = parseInt(u.id.replace(/\D/g, ''), 10) || 0;
      const schedUser: SchedUser = {
        id: numId, name: u.name, role: u.role, color: u.color,
        group: u.group, site: u.location, model: u.model,
        email: u.email, phone: u.phone, slack: u.slack,
      };
      return this.svc.buildSchedule([schedUser], offset)[0];
    });
  });

  stats = computed(() => {
    const scheds = this.filteredSchedule();
    const total  = scheds.reduce((a, s) => a + s.days.filter(d => d.shift !== 'off').length, 0);
    const onsite = scheds.reduce((a, s) => a + s.days.filter(d => ['day','night'].includes(d.shift)).length, 0);
    const remote = scheds.reduce((a, s) => a + s.days.filter(d => d.shift === 'virtual').length, 0);
    const pto    = scheds.reduce((a, s) => a + s.days.filter(d => d.shift === 'pto' || d.shift === 'holiday').length, 0);
    return [
      { label: 'Total Shifts',  value: total,  sub: 'this week',      icon: 'event_note'   },
      { label: 'On-Site',       value: onsite, sub: 'shifts',         icon: 'business'     },
      { label: 'Virtual',       value: remote, sub: 'virtual shifts', icon: 'videocam'     },
      { label: 'PTO / Holiday', value: pto,    sub: 'days',           icon: 'beach_access' },
    ];
  });

  readonly SHIFT_DEFS = SHIFT_DEFS;
  readonly DAY_NAMES  = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
  readonly MONTHS     = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  readonly shiftOptions = [
    { value:'', label:'All shifts' }, { value:'day', label:'Day' },
    { value:'night', label:'Night' }, { value:'virtual', label:'Virtual' },
    { value:'pto', label:'PTO' }, { value:'holiday', label:'Holiday' },
    { value:'off', label:'Day Off' }, { value:'overtime', label:'Overtime ⚡' },
  ];

  uniqueGroups     = computed(() => [...new Set(this.svc.allUsers().map(u => u.group))].sort());
  uniqueLocations  = computed(() => [...new Set(this.svc.allUsers().map(u => u.location))].sort());
  uniqueModels     = computed(() => [...new Set(this.svc.allUsers().map(u => u.model))].sort());
  uniqueRoles      = computed(() => [...new Set(this.svc.allUsers().map(u => u.role))].sort());

  hoveredUserId = signal<number | null>(null);

  // Contact card
  contactVisible = signal(false);
  contactInfo    = signal<ContactInfo | null>(null);
  contactAnchor  = signal<DOMRect | null>(null);

  toggleDrawer(): void { this.drawerOpen.update(v => !v); }

  setFilter(key: keyof TimelineFilters, value: string): void {
    this.filters.update(f => ({ ...f, [key]: value }));
    this.page.set(0);
  }

  clearFilter(key: keyof TimelineFilters): void {
    this.filters.update(f => ({ ...f, [key]: '' }));
    this.page.set(0);
  }

  clearAllFilters(): void {
    this.filters.set({ ...EMPTY_FILTERS });
    this.page.set(0);
  }

  toggleSort(): void {
    this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc');
    this.page.set(0);
  }

  onPage(e: PageEvent): void {
    this.page.set(e.pageIndex);
    this.pageSize.set(e.pageSize);
  }

  prevWeek():  void { this.svc.changeWeek(-1); }
  nextWeek():  void { this.svc.changeWeek(1);  }
  goToday():   void { this.svc.setWeekOffset(0); }

  initials = initials;
  getShiftDef(shift: ShiftType) { return SHIFT_DEFS[shift]; }

  shiftLeft(shift: ShiftType, hourW: number): number {
    if (SHIFT_DEFS[shift].allDay) return 0;
    return SHIFT_DEFS[shift].start * hourW;
  }

  shiftWidth(shift: ShiftType, hourW: number): number {
    const def = SHIFT_DEFS[shift];
    if (def.allDay) return hourW * 24;
    if (shift === 'night') return (24 - def.start) * hourW;
    return (def.end - def.start) * hourW;
  }

  shiftTooltip(name: string, shift: ShiftType, overtime = false): string {
    const def = SHIFT_DEFS[shift];
    if (def.allDay) return name;
    const fmt = (h: number) => `${String(h % 24).toString().padStart(2, '0')}:00`;
    const end = overtime ? def.overtimeEnd : def.end;
    const endStr = (shift === 'night' && end <= def.start) ? `${fmt(end)} (+1)` : fmt(end);
    return `${name}  (${fmt(def.start)} – ${endStr})`;
  }

  oooTime(h: number): string {
    return `${String(h % 24).padStart(2, '0')}:00`;
  }

  // Checks if a shift overflows past midnight
  shiftOverflowsMidnight(shift: ShiftType, overtime = false): boolean {
    const def = SHIFT_DEFS[shift];
    if (def.allDay || shift === 'off') return false;
    const end = overtime ? def.overtimeEnd : def.end;
    return end < def.start; // end < start means it crosses midnight
  }

  // Width of the truncated part (start → midnight) on the last day
  shiftTruncatedWidthPct(shift: ShiftType): number {
    return ((24 - SHIFT_DEFS[shift].start) / 24) * 100;
  }

  // Width of the continuation part (midnight → end) on the next day
  shiftContinuationWidthPct(shift: ShiftType, overtime = false): number {
    const def = SHIFT_DEFS[shift];
    const end = overtime ? def.overtimeEnd : def.end;
    return (end / 24) * 100;
  }

  // OOO overflow helpers
  oooOverflowsMidnight(ooo: { start: number; end: number }): boolean {
    return ooo.end < ooo.start;
  }

  oooTruncatedWidthPct(ooo: { start: number; end: number }): number {
    return ((24 - ooo.start) / 24) * 100;
  }

  oooContinuationWidthPct(ooo: { start: number; end: number }): number {
    return (ooo.end / 24) * 100;
  }

  shiftLeftPct(shift: ShiftType): number {
    if (SHIFT_DEFS[shift].allDay) return 0;
    return (SHIFT_DEFS[shift].start / 24) * 100;
  }

  shiftWidthPct(shift: ShiftType, overtime = false): number {
    const def = SHIFT_DEFS[shift];
    if (def.allDay) return 100;
    const end = overtime ? def.overtimeEnd : def.end;
    if (shift === 'night') return ((24 - def.start + end) / 24) * 100;
    return ((end - def.start) / 24) * 100;
  }

  showContact(event: MouseEvent, user: SchedUser): void {
    event.stopPropagation();
    this.contactInfo.set({
      name: user.name, role: user.role, color: user.color,
      email: user.email, phone: user.phone, slack: user.slack,
      location: user.site, group: user.group, model: user.model,
    });
    this.contactAnchor.set((event.currentTarget as HTMLElement).getBoundingClientRect());
    this.contactVisible.set(true);
  }

  goToUser(name: string): void {
    const user = this.svc.getUserByName(name);
    if (user) this.router.navigate(['/users', user.id], { queryParams: { from: 'Timeline' } });
  }

  @HostListener('document:keydown.escape')
  onEsc(): void { this.contactVisible.set(false); }
}
