import JSYG from "../JSYG-wrapper/JSYG-wrapper.js";
import StdConstruct from "../JSYG.StdConstruct/JSYG.StdConstruct.js";
import Resizable from "../JSYG.Resizable/JSYG.Resizable.js";

/*   "use strict";*/

var plugins = ["mouseWheelZoom", "marqueeZoom", "resizable", "mousePan"];

export default function ZoomAndPan(arg, opt) {
    this.mouseWheelZoom = new MouseWheelZoom(this);
    this.marqueeZoom = new MarqueeZoom(this);
    this.resizable = new ZapResizable(this);
    this.mousePan = new MousePan(this);
    this.cookie = new Cookie(this);
    this.innerFrame = new JSYG("<g>")[0];
    this.outerFrame = new JSYG("<div>")[0];

    if (arg) this.setNode(arg);
    if (opt) this.enable(opt);
}

ZoomAndPan.prototype = new StdConstruct();

ZoomAndPan.prototype.constructor = ZoomAndPan;

ZoomAndPan.prototype.set = function (options) {
    for (var n in options) {
        if (options.hasOwnProperty(n) && n in this) {
            if (plugins.indexOf(n) !== -1) {
                this[n].set(options[n]);
            } else {
                this[n] = options[n];
            }
        }
    }

    return this;
};

ZoomAndPan.prototype.setNode = function (arg) {
    var enabled = this.enabled,
        jNode = new JSYG(arg);

    if (enabled) this.disable();

    if (this.node) new JSYG(this.node).removeData("zoomandpan");

    this.node = jNode[0];

    //jNode.data('zoomandpan',{});
    jNode[0].dataset.ZoomAndPan = {};

    if (enabled) this.enable();
};

ZoomAndPan.prototype.enabled = false;
ZoomAndPan.prototype.overflow = "hidden";
ZoomAndPan.prototype.innerFrame = null;
ZoomAndPan.prototype.outerFrame = null;
ZoomAndPan.prototype.animate = false;
ZoomAndPan.prototype.animateOptions = null;
ZoomAndPan.prototype.scaleMin = "canvas";
ZoomAndPan.prototype.scaleMax = null;
ZoomAndPan.prototype.minLeft = null;
ZoomAndPan.prototype.maxRight = null;
ZoomAndPan.prototype.minTop = null;
ZoomAndPan.prototype.maxBottom = null;
ZoomAndPan.prototype.bounds = null;
ZoomAndPan.prototype.minWidth = 5;
ZoomAndPan.prototype.minHeight = 5;
ZoomAndPan.prototype.maxWidth = 3000;
ZoomAndPan.prototype.maxHeight = 3000;
ZoomAndPan.prototype.onscale = null;
ZoomAndPan.prototype.ontranslate = null;
ZoomAndPan.prototype.onresize = null;
ZoomAndPan.prototype.onchange = null;
ZoomAndPan.prototype.onanimate = null;
ZoomAndPan.prototype._getBounds = function (ctm) {
    var initDim = new JSYG(this.innerFrame).getDim();

    var bounds = {
        left: this.minLeft == null ? initDim.x - this.bounds : this.minLeft,
        right: this.maxRight == null ? initDim.x + initDim.width + this.bounds : this.maxRight,
        top: this.minTop == null ? initDim.y - this.bounds : this.minTop,
        bottom: this.maxBottom == null ? initDim.y + initDim.height + this.bounds : this.maxBottom,
    };

    if (ctm) {
        var mtx = new JSYG(this.innerFrame).getMtx(),
            hg = new JSYG.Vect(bounds.left, bounds.top).mtx(mtx),
            bd = new JSYG.Vect(bounds.right, bounds.bottom).mtx(mtx);

        bounds.left = hg.x;
        bounds.top = hg.y;
        bounds.right = bd.x;
        bounds.bottom = bd.y;
    }

    bounds.width = bounds.right - bounds.left;
    bounds.height = bounds.bottom - bounds.top;

    return bounds;
};

ZoomAndPan.prototype.enable = function (opt) {
    this.disable();

    if (opt) this.set(opt);

    if (
        ["auto", "hidden"].indexOf(this.overflow) === -1 &&
        this.overflow.indexOf("scroll") === -1
    ) {
        throw new Error(this.overflow + " : valeur incorrecte pour la propriété overflow");
    }

    if (!this.node)
        throw new Error("Il faut d'abord définir la propriété node par la méthode setNode");
    var jSVG = new JSYG(this.node);
    //var backup = jSVG.data('zoomandpan') || {};  //GUSA
    var backup = jSVG[0].dataset.zoomandpan || {}; //GUSA
    var hidden = this.overflow == "hidden";
    var dim = jSVG.getDim();
    var width = jSVG.attr("width") || dim.width;
    var height = jSVG.attr("height") || dim.height;
    var that = this;
    var n;

    backup.dimInit = {
        width: width,
        height: height,
    };

    var viewBox = this.node.viewBox.baseVal,
        exclude = {
            tags: ["switch", "defs"],
            list: [],
        },
        child,
        innerFrame = new JSYG(this.innerFrame).transfOrigin("left", "top"),
        mtx = new JSYG.Matrix();

    while (this.node.firstChild) {
        child = this.node.firstChild;
        if (exclude.tags.indexOf(child.tagName) !== -1) {
            this.node.removeChild(child);
            exclude.list.push(child);
        } else innerFrame.append(child);
    }

    jSVG[0].appendChild(innerFrame[0]); //GUSA

    if (viewBox && viewBox.width && viewBox.height) {
        mtx = mtx.scaleNonUniform(dim.width / viewBox.width, dim.height / viewBox.height);
    }

    if (hidden && viewBox) mtx = mtx.translate(-viewBox.x, -viewBox.y);

    jSVG.removeAttr("viewBox");
    backup.viewBoxInit = viewBox;

    innerFrame.setMtx(mtx);

    if (!hidden) {
        var outerFrame = new JSYG(this.outerFrame),
            position = jSVG.css("position"),
            bounds = this._getBounds("ctm"),
            origin,
            left = jSVG.css("left"),
            top = jSVG.css("top"),
            margin = jSVG.css("margin");

        outerFrame.css({
            width: width,
            height: height,
            overflow: this.overflow,
            padding: "0px",
            margin: margin,
            display: "inline-block",
            left: left,
            top: top,
            visibility: jSVG.css("visibility"),
            position: position === "static" ? "relative" : position,
            border: jSVG.css("border"),
            backgroundColor: jSVG.css("backgroundColor"),
        });

        backup.cssInit = {
            left: left,
            top: top,
            margin: margin,
            position: position,
        };

        jSVG.css({
            left: 0,
            top: 0,
            margin: 0,
            position: "absolute",
            width: width,
            height: height,
        });

        mtx = new JSYG.Matrix().translate(-bounds.left, -bounds.top).multiply(mtx);
        innerFrame.setMtx(mtx);

        origin = new JSYG.Vect((viewBox && viewBox.x) || 0, (viewBox && viewBox.y) || 0).mtx(mtx);

        let p = this.node.parentNode;
        p.removeChild(this.node);
        p.appendChild(outerFrame[0]); //GUSA
        outerFrame[0].appendChild(this.node);
        outerFrame[0].scrollLeft = origin.x;
        outerFrame[0].scrollTop = origin.y;
    }

    function majCanvas() {
        that.transform(that.transform());
    }

    if (/%/.test(width)) {
        JSYG(window)[0].addEventListener("resize", majCanvas); //GUSA
        backup.majCanvas = majCanvas;
        majCanvas();
    }

    this.enabled = true;

    if (backup.plugins) {
        for (n in backup.plugins) this[n].enable();
    }

    if (opt) {
        for (n in opt) {
            if (plugins.indexOf(n) !== -1) this[n].enable(opt[n]);
        }
    }

    jSVG[0].dataset.zoomandpan = backup;

    return this;
};

ZoomAndPan.prototype.disable = function () {
    if (!this.enabled || !this.node) return this;

    var jSVG = new JSYG(this.node),
        plugins = {},
        backup = jSVG.data("zoomandpan") || {},
        viewBox = backup.viewBoxInit;

    if (this.mouseWheelZoom.enabled) {
        plugins.mouseWheelZoom = true;
        this.mouseWheelZoom.disable();
    }
    if (this.marqueeZoom.enabled) {
        plugins.marqueeZoom = true;
        this.marqueeZoom.disable();
    }
    if (this.resizable.enabled) {
        plugins.resizable = true;
        this.resizable.disable();
    }
    if (this.mousePan.enabled) {
        plugins.mousePan = true;
        this.mousePan.disable();
    }

    backup.plugins = plugins;

    while (this.innerFrame.firstChild) jSVG.append(this.innerFrame.firstChild);
    new JSYG(this.innerFrame).remove();

    if (this.outerFrame.parentNode) {
        jSVG.replaceAll(this.outerFrame);
        new JSYG(this.outerFrame).remove();
    }

    if (viewBox && viewBox.width && viewBox.height) {
        jSVG.attr(
            "viewBox",
            viewBox.x + " " + viewBox.y + " " + viewBox.width + " " + viewBox.height,
        );
    }

    delete backup.viewBoxInit;

    if (backup.cssInit) {
        jSVG.css(backup.cssInit);
        delete backup.cssInit;
    }

    if (backup.dimInit) {
        jSVG.css(backup.dimInit);
        delete backup.dimInit;
    }

    if (backup.majCanvas) {
        JSYG(window).off("resize", backup.majCanvas);
    }

    this.enabled = false;

    return this;
};

ZoomAndPan.prototype._getAdd = function () {
    return this.overflow == "hidden" ? 0 : this.overflow == "auto" ? 2 : 20;
};

ZoomAndPan.prototype.size = function (width, height, keepViewBox) {
    var hidden = this.overflow == "hidden",
        canvas = new JSYG(hidden ? this.node : this.outerFrame),
        innerWidth = canvas[0].clientWidth,
        innerHeight = canvas[0].clientHeight,
        mtx,
        that = this,
        keepRatio = width == null || height == null,
        widthTest,
        heightTest,
        animate = this.animate,
        opt,
        pt;

    if (width == null && height == null) return { width: innerWidth, height: innerHeight };

    if ($.isPlainObject(width)) {
        opt = width;
        keepViewBox = opt.keepViewBox || height;
        height = opt.height;
        width = opt.width;
    }

    if (width == null) width = (innerWidth * height) / innerHeight;
    else if (height == null) height = (innerHeight * width) / innerWidth;

    widthTest = JSYG.clip(width, this.minWidth, this.maxWidth);
    heightTest = JSYG.clip(height, this.minHeight, this.maxHeight);

    if (keepRatio && widthTest != width) return this.size(widthTest, null, keepViewBox);
    else width = widthTest;

    if (keepRatio && heightTest != height) return this.size(null, heightTest, keepViewBox);
    else height = heightTest;

    canvas.setDim({ width: width, height: height });

    mtx = this.transform();

    if (keepViewBox) {
        pt = new JSYG.Vect(0, 0).mtx(mtx.inverse());
        mtx = mtx.scaleNonUniform(width / innerWidth, height / innerHeight, pt.x, pt.y);
    }

    this.animate = false;

    this.transform(mtx, function () {
        that.trigger("resize");
        that.animate = animate;
    });

    return this;
};

ZoomAndPan.prototype.transform = function (mtx, callback) {
    var innerFrame = new JSYG(this.innerFrame),
        hidden = this.overflow == "hidden",
        outerFrame = !hidden && new JSYG(this.outerFrame),
        scrollLeft = outerFrame && outerFrame[0].scrollLeft,
        scrollTop = outerFrame && outerFrame[0].scrollTop;

    if (mtx == null) {
        mtx = innerFrame.getMtx();
        return hidden ? mtx : new JSYG.Matrix().translate(-scrollLeft, -scrollTop).multiply(mtx);
    }

    var transf = mtx.decompose(),
        scaleX = transf.scaleX,
        scaleY = transf.scaleY,
        translX = transf.translateX,
        translY = transf.translateY,
        mtxInv = mtx.inverse(),
        bounds = this._getBounds();

    if (!hidden) {
        mtx = mtx.translate(scrollLeft, scrollTop).translate(-bounds.left, -bounds.top);
        mtxInv = mtx.inverse();
    }

    var options = Object.create(this.animateOptions),
        that = this,
        outerDim = this.size(),
        add = this._getAdd(),
        jSVG = new JSYG(this.node),
        centerIn = innerFrame.getCenter(),
        centerOut = new JSYG.Vect((outerDim.width - add) / 2, (outerDim.height - add) / 2).mtx(
            mtxInv,
        ),
        hg = new JSYG.Vect(0, 0).mtx(mtxInv),
        bd = new JSYG.Vect(outerDim.width - add, outerDim.height - add).mtx(mtxInv);

    //le contenu est moins large que le cadre, on centre le contenu
    if (bounds.width * scaleX + add < outerDim.width) {
        mtx = mtx.translateX(centerOut.x - centerIn.x);

        //on étend le canvas svg à la largeur exterieure
        if (!hidden) jSVG.css("width", outerDim.width - add);
    } else {
        if (!hidden) {
            jSVG.css("width", bounds.width * scaleX);
            mtx = mtx.translateX(hg.x - bounds.left);
        } else {
            //on empêche de sortir du cadre
            if (hg.x < bounds.left) mtx = mtx.translateX(hg.x - bounds.left);
            else if (bd.x > bounds.right) mtx = mtx.translateX(bd.x - bounds.right);
        }
    }

    //le contenu est moins haut que le cadre, on centre le contenu
    if (bounds.height * scaleY + add < outerDim.height) {
        mtx = mtx.translateY(centerOut.y - centerIn.y);

        //on étend le canvas svg à la hauteur exterieure
        if (!hidden) jSVG.css("height", outerDim.height - add);
    } else {
        if (!hidden) {
            jSVG.css("height", bounds.height * scaleY);
            mtx = mtx.translateY(hg.y - bounds.top);
        } else {
            //on empeche de sortir du cadre
            if (hg.y < bounds.top) mtx = mtx.translateY(hg.y - bounds.top);
            else if (bd.y > bounds.bottom) mtx = mtx.translateY(bd.y - bounds.bottom);
        }
    }

    if (!hidden) {
        transf = mtx.decompose();
        outerFrame[0].scrollLeft = Math.round(transf.translateX - translX);
        outerFrame[0].scrollTop = Math.round(transf.translateY - translY);
    }

    if (!this.animate || !hidden) {
        innerFrame.setMtx(mtx);
        this.trigger("change");
        if (callback) callback.call(this.node);
    } else {
        innerFrame.animate(
            JSYG.extend(options, {
                to: { mtx: mtx },
                onanimate: function () {
                    that.trigger("animate");
                },
                onend: function () {
                    that.trigger("change");
                    if (callback) callback.call(that.node);
                },
            }),
        );
    }

    return this;
};

ZoomAndPan.prototype.scale = function (scale, originX, originY, callback) {
    var mtx = this.transform(),
        transf = mtx.decompose();

    if (scale == null) return transf.scaleX;

    var size = this.size(),
        bounds = this._getBounds(),
        add = this._getAdd(),
        scaleTest = mtx.scale(scale).scaleX(),
        scaleCanvas = Math.min(
            (size.width - add) / bounds.width,
            (size.height - add) / bounds.height,
        ),
        scaleMin = this.scaleMin == "canvas" ? scaleCanvas : this.scaleMin,
        scaleMax = this.scaleMax == "canvas" ? scaleCanvas : this.scaleMax,
        origin,
        that = this;

    if (scaleMin && scaleTest < scaleMin) scale = scaleMin / transf.scaleX;
    if (scaleMax && scaleTest > scaleMax) scale = scaleMax / transf.scaleX;

    originX = originX != null ? originX : size.width / 2;
    originY = originY != null ? originY : size.height / 2;
    origin = new JSYG.Vect(originX, originY).mtx(mtx.inverse());

    mtx = mtx.scale(scale, origin.x, origin.y);

    this.transform(mtx, function () {
        that.trigger("scale");
        if (callback) callback.call(that.node);
    });

    return this;
};

ZoomAndPan.prototype.translate = function (x, y, callback) {
    var mtx = this.transform(),
        that = this;

    if (x == null && y == null) return new JSYG.Vect(0, 0).mtx(mtx.inverse());

    x *= -1;
    y *= -1;

    mtx = mtx.translate(x, y);

    this.transform(mtx, function () {
        that.trigger("translate", that.node);
        if (callback) callback.call(that.node);
    });

    return this;
};

ZoomAndPan.prototype.screenTranslate = function (x, y, callback) {
    var transf = this.transform().decompose();

    if (x == null && y == null) return new JSYG.Vect(transf.translateX, transf.translateY);

    this.translate(x / transf.scaleX, y / transf.scaleY, callback);

    return this;
};
ZoomAndPan.prototype.scaleTo = function (scale, originX, originY, callback) {
    this.scale(scale / this.scale(), originX, originY, callback);

    return this;
};

ZoomAndPan.prototype.fitToCanvas = function () {
    var bounds = this._getBounds("ctm"),
        outerDim = this.size(),
        add = this._getAdd(),
        rapX = (outerDim.width - add) / bounds.width,
        rapY = (outerDim.height - add) / bounds.height;

    this.scale(Math.min(rapX, rapY));

    return this;
};

ZoomAndPan.prototype.fitToWidth = function () {
    var bounds = this._getBounds("ctm"),
        outerDim = this.size(),
        add = this.overflow == "hidden" ? 0 : 20,
        rapX = (outerDim.width - add) / bounds.width;

    this.scale(rapX);

    var transl = this.translate();
    this.translate(-transl.x, -transl.y);

    return this;
};

ZoomAndPan.prototype.fitToHeight = function () {
    var bounds = this._getBounds("ctm"),
        outerDim = this.size(),
        add = this.overflow == "hidden" ? 0 : 20,
        rapY = (outerDim.height - add) / bounds.height;

    this.scale(rapY);

    var transl = this.translate();
    this.translate(-transl.x, -transl.y);

    return this;
};

ZoomAndPan.prototype.translateTo = function (x, y, callback) {
    var transl = this.translate();
    this.translate(x - transl.x, y - transl.y, callback);
    return this;
};

ZoomAndPan.prototype.center = function (x, y, callback) {
    if (x == null && y == null) {
        var size = this.size(),
            mtx = this.transform();

        return new JSYG.Vect(size.width / 2, size.height / 2).mtx(mtx.inverse());
    } else {
        var center = this.center();

        this.translate(x - center.x, y - center.y, callback);
        return this;
    }
};

Object.defineProperty(ZoomAndPan.prototype, "overflow", {
    get: function () {
        return this._overflow || "hidden";
    },

    set: function (val) {
        if (["hidden", "auto", "scroll"].indexOf(val) === -1)
            throw new Error(val + " : valeur incorrecte pour la propriété overflow");

        if (val == this._overflow) return;

        var enabled = this.enabled,
            scale,
            translate,
            size;

        if (enabled) {
            scale = this.scale();
            translate = this.translate();
            size = this.size();
            this.disable();
        }

        this._overflow = val;

        if (enabled) {
            this.enable()
                .scale(scale)
                .translateTo(translate.x, translate.y)
                .size(size.width, size.height);
        }
    },
});

function Cookie(zoomAndPanObject) {
    this.zap = zoomAndPanObject;
}

Cookie.prototype.expires = null;
Cookie.prototype.read = function () {
    var zap = this.zap,
        node = zap.node;

    if (!node.id)
        throw new Error(
            "Il faut définir un id pour la balise SVG pour pouvoir utiliser les cookies",
        );

    var cookie = cookies.get(node.id);

    if (!cookie) return this;

    cookie = cookie.split(";");

    var css = { width: cookie[0], height: cookie[1] },
        newmtx = cookie[2],
        overflow = cookie[3];

    if (overflow != zap.overflow)
        throw new Error("Overflow property is different than in cookie value.");

    new JSYG(node).css(css);

    new JSYG(zap.innerFrame).css(css).attr("transform", newmtx);

    if (overflow != "hidden" && cookie[4] && cookie[5] && cookie[6] != null && cookie[7] != null) {
        new JSYG(zap.outerFrame)
            .css({ width: cookie[4], height: cookie[5] })
            .scrollLeft(cookie[6])
            .scrollTop(cookie[7]);
    }

    return this;
};

Cookie.prototype.write = function () {
    var zap = this.zap,
        node = zap.node;

    if (!node.id)
        throw new Error(
            "Il faut définir un id pour la balise SVG pour pouvoir utiliser les cookies",
        );

    var jSVG = new JSYG(node),
        valcookie = "",
        outerFrame;

    valcookie += parseFloat(jSVG.css("width")) + ";" + parseFloat(jSVG.css("height")) + ";";
    valcookie += new JSYG(zap.innerFrame).getMtx().toString();
    valcookie += ";" + zap.overflow;

    if (zap.overflow !== "hidden") {
        outerFrame = new JSYG(zap.outerFrame);
        valcookie += ";" + outerFrame.css("width") + ";" + outerFrame.css("height") + ";";
        valcookie += outerFrame.scrollLeft() + ";" + outerFrame.scrollTop();
    }

    cookies.set(node.id, valcookie, this.expires ? { expires: this.expires } : undefined);

    return this;
};

Cookie.prototype.remove = function () {
    cookies.remove(this.zap.node.id);
    return this;
};

Cookie.prototype.enable = function () {
    var zap = this.zap,
        node = zap.node,
        unloadFct;

    if (!node.id)
        throw new Error(
            "Il faut définir un id pour la balise SVG pour pouvoir utiliser les cookies",
        );

    this.disable();

    unloadFct = this.write.bind(this);

    new JSYG(window).on("unload", unloadFct);

    this.disable = function () {
        new JSYG(window).off("unload", unloadFct);

        cookies.remove(node.id);

        this.enabled = false;

        return this;
    };

    //this.read();

    this.enabled = true;

    return this;
};

Cookie.prototype.disable = function () {
    return this;
};

function MouseWheelZoom(zoomAndPanObject) {
    this.zap = zoomAndPanObject;
}

MouseWheelZoom.prototype = new StdConstruct();

MouseWheelZoom.prototype.constructor = MouseWheelZoom;
MouseWheelZoom.prototype.key = null;
MouseWheelZoom.prototype.step = 0.1;
MouseWheelZoom.prototype.onstart = null;
MouseWheelZoom.prototype.onend = null;
MouseWheelZoom.prototype.enabled = false;
MouseWheelZoom.prototype.wheel = function (e) {
    if (!this.zap.mousePan.enabled) return;

    let _scale = 0;
    if (e.originalEvent.deltaY < 0) {
        _scale = 0.9;
    } else {
        _scale = 1.1;
    }
    var innerFrame = new JSYG(this.zap.innerFrame),
        //scale = 1 + this.step * e.deltaY,
        //scale = 1 + this.step * e.originalEvent.deltaY,
        scale = _scale,
        animate = this.zap.animate,
        origin;

    if (animate === true && innerFrame.animate("get", "inProgress")) return;

    e.preventDefault();

    this.trigger("start", this.zap.node, e);

    origin =
        this.zap.overflow == "hidden"
            ? innerFrame.getCursorPos(e).mtx(innerFrame.getMtx("ctm"))
            : new JSYG(this.zap.outerFrame).getCursorPos(e);

    this.zap.animate = false;

    //this.zap.scale(scale,origin.x,origin.y);
    //this.zap.scale(0.9);
    //this.zap.scale(1.1);
    this.zap.scale(scale);

    this.zap.animate = animate;

    this.trigger("end", this.zap.node, e);
};

MouseWheelZoom.prototype.enable = function (opt) {
    var that = this,
        cible = new JSYG(this.zap.overflow === "hidden" ? this.zap.node : this.zap.outerFrame);

    if (!this.zap.enabled) this.zap.enable();

    this.disable();

    if (opt) this.set(opt);

    this.disable(); //par précaution si plusieurs appels

    function mousewheelFct(e) {
        if (that.key && !e[that.key] && !e[that.key + "Key"]) return;
        that.wheel(e);
    }

    //cible.on('mousewheel',mousewheelFct);  //GUSA
    cible[0].addEventListener("mousewheel", mousewheelFct);

    this.disable = function () {
        cible.off("mousewheel", mousewheelFct);
        this.enabled = false;
        return this;
    };

    this.enabled = true;

    return this;
};

MouseWheelZoom.prototype.disable = function () {
    return this;
};

function MarqueeZoom(zoomAndPanObject) {
    this.zap = zoomAndPanObject;

    this.container = new JSYG("<rect>")[0];
}

MarqueeZoom.prototype = new StdConstruct();

MarqueeZoom.prototype.constructor = MarqueeZoom;
MarqueeZoom.prototype.event = "mousedown";
MarqueeZoom.prototype.eventWhich = 1;
MarqueeZoom.prototype.onstart = null;
MarqueeZoom.prototype.ondrag = null;
MarqueeZoom.prototype.onend = null;
MarqueeZoom.prototype.className = "marqueeZoom";
MarqueeZoom.prototype.enabled = false;

MarqueeZoom.prototype.start = function (e) {
    var node = this.zap.node,
        jSVG = new JSYG(node),
        pos = jSVG.getCursorPos(e),
        that = this,
        resize = new Resizable(this.container);

    new JSYG(this.container)
        .addClass(this.className)
        .setDim({
            x: Math.round(pos.x) - 1,
            y: Math.round(pos.y) - 1,
            width: 1,
            height: 1,
        })
        .appendTo(node);

    resize.set({
        keepRatio: false,
        type: "attributes",
        originY: "top",
        originX: "left",
        cursor: false,
        inverse: true,
    });

    if (this.onstart) {
        resize.on("start", function (e) {
            that.trigger("start", node, e);
        });
    }
    if (this.ondrag) {
        resize.on("drag", function (e) {
            that.trigger("draw", node, e);
        });
    }

    resize.on("end", function (e) {
        var size = that.zap.size(),
            dim = new JSYG(this).getDim(),
            coef = Math.min(size.width / dim.width, size.height / dim.height),
            mtx = new JSYG(that.zap.innerFrame).getMtx(),
            pt1 = new JSYG.Vect(dim.x, dim.y).mtx(mtx.inverse()),
            pt2;

        if (coef < 20) {
            mtx = mtx.scale(coef, pt1.x, pt1.y);
            pt1 = new JSYG.Vect(0, 0).mtx(mtx.inverse());
            pt2 = new JSYG.Vect(dim.x, dim.y).mtx(mtx.inverse());
            mtx = mtx.translate(pt1.x - pt2.x, pt1.y - pt2.y);

            that.zap.transform(mtx);
            that.trigger("end", node, e);
        }

        new JSYG(this).remove();
    });

    resize.start(e);
};

MarqueeZoom.prototype.enable = function (opt) {
    this.disable(); //par précaution si plusieurs appels

    if (opt) this.set(opt);

    if (!this.zap.enabled) this.zap.enable();

    var that = this;

    function start(e) {
        if (that.eventWhich && e.which != that.eventWhich) return;
        that.start(e);
    }

    new JSYG(this.zap.node).on(this.event, start);

    this.disable = function () {
        new JSYG(this.zap.node).off(this.event, start);
        this.enabled = false;
        return this;
    };

    this.enabled = true;

    return this;
};

MarqueeZoom.prototype.disable = function () {
    return this;
};

function MousePan(zoomAndPanObject) {
    this.zap = zoomAndPanObject;
}

MousePan.prototype = new StdConstruct();

MousePan.prototype.constructor = MousePan;

MousePan.prototype.event = "mousedown";
MousePan.prototype.eventWhich = 1;
MousePan.prototype.className = "MousePanOpenHand";
MousePan.prototype.classDrag = "MousePanClosedHand";
MousePan.prototype.horizontal = true;
MousePan.prototype.vertical = true;
MousePan.prototype.onstart = null;
MousePan.prototype.ondrag = null;
MousePan.prototype.onend = null;
MousePan.prototype.enabled = false;
MousePan.prototype._canMove = function () {
    var bounds = this.zap._getBounds("ctm"),
        size = this.zap.size();

    return (
        (this.horizontal && Math.round(size.width) < Math.round(bounds.width)) ||
        (this.vertical && Math.round(size.height) < Math.round(bounds.height))
    );
};

MousePan.prototype.start = function (e) {
    if (!this._canMove()) return;

    e.preventDefault();

    var jSVG = new JSYG(this.zap.node),
        lastX = e.clientX,
        lastY = e.clientY,
        animate = this.zap.animate,
        that = this,
        jDoc = new JSYG(document);

    function mousemoveFct(e) {
        that.zap.screenTranslate(
            that.horizontal && lastX - e.clientX,
            that.vertical && lastY - e.clientY,
        );
        lastX = e.clientX;
        lastY = e.clientY;
        that.trigger("drag", that.zap.node, e);
    }

    function remove(e) {
        that.zap.animate = animate;
        jSVG.off("mousemove", mousemoveFct).removeClass(that.classDrag).addClass(that.className);
        jDoc.off("mouseup", remove);
        that.trigger("end", e);
    }

    this.zap.animate = false;

    jSVG.addClass(this.classDrag).removeClass(this.className);

    jSVG.on("mousemove", mousemoveFct);
    jDoc.on("mouseup", remove);

    this.trigger("start", this.zap.node, e);
};

MousePan.prototype.enable = function (opt) {
    if (opt) this.set(opt);

    this.disable();

    if (!this.zap.enabled) this.zap.enable();

    var jSVG = new JSYG(this.zap.node),
        that = this;

    function setClassName() {
        if (that.className) jSVG[(that._canMove() ? "add" : "remove") + "Class"](that.className);
    }

    function start(e) {
        if (that.eventWhich && e.which != that.eventWhich) return;
        that.start(e);
    }

    jSVG.on(this.event, start);

    this.zap.on("scale", setClassName);
    setClassName();

    this.disable = function () {
        jSVG.removeClass(this.className).off(this.event, start);
        this.zap.off("scale", setClassName);
        this.enabled = false;
        return this;
    };

    this.enabled = true;

    return this;
};

MousePan.prototype.disable = function () {
    return this;
};

function ZapResizable(zoomAndPanObject) {
    this.zap = zoomAndPanObject;
}

ZapResizable.prototype = new StdConstruct();

ZapResizable.prototype.constructor = ZapResizable;
ZapResizable.prototype.event = "mousedown";
ZapResizable.prototype.field = "default";
ZapResizable.prototype.cursor = "auto";
ZapResizable.prototype.horizontal = true;
ZapResizable.prototype.vertical = true;
ZapResizable.prototype.keepRatio = true;
ZapResizable.prototype.keepViewBox = true;
ZapResizable.prototype.onstart = null;
ZapResizable.prototype.onresize = null;
ZapResizable.prototype.onend = null;
ZapResizable.prototype.enabled = false;
ZapResizable.prototype.start = function (e) {
    e.preventDefault();

    var fields = this.field === "default" ? this._field : new JSYG(this.field),
        that = this,
        cursor = null,
        xInit = e.clientX,
        yInit = e.clientY,
        size = this.zap.size(),
        fcts = {
            mousemove: function (e) {
                var width = size.width + (that.horizontal ? e.clientX - xInit : 0),
                    height = size.height + (that.vertical ? e.clientY - yInit : 0);

                if (that.keepRatio) height = null;

                that.zap.size(width, height, that.keepViewBox);
                that.trigger("resize", that.zap.node, e);
            },

            mouseup: function (e) {
                new JSYG(window).off(fcts);

                if (cursor) {
                    fields.each(function () {
                        var $this = new JSYG(this);
                        $this.css("cursor", $this.data("svgresizable"));
                    });
                }

                that.trigger("end", that.zap.node, e);
            },
        };

    new JSYG(window).on(fcts);

    if (this.cursor === "auto") {
        if (this.horizontal === false) cursor = "n";
        else if (this.vertical === false) cursor = "e";
        else cursor = "se";
        cursor += "-resize";
    } else if (this.cursor) cursor = that.cursor;

    if (cursor) {
        fields.each(function () {
            var $this = new JSYG(this);
            $this.data("svgresizable", $this.css("cursor")).css("cursor", cursor);
        });
    }

    this.trigger("start", this.zap.node, e);
};

ZapResizable.prototype.enable = function (opt) {
    var start = this.start.bind(this),
        fields,
        that = this;

    this.disable();

    if (opt) {
        this.set(opt);
    }

    if (!this.zap.enabled) {
        this.zap.enable();
    }

    if (this.horizontal === false || this.vertical === false) this.keepRatio = false;

    if (this.field === "default") {
        //this._field = new JSYG('<div>').addClass('SVGResize')  //GUSA
        //    .insertAfter(this.zap.overflow == "hidden" ? this.zap.node : this.zap.outerFrame);  //GUSA

        this._field = new JSYG("<div>");
        if (this.zap.overflow == "hidden") {
            this.zap.node.insertAdjacentElement("afterend", this._field[0]);
        } else {
            this.zap.outerFrame.insertAdjacentElement("afterend", this._field[0]);
        }
        this._field[0].classList.add("SVGResize");

        fields = this._field;
    } else fields = new JSYG(this.field);

    //fields.each(function() { new JSYG(this).on(that.event,start); });  //GUSA
    fields.each(function () {
        new JSYG(this)[0].addEventListener(that.event, start);
    });

    this.disable = function () {
        fields.each(function () {
            new JSYG(this).off(that.event, start);
        });

        if (this.field === "default") this._field.remove();

        this.enabled = false;
        return this;
    };

    this.enabled = true;

    return this;
};

ZapResizable.prototype.disable = function () {};
