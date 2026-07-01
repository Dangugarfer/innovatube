import { Component, EventEmitter, Input, OnInit, Output, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule
  ],
  template: `
    <div class="search-container">
      <mat-form-field appearance="fill" subscriptSizing="dynamic">
        <mat-icon matPrefix>search</mat-icon>
        <input 
          matInput 
          [formControl]="searchControl" 
          [placeholder]="placeholder" 
          type="text"
        />
        @if (searchControl.value) {
          <button mat-icon-button matSuffix (click)="clearSearch()" type="button" class="clear-btn">
            <mat-icon>clear</mat-icon>
          </button>
        }
      </mat-form-field>
    </div>
  `,
  styles: [`
    .search-container {
      width: 100%;
      margin: 16px 0;
    }
    mat-form-field {
      width: 100%;
    }
    .clear-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--text-muted);
    }
    .clear-btn:hover {
      color: var(--text-primary);
    }
  `]
})
export class SearchBarComponent implements OnInit, OnDestroy {
  @Input() placeholder: string = 'Search videos...';
  @Input() initialValue: string = '';
  @Output() search = new EventEmitter<string>();

  searchControl = new FormControl('');
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.searchControl.setValue(this.initialValue, { emitEvent: false });

    this.searchControl.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(value => {
      this.search.emit(value || '');
    });
  }

  clearSearch(): void {
    this.searchControl.setValue('');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
