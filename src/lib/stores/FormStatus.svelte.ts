type BuiltinFormTypes =
  | 'delete' | 'duplicate' | 'change_status' | 'preview'
  | 'download' | 'create' | 'update' | 'error';

type ActionKeys<P extends Record<string, any>> =
  keyof P | BuiltinFormTypes;

type Payloads<P extends Record<string, any>> = {
  [K in ActionKeys<P>]: K extends keyof P ? P[K] : unknown;
};

export interface IFormStatusStore<P extends Record<string, any> = {}> {
  open<K extends ActionKeys<P>>(
    ...args: Payloads<P>[K] extends void ? [type: K] : [type: K, data: Payloads<P>[K]]
  ): void;
  close(): void;
  readonly type: ActionKeys<P> | null;
  readonly data: Payloads<P>[ActionKeys<P>] | null;
  readonly isOpen: boolean;

  is<K extends ActionKeys<P>>(type: K): this is { type: K; data: Payloads<P>[K] };
  isSome<K extends ActionKeys<P>>(type: K[]): this is { type: K; data: Payloads<P>[K] };
  isNone<K extends ActionKeys<P>>(type: K[]): this is { type: K; data: Payloads<P>[K] };
  match<R>(
    handlers: Partial<{ [K in ActionKeys<P>]: (data: Payloads<P>[K]) => R }> & { _: () => R }
  ): R;
  get<K extends keyof P>(type: K): P[K] | undefined;
  expect<K extends keyof P>(type: K, msg?: string): P[K];
  select<K extends keyof P, R>(
    type: K,
    map: (data: P[K]) => R,
    fallback?: R
  ): R | undefined;
}

export class StoreFormStatus<P extends Record<string, any> = {}> implements IFormStatusStore<P> {
  #type = $state<ActionKeys<P> | null>(null);
  #data = $state<Payloads<P>[ActionKeys<P>] | null>(null);

  open<K extends ActionKeys<P>>(
    ...args: Payloads<P>[K] extends void ? [type: K] : [type: K, data: Payloads<P>[K]]
  ) {
    const [type, maybeData] = args as [K, any];
    this.#type = type as any;
    this.#data = (maybeData ?? null) as any;
  }

  close = () => {
    this.#type = null;
    this.#data = null;
  }

  get type() { return this.#type; }
  get data() { return this.#data; }
  get isOpen() { return this.#type !== null; }

  is<K extends ActionKeys<P>>(type: K): this is { type: K; data: Payloads<P>[K] } {
    return this.#type === (type as any);
  }

  isSome<K extends ActionKeys<P>>(type: K[]): this is { type: K; data: Payloads<P>[K] } {
    return this.#type !== null && type.includes(this.#type as any);
  }

  isNone<K extends ActionKeys<P>>(type: K[]): this is { type: K; data: Payloads<P>[K] } {
    return this.#type === null || !type.includes(this.#type as any);
  }

  match<R>(
    handlers: Partial<{ [K in ActionKeys<P>]: (data: Payloads<P>[K]) => R }> & { _: () => R }
  ): R {
    if (!this.isOpen || this.#type === null) return handlers._();
    const fn = handlers[this.#type as ActionKeys<P>];
    return fn ? fn(this.#data as any) : handlers._();
  }

  get<K extends keyof P>(type: K): P[K] | undefined {
    return this.#type === (type as any)
      ? ((this.#data ?? undefined) as P[K] | undefined)
      : undefined;
  }

  expect<K extends keyof P>(type: K, msg = `Expected state '${String(type)}'`): P[K] {
    const value = this.get(type);
    if (value === undefined) throw new Error(msg);
    return value;
  }

  select<K extends keyof P, R>(
    type: K,
    map: (data: P[K]) => R,
    fallback?: R
  ): R | undefined {
    return this.#type === (type as any) ? map(this.#data as P[K]) : fallback;
  }
}
