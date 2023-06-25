import { Component, OnInit } from '@angular/core';
import { DatabaseService } from 'src/services/database.service';
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  constructor(private databaservice: DatabaseService) {}
}
