import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth.service';
import { firstValueFrom } from 'rxjs';




interface PayloadDownload {
  url: string;
}

@Component({
  selector: 'release-candidate',
  templateUrl: './release-candidate.component.html',
  styleUrls: ['./release-candidate.component.css']
})
export class ReleaseCandidateComponent implements OnInit {
  @ViewChild('modalAcknowledgement') modalAcknowledgement: ElementRef;
  request: any = {}
  version = 'ecrv1'
  bundleType = ''
  contentType = 'json'
  markdownContent: string = '';
  draftVersion : string = '';
  isDisabled: boolean = true;
  checkboxChecked: boolean = false;



  constructor(
    private httpClient: HttpClient,
    public authService: AuthService,
  ) { }

  ngOnInit() {
    this.httpClient.get('/api/ersd/markdown', { responseType: 'text' }).subscribe((data) => {
      this.markdownContent = data;
    });

  }  

  ngAfterViewInit() {
    this.modalAcknowledgement.nativeElement.addEventListener('hidden.bs.modal', () => {
      this.resetIsDisabled();
    });
  }

  async getReleasePreview(e) {
    const button = e.target as HTMLButtonElement;
    this.draftVersion = button.name;
  
    const urls = {
      'ersdv2-draft-json': 'api/download/change-preview-json',
      'ersdv2-draft-xml': 'api/download/change-preview-xml',
      // Add more versions here if needed
    };
  
    const url = urls[this.draftVersion];
  
    if (!url) {
      console.error('Invalid draft version:', this.draftVersion);
      return;
    }
  
    try {
      const data = await firstValueFrom(this.httpClient.post(url, this.request)) as PayloadDownload;
      const modal = this.modalAcknowledgement.nativeElement;
      
      modal.classList.remove('show');

      document.body.classList.remove('modal-open');
      
      document.querySelector('.modal-backdrop').remove();

      modal.setAttribute('aria-hidden', 'true');
      await this.downloadS3(data);

      
    } catch (err) {
      console.error(err);
    }
  }
  

  async downloadS3(data: PayloadDownload) {
    var a = document.createElement('a');
    a.href = data.url;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.parentNode.removeChild(a);
  }


  async setAcknowledgement(event: Event) {
    this.checkboxChecked = (event.target as HTMLInputElement).checked;
    this.isDisabled = !this.checkboxChecked;
  }

  // Function to reset isDisabled when the modal is hidden
  resetIsDisabled() {
    this.isDisabled = true;
    // Access the checkbox element and uncheck it
    const checkboxElement = document.getElementById('checkboxAgreement') as HTMLInputElement;
    if (checkboxElement) {
      checkboxElement.checked = false;
      this.checkboxChecked = false;
    }
  }


}
