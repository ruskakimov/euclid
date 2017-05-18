function createModebank(modes) {
    var modebank = {}
    var current = modes[0]
    modes.forEach(function (mode) {
        return modebank[mode] = mode
    })
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

    const ZOOM_LIMIT_MIN = 0.1
    const ZOOM_LIMIT_MAX = 10
    const modebank = createModebank(['ruler', 'compass', 'hand'])

    new Vue({
        el: '#app',
        data: {
            startingPoint: [],
            history: [],
            previousMode: modebank.ruler,
            mode: modebank.ruler,
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
            document.addEventListener('keyup', this.handleKeyup)
            this.ctx = canvas.getContext('2d')
        },
        methods: {
            // app event handlers
            handleWheel: function (e) {
                e.preventDefault()
                const deltaZoom = e.deltaY / 1000
                var z0 = this.zoom,
                    z1 = this.zoom + deltaZoom
                z1 = Math.max(ZOOM_LIMIT_MIN, z1)
                z1 = Math.min(ZOOM_LIMIT_MAX, z1)
                const offX = e.offsetX / z0 * (z0 / z1 - 1),
                      offY = e.offsetY / z0 * (z0 / z1 - 1)
                this.translateHistory(offX, offY)
                this.zoom = z1
                this.drawHistory()
            },
            handleKeydown: function (e) {
                if (e.ctrlKey || e.metaKey) {
                    switch (e.key) {
                        case 'Z':
                            this.redo()
                            break
                        case 'z':
                            this.undo()
                            break
                    }
                }
                else {
                    console.log(e)
                    switch (e.key) {
                        case 'Alt':
                            e.preventDefault()
                            e.stopPropagation()
                            this.changeMode(modebank.hand)
                            break
                        case '1':
                            this.changeMode(modebank.ruler)
                            break
                        case '2':
                            this.changeMode(modebank.compass)
                            break
                        case '3':
                            this.changeMode(modebank.hand)
                            break
                    }
                }
            },
            handleKeyup: function (e) {
                switch (e.key) {
                    case 'Alt':
                        this.changeMode(this.previousMode)
                        break
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
                    this.startingPoint[0] / this.zoom,
                    this.startingPoint[1] / this.zoom,
                    e.offsetX / this.zoom,
                    e.offsetY / this.zoom
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
                    this.startingPoint[0] / this.zoom,
                    this.startingPoint[1] / this.zoom,
                    radius / this.zoom
                ))
            },

            // hand event handlers
            handleHandMousedown: function (e) {
                this.startingPoint = [e.offsetX, e.offsetY]
            },
            handleHandMousemove: function (e) {
                if (this.mouseButtonsDown) {
                    this.handOffset[0] = (e.offsetX - this.startingPoint[0]) / this.zoom
                    this.handOffset[1] = (e.offsetY - this.startingPoint[1]) / this.zoom
                    this.drawHistoryWithOffset()
                }
            },
            handleHandMouseup: function (e) {
                const offX = this.handOffset[0],
                      offY = this.handOffset[1]
                this.translateHistory(offX, offY)
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
                this.previousMode = this.mode
                this.mode = modeStr
            },
            addToHistory: function (obj) {
                this.history = this.history.slice(0, this.displayHistoryTill)
                this.history.push(obj)
                this.displayHistoryTill = this.history.length
            },
            drawHistory: function () {
                this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)
                for (var i = 0; i < this.displayHistoryTill; i++) {
                    const obj = this.history[i]
                    if (obj instanceof Line)
                        this.drawScaledLine(obj.x0, obj.y0, obj.x1, obj.y1)
                    else if (obj instanceof Circle)
                        this.drawScaledCircle(obj.x0, obj.y0, obj.radius)
                }
            },
            drawHistoryWithOffset: function () {
                // does not change history
                this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)
                const offX = this.handOffset[0],
                      offY = this.handOffset[1]
                for (var i = 0; i < this.displayHistoryTill; i++) {
                    const obj = this.history[i]
                    if (obj instanceof Line)
                        this.drawScaledLine(
                            obj.x0 + offX,
                            obj.y0 + offY,
                            obj.x1 + offX,
                            obj.y1 + offY,
                            this.zoom
                        )
                    else if (obj instanceof Circle)
                        this.drawScaledCircle(
                            obj.x0 + offX,
                            obj.y0 + offY,
                            obj.radius,
                            this.zoom
                        )
                }
            },
            translateHistory: function (offX, offY) {
                // move all history with offset
                this.history = this.history.map(function(obj) {
                    if (obj instanceof Line) {
                        this.moveLine(obj, offX, offY)
                    }
                    else if (obj instanceof Circle) {
                        this.moveCircle(obj, offX, offY)
                    }
                    return obj
                })
            },
            resetZoom: function () {
                this.zoom = 1
                this.drawHistory()
                // translate history so the center of the screen does not move
            },

            // helping functions
            moveLine: function (line, offX, offY) {
                line.x0 += offX
                line.x1 += offX
                line.y0 += offY
                line.y1 += offY
            },
            drawScaledLine: function (x0, y0, x1, y1) {
                this.drawLine(
                    x0 * this.zoom,
                    y0 * this.zoom,
                    x1 * this.zoom,
                    y1 * this.zoom
                )
            },
            drawLine: function (x0, y0, x1, y1) {
                this.ctx.beginPath()
                this.ctx.moveTo(x0, y0)
                this.ctx.lineTo(x1, y1)
                this.ctx.stroke()
            },
            moveCircle: function (circle, offX, offY) {
                circle.x0 += offX
                circle.y0 += offY
            },
            drawScaledCircle: function (x0, y0, radius) {
                this.drawCircle(
                    x0 * this.zoom,
                    y0 * this.zoom,
                    radius * this.zoom
                )
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
        },
        filters: {
            roundTo2DecPlaces: function (num) {
                return Math.floor(num * 100) / 100
            }
        }
    })
})
