import type { I18nTranslationType } from "$lib/types/translates.type.js";

export class StoreI18n {
  #language: string = $state("en");
  #defaultLanguage: string = "en";
  #translations: I18nTranslationType = $state({});

  constructor(currentLanguage: string, translations: I18nTranslationType = {}) {
    this.#language = currentLanguage;
    this.#translations = translations;
  }

  t = $derived.by(() => {
    this.#language;
    this.#translations;

    return (key: string, params: Record<string, string> = {}) => {
      const translations = this.#translations?.[this.#language || this.#defaultLanguage];
      const translation = this.#getTranslationValue(translations, key);

      if (!translation || typeof translation !== "string") {
        return `--${key}--`;
      }

      return Object.entries(params).reduce((acc, [key, value]) => {
        return acc.replace(`{${key}}`, value);
      }, translation);
    };
  });

  init({ language, translations }: { language: string, translations: I18nTranslationType }) {
    this.#language = language;
    this.#translations = translations;
  }

  #getTranslationValue(translations: any, key: string): string | undefined {
    // Intentar primero como clave plana
    if (translations?.[key]) return translations[key];

    // Si no existe como clave plana, intentar lookup recursivo
    return key.split('.').reduce((acc, part) => acc?.[part], translations);
  }

  get language() {
    return this.#language;
  }

  set language(value: string) {
    this.#language = value;
  }

  get translations() {
    return this.#translations;
  }

  set translations(value: I18nTranslationType) {
    this.#translations = value;
  }
}
