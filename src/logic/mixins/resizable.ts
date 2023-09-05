import { Rect } from "@/common/types2D"

export interface IResizable {
    rect: Rect
    onResize(): void
}