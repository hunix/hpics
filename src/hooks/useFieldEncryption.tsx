import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useClearance, ClearanceLevel } from './useClearance';
import { toast } from 'sonner';
import { invokeFunction } from '@/lib/api';

interface EncryptionResult {
  encrypted_value: string;
  algorithm: string;
  classification: ClearanceLevel;
}

interface DecryptionResult {
  value: string;
}

export function useFieldEncryption() {
  const { user, session } = useAuth();
  const { hasClearance, currentClearance } = useClearance();
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);

  // Encrypt a field value
  const encryptField = useCallback(
    async (
      value: string,
      tableName: string,
      columnName: string,
      classification: ClearanceLevel = 'confidential'
    ): Promise<string | null> => {
      if (!user || !session) {
        toast.error('Authentication required');
        return null;
      }

      setIsEncrypting(true);
      try {
        const { data, error } = await invokeFunction('encrypt-field', {
            value,
            table_name: tableName,
            column_name: columnName,
            classification,
          },);

        if (error) throw error;

        const result = data as EncryptionResult;
        return result.encrypted_value;
      } catch (error) {
        console.error('Encryption failed:', error);
        toast.error('Failed to encrypt field');
        return null;
      } finally {
        setIsEncrypting(false);
      }
    },
    [user, session]
  );

  // Decrypt a field value
  const decryptField = useCallback(
    async (
      encryptedValue: string,
      tableName: string,
      columnName: string
    ): Promise<string | null> => {
      if (!user || !session) {
        toast.error('Authentication required');
        return null;
      }

      // Check if value is encrypted
      if (!encryptedValue?.startsWith('ENC:')) {
        return encryptedValue;
      }

      setIsDecrypting(true);
      try {
        const { data, error } = await invokeFunction('decrypt-field', {
            encrypted_value: encryptedValue,
            table_name: tableName,
            column_name: columnName,
          },);

        if (error) {
          if (error.message?.includes('Insufficient clearance')) {
            toast.error('You lack the required clearance to view this data');
            return '[CLASSIFIED]';
          }
          throw error;
        }

        const result = data as DecryptionResult;
        return result.value;
      } catch (error) {
        console.error('Decryption failed:', error);
        toast.error('Failed to decrypt field');
        return null;
      } finally {
        setIsDecrypting(false);
      }
    },
    [user, session]
  );

  // Check if a value is encrypted
  const isEncrypted = useCallback((value: string): boolean => {
    return value?.startsWith('ENC:') || false;
  }, []);

  // Mask sensitive data based on clearance
  const maskSensitive = useCallback(
    (value: string, requiredClearance: ClearanceLevel): string => {
      if (!value) return '';
      if (hasClearance(requiredClearance)) return value;
      
      // Mask based on data type detection
      if (value.includes('@')) {
        // Email
        const [local, domain] = value.split('@');
        return `${local.slice(0, 2)}***@${domain}`;
      }
      if (/^\d+$/.test(value.replace(/\D/g, ''))) {
        // Number (phone, account, etc.)
        return `***${value.slice(-4)}`;
      }
      // Generic masking
      if (value.length > 6) {
        return `${value.slice(0, 3)}***${value.slice(-3)}`;
      }
      return '***';
    },
    [hasClearance]
  );

  // Get display value (decrypted if possible, masked if not)
  const getDisplayValue = useCallback(
    async (
      value: string,
      tableName: string,
      columnName: string,
      requiredClearance: ClearanceLevel
    ): Promise<string> => {
      if (!value) return '';
      
      // Check clearance first
      if (!hasClearance(requiredClearance)) {
        return maskSensitive(value, requiredClearance);
      }
      
      // Decrypt if encrypted
      if (isEncrypted(value)) {
        const decrypted = await decryptField(value, tableName, columnName);
        return decrypted || '[DECRYPTION FAILED]';
      }
      
      return value;
    },
    [hasClearance, isEncrypted, decryptField, maskSensitive]
  );

  return {
    encryptField,
    decryptField,
    isEncrypted,
    maskSensitive,
    getDisplayValue,
    isEncrypting,
    isDecrypting,
    currentClearance,
  };
}
