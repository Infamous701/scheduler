import { ChangeDetectionStrategy, Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ScheduleService } from '../../../../core/services/schedule.service';
import {
  User, ShiftType, SHIFT_DEFS, BaselineWeek, BaselineDayEntry,
  DAY_LABELS, SHIFT_ICONS, MINUTE_OPTIONS,
  WorkMode, WORK_MODES, WORK_MODE_ICONS, BASELINE_SHIFT_TYPES
} from '../../../../core/models/scheduler.models';
import { initials } from '../../../../core/utils/user.utils';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-user-baseline',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatIconModule, MatButtonModule, MatTooltipModule,
    MatFormFieldModule, MatSelectModule, MatInputModule,
    MatCardModule, MatDividerModule, MatSnackBarModule,
  ],
  templateUrl: './user-baseline.component.html',
  styleUrls: ['./user-baseline.component.scss'],
})
export class UserBaselineComponent implements OnInit {
  user   = signal<User | null>(null);
  shifts = signal<BaselineWeek>(this.defaultWeek());

  readonly DAY_LABELS          = DAY_LABELS;
  readonly SHIFT_TYPES         = BASELINE_SHIFT_TYPES;
  readonly SHIFT_DEFS          = SHIFT_DEFS;
  readonly SHIFT_ICONS         = SHIFT_ICONS;
  readonly MINUTE_OPTIONS      = MINUTE_OPTIONS;
  readonly WORK_MODES          = WORK_MODES;
  readonly WORK_MODE_ICONS     = WORK_MODE_ICONS;
  readonly days                = [0, 1, 2, 3, 4, 5, 6];

  avatarColor = computed(() => this.user()?.color ?? 'var(--accent)');
  avatarLabel = computed(() => initials(this.user()?.name ?? ''));

  totalWorkDays = computed(() =>
    this.days.filter(d => {
      const t = this.shifts()[d].type;
      return t !== 'off' && t !== 'pto' && t !== 'holiday';
    }).length
  );

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public  svc: ScheduleService,
    private snack: MatSnackBar,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('userId');
    if (!id) { this.router.navigate(['/users']); return; }
    const u = this.svc.getUserById(id);
    if (!u)  { this.router.navigate(['/users']); return; }
    this.user.set(u);
    this.shifts.set({ ...this.svc.getBaseline(id) });
  }


  isTimed(type: ShiftType): boolean {
    return type === 'day' || type === 'night';
  }

  setType(day: number, type: ShiftType): void {
    this.shifts.update(s => ({
      ...s,
      [day]: {
        type,
        mode:     this.isTimed(type) ? (s[day].mode ?? 'on-site')              : null,
        start:    this.isTimed(type) ? (s[day].start    ?? SHIFT_DEFS[type].start) : null,
        startMin: this.isTimed(type) ? (s[day].startMin ?? 0)                      : null,
        end:      this.isTimed(type) ? (s[day].end      ?? SHIFT_DEFS[type].end)   : null,
        endMin:   this.isTimed(type) ? (s[day].endMin   ?? 0)                      : null,
      }
    }));
  }

  setMode(day: number, mode: WorkMode): void {
    this.shifts.update(s => ({ ...s, [day]: { ...s[day], mode } }));
  }

  setStart(day: number, val: string): void {
    const n = parseInt(val, 10);
    this.shifts.update(s => ({ ...s, [day]: { ...s[day], start: isNaN(n) ? null : n } }));
  }

  setStartMin(day: number, val: number): void {
    this.shifts.update(s => ({ ...s, [day]: { ...s[day], startMin: val } }));
  }

  setEnd(day: number, val: string): void {
    const n = parseInt(val, 10);
    this.shifts.update(s => ({ ...s, [day]: { ...s[day], end: isNaN(n) ? null : n } }));
  }

  setEndMin(day: number, val: number): void {
    this.shifts.update(s => ({ ...s, [day]: { ...s[day], endMin: val } }));
  }

  entry(day: number): BaselineDayEntry {
    return this.shifts()[day];
  }

  save(): void {
    const u = this.user();
    if (!u) return;
    this.svc.saveBaseline(u.id, this.shifts());
    this.snack.open('Baseline shifts saved', 'OK', { duration: 2500 });
    this.router.navigate(['/users', u.id]);
  }

  cancel(): void {
    const u = this.user();
    this.router.navigate(u ? ['/users', u.id] : ['/users']);
  }

  private defaultWeek(): BaselineWeek {
    const day: BaselineDayEntry = { type: 'day', mode: 'on-site', start: 7, startMin: 0, end: 15, endMin: 0 };
    const off: BaselineDayEntry = { type: 'off', mode: null,      start: null, startMin: null, end: null, endMin: null };
    return { 0: day, 1: day, 2: day, 3: day, 4: day, 5: off, 6: off };
  }
}
