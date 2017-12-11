class Camera extends Object {
    constructor() {
        super()
        this.position = Vector.new(0, 0, -10)
        this.target = Vector.new(0, 0, 0)
        this.up = Vector.new(0, 1, 0)
    }
}

class Canvas extends Object {
    constructor(selector) {
        super()
        let canvas = _e(selector)
        this.canvas = canvas
        this.context = canvas.getContext('2d')
        this.w = canvas.width
        this.h = canvas.height
        this.pixels = this.context.getImageData(0, 0, this.w, this.h)
        this.bytesPerPixel = 4
        this.zbuffer = []
        this.camera = Camera.new()
    }
    render() {
        let {pixels, context} = this
        context.putImageData(pixels, 0, 0)
    }
    clear(color=Color.transparent()) {
        for (var i = 0; i < this.pixels.data.length; i++) {
            this.pixels.data[i] = 0
        }
        for (var i = 0; i < this.zbuffer.length; i++) {
            this.zbuffer[i] = 100000
        }
        this.render()
    }
    _getPixel(x, y) {
        let int = Math.floor
        x = int(x)
        y = int(y)
        let i = (y * this.w + x) * this.bytesPerPixel
        let p = this.pixels.data
        return Color.new(p[i], p[i+1], p[i+2], p[i+3])
    }
    _setPixel(x, y, z, color) {
        x = int(x)
        y = int(y)
        let i = (y * this.w + x) * this.bytesPerPixel
        let index = y * this.w + x
        let depth = this.zbuffer[index]
        if (depth < z) {
            return
        }

        this.zbuffer[index] = z
        let p = this.pixels.data
        let {r, g, b, a} = color
        p[i] = int(r)
        p[i+1] = int(g)
        p[i+2] = int(b)
        p[i+3] = int(a)
    }
    drawPoint(point, color=Color.black()) {
        let {w, h} = this
        let p = point
        if (p.x >= 0 && p.x <= w) {
            if (p.y >= 0 && p.y <= h) {
                this._setPixel(p.x, p.y, p.z, color)
            }
        }
    }
    drawLine(v1, v2, color=Color.black()) {
        let [x1, y1, x2, y2] = [v1.x, v1.y, v2.x, v2.y]
        let dx = x2 - x1
        let dy = y2 - y1

        if(Math.abs(dx) > Math.abs(dy)) {
            let xmin = Math.min(x1, x2)
            let xmax = Math.max(x1, x2)
            for(let x = xmin; x <= xmax; x++) {
                let factor = dx == 0 ? 0 : (x - x1) / dx
                let v = v1.interpolate(v2, factor)
                v.z -= 0.0001
                this.drawPoint(v, color)
            }
        } else {
            let ymin = Math.min(y1, y2)
            let ymax = Math.max(y1, y2)
            for(let y = ymin; y <= ymax; y++) {
                let factor = dy == 0 ? 0 : (y - y1) / dy
                let v = v1.interpolate(v2, factor)
                v.z -= 0.0001
                this.drawPoint(v, color)
            }
        }
    }
    drawScanline(v1, v2) {
        let [a, b] = [v1, v2].sort((va, vb) => va.position.x - vb.position.x)
        let y = a.position.y
        let x1 = a.position.x
        let x2 = b.position.x
        for (let x = x1; x <= x2; x++) {
            let factor = 0
            if (x2 != x1) {
                factor = (x - x1) / (x2 - x1);
            }
            let v = a.interpolate(b, factor)
            if (v.texture !== undefined) {
                let {w, h, pixels} = this.mesh
                v.color = pixels[int(v.texture.y) * w + int(v.texture.x)]
            }
            this.drawPoint(v.position, v.color)
        }
    }
    drawTriangle(v1, v2, v3) {
        let [a, b, c] = [v1, v2, v3].sort((va, vb) => va.position.y - vb.position.y)
        let middle_factor = 0
        if (c.position.y - a.position.y != 0) {
            middle_factor = (b.position.y - a.position.y) / (c.position.y - a.position.y)
        }
        let middle = a.interpolate(c, middle_factor)
        let start_y = a.position.y
        let end_y = b.position.y
        for (let y = start_y; y <= end_y; y++) {
            let factor = 0
            if (end_y != start_y) {
                factor = (y - start_y) / (end_y - start_y)
            }
            let va = a.interpolate(middle, factor)
            let vb = a.interpolate(b, factor)
            this.drawScanline(va, vb)
        }
        start_y = b.position.y
        end_y = c.position.y
        for (let y = start_y; y <= end_y; y++) {
            let factor = 0
            if (end_y != start_y) {
                factor = (y - start_y) / (end_y - start_y)
            }
            let va = middle.interpolate(c, factor)
            let vb = b.interpolate(c, factor)
            this.drawScanline(va, vb)
        }
    }
    project(coordVector, transformMatrix) {
        let c = coordVector
        let {w, h} = this
        let [w2, h2] = [w/2, h/2]
        let point = transformMatrix.transform(c.position)
        let x = point.x * w2 + w2
        let y = - point.y * h2 + h2

        let v = Vector.new(x, y, point.z)
        return Vertex.new(v, c.color, c.texture, c.normal)
    }
    drawMesh(mesh) {
        let self = this
        self.mesh = mesh
        // camera
        let {w, h} = this
        let {position, target, up} = self.camera
        const view = Matrix.lookAtLH(position, target, up)
        const projection = Matrix.perspectiveFovLH(0.8, w / h, 0.1, 1)

        const rotation = Matrix.rotation(mesh.rotation)
        const translation = Matrix.translation(mesh.position)

        const world = rotation.multiply(translation)
        const transform = world.multiply(view).multiply(projection)

        for (let t of mesh.indices) {
            let [a, b, c] = t.map(i => mesh.vertices[i])
            let [v1, v2, v3] = [a, b, c].map(v => self.project(v, transform))
            self.drawTriangle(v1, v2, v3)
            // self.drawLine(v1.position, v2.position)
            // self.drawLine(v1.position, v3.position)
            // self.drawLine(v2.position, v3.position)
        }
    }
    fromimage(imageString) {
        let list = imageString.split('\n')
        let w = list[2]
        let h = list[3]
        let data = list.slice(4)
        data = data.map(i => i.split(' ').map(j => Number(j)))
        let pixels = []
        for (var y = 0; y < h; y++) {
            for (var x = 0; x < w; x++) {
                let color = Color.from32(data[y][x])
                pixels.push(color)
                this.drawPoint(Vector.new(x, y), color)
            }
        }
    }
}
