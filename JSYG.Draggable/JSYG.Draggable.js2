import JSYG from "../JSYG-wrapper/JSYG-wrapper.js";
import StdConstruct from "../JSYG.StdConstruct/JSYG.StdConstruct.js";

("use strict");

function Guides() {}

Guides.prototype = new StdConstruct();

Guides.prototype.constructor = Guides;
Guides.prototype.list = null;
Guides.prototype.strength = 10;
Guides.prototype.originX = "left center right";
Guides.prototype.originY = "top center bottom";
Guides.prototype.require = false;
Guides.prototype.className = "aimant";
Guides.prototype.onreach = null;
Guides.prototype.onleave = null;
Guides.prototype.onsuccess = null;
Guides.prototype.onfail = null;

export default function Draggable(arg, opt) {
    this.guides = new Guides();

    if (arg) {
        this.setNode(arg);
        this.field = this.node;

        if (opt) this.enable(opt);
    } else if (opt) this.set(opt);
}

function shape(node) {
    return ["path", "polyline", "polygon", "g", "text"].indexOf(node.tagName) !== -1
        ? "noAttribute"
        : "shape";
}

function rap(dec) {
    if (dec == null || dec === "center") return 0.5;
    else if (dec === "top" || dec === "left") return 0;
    else if (dec === "bottom" || dec === "right") return 1;
}

Draggable.prototype = new StdConstruct();

Draggable.prototype.constructor = Draggable;

Draggable.prototype.field = null;
Draggable.prototype.eventWhich = 1;
Draggable.prototype.className = null;
Draggable.prototype.horizontal = true;
Draggable.prototype.vertical = true;
Draggable.prototype.type = "attributes";
Draggable.prototype.keepRotation = false;
Draggable.prototype.bounds = null;
Draggable.prototype.minLeft = null;
Draggable.prototype.minTop = null;
Draggable.prototype.maxRight = null;
Draggable.prototype.maxBottom = null;

Draggable.prototype.autoScroll = false;
Draggable.prototype.cursor = "auto";
Draggable.prototype.onstart = null;
Draggable.prototype.ondragstart = null;
Draggable.prototype.ondrag = null;
Draggable.prototype.ondragend = null;
Draggable.prototype.onend = null;
Draggable.prototype.enabled = false;

Draggable.prototype.start = function (e) {
    e.preventDefault();

    var jNode = new JSYG(this.node),
        parent = jNode.offsetParent();

    if ($.isNumeric(this.bounds)) {
        var dimParent = parent.getDim();
        this.minLeft = -this.bounds;
        this.minTop = -this.bounds;
        this.maxRight = dimParent.width + this.bounds;
        this.maxBottom = dimParent.height + this.bounds;
    }

    var that = this,
        isSvg = jNode.isSVG(),
        mtxScreenInitInv = jNode.getMtx("screen").inverse(),
        mtxInit = jNode.getMtx(),
        mouseInit = new JSYG.Vect(e.clientX, e.clientY).mtx(mtxScreenInitInv),
        dimInit = jNode.getDim(),
        mtxScreenParent = parent.getMtx("screen"),
        bornes =
            this.minLeft != null ||
            this.minTop != null ||
            this.maxRight != null ||
            this.maxBottom != null
                ? true
                : false,
        guides = this.guides,
        hasChanged = false,
        triggerDragStart = false,
        dimWin = new JSYG(window).getDim(),
        cursor,
        fcts = {};

    if (this.cursor === "auto") {
        if (this.horizontal && this.vertical) cursor = "move";
        else if (this.horizontal) cursor = "e-resize";
        else cursor = "n-resize";
    } else cursor = this.cursor;

    if (cursor) {
        new JSYG(this.field).each(function () {
            var field = new JSYG(this);
            field.data_("cursorInit", field.css("cursor"));
            field.css("cursor", cursor);
        });
    }

    if (this.className) jNode.addClass(this.className);

    if (guides.list && guides.list.length > 0) {
        guides.offsetX = (function () {
            var tab = guides.originX.trim().split(/ +/),
                dec = [];
            tab.forEach(function (origin) {
                dec.push(rap(origin));
            });
            return dec;
        })();

        guides.offsetY = (function () {
            var tab = guides.originY.trim().split(/ +/),
                dec = [];
            tab.forEach(function (origin) {
                dec.push(rap(origin));
            });
            return dec;
        })();
    }

    function mousemoveFct(e) {
        if (!triggerDragStart) {
            that.trigger("dragstart", that.node, e);
            triggerDragStart = true;
        }

        var oldOk = false,
            mtxScreenInv,
            mtxScreenParentInv,
            magnet,
            guide,
            ref,
            i,
            j,
            k,
            N,
            M,
            P,
            mtx,
            dim,
            rect,
            x,
            y,
            pt1,
            pt2,
            mouse,
            reachedX = false,
            reachedY = false,
            dimFromWin,
            scrollX = 0,
            scrollY = 0;

        function applyMagnet(pt1, pt2) {
            mtx = mtx.translate(pt2.x - pt1.x, pt2.y - pt1.y);

            if (that.type !== "transform" && that._shape !== "noAttribute") {
                dim.x += pt2.x - pt1.x;
                dim.y += pt2.y - pt1.y;
                jNode.setDim(dim);
            } else {
                jNode.setMtx(mtx);
            }

            jNode[0].classList.add(guides.className);

            guides.ok = true;

            if (!oldOk) guides.trigger("reach", that.node, e);
        }

        mouse = new JSYG.Vect(e.clientX, e.clientY).mtx(mtxScreenInitInv);

        mtx = mtxInit.translate(
            that.horizontal ? mouse.x - mouseInit.x : 0,
            that.vertical ? mouse.y - mouseInit.y : 0,
        );

        dim = {
            x: !that.horizontal ? dimInit.x : dimInit.x + mouse.x - mouseInit.x,
            y: !that.vertical ? dimInit.y : dimInit.y + mouse.y - mouseInit.y,
        };

        if (guides) {
            oldOk = guides.ok;
            guides.ok = false;
            if (guides.className) {
                jNode[0].classList.remove(guides.className);
            }
        }

        if (that.type !== "transform" && that._shape !== "noAttribute") jNode.setDim(dim);
        else jNode.setMtx(mtx);

        if (bornes) {
            rect = jNode.getDim(isSvg ? "screen" : null);
            mtxScreenParentInv = mtxScreenParent.inverse();
            pt1 = new JSYG.Vect(rect.x, rect.y).mtx(mtxScreenParentInv);
            pt2 = new JSYG.Vect(rect.x + rect.width, rect.y + rect.height).mtx(mtxScreenParentInv);

            x = 0;
            y = 0;

            if (that.horizontal) {
                if (that.minLeft != null && pt1.x < that.minLeft) {
                    x = that.minLeft - pt1.x;
                } else if (that.maxRight != null && pt2.x > that.maxRight) {
                    x = that.maxRight - pt2.x;
                }
            }

            if (that.vertical) {
                if (that.minTop != null && pt1.y < that.minTop) {
                    y = that.minTop - pt1.y;
                } else if (that.maxBottom != null && pt2.y > that.maxBottom) {
                    y = that.maxBottom - pt2.y;
                }
            }

            if (x !== 0 || y !== 0) {
                mtx = new JSYG.Matrix().translate(x, y).multiply(mtx);

                if (that.type !== "transform" && that._shape !== "noAttribute") {
                    pt1 = new JSYG.Vect(0, 0).mtx(mtxInit.inverse());
                    pt2 = new JSYG.Vect(x, y).mtx(mtxInit.inverse());
                    dim.x += pt2.x - pt1.x;
                    dim.y += pt2.y - pt1.y;
                    jNode.setDim(dim);
                } else jNode.setMtx(mtx);
            }
        }

        if (guides.list && guides.list.length > 0) {
            rect = jNode.getDim(isSvg ? "screen" : null);
            mtxScreenInv = jNode.getMtx("screen").inverse();

            for (i = 0, N = guides.list.length; i < N; i++) {
                guide = guides.list[i];

                magnet = new JSYG.Vect(
                    guide.x != null ? guide.x : 0,
                    guide.y != null ? guide.y : 0,
                ).mtx(mtxScreenParent);

                if (guide.x != null && guide.y != null && !reachedX && !reachedY) {
                    loop: for (j = 0, M = guides.offsetX.length; j < M; j++) {
                        ref = {};
                        ref.x = rect.x + rect.width * guides.offsetX[j];

                        for (k = 0, P = guides.offsetY.length; k < P; k++) {
                            ref.y = rect.y + rect.height * guides.offsetY[k];

                            if (JSYG.distance(magnet, ref) < guides.strength) {
                                pt1 = new JSYG.Vect(ref).mtx(mtxScreenInv);
                                pt2 = new JSYG.Vect(magnet).mtx(mtxScreenInv);
                                applyMagnet(pt1, pt2);
                                reachedX = reachedY = true;
                                break loop;
                            }
                        }
                    }
                } else if (guide.x != null && !reachedX) {
                    for (j = 0, M = guides.offsetX.length; j < M; j++) {
                        ref = rect.x + rect.width * guides.offsetX[j];

                        if (Math.abs(magnet.x - ref) < guides.strength) {
                            pt1 = new JSYG.Vect(ref, 0).mtx(mtxScreenInv);
                            pt2 = new JSYG.Vect(magnet.x, 0).mtx(mtxScreenInv);
                            applyMagnet(pt1, pt2);
                            reachedX = true;
                            break;
                        }
                    }
                } else if (guide.y != null && !reachedY) {
                    for (j = 0, M = guides.offsetY.length; j < M; j++) {
                        ref = rect.y + rect.height * guides.offsetY[j];

                        if (Math.abs(magnet.y - ref) < guides.strength) {
                            pt1 = new JSYG.Vect(0, ref).mtx(mtxScreenInv);
                            pt2 = new JSYG.Vect(0, magnet.y).mtx(mtxScreenInv);
                            applyMagnet(pt1, pt2);
                            reachedY = true;
                            break;
                        }
                    }
                }

                if (reachedX && reachedY) break;
            }

            if (oldOk && !guides.ok) guides.trigger("leave", that.node, e);
        }

        if (that.autoScroll) {
            dimFromWin = jNode.getDim(window);

            if (dimFromWin.x < 0) scrollX = dimFromWin.x;
            else if (dimFromWin.x + dimFromWin.width > dimWin.width) {
                scrollX = dimFromWin.x + dimFromWin.width - dimWin.width;
            }

            if (dimFromWin.y < 0) scrollY = dimFromWin.y;
            else if (dimFromWin.y + dimFromWin.height > dimWin.height) {
                scrollY = dimFromWin.y + dimFromWin.height - dimWin.height;
            }

            window.scrollBy(scrollX, scrollY);
        }

        hasChanged = true;
        that.trigger("drag", that.node, e);
    }

    function remove(e) {
        if (cursor) {
            new JSYG(that.field).each(function () {
                var field = new JSYG(this);
                field.css("cursor", field.data_("cursorInit"));
            });
        }

        if (guides) {
            if (guides.className) {
                jNode[0].classList.remove(guides.className);
            }
            if (that.className) {
                jNode[0].classList.remove(that.className);
            }
            if (guides.ok) {
                const event = new CustomEvent("success", { detail: e });
                that.node.dispatchEvent(event);
            } else if (guides.require) {
                var to;

                if (that.type !== "transform") {
                    if (that._shape === "noAttribute")
                        jNode.mtx2attrs({ keepRotation: that.keepRotation });
                    to = jNode.isSVG()
                        ? { x: dimInit.x, y: dimInit.y }
                        : { left: dimInit.x + "px", top: dimInit.y + "px" };
                } else {
                    to = mtxInit;
                }

                if (!JSYG.Animation) {
                    if (that.type !== "transform") jNode.setDim({ x: dimInit.x, y: dimInit.y });
                    else jNode.setMtx(mtxInit);
                } else {
                    jNode.animate({
                        to: to,
                        easing: "swing",
                        callback: function () {
                            guides.trigger("fail", that.node, e);
                        },
                    });
                }
            }
        }

        if (hasChanged && that.type !== "transform" && that._shape === "noAttribute")
            jNode.mtx2attrs({ keepRotation: that.keepRotation });

        let doc = new JSYG(document);
        doc[0].removeEventListener("mouseover", mousemoveFct);
        doc[0].removeEventListener("mouseup", remove);

        if (hasChanged) {
            const event = new CustomEvent("dragend", { detail: e });
            that.node.dispatchEvent(event);
        }

        const event = new CustomEvent("end", { detail: e });
        that.node.dispatchEvent(event);
    }

    fcts.mousemove = mousemoveFct;
    fcts.mouseup = remove;

    let doc = new JSYG(document);
    doc[0].addEventListener("mouseover", mousemoveFct);
    doc[0].addEventListener("mouseup", remove);

    const event = new CustomEvent("start", { detail: e });
    that.node.dispatchEvent(event);
};

Draggable.prototype.enable = function (opt) {
    this.disable(); //si plusieurs appels

    if (opt) this.set(opt);

    var evt = opt && opt.evt,
        jNode = new JSYG(this.node),
        that = this;

    function start(e) {
        if (that.eventWhich && e.which && e.which != that.eventWhich) return;
        that.start(e);
    }

    if (!this.field) this.field = this.node;

    this._shape = shape(this.node);

    new JSYG(this.field).each(function () {
        var field = new JSYG(this);
        field.data_("draggableUnselect", this.unselectable);
        this.unselectable = "on"; //IE
        field[0].addEventListener("mousedown", start);
    });

    this.disable = function () {
        new JSYG(this.field).each(function () {
            var field = new JSYG(this);
            field[0].removeEventListener("mousedown", start);
            this.unselectable = field.data_("draggableUnselect");
        });
        jNode.removeData_("draggable");
        this.enabled = false;
        return this;
    };

    this.enabled = true;

    if (evt) this.start(evt);

    return this;
};

Draggable.prototype.disable = function () {
    return this;
}; //définie lors de l'appel de la méthode on() car on a besoin du contexte

JSYG.Draggable = Draggable;

var plugin = JSYG.bindPlugin(Draggable);
JSYG.prototype.draggable = function () {
    return plugin.apply(this, arguments);
};
