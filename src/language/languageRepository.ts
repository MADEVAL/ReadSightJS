import { Language } from "./language.js";

/** Abstract repository for loading `Language` definitions. */
export interface LanguageRepository {
  find(languageCode: string): Language;
  listCodes(): string[];
  exists(languageCode: string): boolean;
}
