import JSYG from "../JSYG-wrapper/JSYG-wrapper.js";
import StdConstruct from "../JSYG.StdConstruct/JSYG.StdConstruct.js";

("use strict");

export default function ShapeDrawer(opt) {
    if (opt) this.set(opt);
}

ShapeDrawer.prototype = new StdConstruct();

ShapeDrawer.prototype.constructor = ShapeDrawer;

ShapeDrawer.prototype.ondraw = false;

ShapeDrawer.prototype.onend = false;

ShapeDrawer.prototype.minArea = 2;

ShapeDrawer.prototype.options = null;

ShapeDrawer.prototype.inProgress = false;

ShapeDrawer.prototype.drawLine = function (line, e) {
    line = new JSYG(line);

    var pos = line.getCursorPos(e),
        that = this;

    line.attr({ x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y });

    function mousemoveFct(e) {
        var pos = line.getCursorPos(e);

        line.attr({ x2: pos.x, y2: pos.y });

        that.trigger("draw", line[0], e, line[0]);
    }

    function mouseupFct(e) {
        new JSYG(document)[0].removeEventListener("mousemove", mousemoveFct);
        new JSYG(document)[0].removeEventListener("mouseup", mouseupFct);

        var dim = line.getDim();

        if (that.minArea != null && dim.width * dim.height < that.minArea) line.remove();

        that.trigger("end", line[0], e, line[0]);

        that.inProgress = false;
    }
    new JSYG(document)[0].addEventListener("mousemove", mousemoveFct);
    new JSYG(document)[0].addEventListener("mouseup", mouseupFct);

    this.inProgress = true;

    return this;
};
ShapeDrawer.prototype.drawShape = function (shape, e) {
    shape = new JSYG(shape);

    var pos = shape.getCursorPos(e),
        tag = shape.getTag(),
        resizer = new JSYG.Resizable(shape),
        that = this;

    shape.setDim({
        x: pos.x - 1,
        y: pos.y - 1,
        width: 1,
        height: 1,
    });

    resizer.set({
        originX: tag == "rect" ? "left" : "center",

        originY: tag == "rect" ? "top" : "center",

        keepRatio: tag == "circle" ? true : false,

        cursor: false,

        inverse: true,

        ondrag: function (e) {
            that.trigger("draw", shape[0], e, shape[0]);
        },
    });

    if (this.options) resizer.set(this.options);

    resizer.on("end", function (e) {
        var dim = shape.getDim();

        if (that.minArea != null && dim.width * dim.height < that.minArea) shape.remove();

        that.trigger("end", shape[0], e, shape[0]);

        that.inProgress = false;
    });

    this.inProgress = true;

    resizer.start(e);

    return this;
};

ShapeDrawer.prototype.draw = function (shape, e) {
    shape = new JSYG(shape);

    var tag = shape.getTag();

    return tag == "line" ? this.drawLine(shape, e) : this.drawShape(shape, e);
};
