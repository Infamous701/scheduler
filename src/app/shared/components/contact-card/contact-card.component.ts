import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { initials } from '../../../core/utils/user.utils';

export interface ContactInfo {
  name: string;
  role: string;
  color: string;
  email: string;
  phone: string;
  slack: string;
  location: string;
  group: string;
  model: string;
}

@Component({
  selector: 'app-contact-card',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  template: `
    @if (visible && contact) {
      <div class="overlay" (click)="close.emit()"></div>
      <div class="card" [style.left.px]="x" [style.top.px]="y">
        <div class="cc-header">
          <div class="cc-avatar" [style.background]="contact.color">{{ initials(contact.name) }}</div>
          <div class="cc-info">
            <div class="cc-name">{{ contact.name }}</div>
            <div class="cc-role">{{ contact.role }}</div>
          </div>
        </div>
        <div class="cc-body">
          <div class="cc-row">
            <mat-icon>email</mat-icon>
            <a [href]="'mailto:' + contact.email">{{ contact.email }}</a>
          </div>
          <div class="cc-row">
            <mat-icon>phone</mat-icon>
            <span>{{ contact.phone }}</span>
          </div>
          <div class="cc-row">
            <mat-icon>tag</mat-icon>
            <span>{{ contact.slack }}</span>
          </div>
          <div class="cc-row">
            <mat-icon>location_on</mat-icon>
            <span>{{ contact.location }}</span>
          </div>
        </div>
        <div class="cc-tags">
          <span class="cc-tag">{{ contact.group }}</span>
          <span class="cc-tag">{{ contact.model }}</span>
        </div>
      </div>
    }
  `,
  styles: [`
    .overlay {
      position: fixed; inset: 0; z-index: 500; background: transparent;
    }
    .card {
      position: fixed; z-index: 501;
      background: white; border: 1px solid #e2e5eb;
      border-radius: 12px; width: 240px;
      box-shadow: 0 8px 32px rgba(0,0,0,.18);
      overflow: hidden;
      animation: popIn .15s cubic-bezier(.34,1.56,.64,1);
    }
    @keyframes popIn { from{opacity:0;transform:scale(.88)} to{opacity:1;transform:scale(1)} }
    .cc-header {
      display: flex; align-items: center; gap: 10px;
      padding: 14px; background: #f7f8fa;
      border-bottom: 1px solid #e2e5eb;
    }
    .cc-avatar {
      width: 38px; height: 38px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; font-weight: 800; color: #fff; flex-shrink: 0;
    }
    .cc-name { font-size: 13px; font-weight: 700; }
    .cc-role { font-size: 10px; color: #8a92a6; }
    .cc-body { padding: 10px 14px 8px; display: flex; flex-direction: column; gap: 8px; }
    .cc-row {
      display: flex; align-items: center; gap: 8px;
      font-size: 11px; overflow: hidden;
      mat-icon { font-size: 16px; width: 16px; height: 16px; color: #8a92a6; flex-shrink: 0; }
      a { color: #4f63e7; text-decoration: none; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      a:hover { text-decoration: underline; }
      span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    }
    .cc-tags { display: flex; gap: 5px; padding: 0 14px 12px; flex-wrap: wrap; }
    .cc-tag {
      font-size: 9px; font-weight: 600; padding: 2px 7px;
      border-radius: 20px; background: #eef0fd; color: #4f63e7;
      border: 1px solid #c7cdf9;
    }
  `]
})
export class ContactCardComponent implements OnChanges {
  @Input() visible = false;
  @Input() contact: ContactInfo | null = null;
  @Input() anchorRect: DOMRect | null = null;
  @Output() close = new EventEmitter<void>();

  x = 0;
  y = 0;

  ngOnChanges(): void {
    if (this.visible && this.anchorRect) {
      this.position(this.anchorRect);
    }
  }

  private position(btn: DOMRect): void {
    const cardW = 240, cardH = 220;
    const vw = window.innerWidth, vh = window.innerHeight;
    let left = btn.right + 6;
    let top  = btn.top;
    if (left + cardW > vw - 8) left = btn.left - cardW - 6;
    if (top + cardH  > vh - 8) top  = vh - cardH - 8;
    if (left < 8) left = 8;
    if (top  < 8) top  = 8;
    this.x = left;
    this.y = top;
  }

  initials = initials;
}
