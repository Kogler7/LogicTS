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
 * Created: Aug. 5, 2023
 * Supported by: National Key Research and Development Program of China
 */

export default function timeSlice(
    func: any,
    slice = 5000,
    trigger = requestIdleCallback,
) {
    if (func.constructor.name !== 'GeneratorFunction') {
        console.warn('timeSlice: func is not a generator function')
        return func
    }
    return function (...args: any[]) {
        const gen = func(...args)
        return new Promise(async function step(resolve, reject) {
            try {
                const start = performance.now()
                let result
                do {
                    result = gen.next()
                    if (result.done) {
                        return resolve(result.value)
                    }
                } while (performance.now() - start < slice)
                trigger(() => {
                    step(resolve, reject)
                })
            } catch (e) {
                reject(e)
            }
        })
    }
}
