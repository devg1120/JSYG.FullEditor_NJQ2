import JSYG from "../JSYG-wrapper/JSYG-wrapper.js";
import StdConstruct from "../JSYG.StdConstruct/JSYG.StdConstruct.js";

("use strict");

function Steps(list, strength) {
    this.list = list || [];
    this.strength = $.isNumeric(strength) ? strength : 3;
}

export default function Rotatable(arg, opt) {
    this.steps = new Steps();

    if (arg) {
        this.setNode(arg);
        this.field = this.node;

        if (opt) this.enable(opt);
    } else if (opt) this.set(opt);
}

Rotatable.prototype = new StdConstruct();

Rotatable.prototype.constructor = Rotatable;
Rotatable.prototype.field = null;
Rotatable.prototype.event = "mousedown";
Rotatable.prototype.eventWhich = 1;
Rotatable.prototype.className = false;
Rotatable.prototype.onstart = null;
Rotatable.prototype.ondragstart = null;
Rotatable.prototype.ondrag = null;
Rotatable.prototype.ondragend = null;
Rotatable.prototype.onend = null;
Rotatable.prototype.enabled = false;
Rotatable.prototype.cursor =
    "url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAACqUlEQVRIia2UsU8UQRTGZ97su73dvWOzu3d73Ibl+AOgxEZ7Q6UklhYWlMaGioLEyguFoTJYEQuNsSFiJ0b+ACxsjZAYqcAEK/E4IPfZ7Oi6uwd7hJdMtfO933zzvR0hShSS8jxvZnd39zYAlNGVKt08juNZwzAObduO8K+619K80+nM12q1vmEYmJqa2rQsa2VnZ+ddCnQ1R4kQRNQnIkgp/1umafbGxsZWS4OyGwEgDMP7RNQXQqBoEREcxzlg5huXQpKPjEzV6/V5y7L6zAxmfub7/pbjOCfM/BdUrVZ/hWF4M5G4Q09v2/bnIAgeZiEAkA3Z87wnSqkBEWknP4e6AADXdZcMwwAzo16vP09vBIBKpTLjeZ6bBZumOdDX1el0NnKA1OkPiAhKKTQajddZQFGYSU7LSikQESqVylnOBQDMzc3dk1JCKQVmPr00sAzYNM19pZQ+3GIO0Gw2uzqwIAg+lWme1tdqtTUighACYRhu5ABEtKIBzPx0VMDk5OQjKaWequ0LAUKIlVEBvu8vpPR5gGVZXSEEpJRwXXcrudr8PBc0B4Dx8fE17aDdbr/PAeI4vqufAMuyTkYJWQghHcf5pp8Tz/OWcoAkqJ7+aTzP65YFTExMLBiGgWSKznq93tfCf8H3/VWlFKSUYOZBdu7Pz8/fHB8fvwXwKq2TUm6mRvRDIrlVeJeO4xwIIaCUgmmag0ajsZwGTU9PnyJTURTZrVbrY7Va/b2+vn5nqHMAYOZZpdSRnmkiAjPvB0HwYm9v74tt233DMA6FEDNZUKq+DwUk9FnLso6klNDB6SdEPwlE9KPsIBRCAKDdbr9k5jPtJr2klAO9fSRAESgMw8VWq7UhpdyWUvaZeRBF0eMrObgIBADNZrMXx/GDa2leBEszy2j+AL5S5bW3LnfHAAAAAElFTkSuQmCC) 12 12, auto";

Rotatable.prototype.start = function (e) {
    e.preventDefault();

    var that = this,
        jNode = new JSYG(this.node),
        cursor = this.cursor;

    if (cursor) {
        new JSYG(this.field).each(function () {
            var field = new JSYG(this);
            field.data_("cursorInit", field.css("cursor"));
            field.css("cursor", cursor);
        });
    }

    if (that.className) jNode.classAdd(that.className);

    var mtxInit = jNode.getMtx(),
        mtxScreenInit = (function () {
            var mtx = jNode.getMtx("screen");
            if (!jNode.isSVG()) {
                var dim = jNode.getDim("page");
                mtx = new JSYG.Matrix().translate(dim.x, dim.y).multiply(mtx);
            }
            return mtx;
        })(),
        scaleX = mtxInit.scaleX(),
        scaleY = mtxInit.scaleY(),
        dec = jNode.getShift(),
        screenDec = dec.mtx(mtxScreenInit),
        angleInit = mtxScreenInit.rotate(),
        angleMouseInit =
            (Math.atan2(e.clientX - screenDec.x, e.clientY - screenDec.y) * 180) / Math.PI,
        hasChanged = false,
        triggerDragStart = false;

    function mousemoveFct(e) {
        if (!triggerDragStart) {
            that.trigger("dragstart", that.node, e);
            triggerDragStart = true;
        }

        var newAngle =
            angleInit +
            angleMouseInit -
            (Math.atan2(e.clientX - screenDec.x, e.clientY - screenDec.y) * 180) / Math.PI;

        if (that.steps.list.length > 0) {
            that.steps.list.forEach(function (step) {
                if (
                    Math.abs(newAngle - step) < that.steps.strength ||
                    Math.abs(Math.abs(newAngle - step) - 360) < that.steps.strength
                ) {
                    newAngle = step;
                }
            });
        }

        var mtx = mtxInit
            .translate(dec.x, dec.y)
            .scaleNonUniform(1 / scaleX, 1 / scaleY)
            .rotate(-angleInit)
            .rotate(newAngle)
            .scaleNonUniform(scaleX, scaleY)
            .translate(-dec.x, -dec.y);

        jNode.setMtx(mtx);

        hasChanged = true;
        that.trigger("drag", that.node, e);
    }

    function remove(e) {
        if (that.className) jNode.classRemove(that.className);

        new JSYG(that.field).each(function () {
            var field = new JSYG(this);
            //field.css('cursor',field.data('cursorInit')); //GUSA
            field.css("cursor", field.data_("cursorInit"));
        });

        let c = new JSYG(this);
        c[0].removeEventListener("mousemove", mousemoveFct);
        c[0].removeEventListener("mouseup", remove);

        if (hasChanged) {
            if (that.type !== "transform" && that.shape === "noAttribute") jNode.mtx2attrs();
            that.trigger("dragend", that.node, e);
        }
        that.trigger("end", that.node, e);
    }
    let doc = new JSYG(document);
    doc[0].addEventListener("mousemove", mousemoveFct);
    doc[0].addEventListener("mouseup", remove);

    this.trigger("start", that.node, e);

    return this;
};

Rotatable.prototype.enable = function (opt) {
    this.disable();

    if (opt) this.set(opt);

    var that = this,
        evt = opt && opt.evt;

    function start(e) {
        if (that.eventWhich && e.which != that.eventWhich) return;
        that.start(e);
    }

    new JSYG(this.field).each(function () {
        var field = new JSYG(this);
        //field.on(that.event,start); //GUSA
        field[0].addEventListener(that.event, start);
    });

    this.disable = function () {
        new JSYG(this.field).each(function () {
            var field = new JSYG(this);
            //field.off(that.event,start); //GUSA
            field[0].removeEventListener(that.event, start);
        });
        this.enabled = false;
        return this;
    };

    this.enabled = true;

    if (evt) {
        this.start(evt);
    }

    return this;
};

Rotatable.prototype.disable = function () {
    return this;
};

var plugin = JSYG.bindPlugin(Rotatable);

JSYG.prototype.rotatable = function () {
    return plugin.apply(this, arguments);
};
