import { Rect } from "@/common/types2D"

export interface IRenderable {
    rect: Rect
    render(ctx: CanvasRenderingContext2D): void
}
