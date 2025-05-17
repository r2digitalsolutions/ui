import type { I18nTranslationType } from '$lib/types/translates.type.js';
import { describe, it, expect, beforeEach } from 'vitest';
import { StoreI18n } from './I18n.svelte.js';

const translations: I18nTranslationType = {
  es: {
    "dashboard.title": "Dashboard",
    common: {
      logout: "Cerrar sesión",
      hello: "Hola {name}"
    },
    menu: {
      settings: "Configuración",
      items: "Anuncios"
    },
    menu_admin: {
      languages: "Idiomas"
    }
  },
  en: {
    common: {
      logout: "Log out",
      hello: "Hello {name}"
    }
  }
};

describe('StoreI18n', () => {
  let i18n: StoreI18n;

  beforeEach(() => {
    i18n = new StoreI18n("es", translations);
  });

  it('debe inicializar con idioma y traducciones correctamente', () => {
    expect(i18n.language).toBe("es");
    expect(i18n.translations).toEqual(translations);
  });

  it('traduce claves simples correctamente', () => {
    expect(i18n.t("dashboard.title")).toBe("Dashboard");
    expect(i18n.t("common.logout")).toBe("Cerrar sesión");
    expect(i18n.t("common.hello", { name: "Rafa" })).toBe("Hola Rafa");
  });

  it('traduce claves anidadas correctamente', () => {
    expect(i18n.t("common.logout")).toBe("Cerrar sesión");
    expect(i18n.t("menu.settings")).toBe("Configuración");
    expect(i18n.t("menu_admin.languages")).toBe("Idiomas");
  });

  it('retorna fallback si la clave no existe', () => {
    expect(i18n.t("menu.inexistente")).toBe("--menu.inexistente--");
    expect(i18n.t("otra.cosa")).toBe("--otra.cosa--");
  });

  it('reemplaza parámetros correctamente', () => {
    expect(i18n.t("common.hello", { name: "Rafa" })).toBe("Hola Rafa");
  });

  it('soporta cambio de idioma dinámicamente', () => {
    i18n.language = "en";
    expect(i18n.language).toBe("en");
    expect(i18n.t("common.logout")).toBe("Log out");
  });

  it('soporta actualización de traducciones con el setter', () => {
    const nuevasTraducciones: I18nTranslationType = {
      fr: { common: { logout: "Se déconnecter" } }
    };
    i18n.language = "fr";
    i18n.translations = nuevasTraducciones;
    expect(i18n.t("common.logout")).toBe("Se déconnecter");
  });

  it('retorna fallback si la traducción no es un string', () => {
    const weirdTranslations: I18nTranslationType = {
      es: { common: { logout: 1234 as any } }
    };
    i18n.translations = weirdTranslations;
    expect(i18n.t("common.logout")).toBe("--common.logout--");
  });

  it('retorna fallback si la clave tiene un path roto', () => {
    expect(i18n.t("menu.settings.subitem")).toBe("--menu.settings.subitem--");
  });
});
