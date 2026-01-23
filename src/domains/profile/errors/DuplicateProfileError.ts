/**
 * Duplicate Profile Error
 * Thrown when attempting to create a profile that already exists
 */

export class DuplicateProfileError extends Error {
  public readonly existingProfileId: string;

  constructor(message: string, existingProfileId: string) {
    super(message);
    this.name = 'DuplicateProfileError';
    this.existingProfileId = existingProfileId;
  }
}
