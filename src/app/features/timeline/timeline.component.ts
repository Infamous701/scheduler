import { Component, computed, signal, HostListener, inject } from '@angular/core';
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
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

import { ScheduleService } from '../../core/services/schedule.service';
import { ContactCardComponent, ContactInfo } from '../../shared/components/contact-card/contact-card.component';
import { initials } from '../../core/utils/user.utils';
import {
  SchedUser, UserSchedule, ShiftType, SHIFT_DEFS, TimelineFilters
} from '../../core/models/scheduler.models';

const EMPTY_FILTERS: TimelineFilters = { name:'', id:'', group:'', location:'', model:'', role:'', shift:'' };

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatIconModule, MatButtonModule, MatTooltipModule,
    MatSidenavModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatCardModule, MatDividerModule,
    ContactCardComponent,
  ],
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.scss']
})
export class TimelineComponent {
  private readonly bp = inject(BreakpointObserver);
  readonly svc = inject(ScheduleService);

  readonly isMobile = toSignal(
    this.bp.observe([Breakpoints.Handset]).pipe(map(r => r.matches)),
    { initialValue: false }
  );

  drawerOpen = signal(false);
  filters = signal<TimelineFilters>({ ...EMPTY_FILTERS });

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

  filteredSchedule = computed<UserSchedule[]>(() => {
    const f = this.filters();
    const days = this.days().map(d => d.date);
    const offset = this.svc.weekOffset();

    const users = this.svc.schedUsers.filter(u => {
      if (f.name     && !u.name.toLowerCase().includes(f.name.toLowerCase())) return false;
      if (f.id       && !String(u.id).includes(f.id)) return false;
      if (f.group    && u.group !== f.group)    return false;
      if (f.location && u.site  !== f.location) return false;
      if (f.model    && u.model !== f.model)    return false;
      if (f.role     && u.role  !== f.role)     return false;
      if (f.shift) {
        if (f.shift === 'overtime') {
          const hasOT = days.some(d => {
            const sh = this.svc.getShift(u.id, d);
            return this.svc.getIsOvertime(u.id, d) && sh !== 'off' && sh !== 'pto' && sh !== 'holiday';
          });
          if (!hasOT) return false;
        } else {
          if (!days.some(d => this.svc.getShift(u.id, d) === f.shift)) return false;
        }
      }
      return true;
    });

    return this.svc.buildSchedule(users, offset);
  });

  stats = computed(() => {
    const scheds = this.filteredSchedule();
    const total   = scheds.reduce((a, s) => a + s.days.filter(d => d.shift !== 'off').length, 0);
    const onsite  = scheds.reduce((a, s) => a + s.days.filter(d => ['day','night'].includes(d.shift)).length, 0);
    const remote  = scheds.reduce((a, s) => a + s.days.filter(d => ['remote','virtual'].includes(d.shift)).length, 0);
    const pto     = scheds.reduce((a, s) => a + s.days.filter(d => d.shift === 'pto' || d.shift === 'holiday').length, 0);
    return [
      { label: 'Total Shifts',  value: total,  sub: 'this week',     icon: 'event_note'   },
      { label: 'On-Site',       value: onsite, sub: 'shifts',        icon: 'business'     },
      { label: 'Remote',        value: remote, sub: 'remote/virtual',icon: 'home_work'    },
      { label: 'PTO / Holiday', value: pto,    sub: 'days',          icon: 'beach_access' },
    ];
  });

  readonly SHIFT_DEFS = SHIFT_DEFS;
  readonly DAY_NAMES  = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
  readonly MONTHS     = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  readonly shiftOptions = [
    { value:'', label:'All shifts' }, { value:'day', label:'Day' },
    { value:'night', label:'Night' }, { value:'remote', label:'Remote' },
    { value:'virtual', label:'Virtual' }, { value:'pto', label:'PTO' },
    { value:'holiday', label:'Holiday' }, { value:'off', label:'Day Off' },
    { value:'overtime', label:'Overtime ⚡' },
  ];

  uniqueGroups     = computed(() => [...new Set(this.svc.schedUsers.map(u => u.group))].sort());
  uniqueLocations  = computed(() => [...new Set(this.svc.schedUsers.map(u => u.site))].sort());
  uniqueModels     = computed(() => [...new Set(this.svc.schedUsers.map(u => u.model))].sort());
  uniqueRoles      = computed(() => [...new Set(this.svc.schedUsers.map(u => u.role))].sort());

  // Contact card
  contactVisible = signal(false);
  contactInfo    = signal<ContactInfo | null>(null);
  contactAnchor  = signal<DOMRect | null>(null);

  toggleDrawer(): void { this.drawerOpen.update(v => !v); }

  setFilter(key: keyof TimelineFilters, value: string): void {
    this.filters.update(f => ({ ...f, [key]: value }));
  }

  clearFilter(key: keyof TimelineFilters): void {
    this.filters.update(f => ({ ...f, [key]: '' }));
  }

  clearAllFilters(): void {
    this.filters.set({ ...EMPTY_FILTERS });
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

  @HostListener('document:keydown.escape')
  onEsc(): void { this.contactVisible.set(false); }
}
