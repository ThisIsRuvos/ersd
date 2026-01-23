import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth.service';
import { ConfigService } from '../config.service';


@Component({
  selector: 'navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.css'],
  standalone: false
})

export class NavigationComponent implements OnInit {
  request: any = {};

  constructor(
    public authService: AuthService,
    public configService: ConfigService
  ) {}

  ngOnInit() {
   
  }

}
