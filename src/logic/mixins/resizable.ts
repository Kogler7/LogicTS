import { Rect } from "@/common/types2D"
import { ISelectable } from "./selectable"

export enum AnchorLocation {
    None,
    Left,
    Top,
    Right,
    Bottom,
    LeftTop,
    RightTop,
    LeftBottom,
    RightBottom,
}

export interface IResizable extends ISelectable {
    rect: Rect
    onResize(): void
}