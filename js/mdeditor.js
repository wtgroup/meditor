/*
paragraph,blockquote,blockcode,table,head,ullist,ollist,image,
*/
const Constant = {
    LF: "\n"
};
//--md types--//
let _mtypes = ["paragraph", "blockquote", "blockcode", "table", "head", "ullist", "ollist", "image",];
Constant.mtype = {
    all: new Set(_mtypes),
    paragraph: _mtypes[0],
    blockquote: _mtypes[1],
    blockcode: _mtypes[2],
    table: _mtypes[3],
    head: _mtypes[4],
    //todo 补全
};


class ModeFactory {
    constructor(context) {

        //上下文环境
        this.context = {
            $mEditor: null,
            modeMap: new Map(),
            currentMode: null,
        }
        $.extend(this.context, context);
        let that = this;
        this.context.$mEditor.on("click", function (e) {
            console.log("e.target", e.target);
            if (e != null && e.target != null && e.target.hasAttribute("mid")) {
                that.context.currentMode = that.context.modeMap.get(e.target.attr("mid"));
            }
        })


        this.mid = -1;

    }

    /**
     * {
     *   modeClass:Mode具体类型,
     *   level:标题级别数字,
     *   meta:元数据,
     * }
     *
     * @param args
     * @returns {*}
     */
    createMode(args) {
        if (args == null || args.modeClass == null) {
            console.log("not specify mode class")
            return null;
        }
        //要求是 Mode 及其子类
        if (!(Mode.isPrototypeOf(args.modeClass) || args.modeClass === Mode)) {
            console.log("not supported mode class: " + args.modeClass);
            return null;
        }

        let mode;
        let mid = this.nextMid();
        if (args.modeClass === Paragraph) {
            let para$el = $('<p mid="' + mid + '" mtype="paragraph" contenteditable="true"></p>');
            mode = new args.modeClass(args.meta, args.parent, para$el);
        } else if (args.modeClass === MHead) {
            let hn = 'h' + args.level;
            let mh$el = $('<' + hn + ' mid="' + mid + '" mtype="head" contenteditable="true"></' + hn + '>');
            mode = new MHead(args.level, args.meta, mh$el);
        }

        this.context.modeMap.set(mid, mode);
        if (mode.previous == null) {
            this.context.$mEditor.append(mode.$el);
            mode.$el.focus();
        } else {
            //Note:previous 必须已经在dom容器中了才有效
            mode.previous.$el.after(mode.$el);
        }

        return mode;
    }

    replaceWith(oldMode, newMode) {
        oldMode.$el.replaceWith(newMode.$el);
        newMode.previous = oldMode.previous;
        newMode.next = oldMode.next;
        this.context.modeMap.delete(oldMode.getMid());
        this.context.modeMap.set(newMode.getMid(), newMode);
        oldMode = null;    //置空便于回收
    }


    nextMid() {
        return this.mid += 2;
    }

    inputHandle($dom) {
        let input = $dom.text();
        console.log(input);

        let headLikeReg = /^(#{1,6})\s+(.+)(?:\n|$)?/;
        let m = headLikeReg.exec(input);
        if (m) {
            //几个#代表几级标题
            let lvl = m[1].length;
            let cnt = m[2];
            //let mHead = new MHead(lvl, cnt, null, context);
            let mHead = this.createMode({level: lvl, meta: cnt});
            mHead.$el.text(args.meta);

            //判断当前node是否允许含有head类型子节点
            if (mHead.excludes.has(mHead.type)) {
                //替换
                //mHead.$el.replaceWith(mHead.$el);
                this.replaceWith(this.context.currentMode, mHead);
                //mHead.$el.focus();
                moveCursorToEnd(mHead.$el);
            } else {
                //放入子节点数组中
                mHead.children.push(mHead);
            }
            //
            mHead.binding();

        }
    }


}


class Mode {
    constructor(type, meta, parent, excludes, $el, context) {
        //md 类型, 不同的类型决定了将要dom结构
        this.type = type || 'paragraph';
        //父节点
        this.parent = parent;

        //本类型子类禁用的列表, 是本节点的禁用类和父节点禁用列表并集
        if (parent && excludes) {
            excludes = new Set([...parent.excludes, ...excludes])
        }
        this.excludes = excludes || new Set();

        //存放子节点
        this.children = [];
        //元数据文本
        this.meta = meta || '';
        //对应的jQuery节点
        this.$el = $el;
        //环境参数
        this.context = context || {};
        //前一个节点
        //this.previous;
        //后一个节点
        //this.next;
    }


    /**
     * 计算并获取最终的元数据文本, 用于存储Markdown原始文本内容.
     */
    getMeta() {
        return this.meta;
        /* //paragraph且没有子节点->自身的meta就是最终的meta
         if (this.type == 'paragraph' && this.children.length == 0) {
             return this.meta;
         }

         //标题
         //不存在子节点的
         if (this.type == 'head') {

         }*/
    }

    getMid() {
        if (this.$el == null) {
            return null;
        }
        return this.$el.attr("mid");
    }

    binding() {
        let that = this;
        let isPinyin = false;
        let lastIsEmpty = false;
        this.$el.on('compositionstart', function (e) {
            console.log('compositionstart', this.innerText);
            isPinyin = true;
            console.log('compositionstart');

        }).on('compositionend', function (e) {
            console.log('compositionend', this.innerText);
            //inputHandle($(this),that.context);
            isPinyin = false
        }).on('input', function (e) {
            lastIsEmpty = this.innerText == '';
            console.log('input', this.innerText);
            if (!isPinyin) {
                //inputHandle($(this),that.context);

            }

        }).on('keydown', function (e) {
            console.log('keydown', e.keyCode);
            let newBlock = false;
            if (e.keyCode == 13) {      //回车键
                e.preventDefault();
                //TODO 光标所在位置直到该模块末尾的内容要剪切到新建的下方标签里
                //当前块的内容子光标位置, 一分为二, 后部分剪切, new Paragraph()的内容
                newBlock = true;
            }
            if (e.keyCode == 40) {      //方向下键
                //内容不为空时, 才执行
                if (this.innerText != '') {
                    newBlock = true;

                }
            }
            if (newBlock) {
                inputHandle($(this), that.context);
                that._initStubMNode(true);
            }

            //利用keyup在input事件之后, 且若回退没有内容后, 下次再回退就不会触发input
            if (lastIsEmpty && (e.keyCode == 8 || e.keyCode == 46)) {
                //=>上次input就已经空了, 本次按了Backspace/Delete
                //删除本节点, 替换为P标签
                if (!(that instanceof Paragraph)) {
                    that._initStubMNode(false);
                }

            }

        }).on('keyup', function (e) {
            console.log('keyup', e.keyCode);
        })
    }

    //初始化一个站位MNode, 目前等价于Paragraph
    _initStubMNode(append) {
        let that = this;
        let cid = incrId();
        let para = new Paragraph('', null, $('<p cid="' + cid + '" mdtype="paragraph" contenteditable="true"></p>'),
            that.context);
        if (append) {
            that.$el.after(para.$el);
            that.next = para;
            that.context.mNodeMap.set(cid, para);
        } else {
            that.$el.replaceWith(para.$el);
            //TODO 替换 that.context.mNodeMap.get(cid)
        }
        that.context.currentMNode = para;
        para.$el.focus();
        para.binding();
    }
}

class Paragraph extends Mode {
    constructor(meta, parent, $el, context) {
        super('paragraph', meta, parent, Constant.mtype.all, $el, context);
    }
}


class MHead extends Mode {
    constructor(level, meta, $el, context) {
        super('head', meta, null, Constant.mtype.all, $el, context);
        //标题级别
        this.level = level || 1;
    }

    getMeta() {
        let m = '';
        for (let i = 0; i < this.level; i++) {
            m += "#";
        }
        return m += ' ' + this.meta + LF;
    }


}


class Blockquote extends Mode {
    constructor(parent) {
        super('blockquote', null, parent, null);
    }

    getMeta() {
        let m = '';
        for (let i = 0; i < this.children.length; i++) {
            let c = this.children[i];
            m += '> ' + c.getMeta() + LF;
        }
    }
}

// class MLine

//公共方法区
// function inputHandle($dom, context) {
//     let input = $dom.text();
//     console.log(input);
//
//     let headLikeReg = /^(#{1,6})\s+(.+)(?:\n|$)?/;
//     let m = headLikeReg.exec(input);
//     if (m) {
//         //几个#代表几级标题
//         let lvl = m[1].length;
//         let cnt = m[2];
//         let mHead = new MHead(lvl, cnt, null, context);
//         //绑定事件处理
//         // mHead.$el
//
//         //判断当前node是否允许含有head类型子节点
//         if (context.currentMNode.excludes.has(mHead.type)) {
//             //替换
//             context.currentMNode.$el.replaceWith(mHead.$el);
//             //mHead.$el.focus();
//             moveCursorToEnd(mHead.$el);
//             context.mNodeMap.delete(context.currentMNode);
//             context.mNodeMap.set(cid, mHead);
//             context.currentMNode = null;        //置空便于回收
//         } else {
//             //放入子节点数组中
//             context.currentMNode.children.push(mHead);
//         }
//         //
//         context.currentMNode = mHead;
//         mHead.binding();
//
//     }
// }

function moveCursorToEnd($dom) {

    let textbox = $dom[0];
    let sel = window.getSelection();
    let range = document.createRange();
    //选择节点中的所有内容==全选
    range.selectNodeContents(textbox);
    //collapses the range to end
    range.collapse(false);
    sel.removeAllRanges();
    //更新range
    sel.addRange(range);

    /*$dom.focus();
    if(!start){
        //start = $dom.text().length;
        start = 0;
    }
    if (document.selection) {
        let sel = $dom[0].createTextRange();
        sel.moveStart('character',start);
        sel.collapse();
        sel.select();
    } else if (typeof $dom[0].selectionStart == 'number' && typeof $dom[0].selectionEnd == 'number') {
        $dom[0].selectionStart = $dom[0].selectionEnd = start;
    }*/

}

//

// let cid = -1;
// let incrId = function () {
//     return cid += 2;
// }

$(function () {
    let mf = new ModeFactory({
        $mEditor: $('.md_editor'),
    });

    //页面加载动作
    let para = mf.createMode({modeClass: Paragraph, meta: ''});

    //context.currentMNode = para;
    para.$el.focus();       //添加到页面后, 聚焦才有效果
    para.binding();

})

