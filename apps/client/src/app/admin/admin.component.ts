import { Component, ElementRef, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { IPerson, Person } from '../../../../../libs/ersdlib/src/lib/person';
import { HttpClient } from '@angular/common/http';
import { getErrorString } from '../../../../../libs/ersdlib/src/lib/get-error-string';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AdminEditPersonComponent } from './edit-person/edit-person.component';
import { AuthService } from '../auth.service';
import { IUploadRequest } from '../../../../../libs/ersdlib/src/lib/upload-request';
import { IEmailRequest, IEmailExportRequest } from '../../../../../libs/ersdlib/src/lib/email-request';
import { firstValueFrom } from 'rxjs';
import { ToastrService } from 'ngx-toastr';


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
  public active = 1
  public uploading: boolean = false;


  @ViewChild('bundleUploadFile') bundleUploadField: ElementRef;
  @ViewChild('excelUploadFile') excelUploadField: ElementRef;
  @ViewChild('emailType1') emailType1!: ElementRef<HTMLInputElement>;
  @ViewChild('emailType2') emailType2!: ElementRef<HTMLInputElement>;
  emailType: IEmailExportRequest = {
    exportTypeOrigin: '',
  };
  isDisabled = true;
  downloading = false


  constructor(private httpClient: HttpClient,
    private modalService: NgbModal,
    private authService: AuthService,
    private cdRef: ChangeDetectorRef,
    private toastr: ToastrService) { }

  setEmailType() {
    const person = this.emailType1.nativeElement.checked;
    const subscription = this.emailType2.nativeElement.checked;

    if (person && subscription) {
      this.emailType = { exportTypeOrigin: 'Both' };
    } else if (person) {
      this.emailType = { exportTypeOrigin: 'Person' };
    } else if (subscription) {
      this.emailType = { exportTypeOrigin: 'Subscription' };
    } else {
      this.emailType = { exportTypeOrigin: '' };
    }
    this.isDisabled = this.emailType.exportTypeOrigin.length === 0;
  }


  async sendEmail() {
    if (!this.emailRequest.subject || !this.emailRequest.message) {
      return;
    }

    if (!confirm('Are you sure you want to send this email to all users?')) {
      return;
    }

    this.message = null;
    this.messageIsError = false;

    try {
      await firstValueFrom(this.httpClient.post('/api/user/email', this.emailRequest));
      this.message = 'Successfully sent email to all users';
      window.scrollTo(0, 0);
    } catch (err) {
      this.message = getErrorString(err);
      this.messageIsError = true;
      window.scrollTo(0, 0);
    }
  }

  editUser(user: IPerson) {
    const modalRef = this.modalService.open(AdminEditPersonComponent, { size: 'lg' });
    modalRef.componentInstance.id = user.id;
    modalRef.componentInstance.updatedUser.subscribe((updatedUser: any) => {
      const index = this.users.findIndex(u => u.id === updatedUser.id);

      if (index !== -1) {
        this.users[index] = updatedUser;
        this.fetchUserData();
      }
    });

    modalRef.componentInstance.messageIsSuccess.subscribe((isSuccess: boolean) => {
      if (isSuccess) {
        this.toastr.success('User details updated successfully!' );
      } else {
        this.toastr.error('Failed to update user details!');
      }
    });


  }

  handleBundleFileInput(files: FileList) {
    if (files.length !== 1) {
      this.bundleFile = null;
      return;
    }

    this.bundleFile = files.item(0);

    const fileReader = new FileReader();
    fileReader.onload = () => {
      this.bundleFileContent = <string>fileReader.result;
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
      this.excelFileContent = <string>fileReader.result;
      this.excelFileContent = this.excelFileContent.substring(this.excelFileContent.indexOf('base64,') + 7);
    };
    fileReader.readAsDataURL(this.excelFile);
  }

  // decommissioned atm
  // async getEmail() {
  //   const request = this.emailType
  //   // get emailtype from checkboc and assign it to exportTypeOrigin

  //   try {
  //     const response = await firstValueFrom(this.httpClient.post('/api/upload/get-emails', request))
  //     this.sendEmailsFromClient(response)
  //   } catch (error) {
  //      // Handle error if the request fails
  //      console.error('Error:', error);
  //   }
  // }


  async getEmailCSV() {
    const request = this.emailType
    this.downloading = true;

    try {
      const response = await firstValueFrom(this.httpClient.post('/api/upload/export', request, {
        responseType: 'blob', // Set response type as blob
        observe: 'response', // Get the full response object
      }));

      // console.log(response.body);

      let fileName = '';
      const contentDisposition = response.headers.get('Content-Disposition');
      if (contentDisposition && contentDisposition.indexOf('attachment') !== -1) {
        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
        if (matches != null && matches[1]) {
          fileName = matches[1].replace(/['"]/g, '');
        }
      }

      const blob = new Blob([response.body], { type: 'text/csv' }); // Create a blob from the response body

      const downloadLink = document.createElement('a');
      downloadLink.href = window.URL.createObjectURL(blob);
      downloadLink.download = fileName;
      downloadLink.click();
    } catch (error) {
      // Handle error
    } finally {
      this.downloading = false;
    }
  }

  // not currently used
  sendEmailsFromClient(emailList) {
    const emailString = emailList.join(',');
    // console.log("emailString",emailString);
    // Construct the mailto link with the list of email addresses
    const mailtoLink = `mailto:${emailString}`;
    // Open the default mail client using Angular's Router service
    // this.router.navigateByUrl(mailtoLink);
    window.location.href = mailtoLink;
  }


  async uploadExcel() {
    this.uploading = true;

    const request: IUploadRequest = {
      fileContent: this.excelFileContent,
      fileName: this.excelFile.name
    };
    try {
      await firstValueFrom(this.httpClient.post('/api/upload/excel', request));
      this.message = 'Successfully uploaded!';
      this.messageIsError = false;
      this.excelUploadField.nativeElement.value = '';
      this.excelFile = null;
      this.excelFileContent = null;
    } catch (err) {
      this.message = getErrorString(err);
      this.messageIsError = true;
    } finally {
      this.uploading = false;
    }
  }

  async uploadBundle() {
    if (!this.bundleFile) {
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

    this.uploading = true;

    const request: IUploadRequest = {
      fileContent: this.bundleFileContent,
      fileName: this.bundleFile.name,
      message: this.bundleUploadMessage
    };

    try {
      await firstValueFrom(this.httpClient.post('/api/upload/bundle', request));
      // this.message = 'Successfully uploaded!';
      // this.messageIsError = false;
      this.toastr.success("Successfully uploaded!");   
      this.bundleUploadField.nativeElement.value = '';
      this.bundleUploadMessage = null;
      this.bundleFile = null;
      this.bundleFileContent = null;
    } catch (err) {
      this.message = getErrorString(err);
      this.messageIsError = true;
      this.toastr.error("Failed to upload!");  
    } finally {
      this.uploading = false;
    }
  }

  async deleteUser(user: Person) {
    const currentUserPersonId = this.authService.person ? this.authService.person.id : null;

    if (currentUserPersonId === user.id) {
      this.toastr.error('You cannot delete your user details!');      
      window.scrollTo(0, 0);
      return;
    }

    if (!confirm(`Are you sure you want to delete the user with email ${user.email}?`)) {
      return;
    }

    try {
      await firstValueFrom(this.httpClient.delete('/api/user/' + user.id));
      const index = this.users.indexOf(user);
      if (index >= 0) {
        this.users.splice(index, 1);
      }
      this.toastr.success(`${user.firstName} ${user.lastName} has been deleted!`);    
    } catch (err) {
      // 
      this.message = getErrorString(err);
      this.messageIsError = true;
    }
  }


  async removeEmailAttachments() {
    try {
      await firstValueFrom(this.httpClient.get('/api/subscription/remove_artifacts'));
      this.message = 'Attachements Successfully Removed!';
      this.messageIsError = false;
    } catch (err) {
      this.message = getErrorString(err);
      this.messageIsError = true;
    }
  }

  async ngOnInit() {
    await this.fetchUserData(); // Initial data fetch when component initializes
  }

  async fetchUserData() {
    try {
      const users = await firstValueFrom(this.httpClient.get<IPerson[]>('/api/user'));
      this.users = users.map((user) => new Person(user));
    } catch (err) {
      // Handle errors if any
    }
  }

  ngOnDestroy() {
    // if (this.updatedUserSubscription) {
    //   this.updatedUserSubscription.unsubscribe();
    // }
    // if (this.messageIsSuccessSubscription) {
    //   this.messageIsSuccessSubscription.unsubscribe();
    // }
  }

}


