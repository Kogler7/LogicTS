/**
* Copyright (c) 2022 Beijing Jiaotong University
* PhotLab is licensed under [Open Source License].
* You can use this software according to the terms and conditions of the [Open Source License].
* You may obtain a copy of [Open Source License] at: [https://open.source.license/]
* 
* THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
* EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
* MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
* 
* See the [Open Source License] for more details.
* 
* Author: Zhenjie Wei
* Created: Aug. 3, 2023
* Supported by: National Key Research and Development Program of China
*/

import LogicCore from "../core"
import { IObjectArena, QueryObjectArena } from "@/logic/arena/arena"
import { Point, Rect } from "@/logic/common/types2D"
import { ISelectable } from "../mixins/selectable"
import { IMovable } from "../mixins/movable"
import { IResizable } from "../mixins/resizable"
import { uid } from "@/logic/common/uid"
import { TrapSet } from "../common/types"

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

    private _selectableObjects: Map<uid, ISelectable> = new Map()
    private _selectedObjects: TrapSet<ISelectable> = new TrapSet(
        ((obj: ISelectable) => {
            // if the object is newly selected and enabled, notify it
            if (obj.enabled) {
                obj.selected = true
                obj.onSelected()
                this._core.fire('select.logic-changed')
            }
        }).bind(this),
        ((obj: ISelectable) => {
            // if the object is newly deselected, notify it
            obj.selected = false
            obj.onDeselected()
            this._core.fire('select.logic-changed')
        }).bind(this)
    )

    private _movableObjects: Map<uid, IMovable> = new Map()
    private _movingObjects: Set<IMovable> = new Set()

    private _resizableObjects: Map<uid, IResizable> = new Map()
    private _resizingObjects: Set<IResizable> = new Set()

    private _ctrlDown: boolean = false

    private _oldFrameLogicRect: Rect = Rect.zero()
    private _oldFramedObjectIds: Set<uid> = new Set()

    // make sure the context of these functions is ObjectHandler
    private _handleMouseDown = this._onMousePressedBackground.bind(this)
    private _handleMouseMove = this._onMouseMove.bind(this)
    private _handleMouseUp = this._onMouseUp.bind(this)

    public get selectedObjects(): Set<ISelectable> {
        return this._selectedObjects.set
    }

    public get recentSelectedObject(): ISelectable | null {
        if (this._recentSelectedId) {
            return this._selectableObjects.get(this._recentSelectedId) || null
        }
        return null
    }

    constructor(core: LogicCore) {
        this._core = core
        // register mouse down event listener to the bottom of the event stack
        // if this callback is fired, it means that no object is selected
        core.on('mousedown', false, this._handleMouseDown, -Infinity)
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
                    } else {
                        if (!this._ctrlDown) {
                            // if ctrl is not pressed, clear the selected objects first
                            this._clearSelectedObjects(obj)
                        }
                        // if the object is not selected, select it
                        if (!alreadySelected) {
                            this._recentSelectedId = hitId
                            this._selectedObjects.add(obj)
                        }
                    }
                    if (obj.selected) {
                        // if the selected object is movable and enabled,
                        // we add it to the selected movable objects
                        if (this._movableObjects.has(hitId)) {
                            this._movingObjects.add(obj as IMovable)
                        }
                        // if the selected object is resizable and enabled,
                        // and it's the only one selected object,
                        // we add it to the selected resizable objects
                        if (this._resizableObjects.has(hitId) && this._selectedObjects.size === 1) {
                            this._resizingObjects.add(obj as IResizable)
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
        // register frame begin event listener to the core
        core.on('frame.begin', true, ((e: MouseEvent) => {
            // clear all selected objects
            this._clearSelectedObjects()
            // reset the old frame logic rect
            this._oldFrameLogicRect = Rect.zero()
        }).bind(this))
        // register logic frame change event listener to the core
        core.on('frame.change', true, ((oldRect: Rect, newRect: Rect) => {
            // when the logic frame changes, we need to update the selected objects
            // we need to find the objects that are newly selected and deselected
            // first we compare the old frame logic rect cached and provided by the core
            if (!this._oldFrameLogicRect.equals(oldRect)) {
                // if the old frame logic rect is not the same as the cached one
                // recalculate the old framed object ids
                this._oldFramedObjectIds = this._logicArena.rectOccupiedSet(oldRect, -1, true)
            }
            // then we calculate the new framed object ids
            const newFramedObjectIds = this._logicArena.rectOccupiedSet(newRect, -1, true)
            // find the newly selected objects
            for (const id of newFramedObjectIds) {
                if (!this._oldFramedObjectIds.has(id)) {
                    const obj = this._selectableObjects.get(id)
                    if (obj) {
                        this._selectedObjects.add(obj)
                    }
                }
            }
            // find the newly deselected objects
            for (const id of this._oldFramedObjectIds) {
                if (!newFramedObjectIds.has(id)) {
                    const obj = this._selectableObjects.get(id)
                    if (obj) {
                        this._selectedObjects.delete(obj)
                    }
                }
            }
        }).bind(this))
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
        console.warn('object registration failed.')
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

    public setSelectable(obj: ISelectable, selectable: boolean) {
        if (selectable) {
            this._selectableObjects.set(obj.id, obj)
        } else {
            this._selectableObjects.delete(obj.id)
        }
    }

    public setMovable(obj: IMovable, movable: boolean) {
        if (movable) {
            this._movableObjects.set(obj.id, obj)
        } else {
            this._movableObjects.delete(obj.id)
        }
    }

    public setResizable(obj: IResizable, resizable: boolean) {
        if (resizable) {
            this._resizableObjects.set(obj.id, obj)
        } else {
            this._resizableObjects.delete(obj.id)
        }
    }

    private _clearSelectedObjects(except: ISelectable | null = null) {
        for (const obj of this._selectedObjects.set) {
            if (obj === except) {
                continue
            }
            obj.selected = false
            obj.onDeselected()
        }
        this._selectedObjects.clear()
        if (except) {
            this._selectedObjects.add(except)
        }
        this._recentSelectedId = null
        this._core.fire('select.logic-changed')
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

    private _onMousePressedBackground(e: MouseEvent) {
        if (e.button === 0) {
            // clear all selected objects
            this._clearSelectedObjects()
            // clear non-logic selected object
            this._clearNonLogicSelectedObject()
        }
    }

    private _onMouseMove(e: MouseEvent) { }

    private _onMouseUp(e: MouseEvent) { }
}