import { describe, expect, test } from 'vitest';
import { StoreI18n } from '$lib/index.js';

describe('StoreI18n', () => {
  test('should be set to en', () => {
    const store = new StoreI18n('en', {});
    expect(store.language).toEqual('en');
  });

  test('should be set to es', () => {
    const store = new StoreI18n('es', {});
    expect(store.language).toEqual('es');
  });

  test('translate should return the translation', () => {
    const store = new StoreI18n('en', {
      es: {
        hello: 'hola'
      },
      en: {
        hello: 'hello'
      }
    });

    expect(store.t('hello')).toEqual('hello');

    store.language = 'es';

    expect(store.t('hello')).toEqual('hola');
    expect(store.t('not-found')).toEqual('--not-found--');
  });

  test('should be able to init', () => {
    const store = new StoreI18n('en', {});

    store.init({
      language: 'es',
      translations: {
        es: {
          hello: 'hola'
        },
        en: {
          hello: 'hello'
        }
      }
    });

    expect(store.t('hello')).toEqual('hola');
  });
});