function delay(interval) {
    return it('should delay', done => {
        setTimeout(() => done(), interval)
    }).timeout(interval + 1000)
}

export {
    delay
}