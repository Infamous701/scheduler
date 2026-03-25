import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { ScheduleService } from '../../../../core/services/schedule.service';
import { User, GROUPS, LOCATIONS, MODELS, ROLES, MANAGERS } from '../../../../core/models/scheduler.models';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule,
    MatSelectModule, MatCardModule,
    MatDividerModule, MatSnackBarModule,
  ],
  templateUrl: './user-detail.component.html',
  styleUrls: ['./user-detail.component.scss'],
})
export class UserDetailComponent implements OnInit {
  isNew = true;
  userId: string | null = null;

  form = signal<Partial<User>>({
    id: '', name: '', email: '', phone: '',
    group: '', manager: '', location: '', model: '', role: '',
  });

  headerName   = computed(() => this.form().name || 'New User');
  headerSub    = computed(() => this.isNew ? 'Fill in the details below' : `${this.form().role} · ${this.form().group}`);
  avatarColor  = computed(() => this.form().color ?? 'var(--accent)');
  avatarLabel  = computed(() => {
    const n = this.form().name ?? '';
    return n ? n.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() : '+';
  });
  modeBadge    = computed(() => this.isNew ? 'New' : (this.form().model ?? 'Edit'));
  saveBtnLabel = computed(() => this.isNew ? 'Add User' : 'Save Changes');

  readonly GROUPS    = GROUPS;
  readonly MANAGERS  = MANAGERS;
  readonly LOCATIONS = LOCATIONS;
  readonly MODELS    = MODELS;
  readonly ROLES     = ROLES;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public  svc: ScheduleService,
    private snack: MatSnackBar,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      const user = this.svc.getUserById(id);
      if (user) {
        this.isNew   = false;
        this.userId  = id;
        this.form.set({ ...user });
      }
    }
  }

  setField(key: keyof User, value: string): void {
    this.form.update(f => ({ ...f, [key]: value }));
  }

  save(): void {
    const f = this.form();
    if (!f.name?.trim())  { this.snack.open('Name is required',         'OK', { duration: 3000 }); return; }
    if (!f.email?.trim()) { this.snack.open('Email is required',        'OK', { duration: 3000 }); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email ?? '')) {
                            this.snack.open('Invalid email format',     'OK', { duration: 3000 }); return; }
    if (!f.group)         { this.snack.open('Group is required',        'OK', { duration: 3000 }); return; }
    if (!f.role)          { this.snack.open('Role is required',         'OK', { duration: 3000 }); return; }
    if (!f.location)      { this.snack.open('Location is required',     'OK', { duration: 3000 }); return; }
    if (!f.model)         { this.snack.open('Work model is required',   'OK', { duration: 3000 }); return; }

    if (this.isNew) {
      this.svc.addUser(f as Omit<User, 'id' | 'color'>);
      this.snack.open('User added successfully', 'OK', { duration: 2500 });
    } else if (this.userId !== null) {
      this.svc.updateUser(this.userId, f);
      this.snack.open('Changes saved', 'OK', { duration: 2500 });
    }
    this.router.navigate(['/users']);
  }

  cancel(): void {
    this.router.navigate(['/users']);
  }
}
