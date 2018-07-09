鼠标拖动效果。支持以absolute、fixed、relative、float定位的元素。

# note
- 不兼容IE9以下。 
- 未经过严格测试，如有问题烦请在issue中提出，会及时处理。

# 下载

- npm: `npm install -S wwl-drag`
- 直接下载: `http://wangwl.net/static/demo/wwl-drag/drag.js` 

# 使用

- es2015: `import drag from 'wwl-drag'`
- commonjs: `var drag = require('wwl-drag')`
- amd: `define(['./wwl-drag'],function(drag){ /*...*/ })`
- window.drag: `<script src="http://wangwl.net/static/demo/wwl-drag/drag.js"></script>` 

# 示例1
```javascript
 var dispose1 = drag('#drag1');                             //传入选择器
 var dispose2 = drag(document.getElementById('drag2'));     //传入元素节点
 var dispose3 = drag('#drag3',{ proxy:true });              //传入配置参数。
```

# demo
[http://wangwl.net/static/demo/wwl-drag/demo.html](http://wangwl.net/static/demo/wwl-drag/demo.html)

# 函数签名

`function drag( node, options )`

- node: {element|string} 必填。鼠标拖动的目标元素。传入一个元素或者选择器。
- options: {object} 可选。相关配置参数。

# 函数返回值

```javascript
var dispose = drag('#drag');
typeof dispose === 'function';  //true
```

`drag()`的返回值是function类型，用于释放资源(取消事件监听等)。 

例如，在Vue的`beforeDestroy`和React的`componentWillUnmount`中需要调用`dispose()`。


# options参数

`{ container, targetContainer, handler, proxy, posProperty, event:{dragActive,dragStart,dragMove,dragEnd} }`

### container
{element|string} 元素节点或选择器。

指定拖动的容器，限制拖动元素只能在该容器中被拖动。

默认为 `document.body`，即拖动元素只能在该文档中拖动。

传入字符串`"null"`，则不限制范围。

```javascript
//documentElement和null的区别:

/*
<style> 
#drag1,#drag2{ 
    left:0;
    position:absolute; 
    width:50px; 
    height:50px; 
    border:1px solid #000;} 
</style>
<body>
    <div id=drag1></div>
    <div id=drag1></div>
</body>
* */

drag('#drag1',{container:document.documentElement});  //拖动#drag1,定位left值最小为0。
drag('#drag2',{container:'null'});                    //拖动#drag2,定位left值则可能为负数。

```

### targetContainer
{element|string} 元素节点或选择器。

匹配拖动元素的容器。

例如: `drag('div',{targetContainer:'#container'})`，相当于 `drag('#container div')`;

### handler
{element|string} 元素节点或选择器

触发拖动的元素，默认点击当前元素任意位置触发拖动。

### proxy
{bool} 

是否开启拖动代理效果。

默认直接改变目标元素的定位，如果`proxy`为true，则直到拖动完成后，才改变目标元素的定位，拖动过程中，实际拖动的是一个占位浮层。

### posProperty
{array}

指定定位的样式属性。默认通过改变元素的left和top值进行定位。

通过传入 `{posProperty:[ 'right', 'bottom' ]}`，则使用 right和bottom进行定位。

posProperty只识别`"left"`,`"right"`, `"top"`, `"bottom"`。

检测当存在"right"时，则使用right,否则使用left。当存在"bottom"时，则使用bottom，否则使用top。

### event.dragActive

`function(dragElement,startOffset)`

触发拖动元素时触发，`dragElement` 为当前拖动元素，`startOffset` 为当前拖动元素的坐标。

note: 该事件实际是在mousedown事件中触发。

### event.dragStart

`function(dragElement,startOffSet)`

开始拖动时触发，该事件回调如果返回布尔型的false，则取消拖动。例如:
```javascript
drag('.drag', {
    event: {
        dragStart: function () {
            return window.unlock == false;
        }
    }
})
```
`dragElement` 为当前拖动元素，`startOffset` 为当前拖动元素的坐标。

note: 该事件实际是在首次执行mousemove事件时触发。

### event.dragMove

`function(dragElement,startOffset,endOffset)`

拖动过程中触发的事件。

`dragElement` 为当前拖动元素，`startOffset` 为拖动元素拖动开始时的坐标。`endOffset` 为拖动元素的当前坐标。

note: 该事件实际是在mousemove事件中触发。

### event.dragEnd

`function(dragElement,startOffset,endOffset)`

拖动结束事件。

`dragElement` 为当前拖动元素，`startOffset` 为拖动元素拖动开始时的坐标。`endOffset` 为拖动元素的当前坐标。

note:该事件实际是在mouseup事件中触发。


# 建议

在拖动过程中，可能会出现选中情况。这种情况并没有在组件中做处理，如有需要，建议开发者在`dragStart`或`dragActive`事件中做处理。











