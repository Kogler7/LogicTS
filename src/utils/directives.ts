import { Directive } from "vue";
import { Point } from "./types2D";

export const sizeable: Directive = {
	mounted(el: HTMLElement, binding: any) {
		const sizeMousemove = (e: MouseEvent) => {
			const { clientX, clientY } = e;
			const { left, top } = el.getBoundingClientRect();
			const width = clientX - left;
			const height = clientY - top;
			el.style.width = width + "px";
			el.style.height = height + "px";
			e.stopPropagation();
		};
		const sizeMouseup = () => {
			el.removeEventListener("mousemove", sizeMousemove);
			el.removeEventListener("mouseup", sizeMouseup);
		};
		const sizeMousedown = (e: MouseEvent) => {
			e.preventDefault();
			el.addEventListener("mousemove", sizeMousemove);
			el.addEventListener("mouseup", sizeMouseup);
			e.stopPropagation();
		};
		el.addEventListener("mousedown", sizeMousedown);
		let sheet = el.style;
		sheet.border = "5px solid";
		sheet.borderColor = "rgba(0, 255, 255, 0.5)";
	}
};

export const draggable: Directive = {
	mounted(el: HTMLElement, binding: any) {
		let move: (pos: Point) => void = binding.value?.on_move;
		let offset: Point = Point.zero();
		let button: number = binding.value?.button ?? 0;
		let enable: boolean;
		if (binding.value?.offset) {
			offset = binding.value.offset;
		}
		let disX = 0;
		let disY = 0;
		const dragMousemove = (e: MouseEvent) => {
			// console.log(el.style.cursor);
			if (!enable) {
				return;
			}
			el.style.left = e.clientX - disX - offset.x + "px";
			el.style.top = e.clientY - disY - offset.y + "px";
			if (move) {
				move(new Point(e.clientX - disX - offset.x, e.clientY - disY - offset.y));
			}
			e.stopPropagation();
		}
		const dragMouseup = () => {
			console.log("mouseup");
			el.style.cursor = "default";
			
			el.removeEventListener("mousemove", dragMousemove);
			el.removeEventListener("mouseup", dragMouseup);
		}
		const dragMousedown = (e: MouseEvent) => {
			enable = binding.value?.enable ?? true;
			console.log("mousedown", enable);
			e.stopPropagation();
			if (e.button !== button) {
				return;
			}
			if (binding.value?.cursor) {
				el.style.cursor = binding.value.cursor;
				console.log("cursor", binding.value.cursor);
			}
			disX = e.clientX - el.offsetLeft;
			disY = e.clientY - el.offsetTop;
			el.addEventListener("mousemove", dragMousemove);
			el.addEventListener("mouseup", dragMouseup);
		}
		el.addEventListener("mousedown", dragMousedown);
	},
}