/**
 * Created by wangweilin on 2016/2/20.
 */

/*ne-plugin-state参数：
 element: {String} [可选]拖动元素的选择器; 默认为当前元素
 container: {String} [可选]拖动的容器的selector;默认为document.documentElement
 handler: {String} [可选]触发拖动的元素的selector，默认为当前元素
 proxy: {bool} [可选]只能是true或false, 是否使用代理拖动效果
 scroll:{bool} [可选]拖动过程中是否允许container滚动. 默认为true. 为false代表禁止滚动
 dragStart: {String} [可选]拖动开始事件的事件名称.
 dragEnd:  {String} [可选]拖动结束事件的名称
 dragActive: {String} [可选]选择到拖动元素触发的事件

 special fix param::
 style:{string} [可选] 用逗号分隔, eg: right,bottom
 */


/*事件说明:
 例如设置 dragStart:startEvent;dragEnd:endEvent  ,通过下面的方式监听事件：
 $$.on("startEvent",function($dragElement,startOffSet,outer){})
 $$.on("endEvent",function($dragElement,startOffset,endOffset){})
 */

/*事件参数说明：
 $dragElement 当前被拖动的元素，即ne-plugin-state中element定义的元素
 startOffset  被拖动元素的初始偏移量。
 endOffset    被拖动元素的最终偏移量
 outer是事件返回对象，通过设置outer.cancel=true。取消拖动。
 */

define('%drag_plugin_depends', {
    drag: (function ($, window, document, undefined) {

        var docEle = document.documentElement;
        var getOffset = function (dom) {
            var box = dom.getBoundingClientRect();
            return {
                left: box.left + window.pageXOffset - docEle.clientLeft,
                top: box.top + window.pageYOffset - docEle.clientTop
            }
        };

        var fixPageXandPageY = function (e) {
            if (e.pageX != null) return e;
            e.pageX = e.clientX + (document.body.scrollLeft || docEle.scrollLeft);
            e.pageY = e.clientY + (document.body.scrollTop || docEle.scrollTop);
        };

        var isInclude = function ($container, $tarEle, selector) {
            var $result = $container.find(selector);
            for (var i = $result.length - 1; i > -1; i--) {
                if ($result[i] == $tarEle[0]) {
                    return true;
                }
            }
            return false;
        };

        var drag = function (options) {
            var
                selector = options.selector,  //拖动元素选择器
                targetSelector = selector + ' ' + options.handler, //触发拖动的目标元素选择器
                $container = options.container, //拖动容器
                $tarContainer = options.targetContainer, //允许拖动的元素的容器
                disableScroll = !options.scroll,//取消$container的scroll事件的.
                eleOffset, //拖动元素的文档偏移  offset():文档坐标
                mouseStartX, mouseStartY, //鼠标初始位置
                $currentEle, //拖动元素 BDOM对象
                moveRange, //拖动元素的 运动范围
                containerBound, //容器的视口坐标
                eleBound, //拖动元素的视口坐标
                eleEndOffset, //拖动元素最终的文档偏移
                $moveEle, //在mousemove事件中移动的元素,无代理时为$current,有代理时为$proxyEle
                proxyEleOffset, proxyEleEndOffset,
                isProxy = options.proxy,
                setProxyDisplay = null, //显示代理元素 该变量为Function类型
                execStartEvent = null, // 执行开始拖动事件 该变量为Function类型
                delta, validDelta,
                hasHandler = options.handler,
                posProperty = options.posProperty;


            var getEndOffset = function (delta) {
                var result = {};
                if (eleOffset.left == null) {
                    result.right = eleOffset.right - delta.left;
                }
                else {
                    result.left = eleOffset.left + delta.left;
                }
                if (eleOffset.top == null) {
                    result.bottom = eleOffset.bottom - delta.top;
                }
                else {
                    result.top = eleOffset.top + delta.top;
                }
                return result;
            };

            var mousedownHandler = function (e) {

                if (!e.target) {
                    e.target = e.srcElement;
                }

                //1.delegate触发的有可能是拖动元素的子元素,
                //2.handler元素
                $currentEle = $(e.target).closest(selector);
                if ($currentEle.length == 0) {
                    //3.拖动元素
                    $currentEle = $(e.target);
                }


                if ($tarContainer && !isInclude($tarContainer, $currentEle, selector)) {
                    $currentEle = null;
                    return;
                }


                if (e.pageX == null) {
                    fixPageXandPageY(e);
                }
                mouseStartX = e.pageX;
                mouseStartY = e.pageY;

                //eleOffset: {left,top}
                if ($currentEle.css('position') == 'fixed') {
                    eleOffset = $currentEle[0].getBoundingClientRect();
                    eleOffset={
                        left:eleOffset.left,
                        top:eleOffset.top
                    };
                    //1.删除无用属性,防止下面误判. 2.将只读ClientRect对象变为普通对象.
                }
                //eleOffset: {top?,bottom?,left?,right?}
                else {
                    eleOffset = {
                        left: parseFloat($currentEle.css('left')),
                        top: parseFloat($currentEle.css('top')),
                        right: parseFloat($currentEle.css('right')),
                        bottom: parseFloat($currentEle.css('bottom'))
                    };


                    //有可能left,right均未赋值,top,bottom类似
                    if (isNaN(eleOffset.left) && !isNaN(eleOffset.right)) {
                        delete eleOffset.left;
                    }
                    else {
                        delete eleOffset.right;
                    }

                    if (isNaN(eleOffset.top) && !isNaN(eleOffset.bottom)) {
                        delete eleOffset.top;
                    }
                    else {
                        delete eleOffset.bottom;
                    }

                    for (var key in eleOffset) {
                        eleOffset[key] = eleOffset[key] || 0;
                    }
                    //此时保证 存在一对left|right bottom|top 值, 且为数字类型.
                }

                //region eleOffset filter
                //如果上面的if-else可以从取值中判断出样式是否设置了对应的属性值,则可以省略该region代码.
                //存在该段代码的目的:
                //  当$currentEle是依据right,bottom定位的,
                //  则拖动时,应该 同样设置right,bottom定位, 但是getComputedStyle的结果总是有值得.
                //  其实也可以依照left,top定位,禁用掉bottom和right, 但总觉得这样会存在潜在的问题,且让使用者产生困惑.
                if (posProperty.right &&
                    (   eleOffset.right != undefined || !isNaN(eleOffset.right = parseFloat($currentEle.css('right')))
                    )
                ) {
                    eleOffset.left != undefined && delete eleOffset.left;
                }
                if (posProperty.bottom &&
                    (   eleOffset.bottom != undefined || !isNaN(eleOffset.bottom = parseFloat($currentEle.css('bottom')))
                    )
                ) {
                    eleOffset.top != undefined && delete eleOffset.top;
                }
                //endregion


                eleEndOffset = eleOffset;


                if (options.event.dragStart) {
                    execStartEvent = function () {
                        if (options.event.dragStart($currentEle, eleOffset) === false) {
                            $currentEle = null;
                        }
                        execStartEvent = null;


                        return $currentEle;
                    };
                }

                if (options.event.dragActive) {
                    options.event.dragActive($currentEle, eleOffset);
                }

                containerBound = $container[0].getBoundingClientRect();
                eleBound = $currentEle[0].getBoundingClientRect();
                moveRange = {
                    left: containerBound.left - eleBound.left,
                    right: containerBound.right - eleBound.right,
                    top: containerBound.top - eleBound.top,
                    bottom: containerBound.bottom - eleBound.bottom
                };


                if (isProxy) {

                    proxyEleOffset = getOffset($currentEle[0]);

                    $moveEle = showProxyElement(
                        //$currentEle.width(), $currentEle.height(),
                        $currentEle[0].offsetWidth, $currentEle[0].offsetHeight,
                        $container,
                        +$currentEle.css('z-index'),
                        $currentEle.css('borderRadius')
                    );

                    setProxyDisplay = function () {
                        $moveEle.css('display', 'block');
                        setProxyDisplay = null;
                    };
                }
                else {
                    $moveEle = $currentEle;
                }


                //todo 检查 $currentEle 是否具有禁止选中的 事件和样式。
                //建议在事件中手动添加


            };

            $container.delegate('mousedown', targetSelector, mousedownHandler)
                .bind('mousemove', function (e) {
                    if ($currentEle) {

                        execStartEvent && execStartEvent();
                        if (!$currentEle) {
                            return;
                        }


                        delta = {
                            top: e.pageY - mouseStartY,
                            left: e.pageX - mouseStartX
                        };

                        //max 判断左边缘和上边缘
                        //min 判断右边缘和下边缘
                        //  container.left-eleOffset.left(<0) < delta.left < container.right-eleOffset.right(>0)
                        validDelta = {
                            left: Math.min(Math.max(moveRange.left, delta.left), moveRange.right),
                            top: Math.min(Math.max(moveRange.top, delta.top), moveRange.bottom)
                        };

                        // eleEndOffset = {
                        //     left: eleOffset.left + validDelta.left,
                        //     top: eleOffset.top + validDelta.top
                        // };

                        eleEndOffset = getEndOffset(validDelta);

                        if (isProxy) {
                            proxyEleEndOffset = {
                                left: proxyEleOffset.left + validDelta.left,
                                top: proxyEleOffset.top + validDelta.top
                            };
                            setProxyDisplay && setProxyDisplay();
                            $moveEle.css(proxyEleEndOffset);
                        }
                        else {
                            $moveEle.css(eleEndOffset);
                        }

                        if (disableScroll) {
                            if (e) e.preventDefault();
                            else {
                                window.event.returnValue = false;
                            }
                        }
                    }
                });

            $(window).bind('mouseup', function () {
                if (!$currentEle) {
                    return;
                }

                if (options.proxy) {
                    hideProxyElement();
                    $currentEle.css(eleEndOffset);
                }


                if (options.event.dragEnd) {
                    options.event.dragEnd($currentEle, eleOffset, eleEndOffset);
                }

                $currentEle = null;
            });

        };

        var proxyClass = 'dragProxy_';
        var proxySelector = '.' + proxyClass;

        function showProxyElement(width, height, $container, zIndex, borderRadius) {
            var $proxyEle = $(proxySelector);
            if (!$proxyEle.length) {
                $proxyEle = $container.append('<div class="' + proxyClass +
                    '" style="position:absolute;z-index:20;background:#A0A1A2;opacity:0.6;border-radius:' + (borderRadius || 0) + ';cursor:move"></div>').find(proxySelector);
            }
            $proxyEle.css({
                width: width + 'px',
                height: height + 'px',
                zIndex: zIndex + 10,
                display: 'none'
            });

            return $proxyEle;
        }

        function hideProxyElement() {
            $(proxySelector).hide();
        }

        var guid = 0;
        var getGUID = function () {
            return guid++;
        };


        /*
         * @param ele {element|jQueryObj|string_selector} 拖动的元素
         * @param options
         *           options.container {element|jQueryObj|string_selector} 拖动的容器
         *           options.targetContainer {element|jQueryObj|string_selector}  限定允许拖动的元素的容器. (eg:ele为选择器"div",则container下有多个匹配元素,需要传入该参数限定选中元素的容器)
         *           options.proxy 是否使用拖动代理效果
         *           options.handler {element|jQueryObj|string_selector} 触发拖动的元素
         *           options.scroll {bool} container是否可以滚动. 默认为true. 为false时,在mousemove事件中preventDefault
         *           options.posProperty {array} 传入left|right|top|bottom,判断根据哪个属性进行定位, 默认top,left优先.
         *           options.event.dragActive function($dragElement,startOffset) 触发拖动元素时触发(mousedown事件)
         *           options.event.dragStart function($dragElement,startOffSet) 拖动开始事件,返回布尔型的false则取消拖动
         *           options.event.dragEnd function($dragElement,startOffset,endOffset) 拖动结束事件
         *                                  $dragElement 拖动的元素
         *                                  startOffset 开始拖动时的视口坐标(视口：浏览器内容区域窗口)
         *                                  endOffset   结束拖动时的视口坐标
         * */
        return function (ele, options) {
            if (!ele) return;

            var $ele = $(ele),
                eleIsString = typeof ele == 'string';


            if (!eleIsString && $ele.length == 0) return;

            options = options || {
                    container: document.documentElement,
                    proxy: false,
                    handler: '',
                    event: {}
                };

            if (options.targetContainer) {
                options.targetContainer = $(options.targetContainer);
                if (options.targetContainer.length == 0) {
                    options.targetContainer = null;
                }
            }

            if (eleIsString) {
                options.selector = ele;
            }
            else {
                var flagClass = 'elementDrag_' + getGUID();
                $ele.addClass(flagClass);
                options.selector = '.' + flagClass;
            }

            //init handler
            var $handler;
            options.handler = options.handler || '';
            if (typeof options.handler != 'string') {
                $handler = $(options.handler);
                if ($handler.length) {
                    $handler.addClass('elementDragHandler_');
                    options.handler = '.elementDragHandler_';
                }
            }

            //init container
            options.container = $(options.container || document.documentElement);
            options.event = options.event || {};

            options.scroll = options.scroll == null ? true : options.scroll == true;

            //init posProperty
            var posProperty = options.posProperty;
            options.posProperty = {};
            var propertyLimit = ['left', 'right', 'top', 'bottom,'].join(',');
            if ($.isArray(posProperty)) {
                $.each(posProperty,function (key) {
                    if (propertyLimit.indexOf(key + ',') > -1) {
                        options.posProperty[key] = true;
                    }
                });
            }


            drag(options);

        }

    })(bowlder, window, document)
});
define(['%drag_plugin_depends'], function (drag) {
    var state = this.state = {},
        $$ = bowlder;

    drag = drag.drag;

    this.init = function ($root) {
        var ele = state.element;
        if (ele) {
            state.targetContainer = $root;
        }
        else {
            ele = $root[0];
        }

        state.posProperty = state.style && state.style.split(',');

        //state.proxy = state.proxy == 'true';
        state.event = {};

        if (state.dragStart) {
            state.event.dragStart = function ($dragElement, startOffSet) {
                var outer = {};
                $$.emit(state.dragStart, $dragElement, startOffSet, outer);
                //返回布尔型的false则取消拖动
                return !outer.cancel;
            }
        }
        if (state.dragEnd) {
            state.event.dragEnd = function ($dragElement, startOffset, endOffset) {
                $$.emit(state.dragEnd, $dragElement, startOffset, endOffset);
            }
        }

        if (state.dragActive) {
            state.event.dragActive = function ($dragElement, startOffset) {
                $$.emit(state.dragActive, $dragElement, startOffset);
            }
        }


        drag(ele, state);
    };


});

