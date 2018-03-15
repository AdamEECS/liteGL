class Mesh extends Object {
    // 表示三维物体的类
    constructor() {
        super()

        this.position = Vector.new(0, 0, 0)
        this.rotation = Vector.new(0, 0, 0)
        this.scale = Vector.new(1, 1, 1)
        this.vertices = null
        this.indices = null
    }
    // 返回一个正方体
    static cube() {
        // 8 points
        let points = [
            -1, 1,  -1,     // 0
            1,  1,  -1,     // 1
            -1, -1, -1,     // 2
            1,  -1, -1,     // 3
            -1, 1,  1,      // 4
            1,  1,  1,      // 5
            -1, -1, 1,      // 6
            1,  -1, 1,      // 7
        ]

        let vertices = []
        for (let i = 0; i < points.length; i += 3) {
            let v = Vector.new(points[i], points[i+1], points[i+2])
            let c = Color.red()
            // let c = Color.randomColor()
            vertices.push(Vertex.new(v, c))
        }

        // 12 triangles * 3 vertices each = 36 vertex indices
        let indices = [
            // 12
            [0, 1, 2],
            [1, 3, 2],
            [1, 7, 3],
            [1, 5, 7],
            [5, 6, 7],
            [5, 4, 6],
            [4, 0, 6],
            [0, 2, 6],
            [0, 4, 5],
            [5, 1, 0],
            [2, 3, 7],
            [2, 7, 6],
        ]
        let m = this.new()
        m.vertices = vertices
        m.indices = indices
        return m
    }

    static from3d(string3d) {
        let list = string3d.split('\n')
        let verticesNum = int(list[2].split(' ')[1])
        let trianglesNum = int(list[3].split(' ')[1])
        let verticesList = list.slice(4, 4 + verticesNum)
        let trianglesList = list.slice(4 + verticesNum, 4 + verticesNum + trianglesNum)
        let [w, h, pixels] = Mesh.fromImage(stringImage)

        let vertices = []
        for (let i of verticesList) {
            let [x, y, z, nx, ny, nz, u, v] = i.split(' ').map(j => Number(j))
            let p = Vector.new(x, y, z)
            u = int(u * w)
            v = int(v * h)
            let c = pixels[v * w + u]
            let vertex = Vertex.new(p, c)
            vertex.texture = Vector.new(u, v)
            vertices.push(vertex)
        }

        let indices = trianglesList.map(i => i.split(' ').map(j => int(j)))
        let m = this.new()
        m.vertices = vertices
        m.indices = indices
        m.w = w
        m.h = h
        m.pixels = pixels
        return m
    }

    static fromImage(stringImage) {
        let list = stringImage.split('\n')
        let w = int(list[2])
        let h = int(list[3])
        let data = list.slice(4)
        data = data.map(i => i.split(' ').map(j => Number(j)))
        let pixels = []
        for (var y = 0; y < h; y++) {
            for (var x = 0; x < w; x++) {
                let color = Color.from32(data[y][x])
                pixels.push(color)
            }
        }
        return [w, h, pixels]
    }
}
