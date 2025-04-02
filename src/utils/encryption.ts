
/**
 * Encryption utilities for securing document content
 */

// Generate a random encryption key if not already in localStorage
const getEncryptionKey = (): string => {
  let key = localStorage.getItem('encryption_key');
  
  if (!key) {
    // Generate a random 256-bit key
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    key = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    localStorage.setItem('encryption_key', key);
  }
  
  return key;
};

// Convert string to ArrayBuffer
const str2ab = (str: string): ArrayBuffer => {
  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0; i < str.length; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
};

// Convert ArrayBuffer to string
const ab2str = (buf: ArrayBuffer): string => {
  return String.fromCharCode.apply(null, new Uint8Array(buf));
};

// Encrypt a string
export const encryptData = async (data: string): Promise<string> => {
  try {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    
    const key = await window.crypto.subtle.importKey(
      'raw',
      str2ab(getEncryptionKey()),
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );
    
    // Generate a random initialization vector
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    
    const encryptedData = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv
      },
      key,
      dataBuffer
    );
    
    // Combine the IV and encrypted data
    const result = new Uint8Array(iv.length + encryptedData.byteLength);
    result.set(iv);
    result.set(new Uint8Array(encryptedData), iv.length);
    
    // Convert to base64 for storage
    return btoa(ab2str(result));
  } catch (error) {
    console.error('Encryption error:', error);
    return data; // Fallback to unencrypted data
  }
};

// Decrypt a string
export const decryptData = async (encryptedData: string): Promise<string> => {
  try {
    const binaryData = str2ab(atob(encryptedData));
    
    // Extract the IV and the encrypted data
    const iv = binaryData.slice(0, 12);
    const data = binaryData.slice(12);
    
    const key = await window.crypto.subtle.importKey(
      'raw',
      str2ab(getEncryptionKey()),
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );
    
    const decryptedData = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: new Uint8Array(iv)
      },
      key,
      data
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decryptedData);
  } catch (error) {
    console.error('Decryption error:', error);
    return encryptedData; // Return the encrypted string if decryption fails
  }
};
