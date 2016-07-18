## 拖动插件
拖动支持 absolute、fixed、relative、float ;

## ne-plugin-state参数
element <<String>> 拖动元素的选择器; 默认为当前元素
container <<String>> 拖动的容器的selector;默认为document.documentElement
handler <<String>> 触发拖动的元素的selector，默认为当前元素
proxy <<Boolean>>  是否使用代理拖动效果,只能是true或false
dragStart <<String>> 拖动开始事件的事件名称.
dragEnd  <<String>> 拖动结束事件的名称

## 事件说明
例如设置 ne-plugin-state="dragStart:startEvent;dragEnd:endEvent"  ,通过下面的方式监听事件：
``javascript
$$.on("startEvent",function($dragElement,startOffSet,outer){})
$$.on("endEvent",function($dragElement,startOffset,endOffset){})
``

## 事件参数说明
$dragElement :: 当前被拖动的元素，即ne-plugin-state中element定义的元素
startOffset :: 被拖动元素的初始偏移量。
endOffset  ::  被拖动元素的最终偏移量
outer :: 事件返回对象，通过设置outer.cancel=true。取消拖动。
