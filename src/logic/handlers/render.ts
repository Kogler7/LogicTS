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
* Created: Sep. 8, 2023
* Supported by: National Key Research and Development Program of China
*/

import { Size } from "../common/types2D"
import LogicCore from "../core"
import LogicLayer from "../layer"
import XPSChecker from "../utils/xps"

export default class RenderHandler {
    private _core: LogicCore
    private _cache: HTMLCanvasElement
    private _cacheCtx: CanvasRenderingContext2D
    private _stage: HTMLCanvasElement
    private _stageCtx: CanvasRenderingContext2D

    private _connected = false

    private _stageWidth: number = -1
    private _stageHeight: number = -1

    private _layers: LogicLayer[] = []
    private _foregroundLayers: LogicLayer[] = []
    private _backgroundLayers: LogicLayer[] = []

    private _renderRequested = false
    private _dirty = true

    private _xps = new XPSChecker()
    private _rps: string = ''

    private _dpr: number = 1

    private _resizeObserver: ResizeObserver | null = null

    private _fullSizeCacheCanvasSet: Set<HTMLCanvasElement> = new Set()
    private _fixedSizeCacheCanvasSet: Set<HTMLCanvasElement> = new Set()

    public get stageWidth(): number {
        return this._stageWidth
    }

    public get stageHeight(): number {
        return this._stageHeight
    }

    public get dpr(): number {
        return this._dpr
    }

    public get rps(): string {
        return this._rps
    }

    public get perf(): string {
        return this._xps.getPerfDesc()
    }

    constructor(core: LogicCore) {
        this._core = core
        this._cache = document.createElement('canvas')
        const cacheCtx = this._cache.getContext('2d')
        if (!cacheCtx) {
            throw new Error('cache context is null')
        }
        this._cacheCtx = cacheCtx
        this._stage = this._cache
        this._stageCtx = this._cacheCtx
    }

    private _calcDPR() {
        if (window.devicePixelRatio > 1.5) {
            this._dpr = 2
            console.warn('High resolution display detected, using 2x dpr.')
            console.warn('High dpr mode is still under development, please report bugs.')
        }
        else {
            this._dpr = 1
        }
    }

    private _checkStage() {
        if (!this._connected) return false
        const { _stageWidth: width, _stageHeight: height } = this
        if (width <= 0 || height <= 0) {
            console.error(
                `Invalid stage size [${width}, ${height}].`
            )
            return false
        }
        return true
    }

    private _updateSize() {
        this._calcDPR()
        if (!this._connected) return
        const stage = this._stage
        // configure stage size, with dpr considered
        const { width: cssWidth, height: cssHeight } = stage.getBoundingClientRect()
        if (cssWidth <= 0 || cssHeight <= 0) return
        // resize stage element size
        stage.style.width = `${cssWidth}px`
        stage.style.height = `${cssHeight}px`
        // recalculate stage context size (with dpr considered)
        this._stageWidth = cssWidth * this._dpr
        this._stageHeight = cssHeight * this._dpr
        // resize stage canvas context
        stage.width = this._stageWidth
        stage.height = this._stageHeight
        this._cache.width = this._stageWidth
        this._cache.height = this._stageHeight
        // resize cache canvas contexts
        for (const cache of this._fullSizeCacheCanvasSet) {
            cache.width = this._stageWidth
            cache.height = this._stageHeight
            const cacheCtx = cache.getContext('2d')
            if (!cacheCtx) {
                throw new Error('cache context is null')
            }
            cacheCtx.scale(this._dpr, this._dpr)
        }
        for (const cache of this._fixedSizeCacheCanvasSet) {
            const cacheCtx = cache.getContext('2d')
            if (!cacheCtx) {
                throw new Error('cache context is null')
            }
            cacheCtx.scale(this._dpr, this._dpr)
        }
        // wonder if it's necessary to scale stage context back first
        // this._stageCtx.scale(1 / this._dpr, 1 / this._dpr)
        this._stageCtx.scale(this._dpr, this._dpr)
        this._cacheCtx.scale(this._dpr, this._dpr)
        this._core.fire('stage.resize')
        this.renderAll()
    }

    private _render() {
        if (!this._checkStage()) return
        this._xps.start()
        const { _stageWidth: width, _stageHeight: height } = this
        // clear stage
        this._stageCtx.clearRect(0, 0, width, height)
        // first, paint background layers
        this._backgroundLayers.forEach(layer => {
            if (layer.visible) {
                const rendered = layer.onPaint(this._stageCtx)
                if (rendered) {
                    this._xps.check(layer.name)
                }
            }
        })
        // then, render cache layers on cache canvas, if dirty
        if (this._dirty) {
            this._cacheCtx.clearRect(0, 0, width, height)
            this._xps.check('clear')
            this._layers.forEach(layer => {
                if (layer.visible) {
                    const rendered = layer.onCache(this._cacheCtx)
                    if (rendered) {
                        this._xps.check(layer.name)
                    }
                }
            })
            this._dirty = false
        }
        // paint cache on stage
        if (this._stage !== this._cache) {
            this._stageCtx.drawImage(this._cache, 0, 0)
            this._xps.check('draw')
        }
        // last, paint foreground layers
        this._foregroundLayers.forEach(layer => {
            if (layer.visible) {
                const rendered = layer.onPaint(this._stageCtx)
                if (rendered) {
                    this._xps.check(layer.name)
                }
            }
        })
        // check fps
        this._xps.check('rps', '')
        this._rps = this._xps.get('rps')
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

    public connect(stage: HTMLCanvasElement) {
        this._stage = stage
        const stageCtx = stage.getContext('2d')
        if (!stageCtx) {
            throw new Error('stage context is null')
        }
        this._stageCtx = stageCtx
        this._connected = true
        this._resizeObserver = new ResizeObserver(() => {
            this._updateSize()
        })
        this._resizeObserver.observe(stage)
        this._updateSize()
        setTimeout(() => {
            this.renderAll()
        })
    }

    public disconnect() {
        this._stage = this._cache
        this._stageCtx = this._cacheCtx
        this._stageWidth = this._cache.width
        this._stageHeight = this._cache.height
        this._dirty = true
        this._connected = false
        this._resizeObserver?.disconnect()
    }

    public mountLayer(layer: LogicLayer) {
        layer._onMounted(this._core)
        this._layers.push(layer)
        this._layers.sort((a, b) => a.level - b.level)
        if (layer.level < 0) {
            // background layer
            this._backgroundLayers.push(layer)
            this._backgroundLayers.sort((a, b) => a.level - b.level)
        } else {
            // foreground layer
            this._foregroundLayers.push(layer)
            this._foregroundLayers.sort((a, b) => a.level - b.level)
        }
        // check name duplication without blocking
        const checkDuplication = (layers: LogicLayer[]) => {
            const names = layers.map(layer => layer.name)
            const duplicates = names.filter((name, index) => names.indexOf(name) !== index)
            if (duplicates.length > 0) {
                throw new Error(`Duplicated layer names detected: ${duplicates.join(', ')}`)
            }
        }
        setTimeout(() => {
            checkDuplication(this._layers)
            if (layer.level < 0) {
                checkDuplication(this._backgroundLayers)
            } else {
                checkDuplication(this._foregroundLayers)
            }
        })
    }

    public unmountLayer(name: string) {
        for (let i = 0; i < this._layers.length; i++) {
            if (this._layers[i].name === name) {
                const layer = this._layers[i]
                layer.onUnmount()
                this._layers.splice(i, 1)
                break
            }
        }
    }

    public createCache(size?: Size): CanvasRenderingContext2D {
        const cache = document.createElement('canvas')
        if (!cache) {
            throw new Error('Failed to create cache canvas')
        }
        if (size) {
            this._fixedSizeCacheCanvasSet.add(cache)
            cache.width = size.width * this._dpr
            cache.height = size.height * this._dpr
        } else {
            this._checkStage()
            this._fullSizeCacheCanvasSet.add(cache)
            cache.width = this._stageWidth
            cache.height = this._stageHeight
        }
        const ctx = cache.getContext('2d') as CanvasRenderingContext2D
        ctx.scale(this._dpr, this._dpr)
        return ctx
    }

    public resizeCache(cache: CanvasRenderingContext2D, size: Size) {
        const canvas = cache.canvas
        if (!this._fixedSizeCacheCanvasSet.has(canvas)) {
            throw new Error('Cannot resize a full-size cache canvas')
        }
        canvas.width = size.width * this._dpr
        canvas.height = size.height * this._dpr
    }

    public destroyCache(cache: CanvasRenderingContext2D, fixed: boolean = false) {
        const canvas = cache.canvas
        if (fixed) {
            this._fixedSizeCacheCanvasSet.delete(canvas)
        }
        else {
            this._fullSizeCacheCanvasSet.delete(canvas)
        }
        cache = null as any
    }
}