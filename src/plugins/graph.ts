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
* Created: Oct. 25, 2023
* Supported by: National Key Research and Development Program of China
*/

import RenderGraph from "@/models/graph"
import LogicCore, { ILogicPlugin } from "@/logic/core"

export const graphManager = new class GraphManager implements ILogicPlugin {
    private _core: LogicCore | null = null
    private _graph: RenderGraph

    public get graph() {
        return this._graph
    }

    constructor() {
        this._graph = new RenderGraph()
    }

    public install(core: LogicCore) {
        this._core = core
        core.malloc('graph', this, {
            _graph: 2,
        })
    }

    public uninstall(core: LogicCore) {
        this._core = null
    }
}