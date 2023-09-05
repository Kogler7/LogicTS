import LogicCore from "../core"
import { IObjectArena, QueryObjectArena } from "@/logic/arena/arena"
import { Point, Rect } from "@/common/types2D"
import { ISelectable } from "../mixins/selectable"
import { IMovable } from "../mixins/movable"
import { IResizable } from "../mixins/resizable"
import { uid } from "@/common/uid"

export interface IObject {
    id: uid
    core: LogicCore | null
    rect: Rect
    level: number
    onRegistered(core: LogicCore): void
}

export class ObjectHandler {
    private _core: LogicCore
    private _arenas: Map<uid, IObjectArena> = new Map()
    private _objects: Map<uid, IObject> = new Map()
    private _callbacks: Map<uid, (e: MouseEvent) => boolean> = new Map()
    private _logicArena: IObjectArena = new QueryObjectArena()
    private _recentSelectedId: uid | null = null
    private _recentSelectedNonLogicId: uid | null = null
    private _selectedObjects: Set<ISelectable> = new Set()

    private _selectableObjects: Map<uid, ISelectable> = new Map()
    private _movableObjects: Map<uid, IMovable> = new Map()
    private _resizableObjects: Map<uid, IResizable> = new Map()

    private _framing: boolean = false
    private _ctrlDown: boolean = false

    constructor(core: LogicCore) {
        this._core = core
        // register mouse down event listener to the bottom of the event stack
        // if this callback is fired, it means that no object is selected
        core.on('mousedown', false, this._onMouseDown.bind(this), -Infinity)
        // register level 0 arena callback event listener to the core
        this._arenas.set(0, this._logicArena)
        const level0cbk = ((e: MouseEvent) => {
            // the logic arena stores objects with logic coordinates
            // so we need to convert the mouse position to logic coordinates first
            const hitPos = core.pos2crd(new Point(e.offsetX, e.offsetY))
            // check if the mouse position is occupied by an object
            const hitId = this._logicArena.posOccupied(hitPos)
            if (hitId) {
                // check if the object is selectable
                // and if it is, check if it is enabled
                const obj = this._selectableObjects.get(hitId)
                if (obj && obj.enabled) {
                    const alreadySelected = this._selectedObjects.has(obj)
                    // if the object is selectable and enabled, try select it
                    if (this._ctrlDown && alreadySelected) {
                        // if ctrl is pressed and the object is already selected, deselect it
                        this._recentSelectedId = null
                        this._selectedObjects.delete(obj)
                        obj.selected = false
                        obj.onDeselected()
                    } else {
                        if (!this._ctrlDown) {
                            // if ctrl is not pressed, clear the selected objects first
                            this._clearSelectedObjects(obj)
                        }
                        // if the object is not selected, select it
                        if (!alreadySelected) {
                            this._recentSelectedId = hitId
                            this._selectedObjects.add(obj)
                            obj.selected = true
                            obj.onSelected()
                        }
                    }
                    this._clearNonLogicSelectedObject()
                    // if an selectable object is hit, return false to stop the event going down
                    return false
                }
            }
        }).bind(this)
        core.on('mousedown', false, level0cbk, 0)
        // register ctrl key event listener to the core(level 0)
        core.on('keydown', false, ((e: KeyboardEvent) => {
            if (e.key === 'Control') {
                this._ctrlDown = true
            }
        }).bind(this), 0)
        core.on('keyup', false, ((e: KeyboardEvent) => {
            if (e.key === 'Control') {
                this._ctrlDown = false
            }
        }).bind(this), 0)
    }

    public get logicArena(): IObjectArena {
        return this._logicArena
    }

    private _addSelectSupportForLevel(level: number) {
        if (level === 0) {
            console.error('level 0 arena already exists.')
        }
        if (!this._arenas.has(level)) {
            // if the object is in a new level, create a new arena for it
            // and register callback event listener for that level to the core
            const arena = new QueryObjectArena()
            this._arenas.set(level, arena)
            // register callback event listener to the core
            const cbk = ((e: MouseEvent) => {
                // we assume that all objects use device coordinates except objects in level 0
                const hitPos = new Point(e.offsetX, e.offsetY)
                const hitId = arena.posOccupied(hitPos)
                if (hitId) {
                    // check if the object is selectable
                    // and if it is, check if it is enabled
                    const obj = this._selectableObjects.get(hitId)
                    if (obj && obj.enabled) {
                        this._recentSelectedNonLogicId = hitId
                        obj.selected = true
                        obj.onSelected()
                    }
                    // if an object is hit, return false to stop the event going down
                    return false
                }
                return true
            }).bind(this)
            this._callbacks.set(level, cbk)
            this._core.on('mousedown', false, cbk, level)
        }
    }

    private _delSelectSupportForLevel(level: number) {
        if (level === 0) {
            console.error('cannot delete level 0 arena.')
            return
        }
        if (this._arenas.has(level)) {
            this._arenas.delete(level)
            const cbk = this._callbacks.get(level)
            if (cbk) {
                this._core.off('mousedown', false, cbk)
                this._callbacks.delete(level)
            }
        }
    }

    public getArena(level: number): IObjectArena {
        if (!this._arenas.has(level)) {
            this._addSelectSupportForLevel(level)
        }
        return this._arenas.get(level) as IObjectArena
    }

    public addObject(obj: IObject): boolean {
        const level = obj.level
        if (!this._arenas.has(level)) {
            this._addSelectSupportForLevel(level)
        }
        // if the object is already registered, return false
        const success = this._arenas.get(level)!.addObject(obj.id, obj.rect)
        if (success) {
            this._objects.set(obj.id, obj)
            obj.core = this._core
            obj.onRegistered(this._core)
            return true
        }
        return false
    }

    public delObject(obj: IObject): boolean {
        const level = obj.level
        if (!this._arenas.has(level)) {
            return false
        }
        const arena = this._arenas.get(level)!
        const success = arena.delObject(obj.id)
        if (arena.empty) {
            // if the last object in the arena is deleted, delete the arena
            this._delSelectSupportForLevel(level)
        }
        return success
    }

    public setSelectable(obj: ISelectable, selectable: boolean) { }

    public setMovable(obj: IMovable, movable: boolean) { }

    public setResizable(obj: IResizable, resizable: boolean) { }

    private _clearSelectedObjects(except: ISelectable | null = null) {
        for (const obj of this._selectedObjects) {
            if (obj === except) {
                continue
            }
            obj.selected = false
            obj.onDeselected()
        }
        this._selectedObjects.clear()
        this._recentSelectedId = null
    }

    private _clearNonLogicSelectedObject() {
        if (this._recentSelectedNonLogicId) {
            const obj = this._selectableObjects.get(this._recentSelectedNonLogicId)
            if (obj) {
                obj.selected = false
                obj.onDeselected()
            }
            this._recentSelectedNonLogicId = null
        }
    }

    private _onMouseDown(e: MouseEvent) {
        if (this._framing) {
            return
        }
        // clear all selected objects
        this._clearSelectedObjects()
        // clear non-logic selected object
        this._clearNonLogicSelectedObject()
        // this._core.on('mousemove', false, this._onMouseMove)
        // this._core.on('mouseup', false, this._onMouseUp)
    }

    private _onMouseMove(e: MouseEvent) { }

    private _onMouseUp(e: MouseEvent) {
        if (this._framing) {
            this._framing = false
            return
        }
    }
}