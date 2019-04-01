import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'kds-api-keys',
  templateUrl: './api-keys.component.html',
  styleUrls: ['./api-keys.component.css']
})
export class ApiKeysComponent implements OnInit {
  keys = {
    inbound: '',
    outbound: ''
  };

  constructor() { }

  generateKey() {
    const keyPattern = 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx2xxxxxxxxxxxxxxxxxxx';
    let d = new Date().getTime();

    if (window.performance && typeof window.performance.now === "function") {
      d += performance.now();
    }

    const uuid = keyPattern.replace(/[xy]/g, function(c) {
      const r = (d + Math.random()*16)%16 | 0;
      d = Math.floor(d/16);
      return (c === 'x' ? r : (r&0x3|0x8)).toString(16);
    });

    return uuid;
  }

  ngOnInit() {
  }

}
