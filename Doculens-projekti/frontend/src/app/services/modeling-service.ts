/* Service datan mallinnukseen */
import { Injectable } from '@angular/core';
import { TuoteriviModel } from '../models/tuoterivi-model';
import { DisplayDocumentModel } from '../models/display-document-home';
import { ValmisDokumentti } from '../models/valmis-document-model';

@Injectable({
  providedIn: 'root',
})
export class ModelingService {
  modelUnfinishedDocument(document: any): DisplayDocumentModel {
    const [date, timeWithZone] = document.upload_date.split('T');
    const time = timeWithZone.split('.')[0];
    const formattedDate = date.replace(/-/g, '/'); // "2025-10-07" => "2025/10/07"
    return {
      id: document.id,
      name: document.filename,
      author: document.sender || 'Ei saatavilla',
      uploadDate: formattedDate,
      uploadTime: time, // "08:10:21",
      pallet: document.pallet,
    };
  }
  modelFinishedDocument(document: any): ValmisDokumentti {
    const [date, timeWithZone] = document.upload_date.split('T');
    const time = timeWithZone.split('.')[0];
    const formattedDate = date.replace(/-/g, '/'); // "2025-10-07" => "2025/10/07"
    return {
      id: document.id,
      name: document.filename,
      author: document.uploaded_by,
      uploadDate: formattedDate,
      uploadTime: time, // "08:10:21"
    };
  }

  modelProductRow(document: any): TuoteriviModel {
    return {
      product_line_id: document.product_line_id ?? null,
      document_id: document.document_id ?? null,
      product_name: document.product_name ?? null,
      code: document.code ?? null,
      ordered_quantity: document.ordered_quantity ?? null,
      shipped_quantity: document.shipped_quantity ?? null,
      note: document.note ?? null,
      product_id: document.product_id ?? null,
      other_codes: document.other_codes ?? null,
      checked: document.checked ?? false,
    };
  }
}
