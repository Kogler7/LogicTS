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
import IObjectArena from "./arena/arena"
import { uid } from "./common/uid"
import { IResizable } from "./mixins/resizable"
import { MemoryHandler } from "./handlers/memory"
import {
    TRACK_FIRED_EVENTS,
    EVENTS_LOG_FILTER as SCOPED_LOG_FILTER,
    EVENTS_LOG_EXCEPT as SCOPED_LOG_EXCEPT,
    EVENTS_BAN_FILTER as SCOPED_BAN_FILTER,
    EVENTS_BAN_EXCEPT as SCOPED_BAN_EXCEPT
} from "./notifiers/scoped"
import {
    TRACK_EMITTED_EVENTS,
    EVENTS_LOG_FILTER as STACKED_LOG_FILTER,
    EVENTS_LOG_EXCEPT as STACKED_LOG_EXCEPT,
    EVENTS_BAN_FILTER as STACKED_BAN_FILTER,
    EVENTS_BAN_EXCEPT as STACKED_BAN_EXCEPT
} from "./notifiers/stacked"

export interface ILogicPlugin {
    install(core: LogicCore): void
    uninstall(core: LogicCore): void
}

export default class LogicCore {
    private _stage: HTMLCanvasElement | null = null
    private _scopedNotifier = new ScopedEventNotifier()
    private _stackedNotifier = new StackedEventNotifier()

    private _memoryHandler = new MemoryHandler(this)

    public malloc = this._memoryHandler.malloc.bind(this._memoryHandler)

    private _eventHandler = new EventHandler(this)
    private _cursorHandler = new CursorHandler(this)
    private _renderHandler = new RenderHandler(this)
    private _layoutHandler = new LayoutHandler(this)
    private _objectHandler = new ObjectHandler(this)

    constructor(stage?: HTMLCanvasElement) {
        if (stage) {
            this.connect(stage)
        }
    }

    public get stage(): HTMLCanvasElement | null {
        return this._stage
    }

    public get currentMemory() {
        return this._memoryHandler.currentMemory
    }

    public get currentMemoryId() {
        return this._memoryHandler.currentMemoryId
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

    public get stageRect(): Rect {
        return this._renderHandler.stageRect
    }

    public get dpr(): number {
        return this._renderHandler.dpr
    }

    public get rps(): string {
        return this._renderHandler.rps
    }

    public get perf(): string {
        return this._renderHandler.perf
    }

    public get originBias(): Point {
        return this._layoutHandler.originBias
    }

    public get logicWidth(): number {
        return this._layoutHandler.logicWidth
    }

    public get logicRect(): Rect {
        return this._layoutHandler.logicRect
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

    public get logicArena(): IObjectArena<Rect> {
        return this._objectHandler.logicArena
    }

    public get boundRect(): Rect {
        return this._objectHandler.boundRect
    }

    public get logicObjectIds(): Set<uid> {
        return this._objectHandler.logicObjectIds
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

    public on(event: string, callback: Function, level: number | null = null) {
        if (level !== null) {
            this._stackedNotifier.on(event, callback, level)
        } else {
            this._scopedNotifier.on(event, callback)
        }
    }

    public off(event: string, callback: Function | null = null, level: number | null = null) {
        if (level !== null) {
            this._stackedNotifier.off(event, callback, level)
        } else if (callback) {
            this._scopedNotifier.off(event, callback)
        }
    }

    public fire(event: string, ...args: any[]): boolean {
        if (TRACK_FIRED_EVENTS) {
            const matched = (e: string, list: Array<string>) => {
                for (const item of list) {
                    if (e.startsWith(item)) {
                        return true
                    }
                }
            }
            const toLog = (!(SCOPED_LOG_FILTER.length === 0) && !(SCOPED_LOG_EXCEPT.length === 0)) ||
                (SCOPED_LOG_FILTER.length !== 0 && matched(event, SCOPED_LOG_FILTER)) ||
                (SCOPED_LOG_EXCEPT.length !== 0 && !matched(event, SCOPED_LOG_EXCEPT))
            if (toLog) {
                console.log(`[ScopedEventNotifier] Fired event: ${event}`)
            }
            const toBan = (SCOPED_BAN_FILTER.length !== 0 && matched(event, SCOPED_BAN_FILTER)) ||
                (SCOPED_BAN_EXCEPT.length !== 0 && !matched(event, SCOPED_BAN_EXCEPT))
            if (toBan) {
                console.log(`[ScopedEventNotifier] Banned event: ${event}`)
                return false
            }
        }
        return this._scopedNotifier.fire(event, ...args)
    }

    public emit(event: string, ...args: any[]): boolean {
        if (TRACK_EMITTED_EVENTS) {
            const toLog = (!STACKED_LOG_FILTER && !STACKED_LOG_EXCEPT) ||
                (STACKED_LOG_FILTER && STACKED_LOG_FILTER.includes(event)) ||
                (STACKED_LOG_EXCEPT && !STACKED_LOG_EXCEPT.includes(event))
            if (toLog) {
                console.log(`[StackedEventNotifier] Emitted event: ${event}`)
            }
            const toBan = (STACKED_BAN_FILTER && STACKED_BAN_FILTER.includes(event)) ||
                (STACKED_BAN_EXCEPT && !STACKED_BAN_EXCEPT.includes(event))
            if (toBan) {
                console.log(`[StackedEventNotifier] Banned event: ${event}`)
                return false
            }
        }
        return this._stackedNotifier.emit(event, ...args)
    }

    public listAllScopedEvents(): string[] {
        return this._scopedNotifier.listAllRegisteredEvents()
    }

    public listAllStackedEvents(): string[] {
        return this._stackedNotifier.listAllRegisteredEvents()
    }

    public focus() {
        this._stage?.focus()
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
        this._stage = stage
        this._eventHandler.connect(stage)
        this._cursorHandler.connect(stage)
        this._renderHandler.connect(stage)
    }

    public disconnect() {
        this._eventHandler.disconnect()
        this._renderHandler.disconnect()
    }

    public attach(plugin: ILogicPlugin) {
        plugin.install(this)
    }

    public detach(plugin: ILogicPlugin) {
        plugin.uninstall(this)
    }

    public reset() {
        console.log('reset')
    }

    public free = this._memoryHandler.free.bind(this._memoryHandler)
    public createMemory = this._memoryHandler.createMemory.bind(this._memoryHandler)
    public switchMemory = this._memoryHandler.switchMemory.bind(this._memoryHandler)
    public deleteMemory = this._memoryHandler.deleteMemory.bind(this._memoryHandler)
    public getMemoryById = this._memoryHandler.getMemoryById.bind(this._memoryHandler)
    public switchMemoryToNext = this._memoryHandler.switchMemoryToNext.bind(this._memoryHandler)
    public register = this._objectHandler.addObject.bind(this._objectHandler)
    public unregister = this._objectHandler.delObject.bind(this._objectHandler)
    public render = this._renderHandler.render.bind(this._renderHandler)
    public clear = this._renderHandler.clear.bind(this._renderHandler)
    public renderAll = this._renderHandler.renderAll.bind(this._renderHandler)
    public markDirty = this._renderHandler.markDirty.bind(this._renderHandler)
    public mount = this._renderHandler.mountLayer.bind(this._renderHandler)
    public unmount = this._renderHandler.unmountLayer.bind(this._renderHandler)
    public createCache = this._renderHandler.createCache.bind(this._renderHandler)
    public resizeCache = this._renderHandler.resizeCache.bind(this._renderHandler)
    public requireCache = this._renderHandler.requireCache.bind(this._renderHandler)
    public destroyCache = this._renderHandler.destroyCache.bind(this._renderHandler)
    public crd2pos = this._layoutHandler.crd2pos.bind(this._layoutHandler)
    public crd2posRect = this._layoutHandler.crd2posRect.bind(this._layoutHandler)
    public pos2crd = this._layoutHandler.pos2crd.bind(this._layoutHandler)
    public pos2crdRect = this._layoutHandler.pos2crdRect.bind(this._layoutHandler)
    public panTo = this._layoutHandler.panTo.bind(this._layoutHandler)
    public zoomAt = this._layoutHandler.zoomAt.bind(this._layoutHandler)
    public addObject = this._objectHandler.addObject.bind(this._objectHandler)
    public delObject = this._objectHandler.delObject.bind(this._objectHandler)
    public getObject = this._objectHandler.getObject.bind(this._objectHandler)
    public setSelectable = this._objectHandler.setSelectable.bind(this._objectHandler)
    public setMovable = this._objectHandler.setMovable.bind(this._objectHandler)
    public setResizable = this._objectHandler.setResizable.bind(this._objectHandler)
    public isSelectable = this._objectHandler.isSelectable.bind(this._objectHandler)
    public isMovable = this._objectHandler.isMovable.bind(this._objectHandler)
    public isResizable = this._objectHandler.isResizable.bind(this._objectHandler)
}