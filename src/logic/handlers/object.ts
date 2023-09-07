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
    private _recentSelectedLogicId: uid | null = null
    private _recentSelectedNonLogicId: uid | null = null

    private _selectedLogicBoundRect: Rect = Rect.zero()
    private _selectableObjects: Map<uid, ISelectable> = new Map()
    private _selectedLogicObjects: TrapSet<ISelectable> = new TrapSet(
        this._onLogicObjectSelected.bind(this),
        this._onLogicObjectDeselected.bind(this),
        ((delta: number) => {
            if (delta <= 0) {
                // if there are objects deselected, we need to recalculate the select bound rect
                const rects = [...this._selectedLogicObjects.set].map((obj) => obj.rect)
                this._selectedLogicBoundRect = Rect.union(rects)
            }
            this._core.fire('select.logic-changed')
        }).bind(this)
    )

    private _movableObjects: Map<uid, IMovable> = new Map()
    private _movingLogicObjects: Set<IMovable> = new Set()
    private _movingLogicObjectStates: Map<uid, boolean> = new Map()
    private _movingNonLogicObject: IMovable | null = null
    private _movingNonLogicObjectState: boolean = false

    private _startMovingObjectPos: Point = Point.zero()
    private _readyToMoveLogicObjects: boolean = false
    private _isMovingLogicObjects: boolean = false
    private _readyToMoveNonLogicObjects: boolean = false
    private _isMovingNonLogicObjects: boolean = false

    private _resizableObjects: Map<uid, IResizable> = new Map()
    private _resizingLogicObject: IResizable | null = null
    private _resizingNonLogicObject: IResizable | null = null

    private _ctrlDown: boolean = false

    private _oldFramedLogicRect: Rect = Rect.zero()
    private _oldFramedLogicObjectIds: Set<uid> = new Set()

    private _boundRectPressed: boolean = false

    public get logicArena(): IObjectArena {
        return this._logicArena
    }

    public get movingLogicObjects(): Set<IMovable> {
        return this._movingLogicObjects
    }

    public get movingLogicObjectStates(): Map<uid, boolean> {
        return this._movingLogicObjectStates
    }

    public get selectedLogicObjects(): Set<ISelectable> {
        return this._selectedLogicObjects.set
    }

    public get selectedLogicBoundRect(): Rect {
        return this._selectedLogicBoundRect
    }

    public get recentSelectedLogicObject(): ISelectable | null {
        if (this._recentSelectedLogicId) {
            return this._selectableObjects.get(this._recentSelectedLogicId) || null
        }
        return null
    }

    constructor(core: LogicCore) {
        this._core = core
        this._arenas.set(0, this._logicArena)
        // register mouse down event listener to the bottom of the event stack
        // if this callback is fired, it means that no object is selected
        core.on('mousedown', false, this._onMousePressedBackground.bind(this), -Infinity)
        // register mouse down event listener to the top of the event stack
        core.on('mousedown', false, this._checkIfMousePressedBoundRect.bind(this), Infinity)
        // listen to mouse up event to stop moving objects
        core.on('mouseup', false, this._onMouseUp.bind(this), Infinity)
        // listen to mouse move event to move objects
        core.on('mousemove', false, this._onMouseMove.bind(this), Infinity)
        // register level 0 arena callback event listener to the core
        core.on('mousedown', false, this._onMousePressedLogicLevel.bind(this), 0)
        // register ctrl key event listener to the core(level 0)
        core.on('keydown.Control', true, (() => { this._ctrlDown = true }).bind(this), 0)
        core.on('keyup.Control', true, (() => { this._ctrlDown = false }).bind(this), 0)
        // register frame begin event listener to the core
        core.on('frame.begin', true, ((e: MouseEvent) => {
            // clear all selected objects
            this._selectedLogicObjects.clear()
            // reset the old frame logic rect
            this._oldFramedLogicRect = Rect.zero()
        }).bind(this))
        // register logic frame change event listener to the core
        core.on('frame.change', true, this._onLogicFrameRectChanged.bind(this))
    }

    private _onLogicFrameRectChanged(oldRect: Rect, newRect: Rect) {
        // when the logic frame changes, we need to update the selected objects
        // we need to find the objects that are newly selected and deselected
        // first we compare the old frame logic rect cached and provided by the core
        if (!this._oldFramedLogicRect.equals(oldRect)) {
            // if the old frame logic rect is not the same as the cached one
            // recalculate the old framed object ids
            this._oldFramedLogicObjectIds = this._logicArena.rectOccupiedSet(oldRect, -1, true)
        }
        // then we calculate the new framed object ids
        const newFramedObjectIds = this._logicArena.rectOccupiedSet(newRect, -1, true)
        // find the newly selected objects
        for (const id of newFramedObjectIds) {
            if (!this._oldFramedLogicObjectIds.has(id)) {
                const obj = this._selectableObjects.get(id)
                if (obj) {
                    this._selectedLogicObjects.add(obj)
                }
            }
        }
        // find the newly deselected objects
        for (const id of this._oldFramedLogicObjectIds) {
            if (!newFramedObjectIds.has(id)) {
                const obj = this._selectableObjects.get(id)
                if (obj) {
                    this._selectedLogicObjects.delete(obj)
                }
            }
        }
    }

    private _onLogicObjectSelected(obj: ISelectable) {
        // if the object is newly selected and enabled, notify it
        if (obj.enabled) {
            // if the selected object is movable and enabled,
            // we add it to the selected movable objects
            if (this._movableObjects.has(obj.id)) {
                this._movingLogicObjects.add(obj as IMovable)
            }
            // if the selected object is resizable and enabled,
            // and it's the only one selected object,
            // we set it as the resizing object
            if (this._resizableObjects.has(obj.id) && this._selectedLogicObjects.size === 1) {
                this._resizingLogicObject = obj as IResizable
            }
            // recalculate the select bound rect
            if (this._selectedLogicBoundRect.isZero()) {
                // zero rect represents no object selected
                // so we set the bound rect to the object's rect
                this._selectedLogicBoundRect = obj.rect
            } else {
                this._selectedLogicBoundRect = this._selectedLogicBoundRect.union(obj.rect)
            }
            // notify the object and the core
            this._recentSelectedLogicId = obj.id
            obj.selected = true
            obj.onSelected()
        }
    }

    private _onLogicObjectDeselected(obj: ISelectable) {
        // if the object is newly deselected, notify it
        // if the selected object is movable,
        // remove it from the selected movable objects
        if (this._movableObjects.has(obj.id)) {
            this._movingLogicObjects.delete(obj as IMovable)
        }
        // if the selected object is resizing,
        // set the resizing object to null
        if (this._resizingLogicObject === obj) {
            this._resizingLogicObject = null
        }
        // notify the object and the core
        if (this._recentSelectedLogicId === obj.id) {
            this._recentSelectedLogicId = null
        }
        obj.selected = false
        obj.onDeselected()
    }

    private _onMousePressedLogicLevel(e: MouseEvent) {
        const core = this._core
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
                const alreadySelected = this._selectedLogicObjects.has(obj)
                // if the object is selectable and enabled, try select it
                if (this._ctrlDown && alreadySelected) {
                    // if ctrl is pressed and the object is already selected, deselect it
                    this._selectedLogicObjects.delete(obj)
                } else {
                    if (!this._ctrlDown) {
                        // if ctrl is not pressed, clear the selected objects except the hit object
                        this._selectedLogicObjects.clear(obj)
                    }
                    this._selectedLogicObjects.add(obj)
                    // ready to move the selected logic objects
                    this._readyToMoveLogicObjects = true
                    this._readyToMoveNonLogicObjects = false
                    this._startMovingObjectPos = obj.rect.pos.copy()
                }
                this._clearSelectedNonLogicObject()
                // if an selectable object is hit, return false to stop the event going down
                return false
            }
        }
    }

    private _addSelectSupportForNonLogicLevel(level: number) {
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
                        // ready to move the selected non-logic object
                        this._readyToMoveLogicObjects = false
                        this._readyToMoveNonLogicObjects = true
                        this._movingNonLogicObject = obj as IMovable
                        this._startMovingObjectPos = obj.rect.pos.copy()
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

    private _delSelectSupportForNonLogicLevel(level: number) {
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

    private _clearSelectedNonLogicObject() {
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
        // if the left button is pressed on background, clear all selected objects
        if (e.button === 0) {
            // clear all selected objects
            this._selectedLogicObjects.clear()
            // clear non-logic selected object
            this._clearSelectedNonLogicObject()
        }
    }

    private _checkIfMousePressedBoundRect(e: MouseEvent) {
        // if the left button is pressed on the bound rect, start moving the selected objects
        if (e.button === 0) {
            const hitPos = this._core.pos2crd(new Point(e.offsetX, e.offsetY))
            if (this.selectedLogicBoundRect.containsPoint(hitPos)) {
                this._readyToMoveLogicObjects = true
                this._readyToMoveNonLogicObjects = false
                this._startMovingObjectPos = hitPos.copy()
                this._boundRectPressed = true
                // stop the event going down
                return false
            }
        }
    }

    private _onMouseUp(e: MouseEvent) {
        // if the left button is up, stop moving the selected objects
        if (this._readyToMoveLogicObjects) {
            if (this._isMovingLogicObjects) {
                this._isMovingLogicObjects = false
                for (const obj of this._movingLogicObjects) {
                    obj.onMoveEnd()
                }
                this._core.popCursor('move')
                this._core.fire('movobj.logic.end', e)
            }
            if (this._boundRectPressed) {
                this._boundRectPressed = false
                const hitPos = this._core.pos2crd(new Point(e.offsetX, e.offsetY))
                if (this._startMovingObjectPos.equals(hitPos)) {
                    // if the mouse didn't move before up,
                    // we pass the mouse down event to the logic level manually
                    if (this._logicArena.posOccupied(hitPos)) {
                        // if the mouse is up on a logic object, clear all selected objects
                        this._onMousePressedLogicLevel(e)
                    } else {
                        this._onMousePressedBackground(e)
                    }
                }
            }
            this._readyToMoveLogicObjects = false
        } else if (this._readyToMoveNonLogicObjects) {
            if (this._isMovingNonLogicObjects) {
                this._isMovingNonLogicObjects = false
                this._movingNonLogicObject!.onMoveEnd()
                this._core.popCursor('move')
                this._core.fire('movobj.non-logic.end', e)
            }
            this._readyToMoveNonLogicObjects = false
            this._movingNonLogicObject = null
            this._movingNonLogicObjectState = false
        }
    }

    private _onMouseMove(e: MouseEvent) {
        if (this._readyToMoveLogicObjects) {
            if (!this._isMovingLogicObjects) {
                this._isMovingLogicObjects = true
                for (const obj of this._movingLogicObjects) {
                    obj.onMoveBegin()
                }
                this._core.setCursor('move')
                this._core.fire('movobj.logic.begin', e)
            }
            const newPos = this._core.pos2crd(new Point(e.offsetX, e.offsetY))
            for (const obj of this._movingLogicObjects) {
                const accept = obj.onMoving(this._startMovingObjectPos, newPos)
                this._movingLogicObjectStates.set(obj.id, accept)
            }
            this._core.fire('movobj.logic.ing', this._startMovingObjectPos, newPos, e)
        } else if (this._readyToMoveNonLogicObjects) {
            if (!this._isMovingNonLogicObjects) {
                this._isMovingNonLogicObjects = true
                this._movingNonLogicObject!.onMoveBegin()
                this._core.setCursor('move')
                this._core.fire('movobj.non-logic.begin', e)
            }
            const newPos = new Point(e.offsetX, e.offsetY)
            const obj = this._movableObjects.get(this._recentSelectedNonLogicId!)
            if (obj) {
                const accept = obj.onMoving(this._startMovingObjectPos, newPos)
                this._movingNonLogicObjectState = accept
            }
            this._core.fire('movobj.non-logic.ing', this._startMovingObjectPos, newPos, e)
        }
    }

    public getArena(level: number): IObjectArena {
        if (!this._arenas.has(level)) {
            this._addSelectSupportForNonLogicLevel(level)
        }
        return this._arenas.get(level) as IObjectArena
    }

    public addObject(obj: IObject): boolean {
        const level = obj.level
        if (!this._arenas.has(level)) {
            this._addSelectSupportForNonLogicLevel(level)
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
            this._delSelectSupportForNonLogicLevel(level)
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
}