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
import { IObjectArena, QueryObjectArena } from "../arena/arena"
import { Point, Rect } from "../common/types2D"
import { ISelectable } from "../mixins/selectable"
import { IMovable } from "../mixins/movable"
import { IResizable } from "../mixins/resizable"
import { uid } from "../common/uid"
import { TrapSet } from "../common/types"
import { deepCopy } from "../utils/copy"

export interface IObject {
    id: uid
    core: LogicCore | null
    rect: Rect
    level: number
    onRegistered(core: LogicCore): void
}

export class ObjectHandler {
    private _core: LogicCore
    private _logicArena: IObjectArena = new QueryObjectArena()
    private _arenas: Map<uid, IObjectArena> = new Map(
        [[0, this._logicArena]]
    )
    private _objects: Map<uid, IObject> = new Map()
    private _callbacks: Map<uid, (e: MouseEvent) => boolean> = new Map()
    private _recentSelectedLogicId: uid | null = null
    private _recentSelectedNonLogicId: uid | null = null

    private _selectedLogicBoundRect: Rect = Rect.zero()
    private _selectableObjects: Map<uid, ISelectable> = new Map()
    private _selectedLogicObjects: TrapSet<ISelectable> = new TrapSet(
        this._onLogicObjectSelected.bind(this),
        this._onLogicObjectDeselected.bind(this),
        (delta: number) => {
            if (delta <= 0) {
                // if there are objects deselected, we need to recalculate the select bound rect
                const rects = [...this._selectedLogicObjects.set].map((obj) => obj.rect)
                this._selectedLogicBoundRect = Rect.union(rects)
            }
            this._core.fire('select.logic-changed')
        }
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
    private _resizingLogicObject: IResizable[] = []
    private _resizingLogicObjectState: boolean[] = [false]
    private _resizingNonLogicObject: IResizable[] = []
    private _resizingNonLogicObjectState: boolean[] = [false]

    private _startResizingObjectPos: Point = Point.zero()
    private _readyToResizeLogicObject: boolean = false
    private _isResizingLogicObject: boolean = false
    private _readyToResizeNonLogicObject: boolean = false
    private _isResizingNonLogicObject: boolean = false

    private _resizingCursorStyle: string = 'nwse-resize'

    private _ctrlDown: boolean = false

    private _oldFramedLogicRect: Rect = Rect.zero()
    private _oldFramedLogicObjectIds: Set<uid> = new Set()

    private _boundRectPressed: boolean = false

    constructor(core: LogicCore) {
        this._core = core
        core.malloc('__object__', this, {
            _arenas: 1,
            _objects: 1,
            _callbacks: 1,
            _logicArena: 1,
            _selectableObjects: 1,
            _selectedLogicObjects: 1,
            _selectedLogicBoundRect: 1,
            _recentSelectedLogicId: 1,
            _recentSelectedNonLogicId: 1,
            _movableObjects: 1,
            _movingLogicObjects: 1,
            _movingLogicObjectStates: 1,
            _movingNonLogicObject: 1,
            _movingNonLogicObjectState: 1,
            _startMovingObjectPos: 1,
            _readyToMoveLogicObjects: 1,
            _isMovingLogicObjects: 1,
            _readyToMoveNonLogicObjects: 1,
            _isMovingNonLogicObjects: 1,
            _resizableObjects: 1,
            _resizingLogicObject: 1,
            _resizingLogicObjectState: 1,
            _resizingNonLogicObject: 1,
            _resizingNonLogicObjectState: 1,
            _startResizingObjectPos: 1,
            _readyToResizeLogicObject: 1,
            _isResizingLogicObject: 1,
        }, () => {
            // don't forget to reset cursor
            this._core.popCursor(this._resizingCursorStyle)
        }, () => {
            this._logicArena = this._arenas.get(0)!
            // reset rest states
            this._resizingCursorStyle = 'nwse-resize'
            this._ctrlDown = false
            this._oldFramedLogicRect = Rect.zero()
            this._oldFramedLogicObjectIds = new Set()
            this._boundRectPressed = false
        })
        // register mouse down event listener to the bottom of the event stack
        // if this callback is fired, it means that no object is selected
        core.on('mousedown', this._onMousePressedBackground.bind(this), -Infinity)
        // register mouse down event listener to the top of the event stack
        core.on('mousedown', this._checkIfMousePressedBoundRect.bind(this), Infinity)
        // listen to mouse up event to stop moving objects
        core.on('mouseup', this._onMouseUp.bind(this), Infinity)
        // listen to mouse move event to move objects
        core.on('mousemove', this._onMouseMove.bind(this), Infinity)
        // register level 0 arena callback event listener to the core
        core.on('mousedown', this._onMousePressedLogicLevel.bind(this), 0)
        // register ctrl key event listener to the core(level 0)
        core.on('keydown.Control', () => { this._ctrlDown = true })
        core.on('keyup.Control', () => { this._ctrlDown = false })
        // register frame begin event listener to the core
        core.on('frame.begin', (e: MouseEvent) => {
            // clear all selected objects
            this._selectedLogicObjects.clear()
            // reset the old frame logic rect
            this._oldFramedLogicRect = Rect.zero()
        })
        // register logic frame change event listener to the core
        core.on('frame.change', this._onLogicFrameRectChanged.bind(this))
        // recalculate the select bound rect after the objects are moved
        core.on('update-bound', () => {
            this._selectedLogicBoundRect = Rect.union(
                [...this._selectedLogicObjects.set].map((obj) => obj.rect)
            )
        })
    }

    public get logicArena(): IObjectArena {
        return this._logicArena
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

    public get movingLogicObjects(): Set<IMovable> {
        return this._movingLogicObjects
    }

    public get movingLogicObjectStates(): Map<uid, boolean> {
        return this._movingLogicObjectStates
    }

    public get resizingLogicObject(): IResizable[] {
        return this._resizingLogicObject
    }

    public get resizingLogicObjectState(): boolean[] {
        return this._resizingLogicObjectState
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
        if (!obj.enabled) return
        // if the selected object is movable and enabled,
        // we add it to the selected movable objects
        if (this._movableObjects.has(obj.id)) {
            this._movingLogicObjects.add(obj as IMovable)
        }
        // if the selected object is resizable and enabled,
        // and it's the only one selected object,
        // we set it as the resizing object
        if (this._resizableObjects.has(obj.id) && this._selectedLogicObjects.size === 1) {
            this._resizingLogicObject[0] = obj as IResizable
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

    private _onLogicObjectDeselected(obj: ISelectable) {
        // if the object is newly deselected, notify it
        // if the selected object is movable,
        // remove it from the selected movable objects
        if (this._movableObjects.has(obj.id)) {
            this._movingLogicObjects.delete(obj as IMovable)
        }
        // if the selected object is resizing,
        // set the resizing object to null
        if (this._resizingLogicObject.length > 0 && this._resizingLogicObject[0] === obj) {
            this._resizingLogicObject.pop()
        }
        // notify the object and the core
        if (this._recentSelectedLogicId === obj.id) {
            this._recentSelectedLogicId = null
        }
        obj.selected = false
        obj.onDeselected()
    }

    private _onMousePressedLogicLevel(e: MouseEvent) {
        if (e.button !== 0) {
            // if the left button is not pressed, return true to let the event go down
            return true
        }
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
                    this._setReadyToMoveObjects(hitPos, true)
                }
                this._clearSelectedNonLogicObject()
                // if an selectable object is hit, return false to stop the event going down
                return false
            }
        }
    }

    private _setReadyToMoveObjects(start: Point, logic: boolean) {
        if (logic) {
            this._readyToMoveLogicObjects = true
            this._readyToMoveNonLogicObjects = false
        } else {
            this._readyToMoveLogicObjects = false
            this._readyToMoveNonLogicObjects = true
        }
        this._startMovingObjectPos = start
        this._core.setCursor('move')
    }

    private _setReadyToResizeObjects(start: Point, logic: boolean) {
        if (logic) {
            this._readyToResizeLogicObject = true
            this._readyToResizeNonLogicObject = false
            this._core.popCursor(this._resizingCursorStyle)
            this._resizingCursorStyle = this._resizingLogicObject[0]
                .rect.posRelativeResizeDirection(start) + '-resize'
        } else {
            this._readyToResizeLogicObject = false
            this._readyToResizeNonLogicObject = true
            this._core.popCursor(this._resizingCursorStyle)
            this._resizingCursorStyle = this._resizingNonLogicObject[0]
                .rect.posRelativeResizeDirection(start) + '-resize'
        }
        this._core.setCursor(this._resizingCursorStyle)
    }

    private _cancelReadyToResizeObjects() {
        this._readyToResizeLogicObject = false
        this._readyToResizeNonLogicObject = false
        this._core.popCursor(this._resizingCursorStyle)
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
            const cbk = (e: MouseEvent) => {
                if (e.button !== 0) {
                    // if the left button is not pressed, return true to let the event go down
                    return true
                }
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
                        this._setReadyToMoveObjects(hitPos, false)
                        this._movingNonLogicObject = obj as IMovable
                    }
                    // if an object is hit, return false to stop the event going down
                    return false
                }
                return true
            }
            this._callbacks.set(level, cbk)
            this._core.on('mousedown', cbk, level)
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
                this._core.off('mousedown', cbk, 0)
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
        // if the left button is pressed on the bound rect,
        // start moving the selected objects or resizing the selected object
        if (e.button === 0) {
            const hitPos = new Point(e.offsetX, e.offsetY)
            const hitCrd = this._core.pos2crd(hitPos)
            if (this.selectedLogicBoundRect.containsPoint(hitCrd)) {
                this._setReadyToMoveObjects(hitCrd, true)
                this._boundRectPressed = true
                // stop the event going down
                return false
            } else {
                // if the mouse is not pressed on the bound rect,
                // and we are ready to resize the selected object,
                // we start resizing the selected object
                if (this._readyToResizeLogicObject) {
                    this._isResizingLogicObject = true
                    this._isResizingNonLogicObject = false
                    this._startResizingObjectPos = hitCrd
                    this._resizingLogicObjectState[0] = true
                    const obj = this._resizingLogicObject[0]
                    obj.target = obj.rect.clone()
                    obj.onResizeBegin()
                    this._core.fire('resizobj.logic.begin', obj.target, e)
                    return false
                } else if (this._readyToResizeNonLogicObject) {
                    this._isResizingLogicObject = false
                    this._isResizingNonLogicObject = true
                    this._startResizingObjectPos = hitPos
                    this._resizingNonLogicObjectState[0] = true
                    const obj = this._resizingNonLogicObject[0]
                    obj.target = obj.rect.clone()
                    obj.onResizeBegin()
                    this._core.fire('resizobj.non-logic.begin', obj.target, e)
                    return false
                }
            }
        }
    }

    private _onMouseMove(e: MouseEvent) {
        const oldPos = this._startMovingObjectPos
        // if it's ready to move the selected logic or non-logic objects
        if (this._readyToMoveLogicObjects) {
            const newPos = this._core.pos2crd(new Point(e.offsetX, e.offsetY))
            if (!this._isMovingLogicObjects) {
                this._isMovingLogicObjects = true
                for (const obj of this._movingLogicObjects) {
                    this.movingLogicObjectStates.set(obj.id, true)
                    obj.target = obj.rect.clone()
                    obj.onMoveBegin()
                }
                this._core.fire('movobj.logic.begin', newPos, e)
            }
            for (const obj of this._movingLogicObjects) {
                const moved = obj.target.moveTo(obj.rect.pos.plus(newPos.minus(oldPos)).round())
                if (moved) {
                    const accept = obj.onMoving(oldPos, newPos)
                    this._movingLogicObjectStates.set(obj.id, accept as boolean)
                    this._core.fire('movobj.logic.step', obj, oldPos, newPos, e)
                }
            }
            this._core.fire('movobj.logic.ing', oldPos, newPos, e)
        } else if (this._readyToMoveNonLogicObjects) {
            const newPos = new Point(e.offsetX, e.offsetY)
            if (!this._isMovingNonLogicObjects) {
                const obj = this._movingNonLogicObject!
                this._isMovingNonLogicObjects = true
                obj.target = obj.rect.clone()
                obj.onMoveBegin()
                this._core.fire('movobj.non-logic.begin', newPos, e)
            }
            const obj = this._movableObjects.get(this._recentSelectedNonLogicId!)
            if (obj) {
                obj.target.moveTo(obj.rect.pos.plus(newPos.minus(oldPos)))
                const accept = obj.onMoving(oldPos, newPos)
                this._movingNonLogicObjectState = accept as boolean
            }
            this._core.fire('movobj.non-logic.ing', oldPos, newPos, e)
        }
        // else we try to resize the selected object
        else if (this._isResizingLogicObject) {
            const pos = this._core.pos2crd(new Point(e.offsetX, e.offsetY))
            const obj = this._resizingLogicObject[0]
            const newRect = obj.rect.resizeBy(this._startResizingObjectPos, pos).round()
            if (!newRect.equals(obj.target)) {
                obj.target = newRect
                const accept = obj.onResizing(obj.rect, obj.target)
                this._resizingLogicObjectState[0] = accept as boolean
                this._core.fire('resizobj.logic.step', obj.rect, obj.target, e)
            }
            this._core.fire('resizobj.logic.ing', obj.rect, obj.target, e)
        }
        else if (this._isResizingNonLogicObject) {
            const pos = new Point(e.offsetX, e.offsetY)
            const obj = this._resizingNonLogicObject![0]
            const newRect = obj.rect.resizeBy(this._startResizingObjectPos, pos).round()
            if (!newRect.equals(obj.rect)) {
                obj.target = newRect
                const accept = obj.onResizing(obj.rect, obj.target)
                this._resizingNonLogicObjectState[0] = accept as boolean
                this._core.fire('resizobj.non-logic.step', obj.rect, obj.target, e)
            }
            this._core.fire('resizobj.logic.ing', obj.rect, obj.target, e)
        }
        // else we check if the mouse pos is in the bound rect while out of the object's rect
        // if it is, we start resizing the selected object
        else if (this._resizingLogicObject || this._resizingNonLogicObject) {
            const mousePos = new Point(e.offsetX, e.offsetY)
            const mouseCrd = this._core.pos2crd(mousePos)
            if (
                this._resizingLogicObject.length > 0 &&
                !this._resizingLogicObject[0].rect.containsPoint(mouseCrd) &&
                this._core.crd2posRect(this._resizingLogicObject[0].rect).padding(16).containsPoint(mousePos)
            ) {
                this._setReadyToResizeObjects(mouseCrd, true)
            } else if (
                this._resizingNonLogicObject.length > 0 &&
                !this._resizingNonLogicObject[0].rect.containsPoint(mousePos) &&
                this._resizingNonLogicObject[0].rect.padding(16).containsPoint(mousePos)
            ) {
                this._setReadyToResizeObjects(mousePos, false)
            } else {
                this._cancelReadyToResizeObjects()
            }
        }
    }

    private _onMouseUp(e: MouseEvent) {
        // if the left button is up, stop moving the selected objects
        if (this._readyToMoveLogicObjects) {
            const hitPos = this._core.pos2crd(new Point(e.offsetX, e.offsetY))
            if (this._isMovingLogicObjects) {
                this._isMovingLogicObjects = false
                for (const obj of this._movingLogicObjects) {
                    obj.onMoveEnd()
                }
                this._core.fire('movobj.logic.end', hitPos, e)
            }
            if (this._boundRectPressed) {
                this._boundRectPressed = false
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
            const pos = new Point(e.offsetX, e.offsetY)
            if (this._isMovingNonLogicObjects) {
                this._isMovingNonLogicObjects = false
                this._movingNonLogicObject!.onMoveEnd()
                this._core.fire('movobj.non-logic.end', pos, e)
            }
            this._readyToMoveNonLogicObjects = false
            this._movingNonLogicObject = null
            this._movingNonLogicObjectState = false
        } else if (this._isResizingLogicObject) {
            const pos = this._core.pos2crd(new Point(e.offsetX, e.offsetY))
            this._isResizingLogicObject = false
            this._resizingLogicObject[0].onResizeEnd()
            this._core.fire('resizobj.logic.end', pos, e)
        } else if (this._isResizingNonLogicObject) {
            const pos = new Point(e.offsetX, e.offsetY)
            this._isResizingNonLogicObject = false
            this._resizingNonLogicObject[0].onResizeEnd()
            this._core.fire('resizobj.non-logic.end', pos, e)
        }
        this._core.popCursor('move')
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

    public isSelectable(id: uid): boolean {
        return this._selectableObjects.has(id)
    }

    public isMovable(id: uid): boolean {
        return this._movableObjects.has(id)
    }

    public isResizable(id: uid): boolean {
        return this._resizableObjects.has(id)
    }
}