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
* Created: Oct. 24, 2023
* Supported by: National Key Research and Development Program of China
*/

import LogicCore from "./logic/core"
import { Point, Rect } from "@/logic/common/types2D"
import FrameLayer from "@/layers/frame"
import ScalarLayer from "@/layers/scalar"
import MeshLayer from "@/layers/mesh"
import SelectLayer from "@/layers/select"
import LinkLayer from "./layers/link"
import ToastLayer from "./layers/toast"
import MoveObjectLayer from "@/layers/move"
import ResizeObjectLayer from "@/layers/resize"
import Component from "@/objects/comp"
import TextArea from "@/objects/text"
import CompLayer from "./layers/comp"
import IRenderable from "./logic/mixins/renderable"
import { IObject } from "./logic/handlers/object"

export default class Designer {
    private _core: LogicCore

    private _compLayer: CompLayer

    public get core() { return this._core }

    constructor(stage: HTMLCanvasElement) {
        const core = new LogicCore()
        this._core = core

        const frameLayer = new FrameLayer('frame', 2)
        const scalarLayer = new ScalarLayer('scalar', 4)
        const meshLayer = new MeshLayer('mesh', -1)
        const selectLayer = new SelectLayer('select', 1)
        const moveLayer = new MoveObjectLayer('move', 3)
        const resizeLayer = new ResizeObjectLayer('resize', 3)
        const compLayer = new CompLayer('comp', 0)
        const linkLayer = new LinkLayer('link', 0.5)
        const toastLayer = new ToastLayer('toast', 5)

        this._compLayer = compLayer

        core.connect(stage)

        core.mount(frameLayer)
        core.mount(scalarLayer)
        core.mount(meshLayer)
        core.mount(selectLayer)
        core.mount(moveLayer)
        core.mount(resizeLayer)
        core.mount(compLayer)
        core.mount(linkLayer)
        core.mount(toastLayer)
    }

    public addComponent(comp: IObject) {
        this._core.register(comp)
        this._compLayer.addComponent(comp as unknown as IRenderable)
    }
}