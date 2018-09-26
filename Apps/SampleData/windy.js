var Particle = function() {
    this.x = null,
        this.dx = null,
        this.dx = null,
        this.y = null,
        this.age = null,
        this.birthAge = null,
        this.path = null
}
    , WindField = function(t) {
    this.west = null,
        this.east = null,
        this.south = null,
        this.north = null,
        this.rows = null,
        this.cols = null,
        this.dx = null,
        this.dy = null,
        this.unit = null,
        this.date = null,
        this.grid = null,
        this._init(t)
};
WindField.prototype = {
    constructor: WindField,
    _init: function(t) {
        var i = t.header
            , n = t.uComponent
            , e = t.vComponent;
        this.west = +i.lo1,
            this.east = +i.lo2,
            this.south = +i.la2,
            this.north = +i.la1,
            this.rows = +i.ny,
            this.cols = +i.nx,
            this.dx = +i.dx,
            this.dy = +i.dy,
            this.unit = i.parameterUnit,
            this.date = i.refTime,
            this.grid = [];
        for (var r = 0, s = null, a = null, l = 0; l < this.rows; l++) {
            s = [];
            for (var h = 0; h < this.cols; h++,
                r++)
                a = this._calcUV(n[r], e[r]),
                    s.push(a);
            this.grid.push(s)
        }
    },
    _calcUV: function(t, i) {
        return [+t, +i, Math.sqrt(t * t + i * i)]
    },
    _bilinearInterpolation: function(t, i, n, e, r, s) {
        var a = 1 - t
            , l = 1 - i
            , h = a * l
            , o = t * l
            , u = a * i
            , d = t * i
            , c = n[0] * h + e[0] * o + r[0] * u + s[0] * d
            , p = n[1] * h + e[1] * o + r[1] * u + s[1] * d;
        return this._calcUV(c, p)
    },
    getIn: function(t, i) {
        var n, e, r = Math.floor(t), s = Math.floor(i);
        if (r === t && s === i)
            return this.grid[i][t];
        n = r + 1,
            e = s + 1;
        var a = this.getIn(r, s)
            , l = this.getIn(n, s)
            , h = this.getIn(r, e)
            , o = this.getIn(n, e);
        return this._bilinearInterpolation(t - r, i - s, a, l, h, o)
    },
    isInBound: function(t, i) {
        return 0 <= t && t < this.cols - 2 && 0 <= i && i < this.rows - 2
    }
};
var _primitives = null
    , SPEED_RATE = .15
    , PARTICLES_NUMBER = 2e3
    , MAX_AGE = 10
    , BRIGHTEN = 1.5
    , Windy = function(t, i) {
        this.windData = t,
        this.windField = null,
        this.particles = [],
        this.lines = null,
        _primitives = i.scene.primitives,
        this._init()
};
Windy.prototype = {
    constructor: Windy,
    _init: function() {
        this.windField = this.createField();
        for (var t = 0; t < PARTICLES_NUMBER; t++)
            this.particles.push(this.randomParticle(new Particle))
    },
    createField: function() {
        var t = this._parseWindJson();
        return new WindField(t)
    },
    animate: function() {
        var e = this
            , r = e.windField
            , t = e.particles
            , s = []
            , a = null
            , l = null
            , h = null;
        t.forEach(function(t) {
            if (t.age <= 0 && e.randomParticle(t),
                0 < t.age) {
                var i = t.x
                    , n = t.y;
                r.isInBound(i, n) ? (h = r.getIn(i, n),
                    a = i + SPEED_RATE * h[0],
                    l = n + SPEED_RATE * h[1],
                    t.path.push(a, l),
                    t.x = a,
                    t.y = l,
                    s.push(e._createLineInstance(e._map(t.path), t.age / t.birthAge)),
                    t.age--) : t.age = 0
            }
        }),
        s.length <= 0 && this.removeLines(),
            e._drawLines(s)
    },
    _parseWindJson: function() {
        var i = null
            , n = null
            , e = null;
        return this.windData.forEach(function(t) {
            switch (t.header.parameterCategory + "," + t.header.parameterNumber) {
                case "2,2":
                    i = t.data,
                        e = t.header;
                    break;
                case "2,3":
                    n = t.data
            }
        }),
            {
                header: e,
                uComponent: i,
                vComponent: n
            }
    },
    removeLines: function() {
        this.lines && (_primitives.remove(this.lines),
            this.lines.destroy())
    },
    _map: function(t) {
        for (var i = t.length, n = this.windField, e = n.dx, r = n.dy, s = n.west, a = n.north, l = [], h = 0; h <= i - 2; h += 2)
            l.push(s + t[h] * e, a - t[h + 1] * r);
        return l
    },
    _createLineInstance: function(t, i) {
        for (var n = [], e = t.length, r = e / 2, s = 0; s < e; s++)
            n.push(Cesium.Color.WHITE.withAlpha(s / r * i * BRIGHTEN));
        return new Cesium.GeometryInstance({
            geometry: new Cesium.PolylineGeometry({
                positions: Cesium.Cartesian3.fromDegreesArray(t),
                colors: n,
                width: 1.5,
                colorsPerVertex: !0
            })
        })
    },
    _drawLines: function(t) {
        this.removeLines();
        var i = new Cesium.Primitive({
            appearance: new Cesium.PolylineColorAppearance({
                translucent: !0
            }),
            geometryInstances: t,
            asynchronous: !1
        });
        this.lines = _primitives.add(i)
    },
    randomParticle: function(t) {
        for (var i, n, e = 30; i = Math.floor(Math.random() * (this.windField.cols - 2)),
            n = Math.floor(Math.random() * (this.windField.rows - 2)),
        this.windField.getIn(i, n)[2] <= 0 && e++ < 30; )
            ;
        return t.x = i,
            t.y = n,
            t.age = Math.round(Math.random() * MAX_AGE),
            t.birthAge = t.age,
            t.path = [i, n],
            t
    }
};
