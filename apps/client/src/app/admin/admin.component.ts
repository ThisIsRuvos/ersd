import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { IPerson, Person } from '../../../../../libs/kdslib/src/lib/person';
import { HttpClient } from '@angular/common/http';
import { getErrorString } from '../../../../../libs/kdslib/src/lib/get-error-string';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AdminEditPersonComponent } from './edit-person/edit-person.component';
import { AuthService } from '../auth.service';
import { IUploadRequest } from '../../../../../libs/kdslib/src/lib/upload-request';
import { IEmailRequest } from '../../../../../libs/kdslib/src/lib/email-request';

@Component({
  selector: 'kds-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
  public users: Person[] = [];
  public message: string;
  public messageIsError: boolean;
  public uploadFile: File;
  public uploadFileContent: string;
  public uploadMessage: string;
  public emailRequest: IEmailRequest = {
    subject: '',
    message: ''
  };

  @ViewChild('fileUploadField') fileUploadField: ElementRef;

  constructor(private httpClient: HttpClient,
              private modalService: NgbModal,
              private authService: AuthService) { }

  sendEmail() {
    if (!this.emailRequest.subject || !this.emailRequest.message) {
      return;
    }

    if (!confirm('Are you sure you want to send this email to all users?')) {
      return;
    }

    this.message = null;
    this.messageIsError = false;

    this.httpClient.post('/api/user/email', this.emailRequest).toPromise()
      .then(() => {
        this.message = 'Successfully sent email to all users';
        window.scrollTo(0, 0);
      })
      .catch((err) => {
        this.message = getErrorString(err);
        this.messageIsError = true;
        window.scrollTo(0, 0);
      });
  }

  editUser(user: IPerson) {
    const modalRef = this.modalService.open(AdminEditPersonComponent, { size: 'lg' });
    modalRef.componentInstance.id = user.id;

    modalRef.result.then((results) => {

    });
  }

  handleFileInput(files: FileList) {
    if (files.length !== 1) {
      this.uploadFile = null;
      return;
    }

    this.uploadFile = files.item(0);

    const fileReader = new FileReader();
    fileReader.onload = (e) => {
      this.uploadFileContent = <string> fileReader.result;
    };
    fileReader.readAsText(this.uploadFile);
  }

  upload() {
    if (!this.uploadFile || !this.uploadMessage) {
      return;
    }

    if (!confirm('Are you sure you want to upload the selected resource/file?')) {
      return;
    }

    this.message = null;
    this.messageIsError = false;

    if (!this.uploadFile.name.endsWith('.json') && !this.uploadFile.name.endsWith('.xml')) {
      this.message = 'Unknown file type for uploaded file ' + this.uploadFile.name;
      this.messageIsError = true;
      window.scrollTo(0, 0);
      return;
    }

    const request: IUploadRequest = {
      fileContent: this.uploadFileContent,
      fileName: this.uploadFile.name,
      message: this.uploadMessage
    };

    this.httpClient.post('/api/upload', request).toPromise()
      .then(() => {
        this.message = 'Successfully uploaded!';
        this.messageIsError = false;

        this.fileUploadField.nativeElement.value = '';
        this.uploadMessage = null;
        this.uploadFile = null;
        this.uploadFileContent = null;
      })
      .catch((err) => {
        this.message = getErrorString(err);
        this.messageIsError = true;
      });
  }

  deleteUser(user: Person) {
    const currentUserPersonId = this.authService.person ? this.authService.person.id : null;

    if (currentUserPersonId === user.id) {
      this.message = 'You cannot delete yourself!';
      this.messageIsError = true;
      window.scrollTo(0, 0);
      return;
    }

    if (!confirm(`Are you sure you want to delete the user with email ${user.email}?`)) {
      return;
    }

    this.httpClient.delete('/api/user/' + user.id);
  }

  ngOnInit() {
    this.httpClient.get<IPerson[]>('/api/user').toPromise()
      .then((users) => this.users = users.map((user) => new Person(user)))
      .catch((err) => {
        this.message = getErrorString(err);
        this.messageIsError = true;
      });
  }
}
