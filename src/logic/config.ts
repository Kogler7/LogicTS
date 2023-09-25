/**
* Copyright (c) 2022 Beijing Jiaotong University
* PhotLab is licensed under [Open Source License].
* You can use this software according to the terms and conditions of the [Open Source License].
* You may obtain a copy of [Open Source License] at: [https://open.source.license/]
* 
* THIS SOFTWARE IS PROVIDED ON AN AS IS BASIS, WITHOUT WARRANTIES OF ANY KIND,
* EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
* MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
* 
* See the [Open Source License] for more details.
* 
* Author: Zhenjie Wei
* Created: Sep. 10, 2023
* Supported by: National Key Research and Development Program of China
*/

const configObject = {
    core: {
        version: "1.0.0",
        layout: {
            logicWidth: 25,
            logicWidthMin: 1,
            logicWidthMax: 100,
            zoomSpeed: 0.5,
            zoomLevel: 0,
            zoomLevelMin: 0,
            zoomLevelMax: 2,
            levelUpFactor: 4,
            gridWidthMin: 16
        }
    },
    layers: {
        occupy: {
            okColor: "#8BC34A",
            noColor: "#FF5722"
        }
    },
    objects: {
        text: {
            size : 16,
            family : "Arial",
            weight : "normal",
            style : "normal",
            color : "#000000",
            align : "left",
            padding : 0.5,
            baseline : "top",
            lineSpacing : 1.6,
            logicFactor : 0.2,
        }
    }
}

function deepMerge(target: any, source: any) {
    for (const key in source) {
        if (typeof source[key] === 'object' && source[key] !== null) {
            if (!target[key]) {
                target[key] = {}
            }
            deepMerge(target[key], source[key])
        }
        else {
            target[key] = source[key]
        }
    }
}

export default class LogicConfig {
    public static set config(config: any) {
        // compare the config with the default config, sync the difference
        deepMerge(configObject, config)
    }

    public static get config() {
        return configObject
    }

    public static get core() {
        return configObject.core
    }

    public static get layers() {
        return configObject.layers
    }

    public static get objects() {
        return configObject.objects
    }
}