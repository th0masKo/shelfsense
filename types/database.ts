export interface PantryItemRow {
  id: string;
  user_id: string;
  name: string;
  category: string;
  quantity: string | null;
  expiry_date: string;
  added_date: string;
  barcode: string | null;
  image_url: string | null;
  est_cost: number | null;
  status: string;
}
