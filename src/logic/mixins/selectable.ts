import { Rect } from "@/common/types2D"
import LogicCore from "../core"
import { IObject } from "../handlers/object"

export interface ISelectable extends IObject {
    enabled: boolean
    selected: boolean
    onSelected(): void
    onDeselected(): void
}

export class Selectable implements ISelectable {
    public id: number
    public core: LogicCore | null = null
    public rect: Rect
    public level: number
    public enabled: boolean = true
    public selected: boolean = false

    constructor(id: number, level: number, rect: Rect) {
        this.id = id
        this.level = level
        this.rect = rect
    }

    public onRegistered(core: LogicCore): void {
        core.setSelectable(this, true)
    }

    public onSelected(): void {
        // TODO
    }

    public onDeselected(): void {
        // TODO
    }
}