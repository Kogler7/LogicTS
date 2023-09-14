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
* Created: Jul. 20, 2023
* Supported by: National Key Research and Development Program of China
*/

import { Point, Rect } from "./common/types2D"
import EventHandler from "./handlers/event"
import CursorHandler from "./handlers/cursor"
import LayoutHandler from "./handlers/layout"
import RenderHandler from "./handlers/render"
import { ObjectHandler } from "./handlers/object"
import ScopedEventNotifier from "./notifiers/scoped"
import StackedEventNotifier from "./notifiers/stacked"
import { ISelectable } from "./mixins/selectable"
import { IMovable } from "./mixins/movable"
import { IObjectArena } from "./arena/arena"
import { uid } from "./common/uid"
import { IResizable } from "./mixins/resizable"

export default class LogicCore {
    private _scopedNotifier = new ScopedEventNotifier()
    private _stackedNotifier = new StackedEventNotifier()

    private _cursorHandler = new CursorHandler()
    private _eventHandler = new EventHandler(this)
    private _renderHandler = new RenderHandler(this)
    private _layoutHandler = new LayoutHandler(this)
    private _objectHandler = new ObjectHandler(this)

    constructor(stage?: HTMLCanvasElement) {
        if (stage) {
            this.connect(stage)
        }
    }

    public get cursorStack() {
        return this._cursorHandler.cursorStack
    }

    public get stageWidth(): number {
        return this._renderHandler.stageWidth
    }

    public get stageHeight(): number {
        return this._renderHandler.stageHeight
    }

    public get dpr(): number {
        return this._renderHandler.dpr
    }

    public get fps(): string {
        return this._renderHandler.fps
    }

    public get originBias(): Point {
        return this._layoutHandler.originBias
    }

    public get logicWidth(): number {
        return this._layoutHandler.logicWidth
    }

    public get anchorPos(): Point {
        return this._eventHandler.anchorPos
    }

    public get lastPos(): Point {
        return this._eventHandler.lastPos
    }

    public get focusPos(): Point {
        return this._eventHandler.focusPos
    }

    public get focusRect(): Rect | null {
        return this._eventHandler.focusRect
    }

    public get zoomLevel(): number {
        return this._layoutHandler.zoomLevel
    }

    public get levelUpFactor(): number {
        return this._layoutHandler.levelUpFactor
    }

    public get gridWidth(): number {
        return this._layoutHandler.gridWidth
    }

    public get logicArena(): IObjectArena {
        return this._objectHandler.logicArena
    }

    public get selectedLogicObjects(): Set<ISelectable> {
        return this._objectHandler.selectedLogicObjects
    }

    public get selectedLogicBoundRect(): Rect {
        return this._objectHandler.selectedLogicBoundRect
    }

    public get recentSelectedLogicObject(): ISelectable | null {
        return this._objectHandler.recentSelectedLogicObject
    }

    public get movingLogicObjects(): Set<IMovable> {
        return this._objectHandler.movingLogicObjects
    }

    public get movingLogicObjectStates(): Map<uid, boolean> {
        return this._objectHandler.movingLogicObjectStates
    }

    public get resizingLogicObject(): IResizable[] {
        return this._objectHandler.resizingLogicObject
    }

    public get resizingLogicObjectState(): boolean[] {
        return this._objectHandler.resizingLogicObjectState
    }

    public on(event: string, scoped: boolean, callback: Function, level: number = 0) {
        if (scoped) {
            this._scopedNotifier.on(event, callback)
        } else {
            this._stackedNotifier.on(event, callback, level)
        }
    }

    public off(event: string, scoped: boolean, callback: Function | null = null, level = 0) {
        if (scoped && callback) {
            this._scopedNotifier.off(event, callback)
        } else {
            this._stackedNotifier.off(event, callback, level)
        }
    }

    public setCursor = this._cursorHandler.push.bind(this._cursorHandler)

    public popCursor(cursor: string = '') {
        if (cursor) {
            this._cursorHandler.recall(cursor)
        } else {
            this._cursorHandler.pop()
        }
    }

    // connect to a stage device, which is a canvas element
    public connect(stage: HTMLCanvasElement) {
        this._eventHandler.bind(stage)
        this._cursorHandler.bind(stage)
        this._layoutHandler.bind(stage)
        this._renderHandler.bind(stage)
    }

    public disconnect() {
        this._eventHandler.unbind()
        this._layoutHandler.unbind()
        this._renderHandler.unbind()
        this.render()
    }

    public attach() {
        console.log('attach')
    }

    public detach() {
        console.log('detach')
    }

    public reset() {
        console.log('reset')
    }

    public fire = this._scopedNotifier.fire.bind(this._scopedNotifier)
    public emit = this._stackedNotifier.emit.bind(this._stackedNotifier)
    public register = this._objectHandler.addObject.bind(this._objectHandler)
    public unregister = this._objectHandler.delObject.bind(this._objectHandler)
    public render = this._renderHandler.render.bind(this._renderHandler)
    public renderAll = this._renderHandler.renderAll.bind(this._renderHandler)
    public markDirty = this._renderHandler.markDirty.bind(this._renderHandler)
    public mount = this._renderHandler.mountLayer.bind(this._renderHandler)
    public unmount = this._renderHandler.unmountLayer.bind(this._renderHandler)
    public createCache = this._renderHandler.createCache.bind(this._renderHandler)
    public crd2pos = this._layoutHandler.crd2pos.bind(this._layoutHandler)
    public pos2crdRect = this._layoutHandler.pos2crdRect.bind(this._layoutHandler)
    public pos2crd = this._layoutHandler.pos2crd.bind(this._layoutHandler)
    public crd2posRect = this._layoutHandler.crd2posRect.bind(this._layoutHandler)
    public addObject = this._objectHandler.addObject.bind(this._objectHandler)
    public delObject = this._objectHandler.delObject.bind(this._objectHandler)
    public setSelectable = this._objectHandler.setSelectable.bind(this._objectHandler)
    public setMovable = this._objectHandler.setMovable.bind(this._objectHandler)
    public setResizable = this._objectHandler.setResizable.bind(this._objectHandler)
    public isSelectable = this._objectHandler.isSelectable.bind(this._objectHandler)
    public isMovable = this._objectHandler.isMovable.bind(this._objectHandler)
    public isResizable = this._objectHandler.isResizable.bind(this._objectHandler)
}