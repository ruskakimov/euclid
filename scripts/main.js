function createModebank(modes) {
    var modebank = {}
    var current = modes[0]

    modes.forEach(mode => modebank[mode] = mode)

    modebank.current = () => current

    modebank.changeMode = (newMode) => {
        if (modebank[newMode]) {
            current = newMode
            return true
        }
        return false
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

    const modebank = createModebank(['ruler', 'compass', 'hand'])

    new Vue({
        el: '#app',
        data: {
            startingPoint: [],
            history: [],
            mode: modebank.current(),
            mouseButtonsDown: 0,
            displayHistoryTill: 0,
            handOffset: [0, 0],
            zoom: 1
        },
        mounted: function () {
            const canvas = document.getElementById('canvas')
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
            canvas.addEventListener('mousedown', this.handleMousedown)
            canvas.addEventListener('mousemove', this.handleMousemove)
            canvas.addEventListener('mouseup', this.handleMouseup)
            canvas.addEventListener('mouseout', this.handleMouseout)
            canvas.addEventListener('wheel', this.handleWheel)
            document.addEventListener('keydown', this.handleKeydown)
            this.ctx = canvas.getContext('2d')
        },
        methods: {
            // app event handlers
            handleWheel: function (e) {
                this.zoom += e.deltaY / 1000
                console.log(this.zoom)
                this.drawHistory()
                this.ctx.restore()
            },
            handleKeydown: function (e) {
                if (e.ctrlKey) {
                    switch (e.keyCode) {
                        case 89:
                            this.redo()
                            break
                        case 90:
                            this.undo()
                            break
                    }
                }
            },
            handleMousedown: function (e) {
                this.mouseButtonsDown++
                switch (this.mode) {
                    case modebank.ruler:
                        this.handleRulerMousedown(e)
                        break
                    case modebank.compass:
                        this.handleCompassMousedown(e)
                        break
                    case modebank.hand:
                        this.handleHandMousedown(e)
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
                    case modebank.hand:
                        this.handleHandMousemove(e)
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
                    case modebank.hand:
                        this.handleHandMouseup(e)
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
                this.addToHistory(new Line(
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
                this.addToHistory(new Circle(
                    this.startingPoint[0],
                    this.startingPoint[1],
                    radius
                ))
            },

            // hand event handlers
            handleHandMousedown: function (e) {
                this.startingPoint = [e.offsetX, e.offsetY]
            },
            handleHandMousemove: function (e) {
                if (this.mouseButtonsDown) {
                    this.handOffset[0] = (e.offsetX - this.startingPoint[0])
                    this.handOffset[1] = (e.offsetY - this.startingPoint[1])
                    this.drawHistoryWithOffset()
                }
            },
            handleHandMouseup: function (e) {
                // update lines with offset
                const offX = this.handOffset[0],
                      offY = this.handOffset[1]
                this.history = this.history.map(obj => {
                    if (obj instanceof Line) {
                        obj.x0 += offX
                        obj.x1 += offX
                        obj.y0 += offY
                        obj.y1 += offY
                    }
                    else if (obj instanceof Circle) {
                        obj.x0 += offX
                        obj.y0 += offY
                    }
                    return obj
                })
                this.handOffset = [0, 0]
            },

            // app operations
            undo: function () {
                this.displayHistoryTill = Math.max(
                    0,
                    this.displayHistoryTill - 1
                )
                this.drawHistory()
            },
            redo: function () {
                this.displayHistoryTill = Math.min(
                    this.history.length,
                    this.displayHistoryTill + 1
                )
                this.drawHistory()
            },
            changeMode: function (modeStr) {
                modebank.changeMode(modeStr)
                this.mode = modeStr
            },
            addToHistory: function (obj) {
                this.history = this.history.slice(0, this.displayHistoryTill)
                this.history.push(obj)
                this.displayHistoryTill = this.history.length
            },
            drawHistory: function () {
                this.ctx.save()
                this.ctx.scale(this.zoom, this.zoom)
                this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)
                for (var i = 0; i < this.displayHistoryTill; i++) {
                    const obj = this.history[i]
                    if (obj instanceof Line)
                        this.drawLine(obj.x0, obj.y0, obj.x1, obj.y1)
                    else if (obj instanceof Circle)
                        this.drawCircle(obj.x0, obj.y0, obj.radius)
                }
                this.ctx.restore()
            },
            drawHistoryWithOffset: function () {
                this.ctx.save()
                this.ctx.scale(this.zoom, this.zoom)
                this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)
                const offX = this.handOffset[0],
                      offY = this.handOffset[1]
                for (var i = 0; i < this.displayHistoryTill; i++) {
                    const obj = this.history[i]
                    if (obj instanceof Line)
                        this.drawLine(
                            obj.x0 + offX,
                            obj.y0 + offY,
                            obj.x1 + offX,
                            obj.y1 + offY
                        )
                    else if (obj instanceof Circle)
                        this.drawCircle(
                            obj.x0 + offX,
                            obj.y0 + offY,
                            obj.radius
                        )
                }
                this.ctx.restore()
            },

            // helping functions
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
