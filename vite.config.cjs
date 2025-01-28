const { resolve } = require('path')

module.exports = {
    build: {
        rollupOptions: {
            input: {
                index: resolve(__dirname, 'index.html'),
                live: resolve(__dirname, 'live.html')
            }
        }
    }
}
