export class ModalContext {
	#open = $state<boolean>(false);
	#is_minimized = $state<boolean>(false);
	#is_maximized = $state<boolean>(false);
	#ref_dialog = $state<HTMLDialogElement>();

	constructor(initialOpen = false) {
		this.#open = initialOpen;

		$effect(() => {
			if (this.#open) {
				this.#ref_dialog?.showModal();
			} else {
				this.#ref_dialog?.close();
			}
		});
	}

	onclose() {
		this.#open = false;
		this.#ref_dialog?.close();
	}

	onRequestMinimize() {
		this.#is_minimized = !this.#is_minimized;
	}

	onRequestMaximize() {
		this.#is_maximized = !this.#is_maximized;
	}

	get open() {
		return this.#open;
	}

	set open(value: boolean) {
		this.#open = value;
	}

	get ref_dialog() {
		return this.#ref_dialog;
	}

	get is_minimized() {
		return this.#is_minimized;
	}

	get is_maximized() {
		return this.#is_maximized;
	}

	set ref_dialog(value: HTMLDialogElement | undefined) {
		this.#ref_dialog = value;

		if (value) {
			value.showModal();
		}
	}
}
