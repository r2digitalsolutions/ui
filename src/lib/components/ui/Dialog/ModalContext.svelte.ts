export class ModalContext {
	#open = $state<boolean>(false);
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

	get open() {
		return this.#open;
	}

	set open(value: boolean) {
		this.#open = value;
	}

	get ref_dialog() {
		return this.#ref_dialog;
	}

	set ref_dialog(value: HTMLDialogElement | undefined) {
		this.#ref_dialog = value;

		if (value) {
			value.showModal();
		}
	}
}
