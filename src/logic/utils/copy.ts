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
* Created: Sep. 26, 2023
* Supported by: National Key Research and Development Program of China
*/

export function deepCopy(obj: any, depth: number = 1): any {
    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj

    if (depth <= 0) return obj
    depth--

    let copy

    // Handle Date
    if (obj instanceof Date) {
        copy = new Date()
        copy.setTime(obj.getTime())
        return copy
    }

    // Handle Array
    if (obj instanceof Array) {
        copy = []
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = deepCopy(obj[i], depth)
        }
        return copy
    }

    // Handle Map
    if (obj instanceof Map) {
        copy = new Map()
        for (const [key, value] of obj) {
            copy.set(key, deepCopy(value, depth))
        }
        return copy
    }

    // Handle Set
    if (obj instanceof Set) {
        copy = new Set()
        for (const value of obj) {
            copy.add(deepCopy(value, depth))
        }
        return copy
    }

    // Handle Object
    // deep copy all the properties of the original object
    // with prototype chain copied
    if (obj instanceof Object) {
        let copy = {}
        for (const attr in obj) {
            if (obj.hasOwnProperty(attr)) (copy as any)[attr] = deepCopy(obj[attr], depth)
        }
        return Object.assign(
            Object.create(obj),
            copy
        )
    }

    throw new Error("Unable to copy obj! Its type isn't supported.")
}