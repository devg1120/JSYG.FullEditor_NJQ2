import JSYG from "../JSYG-wrapper/JSYG-wrapper.js";
import StdConstruct from "../JSYG.StdConstruct/JSYG.StdConstruct.js";
import Resizable from "../JSYG.Resizable/JSYG.Resizable.js";

import { isArrayLike } from "../jquery/src/core/isArrayLike.js";

("use strict");

export default function Selection(arg, opt) {
    this.selected = [];
    this.selectedOver = [];
    this.container = document.createElement("div");

    if (arg) this.setNode(arg);
    if (opt) this.enable(opt);
}

Selection.prototype = new StdConstruct();

Selection.prototype.constructor = Selection;

Selection.prototype.id = "Selection";
Selection.prototype.list = null;
Selection.prototype.multiple = true;
Selection.prototype.typeOver = "full";

Selection.prototype.shortCutSelectAll = "ctrl+a";

Selection.prototype.autoEnableShortCuts = false;
Selection.prototype.onbeforedrag = null;

Selection.prototype.onbeforeselect = null;
Selection.prototype.onbeforedeselect = null;
Selection.prototype.ondragstart = null;
Selection.prototype.ondrag = null;
Selection.prototype.ondragend = null;
Selection.prototype.onselectover = null;
Selection.prototype.onselectmove = null;
Selection.prototype.onselectout = null;
Selection.prototype.onselect = null;
Selection.prototype.ondeselect = null;
Selection.prototype.onselectedlist = null;
Selection.prototype.ondeselectedlist = null;
Selection.prototype.enabled = false;
Selection.prototype.classSelected = "selected";
Selection.prototype.classOver = "selectOver";

Selection.prototype.resizableOptions = null;

Selection.prototype.addElmt = function (elmt, e) {
    elmt.classList.add(this.classSelected); //GUSA
    var node = elmt;

    //if (new JSYG(this.list).index(elmt) == -1) throw new Error("L'élément n'est pas sélectionnable");

    if (this.selected.indexOf(node) != -1) throw new Error("L'élément est déjà dans la liste");

    if (!node.parentNode) throw new Error("L'élément n'est pas attaché au DOM");

    this.selected.push(node);

    this.trigger("select", this.node, e, node);
};

Selection.prototype.removeElmt = function (elmt, e) {
    elmt.classList.remove(this.classSelected); //GUSA
    var node = elmt;

    var ind = this.selected.indexOf(node);

    if (ind == -1) throw new Error("L'élément n'est pas dans la liste");

    this.selected.splice(ind, 1);

    this.trigger("deselect", this.node, e, node);
};

function each(obj, callback) {
    var length,
        i = 0;

    if (isArrayLike(obj)) {
        length = obj.length;
        for (; i < length; i++) {
            if (callback.call(obj[i], i, obj[i]) === false) {
                break;
            }
        }
    } else {
        for (i in obj) {
            if (callback.call(obj[i], i, obj[i]) === false) {
                break;
            }
        }
    }

    return obj;
}

Selection.prototype.setSelection = function (arg, e) {
    var that = this;

    this.deselectAll(e);

    each(arg, function () {
        that.addElmt(this, e);
    }); // GUSA

    if (this.selected.length > 0) this.trigger("selectedlist", this.node, e, this.selected);

    return this;
};

Selection.prototype.selectAll = function () {
    this.setSelection(this.list);

    return this;
};

Selection.prototype.deselectAll = function (e) {
    var that = this,
        selected = this.selected.slice();

    let eles = document.querySelectorAll(this.list); //GUSA
    eles.forEach((ele) => {
        ele.classList.remove(this.classSelected, this.classOver); //par précaution
    });

    while (this.selected.length > 0) this.removeElmt(this.selected[0], e);
    this.trigger("deselectedlist", this.node, e, selected);

    this.selectedOver.forEach(function (elmt) {
        elmt.classList.remove(that.classSelected); //GUSA
        that.trigger("selectout", that.node, e, elmt[0]);
    });

    this.selected = [];
    this.selectedOver = [];

    return this;
};

Selection.prototype._draw_ = function (e) {};
Selection.prototype._draw = function (e) {
    var list = new JSYG(this.list),
        container = new JSYG(this.container),
        resize = new Resizable(container),
        that = this;

    container
        .attr("id", this.id)
        //.appendTo(document.body)
        .appendTo_(document.body)
        .setDim({
            x: e.pageX,
            y: e.pageY,
            width: 1,
            height: 1,
        });

    resize.set({
        keepRatio: false,
        type: "attributes",
        originY: "top",
        originX: "left",
        cursor: false,
        inverse: true,
    });

    if (this.resizableOptions) resize.set(this.resizableOptions);

    resize.on("dragstart", function (e) {
        each(list, function () {
            //GUSA

            var dim,
                $this = new JSYG(this);
            try {
                dim = $this.getDim("screen");
                //$this.data("dimSelection",dim);//GUSA
                $this.data_("dimSelection", dim);
            } catch (e) {
                //éléments n'ayant pas de dimensions (exemple balise defs)
            }
        });

        that.trigger("dragstart", that.node, e);
    });

    resize.on("drag", function (e) {
        var div = new JSYG(this),
            dimDiv = div.getDim("screen"); //-------------------------

        each(list, function () {
            //GUSA

            var elmt = new JSYG(this),
                dimElmt = elmt.data_("dimSelection"),
                indOver = dimElmt && that.selectedOver.indexOf(this),
                isNewElmt = indOver === -1;

            if (!dimElmt) return;

            if (JSYG.isOver(dimDiv, dimElmt, that.typeOver)) {
                if (isNewElmt) {
                    elmt[0].classList.add(that.classOver);
                    const event = new CustomEvent("selectover", { detail: e });
                    that.node.dispatchEvent(event);

                    that.selectedOver.push(this);
                } else {
                    const event = new CustomEvent("selectmove", { detail: e });
                    that.node.dispatchEvent(event);
                }
            } else {
                if (!isNewElmt) {
                    elmt[0].classList.remove(that.classOver);
                    const event = new CustomEvent("selectout", { detail: e });
                    that.node.dispatchEvent(event);

                    that.selectedOver.splice(indOver, 1);
                }
            }
        });

        const event = new CustomEvent("drag", { detail: e });
        that.node.dispatchEvent(event);
    });

    resize.on("dragend", function (e) {
        var elmts = [];

        each(list, function () {
            //GUSA

            var indOver = that.selectedOver.indexOf(this);

            if (indOver !== -1) {
                that.trigger("selectout", that.node, e, this);

                if (that.trigger("beforeselect", that.node, e, this)) elmts.push(this);
            }
        });

        that.setSelection(elmts, e);

        that.trigger("dragend", that.node, e, this);

        new JSYG(this)[0].remove();
    });

    resize.on("end", function () {
        new JSYG(this)[0].remove();
    });

    resize.start(e); //-------------------------

    return this;
};

Selection.prototype._getTarget = function (e) {
    let list = document.querySelectorAll(this.list); //GUSA
    var child = new JSYG(e.target);
    let target = null;

    each(list, function () {
        if (child.isChildOf(this)) {
            target = this;
            return false;
        }
    });

    return target;
};

Selection.prototype._isIn = function (e) {
    return e.target == this.node || new JSYG(e.target).isChildOf(this.node);
};

Selection.prototype.enableShortCutSelectAll = function () {
    if (!this.enabled || !this.shortCutSelectAll) return this;

    var that = this;

    function selectAll(e) {
        e.preventDefault();
        that.selectAll();
    }

    this.disableShortCutSelectAll();

    document.addEventListener(
        "keydown", //GUSA
        selectAll,
    );
    this.disableShortCutSelectAll = function () {
        document.addEventListener(
            "keydown", //GUSA
            selectAll,
        );
        return this;
    };

    return this;
};

Selection.prototype.disableShortCutSelectAll = function () {
    return this;
};

Selection.prototype.clearNativeSelection = function () {
    if (window.getSelection) window.getSelection().removeAllRanges();
    else if (document.selection) document.selection.empty();

    return this;
};

Selection.prototype.enable = function (opt) {
    this.disable();

    if (opt) this.set(opt);

    var that = this,
        drawing = false,
        hasMoved = false,
        posInit = {},
        mousedown_ = false,
        dragging_ = false,
        $doc = new JSYG(document),
        $canvas = (this.node && new JSYG(this.node)) || $doc,
        fcts = {
            mousedown: function (e) {
                if (e.which != 1) return;

                if (
                    (!e.ctrlKey || !that.multiple) &&
                    that.trigger("beforedeselect", that.node, e) !== false
                )
                    that.deselectAll(e);

                that.clearNativeSelection();

                var cible = that._getTarget(e);

                if (cible) {
                    if (that.trigger("beforeselect", that.node, e, cible) !== false) {
                        that.setSelection(that.selected.concat(cible), e);
                    }
                } else if (!that.node || that._isIn(e)) drawing = true;
            },

            "drag:start": function (e) {
                if (that.multiple && that.trigger("beforedrag", that.node, e) !== false)
                    that._draw(e);
                else drawing = false;
            },

            mousemove: function (e) {
                if (drawing) return;

                var lastOver = that.selectedOver[0] || null,
                    cible = that._getTarget(e);

                if (lastOver && lastOver !== cible) {
                    new JSYG(lastOver).removeClass(that.classOver);
                    that.trigger("selectout", that.node, e, lastOver);
                    that.selectedOver = [];
                }

                if (cible) {
                    if (lastOver === cible) that.trigger("selectmove", that.node, e, lastOver);
                    else {
                        that.trigger("selectover", that.node, e, cible);
                        cible.classList.add(that.classOver); //GUSA
                    }
                    that.selectedOver = [cible];
                }
            },

            mouseout: function (e) {
                if (drawing) return;

                var lastOver = that.selectedOver[0];

                if (lastOver) {
                    lastOver.classList.remove(that.classOver); //GUSA
                    that.trigger("selectout", that.node, e, lastOver);
                    that.selectedOver = [];
                }
            },
        };

    var fcts2 = {
        mousedown: function (e) {
            mousedown_ = true;

            if (e.which != 1) return;

            if (
                (!e.ctrlKey || !that.multiple) &&
                that.trigger("beforedeselect", that.node, e) !== false
            )
                that.deselectAll(e);

            that.clearNativeSelection();

            var cible = that._getTarget(e);

            if (cible) {
                if (that.trigger("beforeselect", that.node, e, cible) !== false) {
                    that.setSelection(that.selected.concat(cible), e);
                }
            } else if (!that.node || that._isIn(e)) {
                drawing = true;
            }
        },

        "drag:start": function (e) {
            if (that.multiple && that.trigger("beforedrag", that.node, e) !== false) that._draw(e);
            else drawing = false;
        },

        mousemove: function (e) {
            if (mousedown_ && !dragging_) {
                dragging_ = true;

                if (that.multiple && that.trigger("beforedrag", that.node, e) !== false)
                    that._draw(e);
                else drawing = false;
                return;
            }

            if (drawing) return;

            var lastOver = that.selectedOver[0] || null,
                cible = that._getTarget(e);

            if (lastOver && lastOver !== cible) {
                new JSYG(lastOver).removeClass(that.classOver);
                that.trigger("selectout", that.node, e, lastOver);
                that.selectedOver = [];
            }

            if (cible) {
                if (lastOver === cible) that.trigger("selectmove", that.node, e, lastOver);
                else {
                    that.trigger("selectover", that.node, e, cible);
                    cible.classList.add(that.classOver); //GUSA
                }
                that.selectedOver = [cible];
            }
        },

        mouseout: function (e) {
            if (drawing) return;

            var lastOver = that.selectedOver[0];

            if (lastOver) {
                lastOver.classList.remove(that.classOver); //GUSA
                that.trigger("selectout", that.node, e, lastOver);
                that.selectedOver = [];
            }
        },
    };

    function mouseup() {
        drawing = false;
        dragging_ = false;
        mousedown_ = false;
    }

    $doc[0].addEventListener("mouseup", mouseup);

    $canvas.dragEvents()[0].addEventListener("mousedown", fcts2["mousedown"]);
    $canvas.dragEvents()[0].addEventListener("mouseup", fcts2["mouseup"]);
    $canvas.dragEvents()[0].addEventListener("mousemove", fcts2["mousemove"]);
    $canvas.dragEvents()[0].addEventListener("mouseout", fcts2["mouseout"]);

    this.enabled = true;

    if (this.autoEnableShortCuts) this.enableShortCutSelectAll();

    this.disable = function () {
        $canvas.dragEvents()[0].removeEventListener("mousedown", fcts2["mousedown"]);
        $canvas.dragEvents()[0].removeEventListener("mouseup", fcts2["mouseup"]);
        $canvas.dragEvents()[0].removeEventListener("mousemove", fcts2["mousemove"]);
        $canvas.dragEvents()[0].removeEventListener("mouseout", fcts2["mouseout"]);

        this.deselectAll();

        this.enabled = false;

        this.disableShortCutSelectAll();

        return this;
    };

    return this;
};

Selection.prototype.disable = function () {
    return this;
};
