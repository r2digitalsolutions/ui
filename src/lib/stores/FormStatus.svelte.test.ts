import { describe, expect, it } from "vitest";
import { StoreFormStatus } from "./FormStatus.svelte.js";

describe('StoreFormStatus', () => {
  it('debe inicializar con un tipo de formulario y datos', () => {
    const store = new StoreFormStatus();
    expect(store.type).toBe(null);
    expect(store.data).toBe(null);
    expect(store.isOpen).toBe(false);
  });

  it('debe abrir el formulario con un tipo de formulario y datos', () => {
    const store = new StoreFormStatus();
    store.open('delete', { id: 1 });
    expect(store.type).toBe('delete');
    expect(store.data).toEqual({ id: 1 });
    expect(store.isOpen).toBe(true);
  });

  it('debe cerrar el formulario', () => {
    const store = new StoreFormStatus();
    store.open('delete', { id: 1 });
    expect(store.type).toBe('delete');
    expect(store.data).toEqual({ id: 1 });
    expect(store.isOpen).toBe(true);
    store.close();
    expect(store.type).toBe(null);
    expect(store.data).toBe(null);
    expect(store.isOpen).toBe(false);
  });

  it('debe verificar si el formulario es de un tipo determinado', () => {
    const store = new StoreFormStatus();
    store.open('delete', { id: 1 });
    expect(store.is('delete')).toBe(true);
    expect(store.isSome(['delete', 'change_status'])).toBe(true);
    expect(store.isNone(['delete', 'change_status', 'preview'])).toBe(false);
  });

  it('debe verificar si el formulario es de algunos tipos determinados', () => {
    const store = new StoreFormStatus();
    store.open('delete', { id: 1 });
    expect(store.isSome(['delete', 'change_status'])).toBe(true);
    expect(store.isSome(['delete', 'preview'])).toBe(true);
    expect(store.isNone(['delete', 'change_status', 'preview'])).toBe(false);
  });

  it('debe devolver el tipo de formulario', () => {
    const store = new StoreFormStatus();
    store.open('delete', { id: 1 });
    expect(store.type).toBe('delete');
  });
});