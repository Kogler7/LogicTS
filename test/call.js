function f1(a, b) {
    return a + b
}

function f2(a, b) {
    return f1(a, b)
}

function f3(a, b) {
    return f2(a, b)
}

function testFunction(a, b) {
    const _a = a
    const _b = b
    return f3(_a, _b)
}

function measureExecutionTime(callback, iterations) {
    const startTime = performance.now()

    for (let i = 0; i < iterations; i++) {
        callback(1, 2)
    }

    const endTime = performance.now()
    const totalTime = endTime - startTime
    const averageTime = totalTime / iterations

    console.log(`总共执行时间：${totalTime.toFixed(8)} 毫秒`)
    console.log(`平均执行时间：${averageTime.toFixed(8)} 毫秒`)
}

const iterations = 1000000 // 调用次数，可以根据需要进行调整

measureExecutionTime(testFunction, iterations)