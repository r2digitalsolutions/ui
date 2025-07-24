import type { ClassValue } from "svelte/elements";

export type Type =
  | 'email'
  | 'password'
  | 'text'
  | 'tel'
  | 'number'
  | 'time'
  | 'url'
  | 'search'
  | 'date'
  | 'datetime-local'
  | 'color'
  | 'file';

interface Base<TValue = unknown> {
  autocomplete?: 'on' | 'off';
  name?: string;
  placeholder?: string;
  class?: ClassValue;
  required?: boolean;
  readonly?: boolean;
  autofocus?: boolean;
  value?: TValue;
  onchange?: (value: TValue, e: Event) => void;
  onkeydown?: (e: KeyboardEvent) => void;
  onkeyup?: (e: KeyboardEvent) => void;
  onclick?: (e: MouseEvent) => void;
  onfocus?: (e: FocusEvent) => void;
  onblur?: (e: FocusEvent) => void;
  oninput?: (e: Event & { currentTarget: HTMLInputElement }) => void;
}

export interface ITextInputProps extends Base<string | null> {
  type: 'text';
  minlength?: number;
  maxlength?: number;
}

export interface IUrlInputProps extends Base<string | null> {
  type: 'url' | 'search';
}

export interface IEmailInputProps extends Base<string | null> {
  type: 'email';
}

export interface IPasswordInputProps extends Base<string | null> {
  type: 'password';
}

export interface INumberInputProps extends Base<number | null> {
  type: 'number';
  min?: number;
  max?: number;
  step?: number;
}

export interface ITelInputProps extends Base<string | null> {
  type: 'tel';
}

export interface ITimeInputProps extends Base<string | null> {
  type: 'time';
}

export interface IFileInputProps extends Base<File | null> {
  type: 'file';
  accept?: string;
  multiple?: boolean;
}

export interface IDateInputProps extends Base<string | null> {
  type: 'date' | 'datetime-local';
}

export interface IColorInputProps extends Base<string | null> {
  type: 'color';
}

export type Props =
  | ITextInputProps
  | IUrlInputProps
  | IEmailInputProps
  | IPasswordInputProps
  | INumberInputProps
  | ITelInputProps
  | ITimeInputProps
  | IFileInputProps
  | IColorInputProps
  | IDateInputProps;

export type InputTypeValueMap = {
  text: string;
  url: string;
  search: string;
  email: string;
  password: string;
  tel: number;
  number: number;
};

export type ValueFromType<T extends keyof InputTypeValueMap> = InputTypeValueMap[T];
