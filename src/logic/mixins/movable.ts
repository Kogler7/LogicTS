import { Point, Rect } from "@/common/types2D"
import { ISelectable } from "./selectable"

export interface IMovable extends ISelectable {
    rect: Rect
    onMove(oldPos: Point, newPos: Point): void
}