import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'ersd-update-notice',
  template: `
    <strong class="update-notice-header">********* NOTICE *********</strong>
    <p class="update-notice-body">
      The spreadsheet presentation of trigger codes and reporting metadata (the "RCTC spreadsheet")
      <u>will no longer be available after &lt;Month, DD, YYYY&gt;.</u>
      <br><br>
      EHRs and healthcare organizations should use the trigger codes, reporting metadata, 
      and where applicable, rules from the eRSD distributions that are available now on the eRSD website.
      The eRSD distributions include all codes necessary for eCR in machine-consumable form.
      <br>
      The new two-bundle eRSD specification (the primary bundle includes trigger codes and related metadata; 
      the supplemental bundle contains operational value sets and rules for their use) is in the HL7 FHIR eCR R2 implementation guide - available 
      <a href="https://build.fhir.org/ig/HL7/case-reporting/">here</a>.
      It will be populated and available (along with the existing eRSD specification) by &lt;Month, DD, YYYY&gt;.
    </p>
  `,
  styleUrls: ['./update-notice.component.css']
})

export class UpdateNoticeComponent implements OnInit {
  ngOnInit() {}
}
