import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { IPerson, Person } from '../../../../../libs/ersdlib/src/lib/person';
import { HttpClient } from '@angular/common/http';
import { getErrorString } from '../../../../../libs/ersdlib/src/lib/get-error-string';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AdminEditPersonComponent } from './edit-person/edit-person.component';
import { AuthService } from '../auth.service';
import { IUploadRequest } from '../../../../../libs/ersdlib/src/lib/upload-request';
import { IEmailRequest } from '../../../../../libs/ersdlib/src/lib/email-request';

@Component({
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
  public users: Person[] = [];
  public message: string;
  public messageIsError: boolean;
  public bundleFile: File;
  public bundleFileContent: string;
  public bundleUploadMessage: string;
  public emailRequest: IEmailRequest = {
    subject: '',
    message: ''
  };
  public excelFile: File = null;
  public excelFileContent: string;

  @ViewChild('bundleUploadFile') bundleUploadField: ElementRef;
  @ViewChild('excelUploadFile') excelUploadField: ElementRef;

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
  }

  handleBundleFileInput(files: FileList) {
    if (files.length !== 1) {
      this.bundleFile = null;
      return;
    }

    this.bundleFile = files.item(0);

    const fileReader = new FileReader();
    fileReader.onload = () => {
      this.bundleFileContent = <string> fileReader.result;
    };
    fileReader.readAsText(this.bundleFile);
  }

  handleExcelFileInput(files: FileList) {
    if (files.length !== 1) {
      this.bundleFile = null;
      return;
    }

    this.excelFile = files.item(0);

    const fileReader = new FileReader();
    fileReader.onload = () => {
      this.excelFileContent = <string> fileReader.result;
      this.excelFileContent = this.excelFileContent.substring(this.excelFileContent.indexOf('base64,') + 7);
    };
    fileReader.readAsDataURL(this.excelFile);
  }

  uploadExcel() {
    const request: IUploadRequest = {
      fileContent: this.excelFileContent,
      fileName: this.excelFile.name
    };

    this.httpClient.post('/api/upload/excel', request).toPromise()
      .then(() => {
        this.message = 'Successfully uploaded!';
        this.messageIsError = false;

        this.excelUploadField.nativeElement.value = '';
        this.excelFile = null;
        this.excelFileContent = null;
      })
      .catch((err) => {
        this.message = getErrorString(err);
        this.messageIsError = true;
      });
  }

  uploadBundle() {
    if (!this.bundleFile || !this.bundleUploadMessage) {
      return;
    }

    if (!confirm('Are you sure you want to upload the selected resource/file?')) {
      return;
    }

    this.message = null;
    this.messageIsError = false;

    if (!this.bundleFile.name.endsWith('.json') && !this.bundleFile.name.endsWith('.xml')) {
      this.message = 'Unknown file type for uploaded file ' + this.bundleFile.name;
      this.messageIsError = true;
      window.scrollTo(0, 0);
      return;
    }

    const request: IUploadRequest = {
      fileContent: this.bundleFileContent,
      fileName: this.bundleFile.name,
      message: this.bundleUploadMessage
    };

    this.httpClient.post('/api/upload/bundle', request).toPromise()
      .then(() => {
        this.message = 'Successfully uploaded!';
        this.messageIsError = false;

        this.bundleUploadField.nativeElement.value = '';
        this.bundleUploadMessage = null;
        this.bundleFile = null;
        this.bundleFileContent = null;
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

    this.httpClient.delete('/api/user/' + user.id)
      .subscribe(() => {
        const index = this.users.indexOf(user);
        this.users.splice(index, index >= 0 ? 1 : 0);
      }, (err) => {
        this.message = getErrorString(err);
        this.messageIsError = true;
      });
  }

  removeEmailAttachments() {
    this.httpClient.get('/api/subscription/remove_artifacts').toPromise()
      .then((response) => {
        console.log(response)
        this.message = 'Attachements Successfully Removed!';
        this.messageIsError = false;
      })
      .catch((err) => {
        this.message = getErrorString(err);
        this.messageIsError = true;
      })
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
