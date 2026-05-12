import { Component, Input, Output, EventEmitter } from '@angular/core';
import { PdfViewerModule } from 'ng2-pdf-viewer';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [PdfViewerModule],
  templateUrl: './png-modal.html',
  styleUrl: './png-modal.scss',
})
export class Modal {
  @Input() pdfUrl!: string;

  @Output() closeModal = new EventEmitter<void>();

  ngOnInit(): void {
    console.log('Modaali auki!');
  }

  onBackgroundClick(event: MouseEvent): void {
    console.log('PdfUrl =', this.pdfUrl);
    this.closeModal.emit();
  }

  onCloseClick(): void {
    this.closeModal.emit();
    console.log('PdfUrl =', this.pdfUrl);
  }
}
