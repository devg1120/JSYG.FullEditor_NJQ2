import JSYG from "../JSYG-wrapper/JSYG-wrapper.js";
import StdConstruct from "../JSYG.StdConstruct/JSYG.StdConstruct.js";

("use strict");

export default function PolylineDrawer(opt) {
    if (opt) this.set(opt);
}

PolylineDrawer.prototype = new StdConstruct();

PolylineDrawer.prototype.constructor = PolylineDrawer;
PolylineDrawer.prototype.area = null;
PolylineDrawer.prototype.inProgress = false;
PolylineDrawer.prototype.strengthClosingMagnet = 5;
PolylineDrawer.prototype.ondraw = false;
PolylineDrawer.prototype.onbeforeend = false;
PolylineDrawer.prototype.onend = false;
PolylineDrawer.prototype.onbeforenewseg = false;
PolylineDrawer.prototype.onnewseg = false;

function isClosed(points) {
    var seg1 = points.getItem(0),
        seg2 = points.getItem(points.numberOfItems - 1);

    return seg1.x == seg2.x && seg1.y == seg2.y;
}

PolylineDrawer.prototype.draw = function (polyElmt, e) {
    var poly = new JSYG(polyElmt);

    if (!poly[0].parentNode) throw new Error("Il faut attacher l'élément à l'arbre DOM");

    var jSvg = this.area ? new JSYG(this.area) : poly.offsetParent("farthest"),
        mtx = poly.getMtx("screen").inverse(),
        xy = new JSYG.Vect(e.clientX, e.clientY).mtx(mtx),
        node = poly[0],
        points = node.points,
        that = this;

    function mousemove(e) {
        var mtx = poly.getMtx("screen").inverse(),
            xy = new JSYG.Vect(e.clientX, e.clientY).mtx(mtx),
            nbSegs = points.numberOfItems,
            seg = points.getItem(nbSegs - 1),
            pos,
            first,
            ref;

        if (that.strengthClosingMagnet != null) {
            first = points.getItem(0);
            ref = new JSYG.Vect(first.x, first.y).mtx(mtx.inverse());
            pos = new JSYG.Vect(e.clientX, e.clientY);

            if (JSYG.distance(ref, pos) < that.strengthClosingMagnet) {
                xy.x = first.x;
                xy.y = first.y;
            }
        }

        seg.x = xy.x;
        seg.y = xy.y;

        points.replaceItem(seg, nbSegs - 1);

        that.trigger("draw", node, e);
    }

    function mousedown(e) {
        if (that.trigger("beforenewseg", node, e) === false) return;

        //si la courbe est fermée, un clic suffit pour terminer.
        if (points.numberOfItems > 3 && isClosed(points)) {
            if (that.trigger("beforeend", node, e) === false) return;
            return that.end();
        }

        if (e.detail === 2) return; //pas d'action au double-clic

        var mtx = poly.getMtx("screen").inverse(),
            xy = new JSYG.Vect(e.clientX, e.clientY).mtx(mtx);

        points.appendItem(xy.toSVGPoint());

        that.trigger("newseg", node, e);
    }

    function dblclick(e, keepLastSeg) {
        points.removeItem(points.numberOfItems - 1);

        if (that.trigger("beforeend", node, e) === false) return;

        //points.removeItem(points.numberOfItems-1);

        that.end();
    }

    this.end = function () {
        var first;
        jSvg[0].removeEventListener("mousemove", mousemove);
        jSvg[0].removeEventListener("mousedown", mousedown);
        jSvg[0].removeEventListener("dblclick", dblclick);

        this.inProgress = false;

        const event = new CustomEvent("end", { detail: e });
        node.dispatchEvent(event);

        this.end = function () {
            return this;
        };
    };

    if (points.numberOfItems === 0) points.appendItem(xy.toSVGPoint());

    this.inProgress = true;

    jSvg[0].addEventListener("mousemove", mousemove);
    jSvg[0].addEventListener("mousedown", mousedown);
    jSvg[0].addEventListener("dblclick", dblclick);

    mousedown(e);

    return this;
};

PolylineDrawer.prototype.end = function () {
    return this;
};
