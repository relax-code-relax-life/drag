import $ from 'wwl-dom';
// import $ from './dom';

// var $=window.$;

var docEle = document.documentElement;
var body = document.body;

var guid = 0;
var getGUID = (prefix) => prefix + guid++;

var fixPageXandPageY = function (e) {
    // if (e.pageX) return;
    e.pageX = e.clientX + (body.scrollLeft || docEle.scrollLeft);
    e.pageY = e.clientY + (body.scrollTop || docEle.scrollTop);
};

var fixStyleOffset= function (offset) {
    var obj={};
    for(var key in offset){
        obj[key]=offset[key]+'px';
    }
    return obj;
}

/*
     * @param ele {element|string_selector} 拖动的元素
     * @param options
     *           options.container {element|string_selector} 拖动的容器 传入字符串null,则不限制范围。
     *           options.targetContainer {element|string_selector}  限定允许拖动的元素的容器. (eg:ele为选择器"div",则container下有多个匹配元素,需要传入该参数限定选中元素的容器)
     *           options.proxy 是否使用拖动代理效果
     *           options.handler {element|string_selector} 触发拖动的元素
     *           options.scroll {bool} container是否可以滚动. 默认为true. 为false时,在mousemove事件中preventDefault
     *           options.posProperty {array} 传入left|right|top|bottom,判断根据哪个属性进行定位, 默认top,left优先.
     *           options.event.dragActive function($dragElement,startOffset) 触发拖动元素时触发(mousedown事件)
     *           options.event.dragStart function($dragElement,startOffSet) 拖动开始事件,返回布尔型的false则取消拖动
     *           options.event.dragEnd function($dragElement,startOffset,endOffset) 拖动结束事件
     *           options.event.dragMove function($dragElement,startOffset,endOffset) 拖动过程中触发的事件
     *                                  $dragElement 拖动的元素
     *                                  startOffset 开始拖动时的视口坐标(视口：浏览器内容区域窗口)
     *                                  endOffset   结束拖动时的视口坐标
     * */

// export default
// 不使用export ， 当umd打包在全局window上使用时，入口点为drag.default
export default function (ele, options) {
    if (!ele) return;

    var $ele = $(ele),
        eleIsString = typeof ele === 'string';


    if (!eleIsString && $ele.length === 0) return;

    options = options || {
        container: docEle,
        proxy: false,
        handler: '',
        event: {}
    };

    if (options.targetContainer) {
        options.targetContainer = $(options.targetContainer);
        if (options.targetContainer.length === 0) {
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
    if (typeof options.handler !== 'string') {
        $handler = $(options.handler);
        if ($handler.length) {
            $handler.addClass('elementDragHandler_');
            options.handler = '.elementDragHandler_';
        }
    }

    //init container
    if (options.container === 'null') {
        options.container = $(docEle);
        options.unlimit = true;
    }
    else {
        options.container = $(options.container || docEle);
    }

    options.event = options.event || {};

    options.scroll = options.scroll == null ? true : options.scroll == true;

    //init posProperty
    var posProperty = options.posProperty;
    options.posProperty = {};

    // var propertyLimit = ['left', 'right', 'top', 'bottom'];

    if (Array.isArray(posProperty)) {
        posProperty.forEach(key => {
            options.posProperty[key] = true
        });
    }


    drag(options);

};

function drag(options) {
    var
        selector = options.selector,  //拖动元素选择器
        targetSelector = selector + ' ' + options.handler, //触发拖动的目标元素选择器
        $container = options.container, //拖动容器
        isUnLimit = options.unlimit === true, //是否限制拖动范围
        $tarContainer = options.targetContainer, //允许拖动的元素的容器
        disableScroll = !options.scroll,//取消$container的scroll事件的.
        eleOffset, //拖动元素的文档偏移  offset():文档坐标
        mouseStartX, mouseStartY, //鼠标初始位置
        $currentEle, //拖动元素 BDOM对象
        moveRange, //拖动元素的 运动范围
        // containerBound, //容器的视口坐标
        // eleBound, //拖动元素的视口坐标
        eleEndOffset, //拖动元素最终的文档偏移
        $moveEle, //在mousemove事件中移动的元素,无代理时为$current,有代理时为$proxyEle
        proxyEleOffset, proxyEleEndOffset,
        isProxy = options.proxy,
        setProxyDisplay = null, //显示代理元素 该变量为Function类型
        execStartEvent = null, // 执行开始拖动事件 该变量为Function类型
        delta, validDelta,
        // hasHandler = options.handler,
        posProperty = options.posProperty,
        isMoved; //标识是否执行了mouseMove事件,如果该元素触发mousedown后,未触发mousemove,则不执行options.event.dragEnd事件


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

    //todo mousemove 写在window里
    $container
        .onDelegate('mousedown', targetSelector, (e) => {

            console.log('moduledown');

            //1.delegate触发的有可能是拖动元素的子元素,
            //2.handler元素
            $currentEle = $(e.target).closest(selector);

            if ($tarContainer && !$tarContainer.find(selector).includes($currentEle[0])) {
                $currentEle = null;
                return;
            }


            !e.pageX && fixPageXandPageY(e);
            mouseStartX = e.pageX;
            mouseStartY = e.pageY;

            //删除对fixed定位的特殊处理。因为统一使用计算的css定位,可以有效避免margin和transform:translate造成的偏移。
            var computeStyle = $currentEle.computeStyle();
            eleOffset = {
                left: parseFloat(computeStyle.left),
                top: parseFloat(computeStyle.top),
                right: parseFloat(computeStyle.right),
                bottom: parseFloat(computeStyle.bottom)
            }


            // console.log(eleOffset);

            // 默认根据left,top定位。
            //  其实也可以全部依照left,top定位,禁用掉bottom和right, 但总觉得这样会存在潜在的问题,且让使用者产生困惑.

            if (posProperty.right && !isNaN(eleOffset.right)) {
                delete eleOffset.left;
            }
            else {
                delete eleOffset.right;
            }
            if (posProperty.bottom && !isNaN(eleOffset.bottom)) {
                delete eleOffset.top
            }
            else {
                delete eleOffset.bottom;
            }

            eleEndOffset = eleOffset;

            isMoved = false;

            execStartEvent = function () {
                if (options.event.dragStart && options.event.dragStart($currentEle, eleOffset) === false) {
                    $currentEle = null;
                }
                isMoved = true;
                execStartEvent = null;

                return $currentEle;
            };

            if (options.event.dragActive) {
                options.event.dragActive($currentEle, eleOffset);
            }


            if (!isUnLimit) {
                let containerBound = $container[0].getBoundingClientRect();
                let eleBound = $currentEle[0].getBoundingClientRect();
                moveRange = {
                    left: containerBound.left - eleBound.left,
                    right: containerBound.right - eleBound.right,
                    top: containerBound.top - eleBound.top,
                    bottom: containerBound.bottom - eleBound.bottom
                };
            }

            if (isProxy) {

                proxyEleOffset = $currentEle.offset();
                let currentEleComputeStyle = $currentEle.computeStyle();
                $moveEle = getProxyElement(
                    $currentEle.offsetWidth(),
                    $currentEle.offsetHeight(),
                    $container,
                    +currentEleComputeStyle.zIndex,
                    currentEleComputeStyle.borderRadius
                );

                setProxyDisplay = function () {
                    $moveEle.style('display', 'block');
                    setProxyDisplay = null;
                }

            }
            else {
                $moveEle = $currentEle
            }

            //todo 检查 $currentEle 是否具有禁止选中的 事件和样式。
            //建议在事件中手动添加

        })
        .on('mousemove', (e) => {
            if (!$currentEle) return;

            if (execStartEvent && execStartEvent() === null) return;

            !e.pageX && fixPageXandPageY(e);
            delta = {
                top: e.pageY - mouseStartY,
                left: e.pageX - mouseStartX
            };

            //max 判断左边缘和上边缘
            //min 判断右边缘和下边缘
            //  container.left-eleOffset.left(<0) < delta.left < container.right-eleOffset.right(>0)
            if (isUnLimit) {
                validDelta = delta
            }
            else {
                validDelta = {
                    left: Math.min(Math.max(moveRange.left, delta.left), moveRange.right),
                    top: Math.min(Math.max(moveRange.top, delta.top), moveRange.bottom)
                };
            }

            eleEndOffset = getEndOffset(validDelta);

            // console.log('endOffset:', eleEndOffset);

            if (isProxy) {
                // debugger;
                proxyEleEndOffset = {
                    left: proxyEleOffset.left + validDelta.left,
                    top: proxyEleOffset.top + validDelta.top
                };
                setProxyDisplay && setProxyDisplay();
                console.log(fixStyleOffset(proxyEleEndOffset));
                $moveEle.style(fixStyleOffset(proxyEleEndOffset));
            }
            else {
                $moveEle.style(fixStyleOffset(eleEndOffset));
            }

            if (disableScroll) {
                if (e) e.preventDefault();
                else {
                    window.event.returnValue = false;
                }
            }

            if (options.event.dragMove) {
                options.event.dragMove($currentEle, eleOffset, eleEndOffset);
            }

        });

    $(window)
        .on('mouseup', (e) => {
            if (!$currentEle) {
                return;
            }

            if (isProxy) {
                hideProxyElement();
                $currentEle.style(fixStyleOffset(eleEndOffset));
            }

            if (isMoved && options.event.dragEnd) {
                options.event.dragEnd($currentEle, eleOffset, eleEndOffset);
            }

            $currentEle = null;

        });


    var proxyClass = 'dragProxy__';
    var proxySelector = '.' + proxyClass;

    function getProxyElement(width, height, $container, zIndex, borderRadius) {
        var $proxy = $(proxySelector);
        if ($proxy.length === 0) {
            $proxy = ($container[0] === docEle ? $('body') : $container).append(
                $.create(`<div class="${proxyClass}" style="position:absolute;z-index:20;background:#A0A1A2;opacity:0.6;border-radius:${borderRadius || 0};cursor:move"></div>`)
            ).find(proxySelector);
        }

        $proxy.style({
            width: width + 'px',
            height: height + 'px',
            zIndex: zIndex + 10,
            display: 'none'
        });

        return $proxy;
    }

    function hideProxyElement() {
        $(proxySelector).style('display', 'none');
    }

}