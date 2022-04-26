export interface FileInfo {
  name: string;
  path: string;
  size: number;
  type: string;
  lastModifiedDate?: Date;
  description?: string;
  storage_url?: string; 
  storage_id?: string;
  part_size?: number;
  etag?: string;
  etags?: string[];
  final_result?: number;
}
