// WhatsApp media filename patterns and utilities

export interface MediaReference {
  filename: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'sticker';
  extension: string;
}

// WhatsApp media filename patterns:
// IMG-YYYYMMDD-WAXXXX.jpg/jpeg - Images
// VID-YYYYMMDD-WAXXXX.mp4 - Videos
// PTT-YYYYMMDD-WAXXXX.opus - Voice notes (Push-to-Talk)
// AUD-YYYYMMDD-WAXXXX.opus/mp3 - Audio files
// DOC-YYYYMMDD-WAXXXX.* - Documents
// STK-YYYYMMDD-WAXXXX.webp - Stickers

const MEDIA_PATTERNS = {
  image: /^IMG-\d{8}-WA\d{4,}\.(jpg|jpeg|png|gif|webp)$/i,
  video: /^VID-\d{8}-WA\d{4,}\.(mp4|3gp|mov)$/i,
  audio: /^(PTT|AUD)-\d{8}-WA\d{4,}\.(opus|mp3|m4a|ogg|wav)$/i,
  document: /^DOC-\d{8}-WA\d{4,}\.(.+)$/i,
  sticker: /^STK-\d{8}-WA\d{4,}\.webp$/i,
};

// Pattern to detect media reference in message text
// e.g., "IMG-20240115-WA0001.jpg (file attached)" or "<attached: IMG-20240115-WA0001.jpg>"
const MEDIA_IN_MESSAGE_PATTERNS = [
  /(IMG|VID|PTT|AUD|DOC|STK)-\d{8}-WA\d{4,}\.[a-z0-9]+/gi,
  /<attached:\s*([^>]+)>/gi,
  /([A-Za-z0-9_-]+\.(jpg|jpeg|png|gif|mp4|mp3|opus|pdf|doc|docx|xls|xlsx|webp))\s*\(file attached\)/gi,
  /‎?([A-Za-z0-9_-]+\.(jpg|jpeg|png|gif|mp4|mp3|opus|pdf|doc|docx|xls|xlsx|webp))/gi,
];

// System messages to skip
const SYSTEM_MESSAGE_PATTERNS = [
  /^Messages and calls are end-to-end encrypted/i,
  /^This message was deleted/i,
  /^<Media omitted>/i,
  /^media omitted$/i,
  /^You deleted this message/i,
  /^Missed voice call/i,
  /^Missed video call/i,
  /^\u200E/,  // Left-to-right mark (system messages)
];

export function getMediaType(filename: string): MediaReference['type'] | null {
  const lowerFilename = filename.toLowerCase();
  
  if (MEDIA_PATTERNS.image.test(filename) || /\.(jpg|jpeg|png|gif)$/i.test(filename)) {
    return 'image';
  }
  if (MEDIA_PATTERNS.video.test(filename) || /\.(mp4|3gp|mov)$/i.test(filename)) {
    return 'video';
  }
  if (MEDIA_PATTERNS.audio.test(filename) || /\.(opus|mp3|m4a|ogg|wav)$/i.test(filename)) {
    return 'audio';
  }
  if (MEDIA_PATTERNS.sticker.test(filename)) {
    return 'sticker';
  }
  if (MEDIA_PATTERNS.document.test(filename) || /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt)$/i.test(filename)) {
    return 'document';
  }
  
  // Try to detect by extension
  const ext = lowerFilename.split('.').pop();
  if (ext) {
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
    if (['mp4', '3gp', 'mov', 'avi', 'mkv'].includes(ext)) return 'video';
    if (['opus', 'mp3', 'm4a', 'ogg', 'wav', 'aac'].includes(ext)) return 'audio';
    if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'].includes(ext)) return 'document';
  }
  
  return null;
}

export function extractMediaReference(messageContent: string): MediaReference | null {
  for (const pattern of MEDIA_IN_MESSAGE_PATTERNS) {
    const match = pattern.exec(messageContent);
    if (match) {
      const filename = match[1] || match[0];
      const cleanFilename = filename.replace(/[<>‎]/g, '').trim();
      const type = getMediaType(cleanFilename);
      if (type) {
        const extension = cleanFilename.split('.').pop()?.toLowerCase() || '';
        return { filename: cleanFilename, type, extension };
      }
    }
    // Reset pattern for next use
    pattern.lastIndex = 0;
  }
  return null;
}

export function cleanMessageContent(content: string): string {
  // Remove media attachment indicators
  let cleaned = content
    .replace(/\(file attached\)/gi, '')
    .replace(/<attached:\s*[^>]+>/gi, '')
    .replace(/(IMG|VID|PTT|AUD|DOC|STK)-\d{8}-WA\d{4,}\.[a-z0-9]+/gi, '')
    .replace(/‎/g, '')
    .trim();
  
  return cleaned || content;
}

export function isSystemMessage(content: string): boolean {
  return SYSTEM_MESSAGE_PATTERNS.some(pattern => pattern.test(content));
}

export function isMediaOmitted(content: string): boolean {
  return /<Media omitted>|media omitted/i.test(content);
}

export function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    mp4: 'video/mp4',
    '3gp': 'video/3gpp',
    mov: 'video/quicktime',
    opus: 'audio/opus',
    mp3: 'audio/mpeg',
    m4a: 'audio/mp4',
    ogg: 'audio/ogg',
    wav: 'audio/wav',
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    txt: 'text/plain',
  };
  return mimeTypes[ext || ''] || 'application/octet-stream';
}
