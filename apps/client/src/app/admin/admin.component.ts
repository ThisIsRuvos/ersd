import { Component, ElementRef, OnInit, ViewChild, AfterViewInit } from '@angular/core';
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
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';

@Component({
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
  standalone: false
})

export class AdminComponent implements AfterViewInit {
  public users: Person[] = [];
  public dataSource = new MatTableDataSource([]);
  public isLoadingResults = true; // Loading indicator flag
  public message: string;
  public messageIsError: boolean;
  public emailRequest: IEmailRequest = {
    subject: '',
    message: ''
  };
  public excelFile: File = null;
  public excelFileContent: string;
  public active = 1
  public uploading: boolean = false;
  displayedColumns: string[] = ['firstName', 'lastName', 'email', 'actions'];

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
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
    public authService: AuthService,
    private toastr: ToastrService) {}

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

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
  
  async ngAfterViewInit() {
    this.dataSource.filterPredicate = (data, filter) => {
      const accumulator = data.firstName + ' ' + data.lastName + ' ' + data.email;
      return accumulator.toLowerCase().includes(filter);
    };    
    await this.fetchUserData();
  }

  async fetchUserData() {
    this.isLoadingResults = true;
    try {
      const users = await firstValueFrom(this.httpClient.get<IPerson[]>('/api/user'));
      this.users = users.map(user => new Person(user));
      this.updateTableDataSource(users); // Transform and update in one step
    } catch (err) {
      this.handleError(err);
    } finally {
      this.isLoadingResults = false;
      this.initializeTableFeatures();
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

  

  async deleteUser(user: Person) {
    if (this.isCurrentUserService(user)) return;
    if (!confirm(`Are you sure you want to delete the user with email ${user.email}?`)) return;

    try {
      await firstValueFrom(this.httpClient.delete(`/api/user/${user.id}`));
      this.users = this.users.filter(u => u.id !== user.id);
      this.updateTableDataSource([...this.users]); // Update table with current users
      window.scrollTo(0, 0);
      this.toastr.success(`${user.firstName} ${user.lastName} has been deleted!`);
    } catch (err) {
      window.scrollTo(0, 0);
      this.handleError(err);
    }
  }

  handleExcelFileInput(files: FileList) {
    if (files.length !== 1) {
      this.excelFile = null;
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


  async getEmailCSV() {
    const request = this.emailType
    this.downloading = true;

    try {
      const response = await firstValueFrom(this.httpClient.post('/api/upload/export', request, {
        responseType: 'blob', // Set response type as blob
        observe: 'response', // Get the full response object
      }));

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

  async uploadExcel() {
    if (!this.excelFile) {
      return;
    }

    if (!confirm('Are you sure you want to upload the selected resource/file?')) {
      return;
    }

    this.uploading = true;

    const request: IUploadRequest = {
      fileContent: this.excelFileContent,
      fileName: this.excelFile.name
    };
    try {
      await firstValueFrom(this.httpClient.post('/api/upload/excel', request));
      this.toastr.success("Successfully uploaded!");   
      this.excelUploadField.nativeElement.value = '';
      this.excelFile = null;
      this.excelFileContent = null;
    } catch (err) {
      this.message = getErrorString(err);
      this.messageIsError = true;
      this.toastr.error("Failed to upload!");
    } finally {
      this.uploading = false;
    }
  }

  updateTableDataSource(users: IPerson[]) {
    this.dataSource.data = users.map(({ id, name, telecom }) => ({
      id,
      firstName: name?.[0]?.given?.[0],
      lastName: name?.[0]?.family,
      email: telecom?.find(contact => contact?.system === 'email')?.value?.replace('mailto:', '')
    }));

    this.dataSource.filter = this.dataSource.filter; // Re-trigger filtering
  }

  initializeTableFeatures() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  isCurrentUserService(user: Person): boolean {
    const currentUserPersonId = this.authService.person?.id;
    if (currentUserPersonId === user.id) {
      this.toastr.error('You cannot delete your user details!');
      return true;
    }
    return false;
  }

  handleError(err: any) {
    console.error("Failed to fetch user data:", err);
    this.toastr.error('An error occurred. Please try again.');
  }

  async removeEmailAttachments() {
    try {
      await firstValueFrom(this.httpClient.get('/api/subscription/remove_artifacts'));
      this.message = 'Attachments Successfully Removed!';
      this.messageIsError = false;
    } catch (err) {
      this.message = getErrorString(err);
      this.messageIsError = true;
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


