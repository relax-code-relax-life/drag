## 拖动插件
拖动支持 absolute、fixed、relative、float ;
拖动支持 left、top、right、bottom 任意组合定位.
注意: 拖动不支持 同时设置left和right 或者 同时设置top和bottom 的情况.

## ne-plugin-state参数
element <<String>> (可选)拖动元素的选择器; 默认为当前元素
container <<String>> (可选)拖动的容器的selector;默认为document.documentElement
handler <<String>> (可选)触发拖动的元素的selector，默认为当前元素
proxy <<Boolean>>  (可选)是否使用代理拖动效果,只能是true或false
scroll <<bool>> (可选)拖动过程中是否允许container滚动. 默认为true. 为false代表禁止滚动
dragActive <<String>> (可选)选择到拖动元素触发的事件
dragStart <<String>> (可选)拖动开始事件的事件名称.
dragEnd  <<String>> (可选)拖动结束事件的名称

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

##特殊情况参数-针对某些特出情况的fix
style <<String>> (可选)用逗号分隔, eg: right,bottom
