function createModebank(modes) {
    var modebank = {}
    var current = modes[0]

    modes.forEach(mode => modebank[mode] = mode)

    modebank.current = () => current

    modebank.changeMode = (newMode) => {
        if (modes[newMode])
            current = newMode
    }
    return modebank
}


document.addEventListener('DOMContentLoaded', function () {

    const modebank = createModebank(['ruler', 'compass'])

    new Vue({
        el: '#app',
        data: {
            startingPoint: [],
            endingPoint: [],
            lines: [],
            circles: [],
            mode: modebank.current(),
            mouseButtonsDown: 0
        },
        mounted: function () {
            const canvas = document.getElementById('canvas')
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
            canvas.addEventListener('mousedown', this.handleMousedown)
            canvas.addEventListener('mousemove', this.handleMousemove)
            canvas.addEventListener('mouseup', this.handleMouseup)
            this.ctx = canvas.getContext('2d')
        },
        methods: {
            handleMousedown: function (e) {
                this.mouseButtonsDown++
                switch (this.mode) {
                    case modebank.ruler:
                        this.handleRulerMousedown(e)
                        break
                    case modebank.compass:
                        this.handleCompassMousedown(e)
                        break
                }
            },
            handleMousemove: function (e) {
                switch (this.mode) {
                    case modebank.ruler:
                        this.handleRulerMousemove(e)
                        break
                    case modebank.compass:
                        this.handleCompassMousemove(e)
                        break
                }
            },
            handleMouseup: function (e) {
                this.mouseButtonsDown--
                switch (this.mode) {
                    case modebank.ruler:
                        this.handleRulerMouseup(e)
                        break
                    case modebank.compass:
                        this.handleCompassMouseup(e)
                        break
                }
            },

            // ruler event handlers
            handleRulerMousedown: function (e) {
                this.startingPoint = [e.offsetX, e.offsetY]
            },
            handleRulerMousemove: function (e) {
                if (this.mouseButtonsDown) {
                    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)
                    this.drawHistory()
                    this.drawLine(this.startingPoint, [e.offsetX, e.offsetY])
                }
            },
            handleRulerMouseup: function (e) {
                this.endingPoint = [e.offsetX, e.offsetY]
                this.lines.push([this.startingPoint, this.endingPoint])
            },

            // compass event handlers
            handleCompassMousedown: function (e) {
                this.startingPoint = [e.offsetX, e.offsetY]
            },
            handleCompassMousemove: function (e) {
                if (this.mouseButtonsDown) {
                    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)
                    this.drawHistory()
                    this.drawCircle(this.startingPoint, [e.offsetX, e.offsetY])
                }
            },
            handleCompassMouseup: function (e) {
                this.endingPoint = [e.offsetX, e.offsetY]
                this.circles.push([this.startingPoint, this.endingPoint])
            },

            changeMode: function (modeStr) {
                modebank.changeMode(modeStr)
                this.mode = modeStr
            },
            drawHistory: function () {
                this.drawLines()
                this.drawCircles()
            },
            drawLines: function () {
                this.lines.forEach(line => {
                    this.drawLine(line[0], line[1])
                })
            },
            drawLine: function (startPoint, endPoint) {
                this.ctx.beginPath()
                this.ctx.moveTo(startPoint[0], startPoint[1])
                this.ctx.lineTo(endPoint[0], endPoint[1])
                this.ctx.stroke()
            },
            drawCircles: function () {
                this.circles.forEach(circle => {
                    this.drawCircle(circle[0], circle[1])
                })
            },
            drawCircle: function (startPoint, endPoint) {
                const radius = this.distanceBetween(startPoint, endPoint)
                this.drawDot(startPoint)
                this.ctx.beginPath()
                this.ctx.arc(startPoint[0], startPoint[1], radius, 0, 2 * Math.PI)
                this.ctx.stroke()
            },
            drawDot: function (point) {
                const radius = 2
                this.ctx.beginPath()
                this.ctx.arc(point[0], point[1], radius, 0, 2 * Math.PI)
                this.ctx.fill()
            },
            distanceBetween: function (startPoint, endPoint) {
                const dx = Math.abs(startPoint[0] - endPoint[0])
                const dy = Math.abs(startPoint[1] - endPoint[1])
                return Math.sqrt(dx * dx + dy * dy)
            }
        }
    })
})
