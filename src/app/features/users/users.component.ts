import { Component, computed, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatChipsModule } from '@angular/material/chips';

import { ScheduleService } from '../../core/services/schedule.service';
import { ContactCardComponent, ContactInfo } from '../../shared/components/contact-card/contact-card.component';
import { initials } from '../../core/utils/user.utils';
import { User, UserFilters, GROUPS, LOCATIONS, MODELS, ROLES, MANAGERS, ROLE_COLORS, MANAGER_DATA } from '../../core/models/scheduler.models';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatIconModule, MatButtonModule, MatTooltipModule,
    MatSidenavModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatCardModule, MatTableModule,
    MatPaginatorModule, MatSortModule, MatChipsModule,
    ContactCardComponent,
  ],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent {
  drawerOpen = signal(false);

  filters = signal<UserFilters>({ name:'', id:'', group:'', location:'', model:'', role:'', manager:'' });

  sortCol    = signal<keyof User>('name');
  sortDir    = signal<'asc'|'desc'>('asc');
  page       = signal(0);
  pageSize   = signal(10);

  readonly GROUPS      = GROUPS;
  readonly LOCATIONS   = LOCATIONS;
  readonly MODELS      = MODELS;
  readonly ROLES       = ROLES;
  readonly MANAGERS    = MANAGERS;
  readonly ROLE_COLORS = ROLE_COLORS;

  readonly displayedColumns = ['name','id','group','location','model','role','manager'];

  activeFilterCount = computed(() =>
    Object.values(this.filters()).filter(v => v !== '').length
  );

  activeFilterChips = computed(() => {
    const labels: Record<string, string> = { name:'Name', id:'ID', group:'Group', location:'Location', model:'Model', role:'Role', manager:'Manager' };
    return Object.entries(this.filters())
      .filter(([, v]) => v !== '')
      .map(([k, v]) => ({ key: k, label: labels[k], value: v }));
  });

  filteredUsers = computed(() => {
    const f = this.filters();
    const col = this.sortCol();
    const dir = this.sortDir() === 'asc' ? 1 : -1;
    return this.svc.allUsers()
      .filter(u => {
        if (f.name     && !u.name.toLowerCase().includes(f.name.toLowerCase())) return false;
        if (f.id       && !u.id.toLowerCase().includes(f.id.toLowerCase()))     return false;
        if (f.group    && u.group    !== f.group)    return false;
        if (f.location && u.location !== f.location) return false;
        if (f.model    && u.model    !== f.model)    return false;
        if (f.role     && u.role     !== f.role)     return false;
        if (f.manager  && u.manager  !== f.manager)  return false;
        return true;
      })
      .sort((a, b) => (a[col] as string).localeCompare(b[col] as string) * dir);
  });

  pagedUsers = computed(() => {
    const start = this.page() * this.pageSize();
    return this.filteredUsers().slice(start, start + this.pageSize());
  });

  // Contact card
  contactVisible = signal(false);
  contactInfo    = signal<ContactInfo | null>(null);
  contactAnchor  = signal<DOMRect | null>(null);

  constructor(public svc: ScheduleService, private router: Router) {}

  toggleDrawer(): void { this.drawerOpen.update(v => !v); }

  setFilter(key: keyof UserFilters, value: string): void {
    this.filters.update(f => ({ ...f, [key]: value }));
    this.page.set(0);
  }

  clearFilter(key: keyof UserFilters): void {
    this.filters.update(f => ({ ...f, [key]: '' }));
    this.page.set(0);
  }

  clearAllFilters(): void {
    this.filters.set({ name:'', id:'', group:'', location:'', model:'', role:'', manager:'' });
    this.page.set(0);
  }

  onSort(sort: Sort): void {
    this.sortCol.set((sort.active as keyof User) || 'name');
    this.sortDir.set(sort.direction === 'desc' ? 'desc' : 'asc');
    this.page.set(0);
  }

  onPage(e: PageEvent): void {
    this.page.set(e.pageIndex);
    this.pageSize.set(e.pageSize);
  }

  goToUser(id: string): void { this.router.navigate(['/users', id]); }
  addUser(): void            { this.router.navigate(['/users/new']); }

  goToManager(name: string): void {
    const user = this.svc.getUserByName(name);
    if (user) this.router.navigate(['/users', user.id]);
  }

  initials = initials;

  mgrColor(manager: string): string {
    return MANAGER_DATA.find(m => m.name === manager)?.color ?? '#607D8B';
  }

  roleStyle(role: string): { bg: string; color: string } {
    return ROLE_COLORS[role] ?? { bg: '#f0f2f5', color: '#555' };
  }

  showContact(event: MouseEvent, user: User): void {
    event.stopPropagation();
    this.contactInfo.set({
      name: user.name, role: user.role, color: user.color,
      email: user.email, phone: user.phone, slack: user.slack,
      location: user.location, group: user.group, model: user.model,
    });
    this.contactAnchor.set((event.currentTarget as HTMLElement).getBoundingClientRect());
    this.contactVisible.set(true);
  }

  showManagerContact(event: MouseEvent, managerName: string): void {
    event.stopPropagation();
    const m = MANAGER_DATA.find(mgr => mgr.name === managerName);
    this.contactInfo.set({
      name: managerName, role: 'Manager', model: 'Full-Time',
      color:    m?.color    ?? '#607D8B',
      email:    m?.email    ?? '',
      phone:    m?.phone    ?? '',
      slack:    m?.slack    ?? '',
      location: m?.location ?? '',
      group:    m?.group    ?? 'Management',
    });
    this.contactAnchor.set((event.currentTarget as HTMLElement).getBoundingClientRect());
    this.contactVisible.set(true);
  }

  @HostListener('document:keydown.escape')
  onEsc(): void { this.contactVisible.set(false); }
}
