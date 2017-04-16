function Modebank(config) {
    for (let modeStr in config) {
        if (config.hasOwnProperty(modeStr)) {
            const hasSteps = config[modeStr].hasOwnProperty('steps') && config[modeStr].steps.length
            this[modeStr] = {
                name: modeStr
            }
            if (config[modeStr].hasOwnProperty('current') && config[modeStr].current) {
                this._currentMode = this[modeStr]
                if (hasSteps) this._currentStep = 0
            }
            if (hasSteps) {
                this[modeStr]._steps = config[modeStr].steps
                const self = this
                config[modeStr].steps.forEach(function (step) {
                    self[modeStr][step] = step
                })
            }
        }
    }
}

Modebank.prototype.whichMode = function () {
    return this._currentMode.name
}

Modebank.prototype.whichStep = function () {
    return this._currentMode._steps[this._currentStep]
}

Modebank.prototype.nextStep = function () {
    if (this._currentStep === undefined) return
    this._currentStep += 1
    if (this._currentStep >= this._currentMode._steps.length)
        this._currentStep = 0
}

Modebank.prototype.mode = function (modeStr) {
    this._currentMode = this[modeStr]
    if (this[modeStr].hasOwnProperty('steps'))
        this._currentStep = 0
}

document.addEventListener('DOMContentLoaded', function () {

    modebank = new Modebank({
        ruler: {
            current: true,
            steps: [
                'select-first-point',
                'select-second-point'
            ]
        },
        compass: {
            steps: [
                'select-first-point',
                'select-second-point'
            ]
        }
    })
    console.log(modebank)

    new Vue({
        el: '#canvas',
        data: {
            startingPoint: [],
            endingPoint: [],
            lines: [],
            circles: [],
            mode: modebank.whichMode()
        },
        mounted: function () {
            this.$el.width = window.innerWidth
            this.$el.height = window.innerHeight
            this.$el.addEventListener('mousedown', this.handleMousedown)
            this.$el.addEventListener('mousemove', this.handleMousemove)
        },
        methods: {
            handleMousedown: function (e) {
                switch (modebank.whichMode()) {
                    case modebank.ruler.name:
                        this.handleRulerMousedown(e)
                        break
                    case modebank.compass.name:
                        this.handleCompassMousedown(e)
                        break
                }
            },
            handleMousemove: function (e) {
                switch (modebank.whichMode()) {
                    case modebank.ruler.name:
                        this.handleRulerMousemove(e)
                        break
                    case modebank.compass.name:
                        this.handleCompassMousemove(e)
                        break
                }
            },
            handleRulerMousedown: function (e) {
                switch (modebank.whichStep()) {
                    case modebank.ruler['select-first-point']:
                        this.startingPoint = [e.offsetX, e.offsetY]
                        modebank.nextStep()
                        break
                    case modebank.ruler['select-second-point']:
                        this.endingPoint = [e.offsetX, e.offsetY]
                        this.lines.push([this.startingPoint, this.endingPoint])
                        modebank.nextStep()
                        break
                }
            },
            handleRulerMousemove: function (e) {
                switch (modebank.whichStep()) {
                    case 'select-first-point':
                        break
                    case 'select-second-point':
                        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
                        this.drawLines()
                        this.drawLine(this.startingPoint, [e.offsetX, e.offsetY])
                        break
                }
            },
            handleCompassMousedown: function (e) {
                switch (modebank.whichStep()) {
                    case modebank.compass['select-first-point']:
                        this.startingPoint = [e.offsetX, e.offsetY]
                        modebank.nextStep()
                        break
                    case modebank.compass['select-second-point']:
                        this.endingPoint = [e.offsetX, e.offsetY]
                        this.circles.push([this.startingPoint, this.endingPoint])
                        modebank.nextStep()
                        break
                }
            },
            handleCompassMousemove: function (e) {
                switch (modebank.whichStep()) {
                    case 'select-first-point':
                        break
                    case 'select-second-point':
                        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
                        this.drawCircles()
                        this.drawCircle(this.startingPoint, [e.offsetX, e.offsetY])
                        break
                }
            },
            changeMode: function (modeStr) {
                modebank.mode(modeStr)
                this.mode = modeStr
            },
            drawLines: function () {
                this.lines.forEach(line => {
                    this.drawLine(line[0], line[1])
                })
            },
            drawLine: function (startPoint, endPoint) {
                ctx.beginPath()
                ctx.moveTo(startPoint[0], startPoint[1])
                ctx.lineTo(endPoint[0], endPoint[1])
                ctx.stroke()
            },
            drawCircles: function () {
                this.circles.forEach(circle => {
                    this.drawCircle(circle[0], circle[1])
                })
            },
            drawCircle: function (startPoint, endPoint) {
                const radius = this.distanceBetween(startPoint, endPoint)
                ctx.beginPath()
                ctx.arc(startPoint[0], startPoint[1], radius, 0, 2 * Math.PI)
                ctx.stroke()
            },
            distanceBetween: function (startPoint, endPoint) {
                const dx = Math.abs(startPoint[0] - endPoint[0])
                const dy = Math.abs(startPoint[1] - endPoint[1])
                return Math.sqrt(dx * dx + dy * dy)
            }
        }
    })

    const ctx = document.getElementById('canvas').getContext('2d')
})
