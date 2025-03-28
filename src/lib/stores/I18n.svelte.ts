import type { I18nTranslationType } from "$lib/types/translates.type.js";

export class StoreI18n {
  #language: string = $state("en");
  #translations: I18nTranslationType = $state({});

  constructor(currentLanguage: string, translations: I18nTranslationType = {}) {
    this.#language = currentLanguage;
    this.#translations = translations;
  }

  t = $derived.by(() => {
    this.#language;
    this.#translations;

    return (key: string, params: Record<string, string> = {}) => {
      const translations = this.#translations[this.#language];
      const translation = translations[key];

      if (!translation) {
        return `--${key}--`;
      }

      return Object.entries(params).reduce((acc, [key, value]) => {
        return acc.replace(`{${key}}`, value);
      }, translation);
    }
  })

  init({ language, translations }: { language: string, translations: I18nTranslationType }) {
    this.#language = language;
    this.#translations = translations;
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