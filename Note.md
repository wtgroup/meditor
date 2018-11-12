
## 设计

Markdown block types:
- paragraph
- blockquote
- blockcode
- table
- head
- ullist
- ollist
- image

其中, paragraph下面不能再有其他类型节点.



## 获取文本宽度

将文本放入隐藏的div中, 得到宽度.
[](https://blog.csdn.net/ybdesire/article/details/50018747)





## Typora研究



段落:
```
mdtype="paragraph" contenteditable="true"

```

带有mdtype属性的貌似就有cid="n2"属性, 数字按2步长递增? 但是也不一定, 没有规律.


引用:

```
blockquote>p
```
每行内容在p>span中.


光标两侧标签带有`class="md-expand"`, 但是貌似只有p>span会有, 在往下的没有.


标题:
输入`# 9`时的状态是, 包裹'#'的span带有`class="md-block-like"`.


代码块('```'):
`mdtype="fences"`
获取焦点到失去焦点之间输入的内容, 会在textarea里, 失去焦点就会被清除了.

每一行都在pre>span中.


图片域提示文字:'输入图片地址', 是通过before伪类, content属性+样式: `content: attr(content);`得到.


## 知识点

`(.*?)`, ?表示尽可能少的匹配.
`(?:\n|$)/)`, ?:表示此括号的内容不作为结果输出, 不会编号.


> The Range.collapse() method collapses the Range to one of its boundary points.
> 将访问折叠到边界位置.
> A collapsed Range is empty, containing no content, specifying a single-point in a DOM tree. To determine if a 
> Range is already collapsed, see the Range.collapsed property.


```
range.collapse(toStart);
toStart Optional
A boolean value: true collapses the Range to its start, false to its end. If omitted, it defaults to false .
```

这两个属性只适合input, textarea
console.log(this.selectionStart, this.selectionEnd);


```
/*触发顺序:
* 非拼音: keydown, input, keyup
* 拼音: keydown,start,input,keyup,keydown,input,keyup... end
* */

```

* `Enter`
最先触发的地方preventDefault, `Enter`键只会触发keydown,keyup.
回车时, input事件中e.keyCode==undisputed.