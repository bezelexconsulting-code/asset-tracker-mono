import { supabase } from '../lib/supabase';

export interface NFCAssetData {
  asset_id: string;
  asset_tag: string;
  name: string;
  checksum: string;
  timestamp: number;
  org_id: string;
}

export interface NFCTagInfo {
  tag_uid: string;
  tag_type: string;
  last_programmed: string;
  programmed_by: string;
  data_integrity: 'valid' | 'invalid' | 'tampered';
}

export interface NFCScanResult {
  asset: any;
  tag_info: NFCTagInfo;
}

export interface NFCWriteResult {
  success: boolean;
  message: string;
  tag_id?: string;
}

export class NFCService {
  private static instance: NFCService;
  private isSupported: boolean = false;
  private encryptionKey: string = '';

  private constructor() {
    this.checkSupport();
  }

  public static getInstance(): NFCService {
    if (!NFCService.instance) {
      NFCService.instance = new NFCService();
    }
    return NFCService.instance;
  }

  private checkSupport(): void {
    if ('NDEFReader' in window) {
      this.isSupported = true;
    } else {
      console.warn('Web NFC API not supported in this browser');
      this.isSupported = false;
    }
  }

  public isNFCSupported(): boolean {
    return this.isSupported;
  }

  public async scanNFC(): Promise<NFCScanResult | null> {
    if (!this.isSupported) {
      throw new Error('NFC is not supported in this browser');
    }

    try {
      const ndef = new (window as any).NDEFReader();
      await ndef.scan();
      
      return new Promise((resolve, reject) => {
        ndef.addEventListener('readingerror', () => {
          reject(new Error('Error reading NFC tag'));
        });

        ndef.addEventListener('reading', async (event: any) => {
          try {
            const { message, serialNumber } = event;
            const record = message.records[0];
            
            if (!record) {
              reject(new Error('No data found on NFC tag'));
              return;
            }

            const textDecoder = new TextDecoder();
            const tagData = JSON.parse(textDecoder.decode(record.data));
            
            // Verify data integrity
            const isValid = await this.verifyDataIntegrity(tagData);
            
            if (!isValid) {
              resolve({
                asset: null,
                tag_info: {
                  tag_id: serialNumber,
                  tag_type: 'unknown',
                  last_programmed: '',
                  programmed_by: '',
                  data_integrity: 'tampered'
                }
              });
              return;
            }

            // Fetch asset data from database
            const { data: asset, error } = await supabase
              .from('assets')
              .select(`
                *,
                location:locations(id, name),
                assigned_to:users(id, full_name)
              `)
              .eq('id', tagData.asset_id)
              .single();

            if (error) {
              reject(new Error('Asset not found'));
              return;
            }

            // Get NFC tag info
            const { data: tagInfo } = await supabase
              .from('nfc_tags')
              .select(`
                *,
                programmed_by:users(id, full_name)
              `)
              .eq('tag_uid', serialNumber)
              .single();

            resolve({
              asset,
              tag_info: {
                tag_uid: serialNumber,
                tag_type: tagInfo?.tag_type || 'unknown',
                last_programmed: tagInfo?.last_programmed || '',
                programmed_by: tagInfo?.programmed_by?.full_name || '',
                data_integrity: isValid ? 'valid' : 'invalid'
              }
            });
          } catch (error) {
            reject(error);
          }
        });
      });
    } catch (error) {
      throw new Error(`NFC scan failed: ${error}`);
    }
  }

  public async writeNFC(assetData: NFCAssetData): Promise<NFCWriteResult> {
    if (!this.isSupported) {
      throw new Error('NFC is not supported in this browser');
    }

    try {
      const ndef = new (window as any).NDEFReader();
      await ndef.write({
        records: [{
          recordType: 'mime',
          mediaType: 'application/json',
          data: new TextEncoder().encode(JSON.stringify(assetData))
        }]
      });

      // Save tag information to database
      const { error } = await supabase
        .from('nfc_tags')
        .upsert({
          org_id: assetData.org_id,
          asset_id: assetData.asset_id,
          tag_uid: 'pending_scan', // Will be updated after successful scan
          tag_type: 'NTAG215',
          payload: assetData,
          last_programmed: new Date().toISOString(),
          programmed_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) {
        throw new Error('Failed to save NFC tag record');
      }

      try {
        await supabase.from('audit_logs').insert({
          org_id: assetData.org_id,
          actor_id: (await supabase.auth.getUser()).data.user?.id || null,
          entity: 'nfc_tags',
          entity_id: null,
          action: 'write_tag',
          details: assetData,
        });
      } catch {}

      return {
        success: true,
        message: 'NFC tag programmed successfully',
        tag_id: 'pending_scan'
      };
    } catch (error) {
      return {
        success: false,
        message: `NFC write failed: ${error}`
      };
    }
  }

  private async verifyDataIntegrity(tagData: any): Promise<boolean> {
    // Verify checksum and timestamp
    const expectedChecksum = this.generateChecksum(tagData);
    return tagData.checksum === expectedChecksum;
  }

  private generateChecksum(data: any): string {
    // Simple checksum generation (in production, use proper cryptographic hash)
    const dataString = JSON.stringify({
      asset_id: data.asset_id,
      asset_tag: data.asset_tag,
      name: data.name,
      timestamp: data.timestamp
    });
    
    // Create a simple hash (replace with proper crypto in production)
    let hash = 0;
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  public async getAssetByNFCTag(tagId: string): Promise<any> {
    const { data, error } = await supabase
      .from('nfc_tags')
      .select(`
        *,
        asset:assets(*, location:locations(id, name))
      `)
      .eq('tag_uid', tagId)
      .single();

    if (error) {
      throw new Error('NFC tag not found');
    }

    return data;
  }

  public async updateNFCTag(tagId: string, updates: Partial<any>): Promise<void> {
    const { error } = await supabase
      .from('nfc_tags')
      .update(updates)
      .eq('tag_uid', tagId);

    if (error) {
      throw new Error('Failed to update NFC tag');
    }
  }

  public async getNFCStats(orgId: string): Promise<any> {
    const { data, error } = await supabase
      .rpc('get_nfc_stats', { org_id: orgId });

    if (error) {
      throw new Error('Failed to get NFC statistics');
    }

    return data;
  }
}

export const nfcService = NFCService.getInstance();
