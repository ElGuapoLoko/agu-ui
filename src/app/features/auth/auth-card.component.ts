import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/** Two-column layout shared by the login and registration pages. */
@Component({
  selector: 'app-auth-card',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './auth-card.component.html',
  styleUrl: './auth-card.component.scss',
})
export class AuthCardComponent {
  @Input({ required: true }) heading!: string;
  @Input({ required: true }) subtitle!: string;
}
