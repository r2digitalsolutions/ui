export type NestedTranslations = string | { [key: string]: NestedTranslations };
export type I18nTranslationType = Record<string, NestedTranslations>;