interface ProductCode {
  code_type: string | null;
  code_value: string | null;
}

// Inspect document sivun tuoterivin -malli
export interface TuoteriviModel {
  product_line_id: number | null;
  document_id: number | null;
  product_name: string | null;
  code: string | null;
  ordered_quantity: number | null;
  shipped_quantity: number | null;
  note: string | null;
  product_id?: number | null;
  other_codes?: ProductCode[] | null;
  checked: boolean | null;
}
