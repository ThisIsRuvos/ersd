import { Component, Input, OnInit } from '@angular/core';
import { Person } from '../../../../../libs/kdslib/src/lib/person';

@Component({
  selector: 'kds-edit-person',
  templateUrl: './edit-person.component.html',
  styleUrls: ['./edit-person.component.css']
})
export class EditPersonComponent implements OnInit {
  @Input() person: Person;

  constructor() { }

  ngOnInit() {
  }
}
