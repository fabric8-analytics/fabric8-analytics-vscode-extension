function delay(interval) {
    return it('should delay', done => {
        setTimeout(() => done(), interval)
    }).timeout(interval + 1000) // The extra 1000ms should guarantee the test will not fail due to exceeded timeout
}

export {
    delay
}