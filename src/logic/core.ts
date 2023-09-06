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
import LogicLayer from "./layers/layer"
import XPSChecker from "./utils/xps"
import EventHandler from "./handlers/event"
import CursorHandler from "./handlers/cursor"
import LayoutHandler from "./handlers/layout"
import { IObject, ObjectHandler } from "./handlers/object"
import ScopedEventNotifier from "./notifiers/scoped"
import StackedEventNotifier from "./notifiers/stacked"
import { ISelectable } from "./mixins/selectable"
import { IMovable } from "./mixins/movable"
import { IResizable } from "./mixins/resizable"
import { Size } from "electron"

export default class LogicCore {
    private _dpr: number = window.devicePixelRatio || 1
    private _cache: HTMLCanvasElement
    private _cacheCtx: CanvasRenderingContext2D
    private _stage: HTMLCanvasElement
    private _stageCtx: CanvasRenderingContext2D

    private _stageWidth: number = 100
    private _stageHeight: number = 100

    private _layers: LogicLayer[] = []

    private _renderRequested = false
    private _dirty = true

    private _xps = new XPSChecker()
    private _fps: string = ''

    private _scopedNotifier = new ScopedEventNotifier()
    private _stackedNotifier = new StackedEventNotifier()
    private _eventHandler = new EventHandler(this)
    private _cursorHandler = new CursorHandler()
    private _layoutHandler = new LayoutHandler(this)
    private _objectHandler = new ObjectHandler(this)

    constructor(stage?: HTMLCanvasElement) {
        this._cache = document.createElement('canvas')
        const cacheCtx = this._cache.getContext('2d')
        if (!cacheCtx) {
            throw new Error('cache context is null')
        }
        this._cacheCtx = cacheCtx
        this._stage = this._cache
        this._stageCtx = this._cacheCtx
        if (stage) {
            this.connect(stage)
        }
    }

    private _render() {
        this._xps.start()
        const { _stageWidth: width, _stageHeight: height } = this
        if (this._dirty) {
            this._cacheCtx.clearRect(0, 0, width, height)
            this._xps.check('clear')
            this._layers.forEach(layer => {
                if (layer.visible) {
                    const rendered = layer.onReloc(this._cacheCtx)
                    if (rendered) {
                        this._xps.check(layer.name)
                    }
                }
            })
            this._dirty = false
        }
        if (this._stage !== this._cache) {
            this._stageCtx.clearRect(0, 0, width, height)
            this._stageCtx.drawImage(this._cache, 0, 0)
            this._xps.check('draw')
        }
        this._layers.forEach(layer => {
            if (layer.visible) {
                const rendered = layer.onPaint(this._stageCtx)
                if (rendered) {
                    this._xps.check(layer.name)
                }
            }
        })
        this._xps.check('FPS', '')
        this._fps = this._xps.get('FPS')
    }

    public render() {
        if (this._renderRequested) {
            return
        }
        this._renderRequested = true
        window.requestAnimationFrame(() => {
            this._render()
            this._renderRequested = false
        })
    }

    public renderAll() {
        this._dirty = true
        this.render()
    }

    public markDirty() {
        this._dirty = true
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

    // fire event to scoped listeners via scoped notifier
    public fire(event: string, ...args: any[]): boolean {
        return this._scopedNotifier.fire(event, ...args)
    }

    // emit event to stacked layers via stacked notifier
    public emit(event: string, ...args: any[]): boolean {
        return this._stackedNotifier.emit(event, ...args)
    }

    public setCursor(cursor: string) {
        this._cursorHandler.push(cursor)
    }

    public popCursor(cursor: string) {
        this._cursorHandler.recall(cursor)
    }

    public mount(layer: LogicLayer) {
        layer._onMount(this)
        this._layers.push(layer)
        this._layers.sort((a, b) => a.level - b.level)
        // check name duplication without blocking
        setTimeout(() => {
            const names = this._layers.map(layer => layer.name)
            const duplicates = names.filter((name, index) => names.indexOf(name) !== index)
            if (duplicates.length > 0) {
                throw new Error(`Duplicated layer names detected: ${duplicates.join(', ')}`)
            }
        })
    }

    public unmount(name: string) {
        for (let i = 0; i < this._layers.length; i++) {
            if (this._layers[i].name === name) {
                const layer = this._layers[i]
                layer.onUnmount()
                this._layers.splice(i, 1)
                break
            }
        }
    }

    // connect to a stage device, which is a canvas element
    public connect(stage: HTMLCanvasElement) {
        this._eventHandler.bind(stage)
        this._cursorHandler.bind(stage)
        this._layoutHandler.bind(stage)
        this._stage = stage
        const stageCtx = stage.getContext('2d')
        if (!stageCtx) {
            throw new Error('stage context is null')
        }
        this._stageCtx = stageCtx
        // configure stage size, with dpr considered
        const { width: cssWidth, height: cssHeight } = stage.getBoundingClientRect()
        stage.style.width = `${cssWidth}px`
        stage.style.height = `${cssHeight}px`
        this._stageWidth = cssWidth * this._dpr
        this._stageHeight = cssHeight * this._dpr
        this._cache.width = this._stageWidth
        this._cache.height = this._stageHeight
        // this._stageCtx.scale(this._dpr, this._dpr)
        // this._cacheCtx.scale(this._dpr, this._dpr)
        this._cacheCtx.clearRect(0, 0, this._stageWidth, this._stageHeight)
        this._dirty = true
        this.render()
    }

    public disconnect() {
        this._eventHandler.unbind()
        this._layoutHandler.unbind()
        this._stage = this._cache
        this._stageCtx = this._cacheCtx
        this._stageWidth = this._cache.width
        this._stageHeight = this._cache.height
        this._dirty = true
        this.render()
    }

    public attach() {
        console.log('attach')
    }

    public detach() {
        console.log('detach')
    }

    // register object to the logic core
    public register(obj: IObject) {
        this._objectHandler.addObject(obj)
    }

    public unregister(obj: IObject) {
        this._objectHandler.delObject(obj)
    }

    public createCache(size: Size | null = null): CanvasRenderingContext2D {
        const cache = document.createElement('canvas')
        cache.width = size?.width || this._stageWidth
        cache.height = size?.height || this._stageHeight
        return cache.getContext('2d') as CanvasRenderingContext2D
    }

    public reset() {
        console.log('reset')
    }

    public get stageWidth(): number {
        return this._stageWidth
    }

    public get stageHeight(): number {
        return this._stageHeight
    }

    public get fps(): string {
        return this._fps
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

    public get selectedObjects(): Set<ISelectable> {
        return this._objectHandler.selectedObjects
    }

    public get recentSelectedObject(): ISelectable | null {
        return this._objectHandler.recentSelectedObject
    }

    public crd2pos = this._layoutHandler.crd2pos.bind(this._layoutHandler)
    public pos2crdRect = this._layoutHandler.pos2crdRect.bind(this._layoutHandler)
    public pos2crd = this._layoutHandler.pos2crd.bind(this._layoutHandler)
    public crd2posRect = this._layoutHandler.crd2posRect.bind(this._layoutHandler)
    public addObject = this._objectHandler.addObject.bind(this._objectHandler)
    public delObject = this._objectHandler.delObject.bind(this._objectHandler)
    public setSelectable = this._objectHandler.setSelectable.bind(this._objectHandler)
    public setMovable = this._objectHandler.setMovable.bind(this._objectHandler)
    public setResizable = this._objectHandler.setResizable.bind(this._objectHandler)
}