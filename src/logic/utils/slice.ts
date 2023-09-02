export default function timeSlice(func: any, slice = 5000, trigger = requestIdleCallback) {
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
                trigger(() => { step(resolve, reject) })
            } catch (e) {
                reject(e)
            }
        })
    }
}