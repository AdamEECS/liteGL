class Vertex extends Object {
    constructor(position, color, texture, normal) {
        super()
        this.position = position
        this.color = color
        this.texture = texture
        this.normal = normal
    }
    interpolate(other, factor) {
        let a = this
        let b = other
        let p = a.position.interpolate(b.position, factor)
        let c = a.color.interpolate(b.color, factor)
        let t
        let n
        if (a.texture !== undefined && b.texture !== undefined) {
            t = a.texture.interpolate(b.texture, factor)
        }
        if (a.normal !== undefined && b.normal !== undefined) {
            n = a.normal.interpolate(b.normal, factor)
        }
        return Vertex.new(p, c, t, n)
    }
}
