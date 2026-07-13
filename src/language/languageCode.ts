/** A normalized (trimmed, lower-cased) language code. */
export class LanguageCode {
  readonly value: string;

  constructor(value: string) {
    this.value = LanguageCode.normalize(value);
  }

  static normalize(code: string): string {
    return code.trim().toLowerCase();
  }

  equals(other: LanguageCode): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
