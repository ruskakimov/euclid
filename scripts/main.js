document.addEventListener('DOMContentLoaded', function () {

    const states = [
        'select-first-point',
        'select-second-point'
    ]

    new Vue({
        el: '#canvas',
        data: {
            startingPoint: [],
            endingPoint: [],
            lines: [],
            state: 0
        },
        mounted: function () {
            this.$el.width = window.innerWidth
            this.$el.height = window.innerHeight
            this.$el.addEventListener('mousedown', this.handleMousedown)
            this.$el.addEventListener('mousemove', this.handleMousemove)
        },
        methods: {
            handleMousedown: function (e) {
                switch (states[this.state]) {
                    case 'select-first-point':
                        this.startingPoint = [e.offsetX, e.offsetY]
                        this.nextState()
                        break
                    case 'select-second-point':
                        this.endingPoint = [e.offsetX, e.offsetY]
                        this.lines.push([this.startingPoint, this.endingPoint])
                        this.nextState()
                        break
                }
            },
            nextState: function () {
                this.state += 1
                if (this.state >= states.length)
                    this.state = 0
            },
            handleMousemove: function (e) {
                switch (states[this.state]) {
                    case 'select-first-point':
                        break
                    case 'select-second-point':
                        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
                        this.drawLines()
                        this.drawLine(this.startingPoint, [e.offsetX, e.offsetY])
                        break
                }
            },
            drawLines: function () {
                this.lines.forEach(line => {
                    this.drawLine(line[0], line[1])
                })
            },
            drawLine: function (start, end) {
                ctx.beginPath()
                ctx.moveTo(start[0], start[1])
                ctx.lineTo(end[0], end[1])
                ctx.stroke()
            }
        }
    })

    const ctx = document.getElementById('canvas').getContext('2d')
})
