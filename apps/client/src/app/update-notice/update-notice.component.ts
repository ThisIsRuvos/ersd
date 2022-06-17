import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'ersd-update-notice',
  template: `
    <strong class="update-notice-header">********* NOTICE *********</strong>
    <p class="update-notice-body">
      The spreadsheet presentation of trigger codes and reporting metadata (the "RCTC spreadsheet")
      <u>will no longer be available after June 17th, 2022.</u>
      <br><br>
      EHRs and healthcare organizations should use the trigger codes, reporting metadata, and where applicable,
      rules from the eRSD distributions that are available now on the eRSD website. The eRSD distributions include
      all of the codes necessary for eCR in machine consumable form.
      <br>
      The two new bundle eRSD specification (the primary bundle includes trigger codes and related metadata and
      and the supplemental bundle contains rules and operational value set for where they can be used) is in
      the HL7 FHIR eCR R2 implementation guide available <a href="https://build.fhir.org/ig/HL7/case-reporting/">here</a>.
      It will be populated and available (along with the existing eRSD specification) by June, 2022.
    </p>
  `,
  styleUrls: ['./update-notice.component.css']
})

export class UpdateNoticeComponent implements OnInit {
  ngOnInit() {}
}
