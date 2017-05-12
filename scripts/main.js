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

function Line(x0, y0, x1, y1) {
    this.x0 = x0
    this.y0 = y0
    this.x1 = x1
    this.y1 = y1
}

function Circle(x0, y0, radius) {
    this.x0 = x0
    this.y0 = y0
    this.radius = radius
}

document.addEventListener('DOMContentLoaded', function () {

    const modebank = createModebank(['ruler', 'compass'])

    new Vue({
        el: '#app',
        data: {
            startingPoint: [],
            endingPoint: [],
            history: [],
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
            canvas.addEventListener('mouseout', this.handleMouseout)
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
                if (this.mouseButtonsDown === 0) return
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
            handleMouseout: function (e) {
                this.mouseButtonsDown = 0
            },

            // ruler event handlers
            handleRulerMousedown: function (e) {
                this.startingPoint = [e.offsetX, e.offsetY]
            },
            handleRulerMousemove: function (e) {
                if (this.mouseButtonsDown) {
                    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)
                    this.drawHistory()
                    this.drawLine(
                        this.startingPoint[0],
                        this.startingPoint[1],
                        e.offsetX,
                        e.offsetY
                    )
                }
            },
            handleRulerMouseup: function (e) {
                this.history.push(new Line(
                    this.startingPoint[0],
                    this.startingPoint[1],
                    e.offsetX,
                    e.offsetY
                ))
            },

            // compass event handlers
            handleCompassMousedown: function (e) {
                this.startingPoint = [e.offsetX, e.offsetY]
            },
            handleCompassMousemove: function (e) {
                if (this.mouseButtonsDown) {
                    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)
                    this.drawHistory()
                    const radius = this.distanceBetween(
                        this.startingPoint[0],
                        this.startingPoint[1],
                        e.offsetX,
                        e.offsetY
                    )
                    this.drawCircle(
                        this.startingPoint[0],
                        this.startingPoint[1],
                        radius
                    )
                }
            },
            handleCompassMouseup: function (e) {
                const radius = this.distanceBetween(
                    this.startingPoint[0],
                    this.startingPoint[1],
                    e.offsetX,
                    e.offsetY
                )
                this.history.push(new Circle(
                    this.startingPoint[0],
                    this.startingPoint[1],
                    radius
                ))
            },

            changeMode: function (modeStr) {
                modebank.changeMode(modeStr)
                this.mode = modeStr
            },
            drawHistory: function () {
                this.history.forEach(obj => {
                    if (obj instanceof Line)
                        this.drawLine(obj.x0, obj.y0, obj.x1, obj.y1)
                    else if (obj instanceof Circle)
                        this.drawCircle(obj.x0, obj.y0, obj.radius)
                })
            },
            drawLine: function (x0, y0, x1, y1) {
                this.ctx.beginPath()
                this.ctx.moveTo(x0, y0)
                this.ctx.lineTo(x1, y1)
                this.ctx.stroke()
            },
            drawCircle: function (x0, y0, radius) {
                this.drawDot(x0, y0)
                this.ctx.beginPath()
                this.ctx.arc(x0, y0, radius, 0, 2 * Math.PI)
                this.ctx.stroke()
            },
            drawDot: function (x0, y0) {
                const radius = 2
                this.ctx.beginPath()
                this.ctx.arc(x0, y0, radius, 0, 2 * Math.PI)
                this.ctx.fill()
            },
            distanceBetween: function (x0, y0, x1, y1) {
                const dx = Math.abs(x0 - x1)
                const dy = Math.abs(y0 - y1)
                return Math.sqrt(dx * dx + dy * dy)
            }
        }
    })
})
