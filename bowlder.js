(function(undefined){
  if(this.bowlder) return;
  var $$ = this.bowlder = function(q, context){
    if(!q || !isDefined(q)){
      return new BDom([]);
    }else if(isString(q)){
      return new BDom(/^\s*</.test(q) ? dom.create(q).childNodes : utils.cssQuery(q, context));
    }else if(isArray(q) || isDefined(q.nodeType) || isWindow(q)){
      return new BDom(q);
    }else if(isFunction(q)){
      $$.ready(q);
    }else{
      return q;
    }
  };
  $$.ver = '0.7';
  $$.cb = { counter: 0 };
  var domId = 0;
  var toString = Object.prototype.toString;
  var slice = [].slice;
  if(!Function.prototype.bind || typeof $$.bind(this) != 'function')
    Function.prototype.bind = function(){
      if(!arguments.length) return this;
      var method = this,
          args = slice.call(arguments),
          object = args.shift();
      return function() {
        return method.apply(object, args.concat(slice.call(arguments)));
      };
    };
  var forEach = $$.each = function(obj, iterator, context) {
    var key;
    if(obj){
      if(typeof obj == 'function'){
        for(key in obj) {
          if(key != 'prototype' && key != 'length' && key != 'name' && (!obj.hasOwnProperty || obj.hasOwnProperty(key))){
            iterator.call(context, obj[key], key);
          }
        }
      }else if(obj.forEach && obj.forEach !== forEach){
        obj.forEach(iterator, context);
      }else if(isArrayLike(obj)){
        for(key = 0; key < obj.length; key++){
          if(isDefined(obj[key]))iterator.call(context, obj[key], key);
        }
      }else{
        for(key in obj){
          if(obj.hasOwnProperty(key)){
            iterator.call(context, obj[key], key);
          }
        }
      }
    }
    return obj;
  }
  var isDefined = $$.isDefined = function(value){return typeof value !== 'undefined';}
  var isObject = $$.isObject = function(value){return value != null && toString.call(value) === '[object Object]' && !isDefined(value.nodeType);}
  var isNumber = $$.isNumber = function(value){return typeof value === 'number' && !isNaN(value);}
  var isFunction = $$.isFunction = function(val){return toString.call(val) === '[object Function]'};
  var isArray = $$.isArray = function(val){return toString.call(val) === '[object Array]'};
  var isString = $$.isString = function(val){return toString.call(val) === '[object String]'};
  forEach('File RegExp Boolean'.split(/ /), function(name){$$['is'+name] = function(val){return toString.call(val) === '[object '+name+']'};});
  var cssNumber = {};
  forEach('fillOpacity fontWeight lineHeight opacity orphans widows zIndex zoom'.split(/ /), function(name){cssNumber[name] = true});
  var lowercase = function(string){return isString(string) ? string.toLowerCase() : string;}
  var uppercase = function(string){return isString(string) ? string.toUpperCase() : string;}
  function isWindow(obj) {
    return obj && obj.document && obj.window == obj;
  }
  function getStyle(node, key){
    if(isWindow(node)){
      node = node.document.documentElement;
      if(/^(width|height)$/.test(key)) return node[camelCase("client-" + key)] || this[camelCase("inner-" + key)];
    } else if(node.nodeType == 9) node = node.documentElement;
    if(msie && /^(width|height)$/.test(key)) return node[camelCase("offset-" + key)];
    if(supportedTransforms.test(key)){
      var _key = camelCase(transform),
          inlineTransform = node.style[_key];
      if(inlineTransform && (new RegExp(key+'\\s*\\((.*?)\\)')).test(inlineTransform)){
        return RegExp.$1;
      }
      return getStyle(node, _key);
    }
    if(node.currentStyle) {
      return node.currentStyle[key] || '';
    } else if(window.getComputedStyle) {
      return window.getComputedStyle(node , null)[key];
    }
    return '';
  }
  function setStyle(node, key, val){
    if(!isCssProp(key)){
      key = camelCase(key);
      if(!isCssProp(key)) return;
    }
    if(!isDefined(val) || (isNaN(val) && typeof val == 'number')) return;
    if(msie < 9 && key == 'opacity'){
      var ofilter = getStyle(node, 'filter') || '',
          re = /alpha\([^\)]*\)/;
      val = 'alpha(opacity=' + Math.round(100 * parseFloat(val)) + ')';
      node.style.filter = re.test(ofilter) ? ofilter.replace(re, val) : val;
      return;
    }else if(key == 'transform'){
      key = camelCase(transform);
    }
    if(supportedTransforms.test(key)){
      if(!isNaN(val) && val){
        if(key.indexOf('translate') == 0) val += 'px';
        else if(key.indexOf('rotate') == 0) val += 'deg';
      }
      node.style[camelCase(transform)] = key + '(' + val + ')';
      return;
    }
    if(val == 'show'){
      if(node.style.display == 'none'){
        dom.show(node);
        val = getStyle(node, key);
        node.style[key] = 0;
        node.offsetWidth;
      }else{
        return;
      }
    }else if(val == 'hide'){
      val = 0;
      node.style[key] = getStyle(node, key);
      node.offsetWidth;
    }
    if(!isNaN(val) && val && !cssNumber[key]) //isNaN("") == false
      val = val + 'px';
    try{node.style[key] = val;}catch(e){consoleError(e);}
  }
  function handlerWrapper(fn, node){
    //attachEvent回调的context为window，故wrapper需与node关联
    var nodeId = node ? node[dom._idname] : '';
    var eventName = 'b$Event' + (nodeId || '');
    return fn[eventName] = (fn[eventName] || function(e){
      var temp = fn.call(node || this, dom._fixe(e));
      if(temp === false || temp === -1) e.preventDefault();
      temp === -1 && e.stopPropagation();
      return temp;
    });
  }
  var isBooleanAttr = {};
  forEach('selected checked disabled readOnly required open autofocus controls autoplay compact loop defer multiple'.split(' '), function(item){
    isBooleanAttr[item] = 1;
  });
  var specialAttr = {
    'class': function(node, value){
      ('className' in node) ? node.className = (value || '') : node.setAttribute('class', value);
    },
    'for': function(node, value){
      ('htmlFor' in node) ? node.htmlFor = value : node.setAttribute('for', value);
    },
    'style': function(node, value){
      (node.style) ? node.style.cssText = value : node.setAttribute('style', value);
    },
    'value': function(node, value){
      node.value = (value != null) ? value : '';
    }
  }
  var ua = lowercase(navigator.userAgent), msie = parseInt((/msie (\d+)/.exec(ua) || [])[1], 10);
  if (isNaN(msie)) { //IE 11+
    msie = parseInt((/trident\/.*; rv:(\d+)/.exec(ua) || [])[1], 10);
  }
  var rAF = window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame    ||
      window.oRequestAnimationFrame      ||
      window.msRequestAnimationFrame     ||
      function(callback) { window.setTimeout(callback, 30); }
  var utils = $$.utils = {
    msie: msie,
    rAF: rAF,
    camelCase: camelCase,
    cssQuery: function(q, context){
      if($$.needPolyfill) {alert("polyfill's not ready.");return;}
      context = context || document;
      if(!isDefined(context.nodeType) && context[0]) context = context[0];
      if(!isDefined(context.nodeType) || !isString(q)) return [];
      var inNode = context != document, _id;
      if(inNode){
        q = q.replace(/(^\s*|,\s*)/g, '$1#__bowlder__ ');
        _id = context.id;
        context.id = '__bowlder__';
      }else q = q.replace(/(^\s*|,\s*)>/g, '$1body>');
      var result = slice.call(context.querySelectorAll(q));
      if(inNode){
        if(_id){
          context.id = _id;
        }else{
          context.removeAttribute('id');
        }
      }
      return result;
    }
  };
  var EVENTSPLITER = /[;\s]+/;
  var _bindEvents = {};  //已绑定事件: {nodeId : {name : [func ..]}}
  var _delgEvents = {};  //已代理事件: {nodeId : {name : [func ..]}}
  var _events = {};  //自定义事件: {name : func}
  var _eventsoff = {}; //事件卸载实例: {nodeId : {name : func}}
  var _delegateMethod = function(e, callbackMap){
    var target = e.target;
    var node = this;
    var temp, domMap = {};
    var delgIterator = function(fns, query){
      if(!domMap[query]) domMap[query] = utils.cssQuery(query, node);
      if(domMap[query].indexOf(target) > -1){
        forEach(fns, function(fn){
          e.currentTarget = target;
          if(temp !== false) temp = fn.call(target, e);
        });
      }
    };
    while(target && target != node){
      forEach(callbackMap, delgIterator);
      if(temp === false || temp === -1){
        e.preventDefault();
        temp === -1 && e.stopPropagation();
        break;
      }
      target = target.parentNode;
    }
  }
  var parentTag = {
    tfoot: 'table',
    thead: 'table',
    tbody: 'table',
    tr: 'tbody',
    th: 'tr',
    td: 'tr',
    option: 'select'
  };
  var dom = $$.dom = {
    _fixe: function(e){
      var params = ['clientX', 'clientY', 'pageX', 'pageY'];
      if (e.touches){
        switch (e.type) {
        case 'touchstart':
          forEach(params, function(name){e[name] = e.touches[0][name]});
          break;
        case 'touchend':
        case 'touchmove':
          forEach(params, function(name){e[name] = e.changedTouches[0][name]});
          break;
        }
      }
      return e;
    },
    _on: function(node, eventName, handler, capture){
      node.addEventListener(eventName, handler, capture || false);
    },
    _off: function(node, eventName, handler, capture){
      node.removeEventListener(eventName, handler, capture || false);
    },
    _idname: '_b$id',
    _nodeId: function(node){
      return node[dom._idname] || (node[dom._idname] = ++domId)
    },
    addClass: function(node, name){
      classList.add(node, name);
    },
    toggleClass: function(node, name){
      classList.toggle(node, name);
    },
    removeClass: function(node, name){
      classList.remove(node, name);
    },
    hasClass: function(node, name){
      return classList.contains(node, name);
    },
    hasRole: function(node, role){
      if(!node || !node.getAttribute || !role) return false;
      var roles = (node.getAttribute("ne-role") || '').split(/\s+/);
      return roles.indexOf(role) > -1;
    },
    parent: function(node, q, ancestor){
      var parent;
      if(q){
        var list = utils.cssQuery(q);
        while(node.parentNode && node.parentNode.nodeType == 1){
          node = node.parentNode;
          if(~list.indexOf(node)){
            parent = node;
            break;
          }
          if(!ancestor) break;
        }
      }else{
        parent = node.parentNode;
      }
      return parent;
    },
    delegate: function(node, eventNames, query, handler){
      if(isObject(query)){
        forEach(query, function(_handler, _query){
          dom.delegate(node, eventNames, _query, _handler);
        });
      }else if(isFunction(query)){
        dom.bind(node, eventNames, query);
      }else if(isString(query)){
        var nodeId = dom._nodeId(node);
        var delgCache = _delgEvents[nodeId] ||
              (_delgEvents[nodeId] = {});
        forEach(eventNames.split(EVENTSPLITER), function(eventName){
          if(!eventName) return;
          var delgFns = delgCache[eventName];
          if(!delgFns){
            delgFns = delgCache[eventName] = {};
            var method = handlerWrapper(function(e){
              _delegateMethod.call(node, e, delgFns);
            });
            dom._on(node, eventName, method);
          }
          if(!delgFns[query]){
            delgFns[query] = [];
          }else{
            if(delgFns[query].indexOf(handler) > -1) return;
          }
          delgFns[query].push(handler);
        });
      }
    },
    undelegate: function(node, eventNames, query, handler){
      var nodeId = node[dom._idname];
      if(isObject(query)){
        forEach(query, function(_handler, _query){
          dom.undelegate(node, eventNames, _query, _handler);
        });
      }else if(isString(query)){
        var delgCache = _delgEvents[nodeId] ||
              (_delgEvents[nodeId] = {});
        forEach(eventNames.split(EVENTSPLITER), function(eventName){
          if(!eventName) return;
          var delgFns = delgCache[eventName];
          if(delgFns[query]){ //不解绑定，只是清理回调列表
            for(var i = 0; i < delgFns[query].length; i ++){
              if(delgFns[query][i] == handler){
                delgFns[query].splice(i, 1);
                break;
              }
            }
            if(delgFns[query].length === 0) delete delgFns[query];
          }
        });
      }
    },
    bind: function(node, eventNames, handler, capture){
      if(!isFunction(handler)) return;
      var nodeId = dom._nodeId(node);
      handler = handlerWrapper(handler, msie < 9 ? node : '');
      var eventCache = _bindEvents[nodeId] ||
            (_bindEvents[nodeId] = {});
      forEach(eventNames.split(EVENTSPLITER), function(eventName){
        eventName = isString(eventName) && eventName.split('.')[0];
        if(!eventName) return;
        if(!eventCache[eventName]){
          eventCache[eventName] = [];
        }else{
          if(eventCache[eventName].indexOf(handler) > -1) return;
        }
        eventCache[eventName].push(handler);
        dom._on(node, eventName, handler, capture); //绑定事件
        if(_events[eventName]){ //自定义事件所需的额外绑定
          var eventsoff = _eventsoff[nodeId] || (_eventsoff[nodeId] = {});
          if(!eventsoff[eventName])
            eventsoff[eventName] = _events[eventName].call(node, function(info, fireTarget){
              dom.trigger(fireTarget||node, eventName, !!fireTarget, info);
            }) || true;
        }
      });
    },
    unbind: function(node, eventNames, handler, capture){
      var nodeId = node[dom._idname];
      if(nodeId){
        var eventCache = _bindEvents[nodeId];
        if(eventCache){
          if(!handler){ //取消所有绑定
            forEach(eventNames.split(EVENTSPLITER), function(eventName){
              eventName = isString(eventName) && eventName.split('.')[0];
              if(!eventName) return;
              forEach(eventCache[eventName], function(fn){
                dom._off(node, eventName, fn, capture);
              });
              delete eventCache[eventName];
            });
          }else{
            handler = handlerWrapper(handler, msie < 9 ? node : '');
            forEach(eventNames.split(EVENTSPLITER), function(eventName){
              eventName = isString(eventName) && eventName.split('.')[0];
              if(!eventName) return;
              dom._off(node, eventName, handler, capture);
              for(var i = 0; i < eventCache[eventName].length; i ++){
                if(eventCache[eventName][i] == handler)
                  eventCache[eventName].splice(i--, 1);
              }
            });
          }
        }
      }
    },
    before: function(newNode, oldNode){
      if(isString(newNode)) newNode = dom.create(newNode);
      if(oldNode && oldNode.parentNode)
        oldNode.parentNode.insertBefore(newNode, oldNode);
      return newNode;
    },
    after: function(newNode, oldNode){
      if(isString(newNode)) newNode = dom.create(newNode);
      if(oldNode && oldNode.parentNode){
        var parent = oldNode.parentNode, next = oldNode.nextSibling;
        next ? parent.insertBefore(newNode, next) : parent.appendChild(newNode);
      }
      return newNode;
    },
    replace: function(newNode, oldNode){
      if(isString(newNode)) newNode = dom.create(newNode);
      if(oldNode && oldNode.parentNode)
        oldNode.parentNode.replaceChild(newNode, oldNode);
      return newNode;
    },
    trigger: function(node, eventName, canbubble, info){
      var ev = document.createEvent("MouseEvents");
      ev.initEvent(eventName, isDefined(canbubble) ? !!canbubble : true, false);//事件类型,是否冒泡,是否可以取消事件
      if(isObject(info)) $$.extend(ev, info);
      node.dispatchEvent(ev);
    },
    show: function(node){
      node.style.display = node.olddisplay || "";
      if(getStyle(node, "display") == "none")
        node.style.display = "block";
    },
    hide: function(node){
      var _display = node.olddisplay || getStyle(node, "display");
      node.olddisplay = (_display == "none" || _display == "block") ? "" : _display;
      node.style.display = "none";
    },
    toggle: function(node){
      dom[dom.css(node, "display") == "none" ? "show" : "hide"](node);
    },
    css: function(node, obj, val){
      if(isString(obj)){
        if(obj.indexOf(":") > -1){
          node.style.cssText += ";" + obj;
        }else if(isDefined(val)){
          setStyle(node, obj, val);
        }else{
          var key = camelCase(obj);
          if(isCssProp(key)){
            val = getStyle(node, key);
          }else{
            if(/scroll/.test(obj) && (isWindow(node) || node.nodeType == 9)){
              return document.body[obj];
            }else if(node.nodeType == 9){
              node = node.documentElement;
            }
            val = node[key];
          }
          return isDefined(val) ? val : '';
        }
      }else if(isObject(obj)){
        var transforms = {}, doTransform;
        forEach(obj, function(val, key){
          if(supportedTransforms.test(key)){
            if(!isNaN(val) && val){
              if(key.indexOf('translate') == 0||key.indexOf('persipective') == 0) val += 'px';
              else if(key.indexOf('rotate') == 0) val += 'deg';
            }
            doTransform = true;
            transforms[key] = key + '(' + val + ')';
            return;
          }
          key = camelCase(key);
          if(isCssProp(key)){
            setStyle(node, key, val);
          }else{
            node[key] = val;
          }
        });
        if(doTransform){
          var oldTransform = node.style[camelCase(transform)], result;
          if(oldTransform){
            var propReg = /(\S+)\s*(\(.*?\))/g;
            while((result = propReg.exec(oldTransform)) != null) {
              var name = result[1];
              if(!isDefined(transforms[name])) transforms[name] = name + result[2];
            }
          }
          var arr = [];
          forEach(transforms, function(val){arr.push(val)});
          node.style[camelCase(transform)] = arr.join(" ");
        }
      }
    },
    val: function(node, val){
      if(lowercase(node.tagName) == 'input'){
        var type = lowercase(node.getAttribute('type'));
        if(type == 'checkbox'){
          return dom.attr(node, 'checked', val);
        }else if(type == 'radio'){
          return isDefined(val) ? (node.value = val) : node.value;
        }
      }
      
      var nodeWidget = $$.widget(node);
      if(nodeWidget) return nodeWidget.val(val);
      
      if(isDefined(val)){
        node.value = val;
      }else{
        return node.value;
      }
    },
    stop: function(node){
      node.startTime = 0;
    },
    pause: function(node){
      var pause = node._pause;
      if(pause){
        node._pause = null;
        pause();
      }
    },
    animate: function(node, properties, duration, ease, callback, delay){
      if(!node || !properties) return;
      if(isFunction(properties)){
        return properties(node).play(duration, ease).then(callback);
      }
      if(isFunction(duration)) callback = duration, ease = undefined, duration = undefined
      if(isFunction(ease)) callback = ease, ease = undefined;
      duration = (typeof duration == 'number' ? duration :
                  (fx.speeds[duration] || fx.speeds.normal));
      if(delay) delay = parseFloat(delay) / 1000;
      
      var easeFns = $$.conf('easeFns'), easeFn = easeFns[ease] || easeFns['linear'];
      if(duration > 1) dom.pause(node); //暂停之前的动画
      var paused, cbTimeout, cssValues = {}, _cssValues = {},
          transforms, _startTime = new Date;
      var fired = false, doRAF = false, doCSS3 = false;
      if(duration === undefined) duration = fx.speeds.normal;
      if(delay === undefined) delay = 0;
      if(typeof properties == 'string'){ //css3 keyframe动画
        doCSS3 = true;
        cssValues[animationName] = properties;
        cssValues[animationDuration] = duration/1000 + 's';
        cssValues[animationDelay] = delay + 's';
        cssValues[animationTiming] = (ease || 'linear');
      }else{  //css3 transition动画
        var cssProperties = [];
        forEach(properties, function(toVal, key){
          if(fx.off || duration <= 1 || !isCssProp(camelCase(key)) || isArray(toVal)){
            doRAF = true;
            _cssValues[key] = isArray(toVal) || duration <= 1 ? toVal : [dom.css(node, key), toVal];
          }else{
            doCSS3 = true;
            cssValues[key] = toVal;
            if(supportedTransforms.test(key)){
              transforms = true;
            }else{
              cssProperties.push(dasherize(key));
            }
          }
        })
        if(doCSS3){
          transforms && cssProperties.push(transform);
          cssValues[transitionProperty] = cssProperties.join(', ');
          cssValues[transitionDuration] = duration/1000 + 's';
          cssValues[transitionDelay] = delay + 's';
          cssValues[transitionTiming] = (ease || 'linear');
        }
      }
      var _step = function(progress){
        var newCss = {};
        forEach(_cssValues, function(_val, key){
          newCss[key] = interpolate(_val, easeFn(progress));
        });
        dom.css(node, newCss);
      }
      var wrappedCallback = function(){
        if(fired) return;
        fired = true;
        dom.css(node, cssReset);
        if(callback) callback.call(node);
        node._pause = null;
      }
      if(duration >= 0){
        if(duration <= 1){ //step only
          _step(duration);
          return;
        }
      }

      if(doRAF){  //rAF动画
        var step = function(){
          var _passTime = (new Date) - _startTime;
          var progress = _passTime / duration;
          if(_passTime < duration){
            _step(progress);
            if(!paused) rAF(step);
          }else{ //动画结束
            _step(1);
            wrappedCallback();
          }
        };
        step();
      }else{
        cbTimeout = setTimeout(function(){
          wrappedCallback();
        }, duration + 10);
      }

      if(doCSS3){ //css3动画
        node.clientLeft; //强制页面重绘
        dom.css(node, cssValues);
      }
      node._pause = function(){
        paused = true;
        if(!fx.off){
          var _passTime = (new Date) - _startTime;
          var progress = Math.min(_passTime / duration, 1);
          dom.css(node, cssReset);
          dom.animate(node, properties, progress);
        }
        cbTimeout && clearTimeout(cbTimeout);
      }
    },
    fadeToggle: function(node){
      return dom[node.style.display == 'none'?'fadeIn': 'fadeOut'].call(dom, arguments);
    },
    fadeIn: function(node, duration, easing, callback){
      var _opacity = node.style.opacity || '';
      if(isFunction(duration)) callback = duration, duration = null;
      if(isFunction(easing)) callback = easing, easing = null;
      return dom.animate(node, {opacity:'show'}, duration, easing, function(){
        setStyle(node, "opacity", _opacity);
        isFunction(callback) && callback();
      });
    },
    fadeOut: function(node, duration, easing, callback){
      var _opacity = node.style.opacity || '';
      if(isFunction(duration)) callback = duration, duration = null;
      if(isFunction(easing)) callback = easing, easing = null;
      return dom.animate(node, {opacity:'hide'}, duration, easing, function(){
        setStyle(node, "opacity", _opacity);
        dom.hide(node);
        isFunction(callback) && callback();
      });
    },
    slideToggle: function(node){
      return dom[node.style.display == 'none'?'slideDown': 'slideUp'].call(dom, arguments);
    },
    slideUp: function(node, duration, easing, callback){
      var reset = {
        height: node.style.height,
        paddingTop: node.style.paddingTop,
        paddingBottom: node.style.paddingBottom
      },
          props = {
            overflow: ['hidden', node.style.overflow],
            height: 'hide',
            paddingTop: 0,
            paddingBottom: 0
          };
      if(isFunction(duration)) callback = duration, duration = null;
      if(isFunction(easing)) callback = easing, easing = null;
      return dom.animate(node, props, duration, easing, function(){
        dom.hide(node);
        dom.css(node, reset);
        isFunction(callback) && callback();
      });
    },
    slideDown: function(node, duration, easing, callback){
      var reset = {
        overflow: node.style.overflow,
        height: node.style.height,
        paddingTop: node.style.paddingTop,
        paddingBottom: node.style.paddingBottom
      };
      var props = {
        height: 'show',
        paddingTop: getStyle(node, 'paddingTop'),
        paddingBottom: getStyle(node, 'paddingBottom')
      };
      if(isFunction(duration)) callback = duration, duration = null;
      if(isFunction(easing)) callback = easing, easing = null;
      dom.css(node, {overflow: 'hidden', paddingTop: 0, paddingBottom: 0});
      return dom.animate(node, props, duration, easing, function(){
        dom.css(node, reset);
        isFunction(callback) && callback();
      });
    },
    data: function(node, name, val){
      if(!isDefined(val) && !isObject(name)) return node && domData(node)[name];
      else{
        isObject(name) ? extend(domData(node), name) : domData(node)[name] = val;
      }
    },
    attr: function(node, name, val){
      if(!node || !node.nodeType) return null;
      name = lowercase(name);
      if(isBooleanAttr[name]) {
        if(isDefined(val)){
          if(isString(val)){ //hack
            if(val == 'false') val = false;
          }
          node[name] = !!val;
          if(!!val){
            node.setAttribute(name, name);
          }else{
            node.removeAttribute(name);
          }
        }else{
          //|| (node.attributes.getNamedItem(name)|| false).specified
          return node[name] ? true : false;
        }
      }else if(isDefined(val)){ //设值
        if(specialAttr[name]) specialAttr[name](node, val);
        else
          node.setAttribute(name, val);
      }else{ //取值
        if(isObject(name)) forEach(name, function(v, n){dom.attr(node, n, v)});
        else return node.getAttribute(name, 2);
      }
    },
    _create: function(tag, str){
      var tmpEl = document.createElement(tag);
      tmpEl.innerHTML = str;
      return tmpEl;
    },
    create: function(str, strict){
      if(!strict && /^\w+$/.test(str)){
        return document.createElement(str);
      }else{
        var tmpEl;
        if(/<(\w+)/.test(str)){
          tmpEl = dom._create(parentTag[lowercase(RegExp.$1)]||'div', str);
        }else{
          tmpEl = testEl;
          tmpEl.innerHTML = str;
        }
        var fragment = document.createDocumentFragment(), childNode = tmpEl.firstChild;
        while(childNode){
          fragment.appendChild(childNode);
          childNode = tmpEl.firstChild;
        }
        return fragment;
      }
    },
    remove: function(node){
      if(node.parentNode) node.parentNode.removeChild(node);
    },
    pos: function(node, noRecurse){
      var pos = {left:0,top:0};
      if(node && !node.nodeType) node = node[0];
      if(!node || node.nodeType !== 1) return pos;
      pos.left = node.offsetLeft;
      pos.top = node.offsetTop;
      if(noRecurse !== true) while( node.offsetParent ){
        node = node.offsetParent;
        if(node == noRecurse) break;
        pos.left += node.offsetLeft;
        pos.top += node.offsetTop;
      }
      return pos;
    }
  }
  if(msie <= 9){
    var safeWraps = {
      'tr' : ['<table><tbody><tr>', '</tr></tbody></table>', 3],
      'tbody' : ['<table><tbody>', '</tbody></table>', 2],
      'thead' : ['<table><thead>', '</thead></table>', 2],
      'table' : ['<table>', '</table>', 1],
      'select' : ['<select>', '</select>', 1]
    }
    dom._create = function(tag, str){
      var wrapFix = safeWraps[tag];
      var tmpEl = document.createElement(wrapFix ? "div" : tag);
      tmpEl.innerHTML = (wrapFix ? wrapFix[0] : '')+str+(wrapFix ? wrapFix[1] : '');
      if(wrapFix)for(var i = 0; i < wrapFix[2]; i ++){
        tmpEl = tmpEl.firstChild;
      }
      return tmpEl;
    }
  }
  $$.cookie = {
    get: function(key){
      var c = document.cookie.split(/;\s*/);
      for(var i = 0; i < c.length; i++){
        var p = c[i].split("=");
        if(key == p[0]) try { return decodeURIComponent(p[1]) } catch (e) { return "" }
      }
      return "";
    },
    remove: function(key, domain, path) {
      document.cookie = key + "=1; path=" + (path || "/") + (domain?"; domain="+domain:"")+";expires=Fri, 02-Jan-1970 00:00:00 GMT";
    },
    set: function(key, val, expires, domain, path, secure){
      if(!path) path = '/';
      if(expires && !isNumber(expires)) expires = 365;
      expires = expires * 86400000;
      document.cookie =
        key + '=' + encodeURIComponent(val) +
        (expires ? '; expires=' + (new Date(+new Date+expires)).toGMTString() : '') + 
        (domain ? '; domain=' + domain : '') +
        '; path=' + path +
        (secure ? '; secure' : '');
    }
  };
  $$.event = function(name, handle/*, remove*/){
    if(!handle) return !!_events[name];
    _events[name] = handle;
  }
  $$.param = function(params) {
    var parts = [];
    forEach(params, function(value, key) {
      if(value == null) return;
      if(!isArray(value)) value = [value];

      forEach(value, function(v) {
        if(isObject(v)) v = JSON.stringify(v);
        parts.push(encodeUriQuery(key) + '=' + encodeUriQuery(v));
      });
    });
    return parts.join('&');
  }
  var buildUrl = utils.buildUrl = function(url, params) {
    params = $$.param(params);
    return url + (params ? ((url.indexOf('?') == -1) ? '?' : '&') + params : '');
  }
  var testEl = document.createElement('div');
  var classList = $$.classList = testEl.classList ? {
    contains: function(elem, name){
      return elem.classList && elem.classList.contains(name) ? true : false;
    },
    add: function(elem, names){
      if(elem.classList) forEach(names.toString().split(/\s+/), function(name){
        if(name) elem.classList.add(name);
      });
    },
    remove: function(elem, names){
      if(elem.classList) forEach(names.toString().split(/\s+/), function(name){
        if(name) elem.classList.remove(name);
      });
    }
  } : {
    check: function(elem, name){
      if(elem.nodeType !== 1 || typeof elem.className !== "string" || typeof name == 'object' || name == null) {
        return false;
      }
      return true;
    },
    contains: function(elem, name){
      return this.check(elem, name) && (new RegExp("\\b" + name + "\\b")).test(elem.className);
    },
    add: function(elem, name){
      if(this.check(elem, name) && !this.contains(elem, name)){
        elem.className = elem.className.replace(/\s*$/, " " + name);
      }
    },
    remove: function(elem, name){
      if(this.check(elem, name) && this.contains(elem, name)){
        elem.className = elem.className.replace(new RegExp("\\b" + name + "\\b\\s*", "g"), "");
      }
    }
  };
  classList.batch = function(elem, addNames, removeNames){
    if(elem.nodeType == 1){
      var idx, clses = elem.className.split(/\s+/);
      if(isString(addNames)) addNames = addNames.split(/\s+/);
      if(isString(removeNames)) removeNames = removeNames.split(/\s+/);
      forEach(removeNames, function(name){
        if(name){
          while((idx = clses.indexOf(name)) > -1){
            clses.splice(idx, 1);
          }
        }
      });
      forEach(addNames, function(name){
        if(name && clses.indexOf(name) == -1) clses.push(name);
      });
      elem.className = clses.join(" ");
    }
  };
  classList.toggle = function(elem, name){
    if(this.contains(elem, name)){
      this.remove(elem, name);
    }else{
      this.add(elem, name);
    }
  };
  var extend = $$.extend = function() {
    var args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
    var deep = false;
    if(typeof args[0] == 'boolean') deep = args.shift();
    var obj, dst = args.shift();
    if(dst && typeof dst == 'object') while(args.length){
      obj = args.shift();
      if(obj && obj !== dst){
        if(isFunction(obj.then) && isFunction(obj["catch"])){ //Promise
          return obj.then(function(res){
            args.unshift(isFunction(obj.success) ? res.data : res);
            args.unshift(dst);
            args.unshift(deep);
            return extend.apply(this, args);
          });
        }
        forEach(obj, function(value, key){
          if(deep && isObject(value)){
            extend(deep, (dst.hasOwnProperty(key) ? dst[key] : (dst[key] = {})), value);
          }else{
            dst[key] = deep && isArray(value) ? slice.call(value, 0) : value;
          }
        });
      }
    };
    return dst;
  }
  function encodeUriQuery(val) {
    return encodeURIComponent(val).
      replace(/%3A/gi, ':').
      replace(/%24/g, '$').
      replace(/%2C/gi, ',');
  }
  function parseHeaders(headers) {
    var parsed = {}, key, val, i;
    if(!headers) return parsed;

    forEach(headers.split('\n'), function(line) {
      i = line.indexOf(':');
      key = lowercase(line.substr(0, i).trim());
      val = line.substr(i + 1).trim();
      if(key){
        if(parsed[key]){
          parsed[key] += ', ' + val;
        }else{
          parsed[key] = val;
        }
      }
    });

    return parsed;
  }
  function headersGetter(headers) {
    var headersObj = isObject(headers) ? headers : undefined;
    return function(name) {
      if(!headersObj) headersObj = parseHeaders(headers);
      if(name) return headersObj[lowercase(name)] || null;
      return headersObj;
    };
  }
  function isArrayLike(obj) {
    if(obj == null || isWindow(obj)) return false;
    var length = obj.length;
    if(obj.nodeType === 1 && length) return true;
    return isString(obj) || isArray(obj) || length === 0 ||
      typeof length === 'number' && length > 0 && (length - 1) in obj;
  }
  function consoleError(arg) {
    if(typeof console == 'undefined' || !isDefined(console.error)) return;
    if(!/firefox/i.test(ua) && arg instanceof Error) {
      if(arg.stack){
        var stack = arg.stack;
        arg = (arg.message && stack.indexOf(arg.message) === -1) ?
          'Error: ' + arg.message + '\n' + stack
          : stack;
      }else if(arg.sourceURL) {
        arg = arg.message + '\n' + arg.sourceURL + ':' + arg.line;
      }
    }
    console.error(arg);
  }
  function dasherize(str) { return lowercase(str.replace(/^ms([A-Z])/,"-ms-$1").replace(/(^|[a-z])([A-Z])/g, '$1-$2')) }
  function camelCase(str) {//IE 前缀ms
    return str.replace(/-([a-z])/g, function(match, letter){return uppercase(letter)}).replace(/^Ms([A-Z])/,"ms$1");
  }

  //样式动画
  var prefix = '', eventPrefix, transform,
      supportedTransforms = /^((translate|rotate|scale)(X|Y|Z|3d)?|matrix(3d)?|perspective|skew(X|Y)?)$/i,
      transitionProperty, transitionDuration, transitionTiming, transitionDelay,
      animationName, animationDuration, animationTiming, animationDelay,
      cssReset = {};
  var fx = (function(vendors){
    forEach(vendors, function(vendor, event){
      if(testEl.style[vendor + 'TransitionProperty'] !== undefined){
        prefix = '-' + lowercase(vendor) + '-';
        eventPrefix = event;
      }
    });
    transform = prefix + 'transform';
    cssReset[transitionProperty = prefix + 'transition-property'] =
      cssReset[transitionDuration = prefix + 'transition-duration'] =
      cssReset[transitionDelay = prefix + 'transition-delay'] =
      cssReset[transitionTiming = prefix + 'transition-timing-function'] =
      cssReset[animationName = prefix + 'animation-name'] =
      cssReset[animationDuration = prefix + 'animation-duration'] =
      cssReset[animationDelay = prefix + 'animation-delay'] =
      cssReset[animationTiming = prefix + 'animation-timing-function'] = '';
    utils.supportCSS3 = eventPrefix !== undefined || testEl.style.transitionProperty !== undefined;
    return {
      off: !utils.supportCSS3,
      speeds: { normal: 300, fast: 200, slow: 600 },
      cssPrefix: prefix
    };
  })({ Webkit: 'webkit', Moz: '', O: 'o', Ms: 'ms' });
  function isCssProp(name) { return name == 'opacity' || supportedTransforms.test(name) || isDefined(testEl.style[name]); }
  var interpolate = utils.interpolate = function(ranges, progress){
    if(!isArray(ranges))return ranges;
    var len = ranges.length;
    if(progress == 0 || progress == 1)return ranges[progress*(len-1)];
    var fromIdx = Math.floor(progress*(len-1)),
        toIdx = Math.min(fromIdx+1, len-1);
    var fromVal = ranges[fromIdx], toVal = ranges[toIdx];
    progress = progress*(len-1) - fromIdx;
    var arr = fromVal.toString().match(/[\-\.\d]+/g) || [], i = 0;
    return toVal.toString().replace(/[\-\.\d]+/g, function(eNum){
      var oNum = parseFloat(arr[i++]) || 0;
      var _val = oNum * (1 - progress) + eNum * progress;
      return Math.abs(eNum - oNum) > 10 ? Math.round(_val) : _val;
    });
  }

  //消息处理
  var _msgCenter = {};
  $$.on = function(name, callback, useCache) {
    var that = this, binds = isObject(name) ? name : {},
        msgCenter = that.hasOwnProperty('$msg') ? that.$msg : _msgCenter;
    if(isString(name)){
      binds[name] = callback;
    }
    forEach(binds, function(callback, name){
      if(!msgCenter[name]) msgCenter[name] = [];
      msgCenter[name].push(callback);
      if(useCache && msgCenter[name].cache) callback.apply(that, msgCenter[name].cache);
    });
    return that;
  };
  $$.off = function(name, callback) {
    var msgCenter = this.hasOwnProperty('$msg') ? this.$msg : _msgCenter;
    if(msgCenter && isString(name)){
      var list = msgCenter[name];
      if(!list) return this;
      if(!callback){
        delete msgCenter[name];
        return this;
      }
      for(var i = 0, len = list.length; i < len; i ++){
        if(list[i] === callback){
          list.splice(i, 1);
          break;
        }
      }
    }
    return this;
  };
  $$.emit = function() {
    var args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
    var ev = args.shift();
    if(!isString(ev)) return;
    var that = this, callback;
    var msgCenter = that.hasOwnProperty('$msg') ? that.$msg : _msgCenter;
    if(msgCenter) forEach(ev.split(/\s+/), function(name){
      var list = msgCenter[name] || (msgCenter[name] = []);
      list.cache = args;
      for(var i = 0, len = list.length; i < len; i++) {
        callback = list[i];
        if(callback.apply(that, args) === false) break;
      }
    });
  };

  var $q = $$.$q = (function(){ //promise
    var defer = function() {
      var pending = [], value;
      var deferred = {
        resolve: function(val, force) {
          if(pending){
            var callbacks = pending;
            pending = undefined;
            value = ref(val);

            forEach(callbacks, function(callback){
              value.then(callback[0], callback[1], callback[2]);
            });
          }else if(force) value = ref(val);
        },
        reject: function(reason) {
          deferred.resolve(reject(reason));
        },
        notify: function(progress) {
          if(pending) forEach(pending, function(callback){
            callback[2](progress);
          });
        },
        promise: {
          then: function(callback, errback, progressback) {
            var result = defer();
            var wrappedCallback = function(value) {
              try {
                result.resolve((isFunction(callback) ? callback : defaultCallback)(value));
              } catch(e) {
                result.reject(e);
                consoleError(e);
              }
            };
            var wrappedErrback = function(reason) {
              try {
                result.resolve((isFunction(errback) ? errback : defaultErrback)(reason));
              } catch(e) {
                result.reject(e);
                consoleError(e);
              }
            };
            var wrappedProgressback = function(progress) {
              try {
                result.notify((isFunction(progressback) ? progressback : defaultCallback)(progress));
              } catch(e) {
                consoleError(e);
              }
            };

            if(pending){
              pending.push([wrappedCallback, wrappedErrback, wrappedProgressback]);
            }else{
              value.then(wrappedCallback, wrappedErrback, wrappedProgressback);
            }

            return result.promise;
          },
          "catch": function(callback) {
            return this.then(null, callback);
          },
          "finally": function(callback) {
            function makePromise(value, resolved) {
              return new Promise(function(resolve, reject){
                if(resolved){
                  resolve(value);
                }else{
                  reject(value);
                }
              });
            }

            function handleCallback(value, isResolved) {
              var callbackOutput = null;
              try {
                callbackOutput = (callback || defaultCallback)();
              } catch(e) {
                return makePromise(e, false);
              }
              if (callbackOutput && isFunction(callbackOutput.then)) {
                return callbackOutput.then(function() {
                  return makePromise(value, isResolved);
                }, function(error) {
                  return makePromise(error, false);
                });
              } else {
                return makePromise(value, isResolved);
              }
            }

            return this.then(function(value) {
              return handleCallback(value, true);
            }, function(error) {
              return handleCallback(error, false);
            });
          }
        }
      };
      return deferred;
    };
    var reject = function(reason) {
      return {
        then: function(callback, errback) {
          var result = defer();
          try {
            result.resolve((isFunction(errback) ? errback : defaultErrback)(reason));
          } catch(e) {
            result.reject(e);
          }
          return result.promise;
        }
      };
    };
    var all = function(promises) {
      var deferred = defer(),
          counter = 0,
          results = isArray(promises) ? [] : {};

      forEach(promises, function(){counter++});
      forEach(promises, function(promise, key){
        ref(promise).then(function(value) {
          if (results.hasOwnProperty(key)) return;
          results[key] = value;
          if (!(--counter)) deferred.resolve(results);
        }, function(reason) {
          if (results.hasOwnProperty(key)) return;
          deferred.reject(reason);
        });
      });

      if (counter === 0) deferred.resolve(results);
      return deferred.promise;
    };
    var race = function(promises) {
      var deferred = defer(), counter = 0;
      forEach(promises, function(){counter++});
      forEach(promises, function(promise){
        ref(promise).then(function(value) {
          deferred.resolve(value);
        }, function(reason) {
          counter--;
          if (counter === 0) deferred.reject(reason);
        });
      });
      if (counter === 0) deferred.resolve();
      return deferred.promise;
    };

    function ref(value) {
      if(value && isFunction(value.then)) return value;
      return {
        then: function(callback) {
          var result = defer();
          result.resolve(callback(value));
          return result.promise;
        }
      };
    }
    function defaultCallback(value) { return value; }
    function defaultErrback(reason) { return reject(reason); }

    return {
      defer: defer,
      reject: reject,
      all: all,
      race: race,
      ref: ref
    };
  })();
  var Promise = $$.Promise = function(fn){
    var deferred = $q.defer();
    if(isFunction(fn)){
      fn(deferred.resolve, deferred.reject);
    }
    return deferred.promise;
  };
  Promise.all = $q.all;
  Promise.race = $q.race;
  Promise.reject = $q.reject;
  Promise.resolve = function(val){
    var deferred = $q.defer();
    deferred.resolve(val);
    return deferred.promise;
  }
  $$.ajax = (function(){ //ajax, jsonp
    var JSON_START = /^\s*(\[|\{[^\{])/,
        JSON_END = /[\}\]]\s*$/,
        CONTENT_TYPE_APPLICATION_JSON = {'Content-Type': 'application/json;charset=utf-8'};
    var defaults = ajax.defaults = {
      transformResponse: [function(data) {
        if(isString(data) && JSON_START.test(data) && JSON_END.test(data))
          data = JSON.parse(data, true);
        return data;
      }],
      transformRequest: [function(d) {
        return (isArray(d) || isObject(d)) && !$$.isFile(d) ? JSON.stringify(d) : d;
      }],
      headers: {
        common: {
          'Accept': 'application/json, text/plain, */*'
        },
        post:   extend({}, CONTENT_TYPE_APPLICATION_JSON),
        put:    extend({}, CONTENT_TYPE_APPLICATION_JSON),
        patch:  extend({}, CONTENT_TYPE_APPLICATION_JSON)
      }
    };
    var ajaxBackend = createHttpBackend($$.cb);
    function ajax(requestConfig) {
      var config = {
        transformRequest: defaults.transformRequest,
        transformResponse: defaults.transformResponse
      };
      var defHeaders = defaults.headers;
      var headers = extend({}, defHeaders.common, defHeaders[lowercase(requestConfig.method)], requestConfig.headers);

      extend(config, requestConfig);
      config.headers = headers;
      config.method = uppercase(config.method);
      config.url = buildUrl(config.url, config.params);
      
      var serverRequest = function(config) {
        headers = config.headers;
        var reqData = '';
        if(config.method == 'GET' && isObject(config.data)){
          config.url = buildUrl(config.url, config.data);
        }else{
          reqData = config.processData === false ? config.data : transformData(config.data, headersGetter(headers), config.transformRequest);
        }
        forEach(headers, function(value, header){
          if(lowercase(header) === 'content-type'){
            if(!isDefined(config.data) || !headers[header]) delete headers[header];
          }
        });
        return sendReq(config, reqData, headers).then(transformResponse, transformResponse);
      };
      var promise = serverRequest(config);
      promise.success = function(fn) {
        promise.then(function(response) {
          fn(response.data, response.status, response.headers, config);
        });
        return promise;
      };
      promise.error = function(fn) {
        promise.then(null, function(response) {
          fn(response.data, response.status, response.headers, config);
        });
        return promise;
      };

      return promise;

      function transformData(data, headers, fns) {
        if(isFunction(fns))
          return fns(data, headers);

        forEach(fns, function(fn) {
          data = fn(data, headers);
        });

        return data;
      }
      function transformResponse(response) {
        var resp = extend(response, {
          data: transformData(response.data, response.headers, config.transformResponse)
        });
        return (isSuccess(response.status)) ? resp : $q.reject(resp);
      }
    }

    ajax.pendingRequests = [];
    createShortMethods('get', 'delete', 'head', 'jsonp', 'require');
    createShortMethodsWithData('post', 'put');

    function createShortMethods() {
      forEach(arguments, function(name) {
        ajax[name] = function(url, config) {
          return ajax(extend(isObject(config) ? config : {}, {
            win: this,
            method: name,
            url: url
          }));
        };
      });
    }
    function createShortMethodsWithData() {
      forEach(arguments, function(name) {
        ajax[name] = function(url, data, config) {
          return ajax(extend(isObject(config) ? config : {}, {
            win: this,
            method: name,
            url: url,
            data: data
          }));
        };
      });
    }
    function sendReq(config, reqData, reqHeaders) {
      var url = config.url;
      ajax.pendingRequests.push(config);

      var timeoutId, abort = $q.defer();
      var promise = new Promise(function(resolve, reject){
        function done(status, response, headers) {
          if(timeoutId) clearTimeout(timeoutId);
          status = Math.max(status, 0);
          (isSuccess(status) ? resolve : reject)({
            data: response,
            status: status,
            headers: headersGetter(headers),
            config: config
          });
        }
        ajaxBackend.call(config.win, config.method, url, reqData, done, reqHeaders, abort.promise, config.responseType);
      });
      
      function removePendingReq() {
        var idx = ajax.pendingRequests.indexOf(config);
        if(idx !== -1) ajax.pendingRequests.splice(idx, 1);
      }
      promise.then(removePendingReq, removePendingReq);
      promise.abort = function(){
        abort.resolve();
      }
      if(isFunction(config.beforeSend)){
        if(config.beforeSend(promise, config) === false){
          promise.abort();
        }
      }
      if(config.timeout > 0){
        timeoutId = setTimeout(promise.abort, config.timeout);
      }
      return promise;
    }
    function isSuccess(status) {
      return 200 <= status && status < 300;
    }
    function createXhr(method) {
      return (msie <= 6 || (msie < 9 && method === 'PATCH')) ?
        new this.ActiveXObject('Microsoft.XMLHTTP')
        : new this.XMLHttpRequest();
    }
    function createHttpBackend(callbacks) {
      var ABORTED = -1;
      return function(method, url, post, callback, headers, abort, responseType) {
        var status, xhr;
        var win = isWindow(this) ? this : window;
        if (method == 'REQUIRE') {
          jsonpReq(url, function() {
            completeRequest(callback, 200);
          }, headers);
        } else if (method == 'JSONP') {
          var callbackId = '_' + (callbacks.counter++).toString(36);
          var globalCallback = callbacks[callbackId] = function(data) {
            if(!globalCallback.datas) globalCallback.datas = [];
            globalCallback.datas.push(data);
          };
          if(/callback=(\w+)/.test(url)){
            var cbName = RegExp.$1;
            if(cbName != 'CALLBACK'){
              globalCallback = win[cbName] || (win[cbName] = callbacks[callbackId]);
            }
          };
          jsonpReq(url.replace('CALLBACK', 'bowlder.cb.' + callbackId),
                   function() {
                     var data = globalCallback.datas && globalCallback.datas.shift();
                     if (data) {
                       completeRequest(callback, 200, data);
                     } else {
                       completeRequest(callback, status || -2);
                     }
                     delete callbacks[callbackId];
                   }, headers);
        } else {
          xhr = createXhr.call(win, method);
          xhr.open(method, url, true);
          forEach(headers, function(value, key) {
            if(key == 'withCredentials'){
              xhr.withCredentials = value;
            }else if(isDefined(value)){
              xhr.setRequestHeader(key, value);
            }
          });

          xhr.onreadystatechange = function() {
            if (xhr && xhr.readyState == 4) {
              var responseHeaders = null, response = null;
              if(status !== ABORTED){
                response = xhr.response || xhr.responseText;
                responseHeaders = xhr.getAllResponseHeaders();
              }
              completeRequest(callback,
                              status || xhr.status,
                              response,
                              responseHeaders);
            }
          };
          if(responseType) xhr.responseType = responseType;
          xhr.send(post || null);
        }
        
        abort.then(abortRequest);
        function abortRequest() {
          status = ABORTED;
          if(xhr) xhr.abort();
          else completeRequest(callback, status);
        }
        function completeRequest(callback, status, response, headersString) {
          xhr = null;
          status = (status === 0) ? (response ? 200 : 404) : status;
          status = status == 1223 ? 204 : status;
          callback(status, response, headersString);
        }
      };

      function jsonpReq(url, done, headers) {
        var parent = msie < 9 ? document.getElementsByTagName('head')[0] : document.body || document.head || document.getElementsByTagName('head')[0] || document.documentElement,
            script = document.createElement('script');
        function doneWrapper() {
          if(done) done();
          script.onreadystatechange = script.onload = script.onerror = done = null;
          try{parent.removeChild(script);}catch(e){}
        }
        if(msie < 9){
          script.onreadystatechange = function() {
            if(/loaded|complete/.test(script.readyState)) doneWrapper();
          };
        }
        script.onload = script.onerror = doneWrapper;
        script.charset = (headers && headers.charset) || 'utf-8';
        script.src = url;
        parent.appendChild(script);
      }
    }
    return ajax;
  })();
  var BDom = function(nodes){ //bdom构造函数
    if(!nodes){
      nodes = [];
    }else if(nodes.nodeType === 1 || !isArrayLike(nodes)){
      nodes = [nodes];
    }
    var len = this.length = nodes.length;
    for(var i = 0; i < len; i ++){
      this[i] = nodes[i];
    }
  };
  function domData(node){
    var id = dom._nodeId(node);
    return this[id] || (this[id] = {});
  }
  $$.fn = BDom.prototype = {
    push: function(node){
      this[this.length] = node;
      this.length ++;
    },
    eq: function(i){
      if(this.length == 1) return this;
      else if(this[i]){
        return new BDom(this[i]);
      }else{
        return null;//new BDom();
      }
    },
    filter: function(fn){
      var list = [];
      isFunction(fn) && this.each(function(node){
        if(fn(node)) list.push(node);
      });
      return new BDom(list);
    },
    each: function(iterator){
      for(var i = 0, len = this.length; i < len; i ++){
        iterator.call(this[i], this[i], i);
      }
      return this;
    },
    parent: function(q){
      var parents = [];
      this.each(function(){
        var parent = dom.parent(this, q);
        if(parent && parents.indexOf(parent) == -1) parents.push(parent);
      });
      return $$(parents);
    },
    closest: function(q){
      var parents = [];
      q && this.each(function(){
        var parent = dom.parent(this, q, true);
        if(parent && parents.indexOf(parent) == -1) parents.push(parent);
      });
      return $$(parents);
    },
    children: function(){
      var children = [];
      this.each(function(){
        forEach(this.children, function(node){
          children.push(node);
        });
      });
      return $$(children);
    },
    html: function(content){
      if(isDefined(content)){
        return this.each(function(){
          this.innerHTML = content;
        });
      }else{
        return this[0] ? this[0].innerHTML : '';
      }
    },
    text: function(content){
      var type = msie<9?'innerText':'textContent';
      if(isDefined(content)){
        return this.each(function(){
          this[type] = content;
        });
      }else{
        return this[0] ? this[0][type] : '';
      }
    },
    hasClass: function(name){
      var result = false;
      this.each(function(){
        result = result || classList.contains(this, name);
      });
      return result;
    },
    append: function(newNode, clone){
      var that = this;
      if(isString(newNode)){
        newNode = dom.create(newNode);
      }else if(isArrayLike(newNode)){
        forEach(slice.call(newNode), function(node){that.append(node, clone)});
        return that;
      }
      return this.each(function(){
        this.appendChild(clone ? newNode.cloneNode(true) : newNode);
      });
    },
    prepend: function(newNode, clone){
      var that = this;
      if(isString(newNode)){
        newNode = dom.create(newNode);
      }else if(isArrayLike(newNode)){
        forEach(slice.call(newNode), function(node){that.prepend(node, clone)});
        return that;
      }
      return this.each(function(){
        this.insertBefore(clone ? newNode.cloneNode(true) : newNode, this.firstChild);
      });
    },
    appendTo: function(parent){
      if(isString(parent)) parent = utils.cssQuery(parent)[0];
      else if(!parent.nodeType && parent[0]) parent = parent[0];
      if(!parent || parent.nodeType !== 1) return this;
      return this.each(function(){
        parent.appendChild(this);
      });
    },
    prependTo: function(parent){
      if(isString(parent)) parent = utils.cssQuery(parent)[0];
      else if(!parent.nodeType && parent[0]) parent = parent[0];
      if(!parent || parent.nodeType !== 1) return this;
      return this.each(function(){
        parent.insertBefore(this, parent.firstChild);
      });
    },
    attr: function(name, val){
      if(isDefined(val) || isObject(name)){
        return this.each(function(node){
          dom.attr(node, name, val);
        });
      }else return this[0] && dom.attr(this[0], name);
    },
    removeAttr: function(key){
      return this.each(function(){this.removeAttribute(key)});
    },
    prop: function(key, val){
      if(!isDefined(val)) return this[0] && this[0][key];
      return this.each(function(){this[key] = val});
    },
    data: function(name, val){
      if(isDefined(val) || isObject(name)){
        return this.each(function(node){
          dom.data(node, name, val);
        });
      }else return this[0] && dom.data(this[0], name);
    },
    removeData: function(name){
      return this.each(function(){
        var data = domData(this);
        delete data[name];
      });
    },
    val: function(val){
      var node = this[0];
      if(!node) return null;
      if(isDefined(val)){
        return forEach(this, function(node){
          dom.val(node, val);
        });
      }else{
        return dom.val(node);
      }
    },
    css: function(obj, val){
      var node = this[0];
      if(!node) return isObject(obj) || isDefined(val) ? this : null;
      var ret = dom.css(node, obj, val);
      if(isDefined(ret)){
        return ret;
      }else{
        for(var i = 1; i < this.length; i ++){
          dom.css(this[i], obj, val);
        }
      }
      return this;
    },
    find: function(query){
      var nodes = [];
      forEach(this, function(node){
        forEach(utils.cssQuery(query, node), function(_node){
          if(nodes.indexOf(_node) == -1) nodes.push(_node);
        });
      });
      return $$(nodes);
    }
  };
  forEach(["on", "off", "emit"], function(fname){
    $$.fn['$'+fname] = function(){
      var args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return this.each(function(){
        var widget = $$.widget(this),
            plugin = dom.plugin(this);
        if(widget) widget[fname].apply(widget, args);
          if(plugin) plugin.then(function(scope){
          isFunction(scope['$'+fname]) && scope['$'+fname].apply(scope, args);
        });
      });
    }
  });
  forEach(["addClass", "removeClass", "toggleClass", "delegate", "undelegate", "bind", "unbind", "remove", "show", "hide", "toggle", "trigger", "animate", "stop", "pause", "fadeIn", "fadeOut", "fadeToggle", "slideUp", "slideDown", "slideToggle"], function(fname){
    $$.fn[fname] = function(){
      var args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return this.each(function(){
        dom[fname].apply(this, [this].concat(args));
      });
    }
  });
  forEach(["focus", "blur", "submit"], function(fname){
    $$.fn[fname] = function(){
      return this.each(function(){this[fname]();});
    }
  });
  forEach(["width", "height", "scrollLeft", "scrollTop"], function(fname){
    $$.fn[fname] = function(val){
      var result = this.css(fname, val);
      if(!isDefined(val)) result = parseInt(result, 10) || 0;
      return result;
    }
  });
  forEach(["before", "after"], function(fname){
    $$.fn[fname] = function(node, clone){
      if(!node.nodeType && node[0]) node = node[0];
      if(node.nodeType !== 1) return this;
      clone ? this.each(function(){
        dom[fname](node.cloneNode(true), this);
      }) : dom[fname](node, this[0]);
      return this;
    }
    $$.fn[camelCase("insert-" + fname)] = function(node){//insertBefore
      if(!node.nodeType && node[0]) node = node[0];
      if(node.nodeType !== 1) return this;
      return this.each(function(){
        dom[fname](this, node);
      });
    }
  });
  $$.fn.on = $$.fn.delegate;
  $$.fn.off = $$.fn.undelegate;
  var isReady, bodyReadyDefer = $q.defer();
  $$.ready = function(widgets, fn){
    if(!widgets) bodyReadyDefer.resolve();
    var promise = bodyReadyDefer.promise;
    if(isFunction(widgets)){
      fn = widgets;
    }else if(isArray(widgets)){
      var promises = [];
      forEach(widgets, function(widget){
        promises.push(widget.ready());
      });
      promise = $q.all(promises);
    }
    if(isFunction(fn)){
      promise.then(function(widgets){
        try{fn.call(document, widgets);}catch(e){consoleError(e)}
      });
    }
    return promise;
  };
  if(msie && !this.addEventListener){ //低版本浏览器
    $$.needPolyfill = true;
    document.write('<script src="http://img1.cache.netease.com/f2e/modules/polyfill.js"></script>');
  }
  function domReadyNow() {
    if(!isReady){
      var body = document.body;
      if(!body){ setTimeout(domReadyNow, 13);return; }
      if($$.needPolyfill){return;}
      if(/debug=(\S+?)($|&|#)/.test(location.href)){
        $$.debug = RegExp.$1.substr(0,4) == 'http' ? RegExp.$1 : true;
      }
      isReady = true;
      bodyReadyDefer.resolve();
    }
  }
  // 绑定DOMReady事件
  if("complete" === document.readyState) {
    setTimeout(domReadyNow);
    return;
  }
  if(document.addEventListener){
    document.addEventListener("DOMContentLoaded", domReadyNow, false);
    window.addEventListener("load", domReadyNow, false);
  }else if(document.attachEvent) {
    var onDomReady = function () {
      if("complete" == document.readyState){
        domReadyNow();
      }
    };
    document.attachEvent("onreadystatechange", onDomReady);
    window.attachEvent("onload", onDomReady);
  }
}).call(this);

(function($$, genFunc){
  if($$.expr) return;
  var fnCache = {};
  var lowercase = function(string){return isString(string) ? string.toLowerCase() : string;}
  var withFunc = $$.expr = function(expr, obj, debug, val){
    try{
      if(!fnCache[expr]) fnCache[expr] = genFunc(expr);
    }catch(e){ throw('invalid expression: ' + expr + '\n' + e); }
    try{
      val = fnCache[expr](obj||window);
    }catch(e){ if(debug) throw(e); }
    return val;
  }
  var SPLITER = /\s*;\s*/,
      EXPRESSER = /(\\?)\{\!?\{(.+?)\}\}/,
      EVENTSPLITER = /[;\s]+/;
  var utils = $$.utils, rAF = utils.rAF, dom = $$.dom, msie = utils.msie, extend = $$.extend, slice = [].slice;
  var forEach = $$.each, isObject = $$.isObject, isNumber = $$.isNumber, isString = $$.isString, isArray = $$.isArray, isFunction = $$.isFunction, $q = $$.$q, classList = $$.classList, isDefined = $$.isDefined, ajax = $$.ajax, Promise = $$.Promise;
  var getDefaultVal = function(defaultval, match){return defaultval != null ? defaultval : (match.substr(1,1) == '!' ? '' : match);};
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\t':     't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };
  var spliceItem = function(arr, item){
    if(isArray(arr)){
      var idx = arr.indexOf(item);
      if(~idx) arr.splice(idx, 1);
    }
  }
  $$.throttle = function(func, wait, immediate) {
    if(!wait) return func;
    var context, args, result;
    var timeout = null;
    var previous = 0;
    var later = function() {
      previous = immediate === false ? 0 : (+new Date);
      timeout = null;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    };
    return function() {
      var now = +new Date;
      if (!previous && immediate === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        previous = now;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      } else if (!timeout) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };
  
  $$.debounce = function(func, wait, immediate) {
    if(!wait) return func;
    var timeout, args, context, timestamp, result;
    var later = function() {
      var last = (+new Date) - timestamp;
      console.log('exec later,last:'+last);

      if (last < wait && last >= 0) {
        timeout = setTimeout(later, wait - last);
      } else {
        timeout = null;
        if (!immediate) {
          result = func.apply(context, args);
          if (!timeout) context = args = null;
        }
      }
    };

    return function() {
      context = this;
      args = arguments;
      timestamp = +new Date;
      var callNow = immediate && !timeout;

      console.log(args[0],callNow,timeout,wait);

      if (!timeout) {
        console.log('create new timeout');
        timeout = setTimeout(later, wait);
      }
      if (callNow) {
        result = func.apply(context, args);
        context = args = null;
      }
      return result;
    };
  };

  //动画中心
  var animCenter = {
    _map: {},
    add: function(name, animator){
      var map = animCenter._map,
          cbs = map[name] || (map[name] = []);
      if(animator){
        if(cbs.indexOf(animator) == -1){
          cbs.push(animator);
        }
      }
    },
    remove: function(name, animator){
      var map = animCenter._map,
          cbs = map[name];
      if(isArray(cbs)){
        if(!animator){
          delete map[name];
        }else{
          var idx = cbs.indexOf(animator);
          if(idx != -1) cbs.splice(idx, 1);
        }
      }
    }
  };
  var delayer = function(delay){ //延迟器
    return delay ? new Promise(function(resolve){
      setTimeout(resolve, delay);
    }) : $q.ref();
  }
  $$.fx = function(config){
    if(!config.start) config.start = null;
    if(!config.end) config.end = null;
    return function($el, opts){
      return extend(new Animator($el), config, opts);
    }
  }
  $$.fx.add = animCenter.add;
  $$.fx.remove = animCenter.remove;
  $$.fx.play = function(name){
    var promises = [], arr = animCenter._map[name];
    if(!arr || !arr.length) return $q.ref();
    forEach(arr, function(animator, i){
      var delay = isFunction(animator.delay) ? animator.delay(i) : animator.delay;
      promises.push(delayer(delay).then(function(){
        return animator.play()
      }));
    });
    return $q.all(promises).then(function(){
      $$.fx.play(name+'.then');
    });
  }
  var fxRepeating = {};
  $$.fx.repeat = function(name, times, delay){
    var promises = [], animates = animCenter._map[name];
    if(!animates.length || (isNumber(times) && times-- === 0)) return;
    fxRepeating[name] = +new Date;
    forEach(animates, function(animator, i){
      promises.push(animator.play());
    });
    $q.all(promises).then(function(){
      if(fxRepeating[name]){
        if(!delay && (+new Date-fxRepeating[name] < 25)) delay = 25;
        delayer(delay).then(function(){
          $$.fx.repeat(name, times, delay);
        });
      }
    });
  }
  forEach(['pause', 'stop'], function(fname){
    $$.fx[fname] = function(name){
      delete fxRepeating[name];
      forEach(animCenter._map[name], function(animator){
        animator[fname]();
      });
    }
  });
  $$.fx.step = function(name, val){ //val取值范围为[0, 1]
    if(typeof val != 'number') val = 0;
    else if(val < 0) val = 0;
    else if(val > 1) val = 1;
    
    forEach(animCenter._map[name], function(animator){
      var toVal;
      if(isFunction(animator.step)){
        toVal = animator.fix().step(val, animator.$el);
      }
      if(isObject(toVal) || isObject(animator.to)){
        animator.$el.animate(extend(toVal || {}, animator.to), val, animator.ease);
      }
      animator.progress = val;
    });
  }
  function runner(animator){
    var paused, percent, progress, _progress = animator.progress || 0,
        duration = animator.duration,
        startTime = +new Date, defer = $q.defer();
    var easeFn = easeFns[animator.ease] || easeFns['linear'];
    var _step = function(){
      percent = easeFn(Math.min((+new Date - startTime)/duration, 1));
      if(!paused && percent < 1) rAF(_step);
      var toVal;
      progress =  _progress*(1-percent)+percent;
      if(isFunction(animator.step)){
        toVal = animator.step(progress, animator.$el);
      }
      if(isObject(animator.to) || isObject(toVal)){
        animator.$el.animate(extend(toVal||{}, animator.to), progress);
      }
      if(percent == 1) defer.resolve();
    }
    _step();
    defer.promise.pause = function(){
      paused = true;
      animator.progress = progress;
    }
    return defer.promise;
  }
  function Animator(el){
    this.$el = $$(el);
    this.duration = 300;
    this.progress = 0;
    this.prefix = "ne-anim";
  }
  Animator.prototype = {
    fix: function(){ //将数组表达的step改为函数
      if(isArray(this.step)){
        var stepArr = this.step,
            steps = stepArr.length,
            stepRatio = [];
        forEach(stepArr, function(step){
          stepRatio.push(parseFloat(step.ratio) || 1/steps);
          delete step.ratio;
        });
        this.step = function(x){
          var ratio = 0, props = {}, isStage;
          for(var i = 0; i < steps; i ++){
            ratio += stepRatio[i];
            isStage = (i == steps-1 || ratio >= x);
            var _props = stepArr[i];
            var progress = isStage ? (x-ratio+stepRatio[i])/stepRatio[i] : 1;
            forEach(_props, function(val, key){
              props[key] = utils.interpolate(val, progress);
            });
            if(isStage) return props;
          }
        }
      }
      return this;
    },
    play: function(duration){
      this.fix().pause();
      duration = (duration || this.duration)*(1-this.progress);
      var that = this,
          $el = that.$el,
          defer = $q.defer();
      var done = function(){
        that._endTimeout = that._updator = null;
        if(isFunction(that.end)){
          that.end($el);
        }
        if(isObject(that.reset)){
          $el.css(that.reset);
        }
        that.progress = 0;
        defer.resolve();
      };
      if(isFunction(that.start)){
        that.start($el);
        that._endTimeout = setTimeout(done, duration + 10);
      }else if(!isFunction(that.step) && isObject(that.to)){
        that._updator = $el.animate(that.to, duration, that.ease, done);
      }else if(isFunction(that.step) || isObject(that.to)){
        that._updator = runner(that);
        that._updator.then(done);
      }
      return defer.promise;
    },
    repeat: function(times, delay){
      var that = this;
      if(isNumber(times) && times-- === 0) return;
      that._repeating = +new Date;
      that.play().then(function(){
        if(that._repeating){
          if(!delay && +new Date-that._repeating<25) delay = 25;
          delayer(delay).then(function(){
            that.repeat(times, delay);
          });
        }
      });
    },
    pause: function(){
      var updator = this._updator,
          endTimeout = this._endTimeout;
      updator && isFunction(updator.pause) && updator.pause();
      endTimeout && clearTimeout(endTimeout);
      this._updator = this._endTimeout = this._repeating = null;
    },
    stop: function(){
      this.pause();
      this.progress = 0;
    },
    start: function($el){
      var prefix = this.prefix;
      $el.removeClass(prefix+"-end");
      $el.addClass(prefix+"-init");
      $el[0].offsetWidth;
      $el.addClass(prefix+"-ing");
    },
    end: function($el){
      var prefix = this.prefix;
      $el.removeClass(prefix+"-ing");
      $el.addClass(prefix+"-end");
    }
  }
  
  var escapeMatch = /\\|'|\r|\n|\t|\u2028|\u2029/g,
      escaper = function(match) { return '\\' + escapes[match]; };
  var template = $$.template = {
    replace: function(temp, data, regexp, defaultval, filter){
      if(!isArray(data)) data = [data];
      var ret = [];
      forEach(data, function(item){
        ret.push(replaceAction(item));
      });
      return ret.join("");
      function replaceAction(object){
        return temp.replace(regexp || (/\{\!?\{([^}]+)\}\}/g), function(match, name){
          if(filter && !filter.test(match)) return match;
          var result = withFunc(name, object);
          return result != null ? result : getDefaultVal(defaultval, match);
        });
      }
    },
    parse: function(text, data){
      var index = 0, source = "var __t,__p='',__j=Array.prototype.join," + "print=function(){__p+=__j.call(arguments,'');};\nwith(obj||{}){__p+='";
      text.replace(/<%=([\s\S]+?)%>|<%([\s\S]+?)%>|$/g, function(match, interpolate, evaluate, offset){
        source += text.slice(index, offset).replace(escapeMatch, escaper);
        if(interpolate){
          source += ~interpolate.indexOf('(') ? "'+\n(typeof (__t="+interpolate+") =='undefined'||__t==null?'':__t)+'"
            : "'+\n(typeof ("+interpolate+") =='undefined'||(__t=("+interpolate+"))==null?'':__t)+'";
        }else if(evaluate){
          source += "';\n" + evaluate + "\n__p+='";
        }
        index = offset + match.length;
        return match;
      });

      source += "';\n}return __p;";
      var fn = new Function('obj', source);
      return data ? fn(data) : fn;
    }
  }
  var tagLC = function(node){return node && isString(node.tagName) ? node.tagName.toLowerCase() : ''}
  function stringify(obj){return typeof obj == 'object' && obj && !obj.alert ? JSON.stringify(obj) : obj;}
  function isEmptyNode(node){
    return node.nodeType == 1 && node.innerHTML.replace(/<!--[\s\S]*?-->/g, '').replace(/^\s+/, '') === '';
  }
  function wanderDom(wrap, fn, fn2, procWrapOrNot){
    if(wrap.nodeType !== 1){
      return wrap;
    }
    var body = document.body;
    if(wrap == body || procWrapOrNot) {
      wrap = fn(wrap);  //处理document.body
      if(!wrap){
        return false;
      }
    }
    var node = wrap.firstChild, _node;
    while(node){ //处理子节点
      var nodeType = node.nodeType;
      var nextNode = node.nextSibling;
      if(nodeType == 1 && fn){
        _node = fn(node);
        if(_node){ //返回false表示不处理孙节点; 返回临时空节点可用来跳过
          if(tagLC(_node) != 'script') wanderDom(_node, fn, fn2);
          nextNode = _node.nextSibling;
        }
      } else if(nodeType == 3 && fn2){
        fn2(node);
      }
      node = nextNode;
    }
    return wrap;
  }
  function getNodeAttrs(node){
    var attrs = {}, str = node.outerHTML;
    var result, name, val;
    if(str){
      var hits = 0;
      var attrMatcher = /((\S+?)=(['"])(.*?)\3|[^>\s]+)\s*(\/?\s*>)?/g;
      while((result = attrMatcher.exec(str))){
        name = result[2];
        val = result[4];
        if(!name){
          var tmparr = result[1].split("=");
          name = tmparr[0];
          val = tmparr[1] || "";
        }
        if(hits++) attrs[name] = val.replace(/&amp;/g, '&').replace(/&gt;/g, '>').replace(/&lt;/g, '<');
        if(result[5]) break;
      }
    }else if(node.attributes){
      for(var i = 0, len = node.attributes.length; i < len; i ++){
        var item = node.attributes[i];
        attrs[item.name] = item.value;
      }
    }
    return attrs;
  }
  var observableProto = {
    $on: $$.on,
    $off: $$.off,
    $emit: $$.emit,
    $extend: $extend
  };
  function observableObj(){
    var scope = Object.create(observableProto);
    scope.$msg = {};
    return scope;
  }
  function getPluginPromise(node, value, data){
    var allPromise = [];
    value = value || node.getAttribute("ne-plugin");
    if(isObject(value)){
      var scope = observableObj(), def = value;
      def.fn.apply(scope, def.depInject);
      extend(true, parseState(scope, node.getAttribute("ne-plugin-state")), data);
      scope.init && scope.init($$(node));
      allPromise.push($q.ref(scope));
    }else if(isString(value)){
      forEach(value.trim().split(SPLITER), function(file){
        file = fullName(file);
        if(/\.css$/i.test(file)){
          amdLoader.createLink(file);
        }else{
          var promise = amdLoader.makeDefer(file).promise;
          allPromise.push(promise.then(function(def){
            var scope = observableObj();
            def.fn.apply(scope, def.depInject);
            extend(true, parseState(scope, node.getAttribute("ne-plugin-state")), data);
            isFunction(scope.init) && scope.init($$(node));
            return scope;
          }));
        }
      });
    }
    return node["ne-plugin-promise"] = allPromise.length == 1 ? allPromise[0] : $q.all(allPromise);
  }
  dom.plugin = function(node, file, data){
    if(!isString(file) && !isObject(file)){
      return node["ne-plugin-promise"];
    }else{
      return getPluginPromise(node, file, data);
    }
  };
  $$.fn.plugin = function(file, data){
    var defer = $q.defer(),
        that = this,
        promises = [];
    $$.ready(function(){
      forEach(that, function(node){
        promises.push(dom.plugin(node, file, data));
      });
      $q.all(promises).then(function(result){
        defer.resolve(result);
      });
    });
    return defer.promise;
  };
  var _directives = {
    "ne-role": function(scope, node, value){
      var widget = this,
          roles = widget.__roles;
      forEach(value.split(/\s+/), function(roleid){
        if(!roleid) return;
        if(!roles[roleid]) roles[roleid] = [];
        roles[roleid].push(node);
      });
    },
    "ne-model": function(scope, node, expr, destroys){//control->model单向绑定
      var widget = this,
          models = widget.models;
      var item = models.add(node, expr.replace(/^\s*{+([^}]*?)}+\s*$/, "$1"), scope);
      destroys.push(function(){
        models.remove(item);
      });
    },
    "ne-if": function(scope, node, expr, destroys){
      var widget = this, widgetScope = widget.scope;
      node['ne-ifed'] = true;
      if(isString(expr)){
        expr = expr.replace(/^\s*{+([^}]*?)}+\s*$/, "$1");
        if(tagLC(node) == 'script'){
          return _directives['ne-repeat'].call(widget, scope, node, "", destroys, true);
        }
        var txtNode = document.createTextNode(""),
            enable = true,
            compiled = false;
        dom.after(txtNode, node);
        var update = function(val){
          if(enable && !val){
            dom.remove(node);
            enable = false;
          }else if(!enable && val){
            dom.before(node, txtNode);
            enable = true;
          }
          if(enable && !compiled){
            compiled = true;
            widget.wander(node, scope, true);
            widget.compile(node);
            destroys.push(function(){
              widgetScope.$unwatch(expr, update, scope);
            });
          }
        }
        widgetScope.$watch(expr, update, scope);
        update(scope.$parse(expr));
        return txtNode;
      }
    },
    "ne-html": function(scope, node, expr, destroys){
      var widget = this, widgetScope = widget.scope;
      if(expr){
        var update = function(val, _val){
          if(isDefined(val)){
            if(msie <= 9 && /tr|thead|tbody|tfoot/.test(tagLC(node))){
              forEach(node.children, function(child){
                node.removeChild(child);
              });
              node.appendChild(dom.create(val));
            }else{
              node.innerHTML = val;
            }
            widget.compile(node);
            widget.$refresh2 = true;
          }
        }
        widgetScope.$watch(expr, update, scope);
        destroys.push(function(){
          widgetScope.$unwatch(expr, update, scope);
        });
      }
    },
    "ne-text": function(scope, node, expr, destroys){
      var widget = this, widgetScope = widget.scope;
      if(expr){
        var update = function(val, _val){
          if(isDefined(val)) node[msie<9?'innerText':'textContent'] = val;
        }
        widgetScope.$watch(expr, update, scope);
        destroys.push(function(){
          widgetScope.$unwatch(expr, update, scope);
        });
      }
    },
    "ne-state-extend": function(scope, node, expr, destroys){
      var widget = this, widgetScope = widget.scope;
      if(expr){
        node.removeAttribute("ne-state-extend");
        var update = function(val, _val){
          var subWidget = $$.widget(node);
          if(val && subWidget){
            subWidget.prepared(function(){
              extend(true, subWidget.scope.state, val);
            });
          }
        }
        widgetScope.$watch(expr, update, scope, true);
        destroys && destroys.push(function(){
          widgetScope.$unwatch(expr, update, scope);
        });
      }
    },
    "ne-on": function(scope, node, expr, destroys){
      var widget = this,
          widgetScope = widget.scope,
          eventList = {},
          result;
      var subWidget = $$.widget(node);
      if(expr && subWidget){
        while ((result = PROPSPLITER.exec(expr)) !== null) {
          var val = result[2];
          eventList[result[1]] = function(){
            var _fn = withFunc(val, widgetScope, true);
            if(isFunction(_fn)) _fn.apply(widgetScope, arguments);
          }
        }
        forEach(eventList, function(fn, msg){
          subWidget.on(msg, fn);
        });
        destroys.push(function(){
          forEach(eventList, function(fn, msg){
            subWidget.off(msg, fn);
          });
        });
      }
    },
    "ne-extend": function(scope, node, expr, destroys){
      var widget = this,
          widgetScope = widget.scope;
      if(expr && /^\s*{{(.*?)}}\s*$/.test(expr)){
        node.removeAttribute("ne-extend");
        var update = function(val, _val){
          var subWidget = $$.widget(node);
          subWidget && subWidget.extend(val);
        }
        widgetScope.$watch(expr, update, scope, true);
        destroys && destroys.push(function(){
          widgetScope.$unwatch(expr, update, scope);
        });
      }
    },
    "ne-options": function(scope, node, value, destroys){
      var widget = this,
          widgetScope = widget.scope;
      node.removeAttribute("ne-options");
      if(node.options){
        var olen = node.options.length; //静态options
        var update = function(arr/*, _arr*/){
          while(olen < node.options.length){
            node.remove(olen);
          }
          createOptions(node, widget, arr);
        }
        widgetScope.$watch(value, update, scope);
        destroys.push(function(){
          widgetScope.$unwatch(value, update, scope);
        });
      }
    },
    "ne-foreach": function(scope, node, value, destroys){
      var widget = this;
      node.removeAttribute('ne-foreach');
      return _directives['ne-repeat'].call(widget, scope, node, value, destroys, true);
    },
    "ne-recurse": function(scope, node, value, destroys){
      if(!scope.hasOwnProperty('$recurse')) return;
      var $recurse = scope.$recurse;
      if(!value || value.indexOf($recurse.key + '.') == -1) return;
      //空节点占位
      var nullnode = document.createTextNode("");
      dom.replace(nullnode, node);
      var widget = this,
          viewItem = {
            node: [nullnode],
            type: 'repeat',
            key: $recurse.key,
            attr: $recurse.attr,
            isJoin: $recurse.isJoin,
            model: value,
            scope: scope
          };
      destroys.push(widget.views.add(viewItem));
      if(!destroys.subnode) destroys.subnode = [];
    },
    "ne-repeat": function(scope, node, value, destroys, isJoin){
      var widget = this,
          isScript = tagLC(node) == 'script';
      if(!isJoin && !value){
        return false;
      }
      value = value.replace(/^\s*\{+(.*?)\}+\s*$/, "$1");
      //空节点占位
      var html, nullnode = document.createTextNode("");
      if(isArray(node)){
        dom.before(nullnode, node[0]);
        var fragment = document.createDocumentFragment();
        forEach(node, function(_node){
          fragment.appendChild(_node);
        });
        node = fragment;
      }else{
        node.removeAttribute('ne-repeat');
      }
      
      if(isScript) {
        html = template.parse(node.innerHTML.trim());
      }else if(isJoin){ //deprecated: 非script标签中使用了ne-foreach
        throw("ne-foreach should be used with script.");
      }else{
        dom.before(nullnode, node);
        var div = document.createElement("div");
        div.appendChild(node);
        html = div.innerHTML.replace(/&amp;/g, '&');
        dom.remove(node);
      }
      if(!nullnode.parentNode){
        dom.replace(nullnode, node);
      }
      
      var viewItem = {
        node: [nullnode],
        attr: html,
        scope: scope,
        isJoin: isJoin,
        type: 'repeat',
        destroys: destroys
      };
      if(isScript){
        var cond = node.getAttribute("ne-if");
        if(isString(cond)){
          viewItem.cond = cond.replace(/^\s*\{+(.*?)\}+\s*$/, "$1");
        }
      }
      if(/^\s*(\S+)\s+in\s+(.*)/.test(value)){
        extend(viewItem, {
          key: RegExp.$1,
          model: RegExp.$2
        });
      }else{
        viewItem.model = value;
      }

      var viewDestroy = widget.views.add(viewItem);
      destroys.push(viewDestroy);
      node['ne-selfcide'] = function(){
        viewDestroy();
        forEach(viewItem.node, function(nodeList){
          forEach(nodeList, dom.remove);
        });
      };
      if(!destroys.subnode){
        destroys.subnode = [];
      }
      return nullnode;
    },
    "ne-repeat-start": function(scope, node, value, destroys){
      var widget = this;
      var match = false, nodes = [node];
      node.removeAttribute('ne-repeat-start');
      while((node = node.nextSibling)){
        nodes.push(node);
        if(node.getAttribute && isString(node.getAttribute("ne-repeat-end"))){
          node.removeAttribute('ne-repeat-end');
          match = true;
          break;
        }
      }
      if(match){
        return _directives['ne-repeat'].call(widget, scope, nodes, value, destroys);
      }else{
        return true;
      }
    },
    "ne-fx": function(scope, node, expr, destroys){
      var result,
          animateList = {};
      if(expr){
        var $node = $$(node);
        while ((result = PROPSPLITER.exec(expr)) !== null) {
          var val = result[2].trim(), animator;
          if(/^(\d+)(\S*)/.test(val)){
            animator = new Animator(node);
            animator.duration = parseInt(RegExp.$1);
            if(RegExp.$2) animator.prefix = RegExp.$2;
          }else{
            var animFactory = scope.$parse(val);
            if(isObject(animFactory)) animFactory = $$.fx(animFactory);
            animator = isFunction(animFactory) && animFactory($node);
          }
          if(animator){
            animateList[result[1]] = animator;
          }
        }
        forEach(animateList, function(animator, name){
          animCenter.add(name, animator);
        });
        destroys.push(function(){
          forEach(animateList, function(animator, name){
            animCenter.remove(name, animator);
          });
        });
      }
    }
  };
  var directives = {},
      directiveMatches = {};
  $$.directive = function(name, fn){  //fn.call(widget, scope, node, value)
    if(isFunction(fn)) {
      if(isString(name)){
        directives[name] = fn;
      }else{
        directiveMatches[name] = fn;
      }
    }else{
      return directives[name];
    }
  }

  function isMatch(item, tester, strict){
    if($$.isRegExp(tester)){
      return tester.test(item);
    }else{
      return strict ? item === tester : item.indexOf(tester) > -1
    }
  }
  function $extend(){
    var deep = true;
    var args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
    if(typeof args[0] == 'boolean') deep = args.shift();
    return extend.apply(this, [deep, this].concat(args));
  }
  function watchRefresh(fns, expr){
    var value = this.$parse(expr),
        _value = fns.cache;
    var cache = stringify(value);
    if(!fns.inited || cache !== _value){
      fns.cache = cache;
      fns._value = value;
      fns.inited = true;
      if(fns.fn){
        fns.fn(value, _value);
      }else{
        forEach(fns, function(fn){
          fn(value, _value);
        });
      }
    }
  }
  function Scope(){}
  Scope.prototype = {
    $on: $$.on,
    $off: $$.off,
    $emit: $$.emit,
    $reverse: function(arr){
      return extend([], arr).reverse();
    },
    $sort: function(arr, expr, reverse){
      var fn = isFunction(expr) ? expr : function(a, b){
        var flag = reverse ? -1 : 1;
        return a[expr] < b[expr] ? -flag : flag;
      }
      return arr.sort(fn);
    },
    $filter: function(arr, fn){
      if(!isArray(arr) || !fn){
        return arr;
      }else{
        var result = [];
        forEach(arr, function(item, i){
          var key;
          if(isFunction(fn)){
            if(!fn(item, i)) return;
          }else if(isObject(fn)){
            for(key in fn)
              if(!isMatch(item[key], fn[key], true)) return;
          }else{
            var match = true;
            if(isString(item)) match = isMatch(item, fn);
            else if(isObject(item)){
              for(key in item)
                if(!isMatch(item[key], fn)){
                  match = false;
                  break;
                }
            }else return;
            if(!match) return;
          }
          result.push(item);
        });
        return result;
      }
    },
    $watch: function(expr, fn, scope, instant){
      expr = expr.replace(/^\s*{{([^}]*?)}}\s*$/, "$1");
      if(scope && scope != this){ //指定子scope
        if(!this.hasOwnProperty('$$watchS')) this.$$watchS = [];
        var item = {
          fn: fn,
          expr: expr,
          scope: scope
        }
        this.$$watchS.push(item);
        if(instant) watchRefresh.call(scope, item, expr);
      }else{
        if(!this.hasOwnProperty('$$watches')) this.$$watches = {};
        var fns = this.$$watches[expr] || (this.$$watches[expr] = []);
        fns.push(fn);
        if(fns.inited) fn(fns._value);
        else if(instant) watchRefresh.call(scope, fns, expr);
      }
    },
    $unwatch: function(expr, fn, scope){
      var i;
      expr = expr.replace(/^\s*{{([^}]*?)}}\s*$/, "$1");
      if(scope && scope != this && scope.$$watchS){
        for(i = 0; i < this.$$watchS.length; i ++){
          var item = this.$$watchS[i];
          if(item.expr == expr && (!fn || item.fn == fn)){
            this.$$watchS.splice(i--, 1);
          }
        }
      }else if(!scope && this.$$watches && this.$$watches[expr]){
        for(i = 0; i < this.$$watches[expr].length; i ++){
          if(!fn || this.$$watches[expr][i] == fn){
            this.$$watches[expr].splice(i--, 1);
          }
        }
      }
    },
    $extend: $extend,
    $parse: function(expr, scope){
      scope = scope || this;
      if(expr.indexOf('{{') > -1){
        return template.replace(expr, scope, /{{([^}]+)}}/g, '');
      }else{
        return withFunc(expr, scope);
      }
    },
    $cancel: function(){ return false; },
    $refresh: function(delay){ //scope.$refresh
      var scope = this,
          widget = scope.$widget;
      if(scope.hasOwnProperty('$refreshing') && scope.$refreshing){
        widget.$refresh2 = true;
        return;
      }
      scope.$refreshing = 1;
      if(isNumber(delay)){
        setTimeout(function(){
          scope.$refresh();
        }, delay);
        return;
      }
      if(scope.hasOwnProperty('$$watches')) forEach(scope.$$watches, function(fns, expr){ //默认widget.scope
        watchRefresh.call(scope, fns, expr);
      });
      if(widget.models) widget.models.refresh();
      if(widget.views) widget.views.refresh();
      if(scope.hasOwnProperty('$$watchS')) forEach(scope.$$watchS, function(item){ //指定scope，如ne-repeat内的视图
        watchRefresh.call(item.scope, item, item.expr);
      });
      forEach(widget.children, function(subwidget){
        subwidget.isReady && subwidget.refresh();
      });
      scope.$refreshing = 0;
      if(widget.$refresh2){
        widget.$refresh2 = false;
        scope.$refresh();
        widget.updateRoles();
      }
    }
  };
  var urlParsingNode = document.createElement('a');
  var originUrl = urlResolve(window.location.href);
  function urlResolve(url) {
    urlParsingNode.setAttribute('href', url);
    return {
      href: urlParsingNode.href,
      host: urlParsingNode.host,
      pathname: (urlParsingNode.pathname.charAt(0) === '/') ?
        urlParsingNode.pathname
        : '/' + urlParsingNode.pathname
    };
  }
  
  var UPPATH_NORM = /(^|\/)\w[^\/;,]*?\/\.\.\//;
  var UPPATH_RE = /^\.\.\/(.*)/;
  var FLOAT_RE = /^\-?([1-9][0-9]*|0)(\.[0-9]+)?$/;
  var PATH_TAIL_RE = /[^\/]+?\/?$/;
  var PROPSPLITER = /([^;\s]+?)\s*[=:]\s*([^;]*)/g;
  var MODELEXPR_RE = /(?:^|\.)(.+?)(?=\[|\.|$|\()|\[(['"]?)(.+?)\2\]/g;
  function fullNames(arr, relpath){
    forEach(arr, function(file, i){
      var depFiles = [];
      forEach(file.split(SPLITER), function(_file){
        depFiles.push(fullName(_file, relpath));
      });
      arr[i] = depFiles.join(';');
    });
  }
  function fullName(path, relpath){
    //相对js地址转成绝对路径
    var prefix = "";
    if(relpath && relpath.indexOf('%') === 0){
      relpath = "";
    }
    if(/^([a-z]*\!)(\S+)/.test(path)){
      prefix = RegExp.$1;
      path = RegExp.$2;
    }
    //替换别名
    if(pathAlias[path]){
      path = pathAlias[path];
    }else{
      for(var alias in pathAlias){
        if(/\/$/.test(alias) && path.indexOf(alias) == 0){
          path = path.replace(alias, pathAlias[alias]);
          break;
        }
      }
    }
    if(!/^(\%|\/\/|http)/.test(path)){
      if(path.indexOf("/") !== 0){ //相对路径
        var _path = relpath || originUrl.pathname; //_path以/结尾
        if(/\/[^\/]+$/.test((relpath || originUrl.href || '').replace(/[#\?].*/, ''))){
          _path = _path.replace(PATH_TAIL_RE, '');
        }
        while(UPPATH_RE.test(path)){
          path = RegExp.$1;
          _path = _path.replace(PATH_TAIL_RE, '');
        }
        path = _path + path;
      }else if(isString(relpath) && /(.*\/\/\S+?)\//.test(relpath)){
        var host = RegExp.$1;
        path = host + path;
      }
    }
    //img*.cache.netease.com外的所有域名换成$$.debug
    if(isString($$.debug) && path.indexOf("cache.netease") == -1){
      path = path.replace(/https?:\/\/.*?\//, "/")
        .replace(/^\//, $$.debug + "/");
    }
    return prefix + normalizePath(path);
  }
  function normalizePath(_path){
    var path = _path.replace(/\/\.\//g, '/');
    while((_path = path.replace(UPPATH_NORM, '$1'))){
      if(_path == path){
        break;
      }else{
        path = _path;
      }
    }
    return path;
  }
  function Widget(){ //组件生成函数
    this._readyDefer = $q.defer();
    this._preparedDefer = $q.defer();
    this._readyDefer.promise.then(function(widget){
      widget.isReady = true;
    });
  }
  var widgetCache = {};
  var _widgetCounter = 1;
  Widget.create = function(wrap, parent, defname){ //创建widget对象(未执行构造器函数)
    var widget;
    if(wrap){
      var widgetId = wrap.getAttribute("ne-id");
      var nodeId = wrap[dom._idname];
      if(nodeId && widgetCache[nodeId]){
        widget = widgetCache[nodeId];
      }else if(widgetId && widgetCache['#' + widgetId]){ //warn: 相同ne-id重复实例化
        widget = widgetCache['#' + widgetId];
      }else{
        widget = new Widget;
        if(widgetId){
          widgetCache['#' + widgetId] = widget;
        }
      }
      var guid = '$$' + _widgetCounter++;
      wrap['ne-wguid'] = widget.guid = guid; //实例化完成
      widgetCache[guid] = widget;
      widget.$root = $$(wrap);
      if(parent){
        widget.parent = parent;
        parent.children.push(widget);
      }
      if(defname){
        if(!widgetCache[defname]) widgetCache[defname] = [];
        widgetCache[defname].push(widget);
      }
    }else{ //rootWidget
      widget = new Widget;
      widget.children = [];
      widget.scope = $$.rootScope;
      widget.scope.$widget = widget;
      widget.views = new Views(widget);
      widget.models = new Models(widget);
      widget.update = $$.rootScope.$update = widget.models.update.bind(widget.models);
    }
    widget.__roles = {};
    widget.roles = {};
    widget.constructor = Widget;
    return widget;
  };
  Widget.shortName = function(name){
    return name.replace(/.*\//, '').replace(/\..*/, '');
  };
  function compile(rootWrap, parentWidget, destroys){
    var moduleWraps = [],
        body = document.body;
    if(!parentWidget) parentWidget = rootWidget;
    if(!rootWrap){
      moduleWraps.push(body);
    }else if(!rootWrap['ne-wguid'] && isString(rootWrap.getAttribute("ne-module"))){
      moduleWraps.push(rootWrap);
    }else{
      wanderDom(rootWrap, function(node){
        if((node != rootWrap) && isString(node.getAttribute("ne-module"))){
          moduleWraps.push(node);
          return false; //不取子模块
        }
        return node; //递归取子模块
      });
    }
    var widgets = [];
    forEach(moduleWraps, function(wrap){
      var widget;
      if(wrap['ne-wguid']){ //compile时跳过已组件化节点，但仍可用load加载
        widget = $$.widget(wrap);
      }else{
        widget = load(wrap.getAttribute("ne-module") || "", wrap, parentWidget);
      }
      widgets.push(widget);
      if(destroys) destroys.push(function(){widget.destroy();});
    });
    return widgets;
  }
  function load(moduleFile, wrap, parentWidget, data){
    if(!wrap || !wrap.nodeType) return null;
    if(wrap != document.body && !isString(wrap.getAttribute('ne-module'))){
      wrap.setAttribute('ne-module', '');
    }
    moduleFile = moduleFile.replace(/^\s+|\s+$/g, '');
    var isolate = false;
    if(/(.*)\*$/.test(moduleFile)){
      moduleFile = RegExp.$1;
      isolate = true;
    }
    if(moduleFile){
      if(moduleFile.substr(0, 1) == '@' && parentWidget && parentWidget.scope){ //rel to parentWidget
        var parentPath = parentWidget.scope.$moduleid;
        if(parentPath && parentPath.substr(0, 1) != '%'){
          moduleFile = parentPath.replace(/[^\/]*?$/, '') + moduleFile.substr(1);
        }else moduleFile = moduleFile.substr(1);
      }
      moduleFile = fullName(moduleFile);
    }
    var widget = Widget.create(wrap, isolate ? rootWidget : parentWidget, moduleFile);
    widget.isolate = isolate; //是否隔离组件
    widget.scope = widget.isolate ? new Scope : Object.create(parentWidget.scope);
    widget.scope.$msg = {};
    if($$.isObject(data)){
      widget.extend(data);
    }
    getPluginPromise(wrap).then(function(){
      if(!moduleFile){ //void module
        amdLoader.instantiate(null, widget);
        widget.render();
      }else if(/^\%|\.js$/.test(moduleFile)){ //典型组件
        amdLoader.get(moduleFile).deploy(widget, parentWidget);
      }else{ //html类型
        amdLoader.instantiate(null, widget);
        loadHtml(moduleFile, widget);
      }
    });
    return widget;
  }
  function bindEvent(node, event, expr, widget, scope){ //绑定表达式事件
    var fn = function(e){
      var result;
      scope.$event = e;
      e.currentTarget = scope.$target = node;
      if(expr){
        widget.update(function(){
          var promise = withFunc(expr, scope, true);
          if(promise === false || promise === -1){
            e.preventDefault();
            promise === -1 && e.stopPropagation();
          }
        });
      }
      return result;
    };
    if(event == 'change'){  //监听模拟元件的value变化
      var nodeWidget = $$.widget(node);
      if(nodeWidget){
        nodeWidget.watch('value', fn);
        return function(){
          nodeWidget.unwatch('value', fn);
        }
      }
    }
    dom.bind(node, event, fn);
    return function(){ //事件销毁
      dom.unbind(node, event, fn);
    }
  }
  function loadHtml(file, widget){ //依赖已满足，填充html
    var wrap = widget.$root[0];
    var scope = widget.scope;
    var neTransclude = isString(wrap.getAttribute("ne-transclude"));
    if(neTransclude || isEmptyNode(wrap)){
      widget._empty = true;
      if(neTransclude) wrap.transclude = wrap.innerHTML;
    }
    if(widget._empty){
      var props = parseProps(wrap);
      var injectHtml = function(html){
        //ie9以下需要保证innerHTML开始时有实体元素，否则会丢失script/link/style
        wrap.innerHTML = (msie < 9 ? '<input style="display:none"/>' : '') + template.replace(html, {
          props: props,  //替换{{props.*}}
          transclude: wrap.transclude || ""
        }, null, null, /props\.|transclude/);
        if(msie < 9) wrap.removeChild(wrap.firstChild);
        widget.render();
      }
      if(scope.hasOwnProperty("html")){ //通过预定义或传参获取组件html
        injectHtml(scope.html);
      }else{ //加载组件皮肤
        var skin = props.skin;
        file = /\//.test(skin) ? fullName(skin) : file.replace(/(\.[^\.]*)?$/, (skin ? "." + skin : "") + ".html") + (msie ? '?' + (+new Date) : '');
        delete props.skin;
        htmlLoader.load(utils.buildUrl(file, props), wrap).then(injectHtml);
      }
    }else{
      widget.render();
    }
  }
  var eventsMatcher = /^(click|dblclick|contextmenu|key\w+|mouse\w+|touch\w+)/; //可代理事件
  var undelegatableEvents = {}; //不可代理事件
  forEach(['submit', 'change', 'focus', 'blur', 'mouseenter', 'mouseleave'], function(name){
    undelegatableEvents['ne-' + name] = 1;
  });
  Widget.prototype = {
    _assure: function(fn){
      if(!this.isReady){
        throw('widget is not ready');
      }
      return fn.call(this);
    },
    lazy: function(fn){
      this._lazyPromise = new Promise(fn);
    },
    load: function(file, wrap, data){
      var widget = this;
      if(wrap && isString(file)){
        if(wrap.nodeType){
          if(wrap.parentNode && !isEmptyNode(wrap)){
            throw('widget cannot be loaded on existed tree');
          }
          return load(file, wrap, widget, data);
        }else if(wrap.length){
          var widgets = [];
          forEach(wrap, function(_wrap){
            widgets.push(load(file, _wrap, widget, data));
          });
          return widgets;
        }
      }
      return null;
    },
    val: function(val){
      if(isDefined(val)){
        this.set('value', val);
      }else{
        return this.scope && this.scope.value;
      }
    },
    get: function(key){
      return this._assure(function(){
        return this.scope[key];
      });
    },
    set: function(key, val){
      var args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return this.ready(function(){
        if(isString(key)){
          this.scope[key] = val;
        }else{
          var deep = true;
          if(typeof args[0] == 'boolean'){
            deep = args.shift();
          }
          extend.apply(this, [deep, this.scope].concat(args));
        }
        this.scope.$refresh();
      });
    },
    setState: function(){
      var args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      var deep = true;
      if(typeof args[0] == 'boolean'){
        deep = args.shift();
      }
      return this.ready(function(){
        extend.apply(this, [deep, this.scope.state].concat(args));
        this.scope.$refresh();
      });
    },
    roleDelegate: function(events, fnMap){
      var widget = this;
      if(!widget.$root) return widget;
      var wrap = widget.$root[0];
      var dlgs = widget.__roleDelegate || (widget.__roleDelegate = {});
      if(!isObject(fnMap)) return widget;
      if(isString(events)){
        events = events.trim().split(EVENTSPLITER);
      }
      forEach(events, function(event){
        if(!dlgs[event]){
          dlgs[event] = [];
          var delg = function(e){
            var target = e.target, _target = target, result = true;
            //避免处理子组件
            while(_target && _target != wrap){
              if(_target.getAttribute('ne-module')){
                target = _target.parentNode;
              }
              _target = _target.parentNode;
            }
            if(_target){  //_target为空表示节点已被删除
              var evts = [];
              while(target){
                var roles = (target.getAttribute("ne-role") || '').split(/\s+/);
                forEach(dlgs[event], function(roleFn){
                  if(~roles.indexOf(roleFn.role)){
                    evts.push({
                      target: target,
                      fn: roleFn.fn
                    });
                  }
                });
                if(target == wrap) break;
                target = target.parentNode;
              }
              evts.length && widget.update(function(){
                var promise;
                for(var i = 0; i < evts.length; i ++){
                  promise = evts[i].fn.call(evts[i].target, e);
                  if(promise === false || promise === -1){
                    e.preventDefault();
                    promise === -1 && e.stopPropagation();
                    break;
                  }
                }
                return promise;
              });
              evts = null;
            }
            return result;
          };
          widget.$root.bind(event, delg);
          widget.ready(function(){
            wrap['ne-destroy'] && wrap['ne-destroy'].push(function(){ //事件销毁
              dom.unbind(wrap, event, delg);
            });
          });
        }
        forEach(fnMap, function(fn, role){
          role && dlgs[event].push({
            role: role,
            fn: fn
          });
        });
      });
      return widget;
    },
    updateRoles: function(cb){
      var widget = this;
      if(!widget.$root) return widget;
      var cbs = widget.__rolecbs || (widget.__rolecbs = []);
      if(isFunction(cb)){
        cbs.push(cb);
        return widget;
      }
      var roles = widget.__roles = {};
      var rootWrap = widget.$root[0];
      wanderDom(rootWrap, function(node){
        var value = node.getAttribute('ne-role');
        if(value){
          forEach(value.split(/\s+/), function(roleid){
            if(!roleid) return;
            if(!roles[roleid]) roles[roleid] = [];
            roles[roleid].push(node);
          });
        }
        if(node != rootWrap && isString(node.getAttribute('ne-module'))){
          return false;
        }
        return node;
      });
      for(var key in widget.roles) delete widget.roles[key];
      for(var roleid in widget.__roles){
        widget.roles[roleid] = $$(widget.__roles[roleid]);
      }
      forEach(cbs, function(cb){
        cb(widget.roles);
      });
      return widget;
    },
    compile: function(wrap, destroys){
      var widget = this, rootWrap = widget.$root && widget.$root[0];
      if(!destroys && rootWrap) destroys = rootWrap['ne-destroy'];
      wrap = wrap || rootWrap;
      if(!wrap || wrap.nodeType){
        return compile(wrap, widget, destroys);
      }else if(wrap.length){
        var widgets = [];
        forEach(wrap, function(_wrap){
          widgets = widgets.concat(compile(_wrap, widget, destroys));
        });
        return widgets;
      }else{
        return [];
      }
    },
    prepared: function(fn){ //依赖已满足，scope已初始化
      var promise = this._preparedDefer.promise;
      if(isFunction(fn)){
        promise.then(fn.bind(this));
        return this;
      }
      return promise;
    },
    replaceWith: function(moduleid, data, clear){ //销毁当前组件，并在根容器上加载新组件
      if(isString(moduleid)){
        var widget = this,
            parent = widget.parent,
            $root = widget.$root;
        widget.destroy(clear);
        load(moduleid, $root[0], parent, data);
      }
    },
    destroy: function(clear){ //销毁组件实例
      var widget = this, scope = widget.scope,
          wrap = widget.$root[0];
      destroyNode(wrap);
      if(!isDefined(clear) || clear) wrap.innerHTML = "";
      var defname = scope.$moduleid;
      spliceItem(widgetCache[defname], widget);
      spliceItem(widget.parent.children, widget);
      scope.$msg = null;
      if(isFunction(scope.destroy)) scope.destroy();
      forEach(widget.children, function(subWidget){
        subWidget.destroy(clear);
      });
      forEach(widget, function(v, k){delete widget[k]});
    },
    ready: function(fn){ //依赖已加载, init()之后执行
      var promise = this._readyDefer.promise;
      if(isFunction(fn)){
        promise.then(fn.bind(this));
        return this;
      }else{
        return promise;
      }
    },
    extend: function(){
      var widget = this, deep = true;
      var args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      if(typeof args[0] == 'boolean'){
        deep = args.shift();
      }
      forEach(args, function(arg, i){
        if(isString(arg)){
          args[i] = $$.defined(arg) || null;
        }
      });
      widget.prepared(function(){
        extend.apply(widget, [deep, widget.scope].concat(args));
        if(widget.isReady) widget.refresh();
      });
      return widget;
    },
    find: function(moduleId){
      if(!moduleId){
        var result = [];
        forEach(this.children, function(w){
          result.push(w);
          forEach(w.find(), function(_w){w.push(_w)});
        });
        return result;
      }
      return $$.widget(moduleId, this);
    },
    isChildOf: function(widget){
      var parent = this.parent;
      while(parent){
        if(parent == widget) return true;
        parent = parent.parent;
      }
      return false;
    },
    render: function(){ //wander->ne-extend->init->ready
      var widget = this, inited;
      if(!widget.$root) return;
      var wrap = widget.$root[0];
      var scope = widget.scope;
      var extendPromises = [], extendFiles = [];
      widget.children = [];
      widget.wander(); //建立model->view, control->model绑定

      var userExt = wrap.getAttribute("ne-extend") || "";
      if(!/^\s*{{(.*?)}}\s*$/.test(userExt)){
        var neExtend = userExt.split(SPLITER);
        forEach(neExtend, function(file){
          if(file){
            file = fullName(file);
            extendFiles.push(file);
            extendPromises.push(amdLoader.makeDefer(file).promise);
          }
        });
      }
      $q.all(extendPromises).then(function(){
        if(extendPromises.length){
          forEach(extendFiles, function(file){ //按顺序extend
            extend(true, scope, amdLoader.getExport(file)); //ne-extend为深度复制
          });
        }
        widget.compile(wrap); //处理子模块
        var doInit = function(){
          if(!inited) inited = true; else return;
          setTimeout(function(){
            if(!widget.scope) return; //destroyed
            if(scope.hasOwnProperty('init') && isFunction(scope.init)){
              scope.init(widget);
            }
            widget.models && widget.models.items.length && widget.views && widget.views.refresh('repeat');
            widget.refresh();
            widget._readyDefer.resolve(widget);
          });
        };
        widget.parent.ready(doInit);
        setTimeout(doInit, 1000);
      });
    },
    refresh: function(){ //widget.refresh
      this.scope && this.scope.$refresh();
      return this;
    },
    wander: function(wrap, scope, procWrapOrNot, modelScope){ //遍历子节点，与scope关联
      var widget = this;
      wrap = wrap || widget.$root;
      if(wrap && !wrap.nodeType) wrap = wrap[0];
      if(!wrap) return widget;
      var widgetWrap = widget.$root ? widget.$root[0] : wrap;
      scope = scope || widget.scope;
      var views = widget.views;
      var props = ['ne-recurse', 'ne-repeat-start', 'ne-repeat', 'ne-foreach', 'ne-options', 'ne-role', 'ne-model', 'ne-html', 'ne-text', 'ne-state-extend', 'ne-extend', 'ne-fx', 'ne-on'];//优先处理指令
      
      if(isArray(wrap['ne-destroy'])){ //销毁历史绑定
        if(wrap != widgetWrap || widget.hasOwnProperty('find')){ //已初始化
          forEach(wrap['ne-destroy'], function(fn){
            fn();
          });
          wrap['ne-destroy'].splice(0);
        }
      }else if(wrap == widgetWrap){
        wrap['ne-destroy'] = [];
      }
      var eventDelgs,
          delgWrap = wrap;
      while(delgWrap.parentNode && delgWrap != widgetWrap){
        if(delgWrap['ne-destroy']) break;
        delgWrap = delgWrap.parentNode;
      }
      var destroys = delgWrap['ne-destroy'];
      if(delgWrap == wrap){
        forEach(delgWrap['ne-delg'], function(fn){isFunction(fn) && fn();});
        eventDelgs = delgWrap['ne-delg'] = {};
      }else{ //在已wander过的父容器中做代理
        eventDelgs = delgWrap['ne-delg'] || (delgWrap['ne-delg'] = {});        
      }
      $$('script[ne-macro]', wrap).each(function(node){ //宏模板
        var tmpl = template.parse(node.innerHTML),
            value = node.getAttribute('ne-macro'),
            argNames = [];
        if(/(.*?)\s*\(\s*(.*?)\s*\)/.test(value)){
          value = RegExp.$1;
          argNames = RegExp.$2.split(/\s*,\s*/);
        }
        saveModel(scope, value, function(){
          var data = Object.create(this);
          var args = arguments.length ? slice.call(arguments, 0) : [];
          var __scopes = this.__scopes;
          forEach(argNames, function(arg, i){
            if(arg) data[arg] = isDefined(args[i]) ? args[i] : null;
          });
          var hit = false, str = tmpl(data).replace(/%(\w+)%/g, function(match, name){
            if(~argNames.indexOf(name)){
              hit = true;
              return '__scopes['+__scopes.length+'].' + name;
            }else{
              return match;
            }
          });
          if(hit) __scopes[__scopes.length] = data;
          return str;
        });
        dom.remove(node);
      });
      wanderDom(wrap, function(node){ //从上到下遍历，见ne-module即止
        var attrs = getNodeAttrs(node), procRet;
        if(isString(attrs['ne-if']) && !node['ne-ifed']){
          return _directives['ne-if'].call(widget, scope, node, attrs['ne-if'], destroys);
        }
        var proc = function(fn, value, _scope){
          var directiveResult = fn.call(widget, _scope||scope, node, value, destroys);
          if(directiveResult === false){
            return false;
          }else if(isFunction(directiveResult)){
            destroys.push(directiveResult);
          }else if(directiveResult){
            node = directiveResult;
            if(node.nodeType == 1){
              node.removeAttribute(prop);
              attrs = getNodeAttrs(node);
            }else{ //非普通节点(如空文本)
              return node;
            }
          }
        };
        for(var i = 0, len = props.length; i < len; i++){ //优先处理指令
          var prop = props[i];
          var value = attrs[prop];
          if(isString(value) && isFunction(_directives[prop])){
            procRet = proc(_directives[prop], value, prop=='ne-model'?modelScope:'');
            if(isDefined(procRet)) { //false, node..
              return procRet;
            }
          }
        }
        for(var name in attrs){
          if(_directives[name]) continue;
          var val = attrs[name], trimName = name.substr(3);
          if(undelegatableEvents[name] || $$.event(trimName)){ //不可代理事件 || 自定义事件
            if(isString(val)){
              destroys.push(bindEvent(node, trimName, val, widget, scope));
            }
          }else if(eventsMatcher.test(trimName)){ //事件代理
            if(!eventDelgs[trimName]) eventDelgs[trimName] = 1;
          }else if(/ne-(href|for|src|title|disabled|checked|selected|readOnly|required)/.test(name)){ //views属性
            name = RegExp.$1;
            if(val){
              if(/\{.+?\}/.test(val)){
                destroys.push(views.add({
                  node : node,
                  model : val,
                  attr : name,
                  scope : scope
                }, true));
              }else{
                dom.attr(node, name, val);
              }
            }
          }else if(name.substr(0,3) == 'ne-' && isFunction(views[name])){
            //ne-[class/style/show/hide/visible/hidden/value]
            procRet = views[name](node, val, scope);
            if(!$$.debug) node.removeAttribute(name);
            isFunction(procRet) && destroys.push(procRet);
          }else if(isFunction(directives[name])){ //自定义指令
            proc(directives[name], val);
          }else{
            var match = false;
            for(var reg in directiveMatches){
              if(reg.test(name)){
                match = true;
                procRet = proc(directiveMatches[reg], val);
                if(isDefined(procRet)) return procRet;
                break;
              }
            }
            if(name == 'ne-cloak'){
              node.removeAttribute(name);
            }else if(!match && !_directives[name] && name != "ne-module" && /^\{\{.+?\}\}$/.test(val)){
              destroys.push(views.add({
                node: node,
                model: val,
                attr: name,
                scope: scope
              }, true));
            }
          }
        }
        if(!isString(attrs["ne-module"]) && attrs["ne-plugin"]){
          getPluginPromise(node, attrs["ne-plugin"]);
        }
        if(isString(attrs["ne-module"])){
          if(node != widgetWrap) return false;
        }
        return node;
      }, function(node){ //textNode处理
        var text = node.nodeValue;
        if(EXPRESSER.test(text)){
          if(RegExp.$1 == '\\'){
            node.nodeValue = text.replace(/\\(\{\!?\{.*?\}\})/g, "$1");
          }else{
            destroys.push(views.add({
              node : node,
              model : text,
              scope : scope
            }, true));
          }
        }
      }, procWrapOrNot);
      forEach(widget.__roles, function(node, roleid){
        widget.roles[roleid] = $$(node);
      });

      forEach(eventDelgs, function(val, name){ //在wrap上绑定代理事件
        if(val !== 1) return;
        var delg = function(e){  //wrap.delegate
          var target = e.target, _target = target, result = true;
          //避免处理子组件或ne-repeat内节点
          while(_target && _target != delgWrap){
            if(_target['ne-destroy'] || _target['ne-delg']){
              target = _target['ne-wguid'] ? _target : _target.parentNode;
            }
            _target = _target.parentNode;
          }
          if(_target){  //_target为空表示节点已被删除
            var evts = [];
            while(target){
              var evtStr = target.getAttribute("ne-" + name);
              if(evtStr){
                evts.push({
                  target: target,
                  evt: evtStr
                });
              }
              if(target == delgWrap) break;
              target = target.parentNode;
              if(scope == widget.scope && target == delgWrap) break;
            }
            evts.length && widget.update(function(){
              scope.$event = e;
              var promise;
              for(var i = 0; i < evts.length; i ++){
                e.currentTarget = scope.$target = evts[i].target;
                promise = withFunc(evts[i].evt, scope, true);
                if(promise === false || promise === -1){
                  e.preventDefault();
                  promise === -1 && e.stopPropagation();
                  result = false;
                  return; //仍然执行$refresh()
                }
              }
            });
            evts = null;
          }
          return result; //任何一处事件指令return false均会阻止组件容器上的同类事件
        };
        dom.bind(delgWrap, name, delg);
        destroys.push((eventDelgs[name] = function(){ //事件销毁
          dom.unbind(delgWrap, name, delg);
        }));
      });
    }
  };
  forEach(['on', 'off', 'emit', 'watch', 'unwatch'], function(fname){
    Widget.prototype[fname] = function(){
      var args = slice.call(arguments);
      return this[fname != 'emit' ? 'prepared' : 'ready'](function(){
        var scope = this.scope;
        scope['$'+fname].apply(scope, args);
      });
    }
  });
  function getParams(str, obj){
    if(!isObject(obj)) obj = {};
    if(isString(str)){
      var result, _name, _tmp, key, val;
      while ((result = PROPSPLITER.exec(str)) !== null) {
        key = result[1];
        val = result[2].trim();
        if(val == 'false') val = false;
        else if(val == 'true') val = true;
        else if(FLOAT_RE.test(val)) val = parseFloat(val);
        _name = null;
        _tmp = obj;
        key.trim().replace(MODELEXPR_RE, function(all, name, quote, quotedName){
          if(_name){
            if(!_tmp[_name]) _tmp[_name] = {};
            _tmp = _tmp[_name];
          }
          _name = name || quotedName;
          return "";
        });
        _tmp[_name] = val;
      }
    }
    return obj;
  }
  function parseProps(wrap){
    return getParams(wrap.getAttribute("ne-props"));
  }
  function parseState(scope, userState){
    if(!scope.hasOwnProperty('state')) scope.state = {};
    getParams(userState, scope.state);
    return scope;
  }
  function createOptions(node, widget, arr){
    var arrNotation = isArray(arr);
    forEach(arr, function(label, value){
      if(arrNotation){
        if(isObject(label)){
          value = label.value;
          label = isDefined(label.label) ? label.label : label.value;
        }else value = label;
      }
      var opt = new Option(label, value);
      node.options.add(opt);
    });
  }
  function destroyNode(node){
    try{
      if(isFunction(node['ne-selfcide'])){
        node['ne-selfcide']();
        delete node['ne-selfcide'];
      }
      var destroys = node['ne-destroy'];
      if(destroys){
        delete node['ne-destroy'];
        forEach(destroys, function(fn){
          fn();
        });
        forEach(destroys.subnode, function(subnode){
          destroyNode(subnode);
        });
      }
    }catch(e){}
  }
  function cachableList(nodeList){
    var result = nodeList && nodeList.length;
    if(result){
      forEach(nodeList, function(node){
        if(node[dom._idname] || !node.parentNode){ //绑定过事件或已删除节点
          result = false;
        }
      });
    }
    return result;
  }
  function getRepeatNum(key, scope){
    var tmp = parseInt(key, 10);
    return isNaN(tmp) ? (parseInt(withFunc(key, scope), 10) || 0) : tmp;
  }
  function getRepeatArr(model, scope){
    var arr = model.split('..'), len = arr.length;
    if(arr.length == 1) return withFunc(model, scope);
    var start = getRepeatNum(arr[0], scope),
        end = getRepeatNum(arr[len-1], scope),
        tmp = "push",
        inc = Math.abs((len == 3) ? getRepeatNum(arr[1], scope) : 1);
    if(start > end){
      tmp = start;
      start = end;
      end = tmp;
      tmp = "unshift";
    }
    var result = [];
    for(var i = start; i <= end; i += inc){
      result[tmp](i);
    }
    return result;
  }
  var updateViews = {
    _replace: function(_nodes, htmls){ //_nodes为旧节点列表，不能为空
      var i = 0, nodes = [],
          addNodes = function(newnode){
            if(isArray(newnode)){
              nodes[i] = newnode;
            }else{
              if(!nodes[i]){
                nodes[i] = [];
              }
              nodes[i].push(newnode);
            }
          };
      var nullnode = _nodes.pop(),
          parent = nullnode.parentNode;
      var div = document.createElement("div"),
          frag = document.createDocumentFragment(),
          fragments = [frag],
          prevReserve, poles = [],
          reserveNodes = [];
      for(; i < htmls.length; i ++){
        var prevNode, reserve = isArray(htmls[i]) ? htmls[i].reserve : 0;
        if(prevReserve && reserve-prevReserve != 1){
          poles.push(prevNode);
          frag = document.createDocumentFragment(),
          fragments.push(frag);
        }
        prevReserve = reserve;
        if(isArray(htmls[i])){ //复用节点
          forEach(htmls[i], function(_node){
            if(reserve){
              if(!poles.length){
                poles.push(_node);
              }
              prevNode = _node;
            }else{
              frag.appendChild(_node);
            }
          });
          addNodes(htmls[i]);
          reserveNodes.push(htmls[i]);
        }else{
          var tmpFrag = dom.create(htmls[i], true);
          forEach(tmpFrag.childNodes, addNodes);
          frag.appendChild(tmpFrag);
        }
      }
      i--;
      forEach(_nodes, function(_list){ //销毁事件
        if(reserveNodes.indexOf(_list) != -1) return;
        forEach(_list, function(_node){
          destroyNode(_node);
          if(_node.parentNode == parent){
            parent.removeChild(_node);
          }
        });
      });
      div = _nodes = null;
      nodes.push(nullnode);
      nodes.fragments = fragments;
      nodes.poles = poles;
      return nodes;
    },
    //key in expr  => {key : expr[i]}
    //expr         => expr[i]
    repeat: function(item, widget, destroys){
      var tmpl = item.attr,
          key = item.key,
          isScript = isFunction(tmpl),
          isJoin = item.isJoin,
          scope = item.scope || widget.scope,
          model = item.model;
      var len, html, arr, htmls = [];
      var cond = isString(item.cond) ? withFunc(item.cond, scope) : true;
      scope.__scopes = [];
      if(!model){  //ne-foreach=""
        html = cond ? tmpl(scope) : '';
        if(isDefined(item._value) && html == item._value){
          return false;
        }
        item._value = html;
        htmls.push(html);
      }else{
        arr = cond ? getRepeatArr(model, scope) : [];
        if(!isArray(arr)){
          arr = arr != null ? [arr] : [];
        }
        len = arr.length;
        var hasChange = !item.repeatScopes ||
              item.repeatScopes.length != len,
            repeatNoKeys = key ? null : item.repeatNoKeys ||
              (item.repeatNoKeys = []); //无key的nodes缓存
        
        if(key && !hasChange){
          for(var i = 0; i < len; i ++){
            var _scope = item.repeatScopes[i];
            if(_scope[key] !== arr[i]){ //该项值或引用有变化
              hasChange = true;
              break;
            }
          }
          if(!isScript && !hasChange){
            return false;
          }
        }
        var _oldScopes = item.repeatScopes || [];
        item.repeatScopes = [];
        forEach(arr, function(obj, i){
          var repeatScope = Object.create(scope); //__proto指向scope
          repeatScope.__scopes = [];
          if(key){
            repeatScope[key] = obj;
            repeatScope.$recurse = {
              key: key,
              attr: tmpl,
              isJoin: isJoin
            };
          }else{
            extend(true, repeatScope, isObject(obj) ? obj : {__val : obj});
          }
          extend(repeatScope, {
            __len: len,
            __i: i
          });
          var html = isScript ? tmpl(repeatScope)
                : key ? tmpl : template.replace(tmpl, repeatScope);
          if(!_oldScopes[i] ||
             !_oldScopes[i].hasOwnProperty('b$html') ||
             html != _oldScopes[i]['b$html']){
            hasChange = true;
          }
          item.repeatScopes[i] = repeatScope;
          htmls.push(html);
        });
        if(!hasChange){ //不需要刷新
          item.repeatScopes = _oldScopes;
          if(!key){
            forEach(arr, function(obj, i){
              extend(item.repeatScopes[i], obj);
            });
          }
          return false;
        }
        var cursor = -1;
        forEach(arr, function(obj, i){
          var html = htmls[i];
          if(!isJoin){
            var cacheWithoutkey = key ? null : getRepeatCacheWithoutKey(obj, repeatNoKeys, html, item.repeatScopes);
            var _repeatScope = key ? findRepeatScope(obj, _oldScopes, key, item.repeatScopes) : cacheWithoutkey ? cacheWithoutkey.scope : null;
            var _node = key ?
                  (_repeatScope && _repeatScope.hasOwnProperty('b$node') ? _repeatScope['b$node'] : null)
                : (cacheWithoutkey ? cacheWithoutkey.node : null);
            if(_repeatScope && cachableList(_node) && html == _repeatScope['b$html']){
              if(cursor == -1 || cursor+1 <= _repeatScope.__i){
                cursor = _repeatScope.__i;
                _node.reserve = i+1;
              }else{              
                _node.reserve = false;
              }
              if(htmls.indexOf(_node) == -1){
                htmls[i] = _node;
                item.repeatScopes[i] = _repeatScope;
                if(!key){
                  extend(item.repeatScopes[i], obj);
                }
              }
            }
          }
          extend(item.repeatScopes[i], {
            __len: len,
            __i: i,
            'b$html': html
          });
        });
        _oldScopes = null;
      }
      if(isJoin){
        htmls = [htmls.join("")];
      }
      item.node = this._replace(item.node, htmls);
      if(len || !model){
        //将所生成节点与repeatScope关联
        var destroySubnode = destroys && destroys.subnode;
        destroySubnode && destroySubnode.splice(0);
        forEach(item.node, function(nodeList, i){
          if(!nodeList || !nodeList.length) return;
          widget.$refresh2 = true;
          var _scope;
          if(model && !isJoin){ //ne-foreach != "" && no join
            _scope = item.repeatScopes[i];
            if(_scope){
              //将repeatScope和node关联，绑定过事件的除外
              if(key && isArray(nodeList) && nodeList.length){
                _scope['b$node'] = nodeList; //!: nodeList.length>1时存在覆盖
              }else if(isString(htmls[i])){
                saveRepeatCacheWithoutKey(arr[i], repeatNoKeys, nodeList, _scope, htmls[i]);
              }
            }
          }

          forEach(nodeList, function(node){
            if(!node['ne-destroy']){ //初始化新生成的子孙节点
              if(node.nodeType == 3){ //repeat对象仅为textNode
                var text = node.nodeValue;
                if(EXPRESSER.test(text)){
                  node['ne-destroy'] = [widget.views.add({
                    node: node,
                    model: text,
                    scope: _scope
                  })];
                }
              }else if(node.nodeType == 1){ //仅当!!key时才绑定ne-model
                var subDestroys = node['ne-destroy'] = [];
                widget.wander(node, _scope, true, !key&&arr ? arr[i]:null);
                if(!node['ne-ifed']) widget.compile(node, subDestroys); //处理子模块
              }else{
                return;
              }
              destroySubnode && destroySubnode.push(node);
            }
          });
        });
      }
      var frags = item.node.fragments, poles = item.node.poles;
      forEach(frags, function(frag, i){
        if(frag.childNodes.length){
          dom[i==0?'before':'after'](frag, poles[i]||item.node[item.node.length-1]);
        }
      });
      item.node.frags = item.node.poles = null;
      return false;
    }
  }
  function getRepeatCacheWithoutKey(item, repeatNoKeys, html, usedScopes){
    if(isObject(item)){
      for(var i = 0; i < repeatNoKeys.length; i ++){
        if(repeatNoKeys[i].item == item && usedScopes.indexOf(repeatNoKeys[i].scope) == -1){
          if(repeatNoKeys[i].string == html){//html和数组项完全相等方可重用
            return repeatNoKeys[i];
          }else{
            repeatNoKeys.splice(i, 1);
            break;
          }
        }
      }
    }
    return null;
  }
  function saveRepeatCacheWithoutKey(item, repeatNoKeys, node, scope, html){
    if(isObject(item)){
      for(var i = 0; i < repeatNoKeys.length; i ++){
        if(repeatNoKeys.scope == scope) return;
      }
      repeatNoKeys.push({
        node: node,
        item: item,
        string: html,
        scope: scope
      });
    }
  }
  function findRepeatScope(item, scopes, key, usedScopes){
    if(isObject(item) && key){
      for(var i = 0; i < scopes.length; i ++){
        if(scopes[i][key] == item && usedScopes.indexOf(scopes[i]) == -1){
          return scopes[i];
        }
      }
    }
    return null;
  }

  function Models(widget){ //View<->ViewModel
    this.widget = widget;
    this.items = [];
    this.cursor = 0;
  }
  function updateModel(item, _value){  //从节点取值并更新到scope中
    var node = item.node,
        value = dom.val(node);
    if(!isDefined(_value)) _value = getModel(item.model, item.scope);
    if(lowercase(node.tagName) == 'input' && lowercase(node.getAttribute('type')) == 'radio'){
      if(node.checked === false) return;
    }
    if(isDefined(value)) item.inited = true;
    if(value !== _value){
      return saveModel(item.scope, item.model, value);
    }
  }
  function saveModel(scope, model, value){
    var _name = null, _tmp = scope, firstKey;
    model.replace(MODELEXPR_RE, function(all, name, quote, quotedName){
      if(_name){
        if(!_tmp[_name]) _tmp[_name] = {};
        _tmp = _tmp[_name];
      }
      _name = name || quotedName;
      if(!firstKey) firstKey = _name;
      return '';
    });
    _tmp[_name] = value;
    return firstKey;
  }
  function getModel(model, scope){
    var _name = null, _tmp = scope;
    model.replace(MODELEXPR_RE, function(all, name, quote, quotedName){
      if(_name){
        if(!_tmp[_name]) _tmp[_name] = {};
        _tmp = _tmp[_name];
      }
      _name = name || quotedName;
      return '';
    });
    return _tmp[_name];
  }
  function refreshModel(item){
    var node = item.node,
        value = getModel(item.model, item.scope),
        isRadio = lowercase(node.tagName) == 'input' && lowercase(node.getAttribute('type')) == 'radio',
        nodeVal = isRadio ? node.checked : dom.val(node);
    if(value !== nodeVal){
      if(!isDefined(value) && item.inited) value = '';
      if(isDefined(value)) isRadio ? dom.attr(node, 'checked', value === node.value) : dom.val(node, value);
      updateModel(item, value);
    }
  }
  Models.prototype = {
    add: function(node, model, scope){ //models.add
      var widget = this.widget;
      scope = scope || widget.scope;
      model = model.trim();
      var item = {
        node: node,
        scope: scope,
        model: model
      };
      this.items.push(item);
      //监听ne-model元素/组件变化
      var nodeWidget = $$.widget(node),
          wrap = widget.$root[0];
      if(nodeWidget){
        nodeWidget.watch('value', widget.update);
        wrap['ne-destroy'].push(function(){
          nodeWidget.unwatch('value', widget.update);
        });
      }else{
        var events = 'change';
        if(/input|textarea/.test(lowercase(node.tagName))){
          events += ' input';
        }
        dom.bind(node, events, widget.update);
        wrap['ne-destroy'].push(function(){
          dom.unbind(node, events, widget.update);
        });
      }
      return item;
    },
    remove: function(item){
      for(var i = 0, len = this.items.length; i < len; i ++){
        if(this.items[i] == item){
          this.items.splice(i, 1);
          break;
        }
      }
    },
    update: function(intercept, promise){ //models.update: view->data && refresh()
      var models = this,
          widget = models.widget,
          scope = widget.scope,
          affectWidget = widget; //model有改变的最高级组件
      if(scope && scope.$refreshing){
        setTimeout(function(){
          models.update(intercept, promise);
        }, 50);
        return;
      }
      forEach(models.items, function(item){
        var firstKey = updateModel(item);
        if(firstKey){
          while(affectWidget.parent && isDefined(affectWidget.scope[firstKey]) && !affectWidget.scope.hasOwnProperty(firstKey)){
            affectWidget = affectWidget.parent;
          }
        }
      });
      forEach(widget.children, function(subwidget){
        if(subwidget.update) subwidget.update(null, false);
      });
      if(isFunction(intercept)) {
        promise = intercept.apply(widget.scope);
      }
      if(promise && isFunction(promise.then)){
        promise.then(function(){
          affectWidget.refresh();
        });
      }else if(promise !== false){
        affectWidget.refresh();
      }
    },
    refresh: function(){ //models.refresh: data->view
      forEach(this.items, refreshModel);
    }
  };

  function Views(widget){ //ViewModel->View绑定
    this.widget = widget;
    this.scope = widget.scope;
    this.items = [];
  }
  Views.prototype = {
    add: function(item, instant){ //views.add
      var items = this.items;
      items.push(item);
      if(instant){
        this.refresh(item);
      }
      return function(){
        var i = items.indexOf(item);
        if(i > -1) items.splice(i, 1);
      }
    },
    'ne-show': function(node, str, scope){
      var widgetScope = this.scope,
          show = function(val){
            dom[val ? "show" : "hide"](node);
          };
      widgetScope.$watch(str, show, scope);
      return function(){
        widgetScope.$unwatch(str, show, scope);
      }
    },
    'ne-hide': function(node, str, scope){
      var widgetScope = this.scope,
          hide = function(val){
            dom[val ? "hide" : "show"](node);
          };
      widgetScope.$watch(str, hide, scope);
      return function(){
        widgetScope.$unwatch(str, hide, scope);
      }
    },
    'ne-visible': function(node, str, scope){
      var widgetScope = this.scope,
          show = function(val){
            node.style.visibility = val ? "visible" : "hidden";
          };
      widgetScope.$watch(str, show, scope, true);
      return function(){
        widgetScope.$unwatch(str, show, scope);
      }
    },
    'ne-hidden': function(node, str, scope){
      var widgetScope = this.scope,
          hide = function(val){
            node.style.visibility = val ? "hidden" : "visible";
          };
      widgetScope.$watch(str, hide, scope, true);
      return function(){
        widgetScope.$unwatch(str, hide, scope);
      }
    },
    'ne-value': function(node, str, scope){
      var widgetScope = this.scope,
          setVal = function(val){
            dom.val(node, val);
          };
      widgetScope.$watch(str, setVal, scope, true);
      return function(){
        widgetScope.$unwatch(str, setVal, scope);
      }
    },
    'ne-class': function(node, str, scope){
      var toggleCls = function(val, _val){
        classList.batch(node, val, _val);
      };
      if(isString(str) && str.trim()){
        var widgetScope = this.scope;
        var exprs = [];
        str = str.replace(/[\w\-]*\{+.+?\}+[\w\-]*/g, function(match){
          exprs.push(match);
          return '';
        });
        classList.batch(node, str);
        str = exprs.join(' ');
        if(str){
          widgetScope.$watch(str, toggleCls, scope);
          return function(){
            widgetScope.$unwatch(str, toggleCls, scope);
          };
        }
      }
    },
    'ne-style': function(node, str, scope){
      if(isString(str)){
        str = str.trim();
        if(!str) return null;
        var widgetScope = this.scope,
            setStyle = function(val, _val){
              node.style.cssText = node.style.cssText.replace(";"+_val, "") + ";" + val;
            };
        if(/\{+(.+?)\}+/.test(str)){
          widgetScope.$watch(str, setStyle, scope);
        }else{
          dom.css(node, str);
        }
      }
      return function(){
        widgetScope.$unwatch(str, setStyle, scope);
      }
    },
    refresh: function(item){ //views.refresh : text, attr, css, repeat..
      var that = this,
          widgetScope = that.scope;
      if(isString(item)){
        for(var i = 0; i < that.items.length; i ++){
          if(that.items[i].type == item) that.refresh(that.items[i]);
        }
        return;
      }else if(!item){
        for(var i = 0; i < that.items.length; i ++){
          that.refresh(that.items[i]);
        }
        return;
      }else{
        var type = item.type, node = item.node, widget = that.widget;
        if(updateViews[type]){ //template, repeat, foreach
          updateViews[type](item, widget, item.destroys);
        }else if(node && node.parentNode){
          var scope = item.scope || widgetScope;
          var value = template.replace(item.model, scope);
          if(value !== item._value){ //dirty check
            var nodeType = node.nodeType;
            if(nodeType == 3){ //text node
              node.nodeValue = value;
            }else if(nodeType == 1 && item.attr){ //html node
              if(value === item.model){
                node.removeAttribute(item.attr);
              }else{
                dom.attr(node, item.attr, value);
              }
            }
            item._value = value;
          }
        }
      }
    }
  };

  var defineQueue = [];
  $$.define = function(name, deps, fn){
    if(isString(name)){
      name = fullName(name);
    }else{
      fn = deps;
      deps = name;
      name = null;
    }
    if(!isArray(deps) || !fn){
      fn = deps;
      deps = [];
    }
    var def = {
      fn: fn,
      deps: deps
    };
    if(name){ //打包模式
      amdLoader.postDefine(name, def);
    }else{
      defineQueue.push(def);
      $$.define.amd = false;
    }
    return def;
  };
  if(!this.define) this.define = $$.define;
  var module = this.module || (this.module = {});
  var skin = this.define.skin = function(name, html){
    if(isObject(name)){
      forEach(name, function(_html, _name){skin(_name, _html)});
      return;
    }
    htmlLoader.promises[fullName(name)] = $q.ref(html);
  }

  var styleCache = {};
  var htmlLoader = { //html异步加载器
    promises: {},
    load: function(url, callback){
      var head = document.head || document.getElementsByTagName('head')[0] || document.documentElement;
      var file = url.replace(/\?.*/, '');
      var safeFile = file.replace(/^https?:\/\/.*?\//, '/'); //html只允许同域加载
      var promise = this.promises[file] || this.promises[safeFile];
      if(!promise){
        promise = this.promises[file] = ajax.get(url).then(function(res){
          var div = document.createElement("div"),
              html = res.data;
          var urlPath = url.replace(/[^\/]+$/, '');
          var urlHost = url.indexOf("//") == -1 ? '/':url.replace(/(\/\/.*?\/).*/, '$1');
          html = html.replace(/((href|ne-module|ne-extend|ne-plugin)=["'])@(\/)?/g, function(match, pre, d, slash){
            return pre + (slash ? urlHost : urlPath);
          });
          if(isString($$.debug)){
            html = html.replace(/(<link [^>]*?href=["'])\//, "$1" + $$.debug + "/");
          }
          //ie bug: 开头的style被忽视
          div.innerHTML = (msie < 9 ? '<input />' : '') + html;
          if(msie < 9) div.removeChild(div.firstChild);
          
          return new Promise(function(resolve){
            var linkCount = 0,
                linkCache = amdLoader._loadedlink;
            forEach(styleCache[file] = utils.cssQuery('link, style', div), function(node){
              if(tagLC(node) == 'link'){
                linkCount ++;
                var href = fullName(node.getAttribute('href')),
                    _resolve = function(){
                      if(--linkCount === 0) resolve(html);
                    };
                if(linkCache[href]){
                  dom.remove(node);
                  node = linkCache[href];
                  setTimeout(_resolve, 100);
                }else{
                  linkCache[href] = node;
                  node.onload = node.onreadystatechange = function(){
                    if(!node.readyState || node.readyState == 'complete'){
                      node.onload = node.onreadystatechange = null;
                      setTimeout(_resolve, 50);
                    }
                  }
                  setTimeout(function(){
                    if(node.onload) node.onload();
                  }, 2000);
                }
              }
              head.appendChild(node);
            });
            html = div.innerHTML;
            div = null;
            if(linkCount === 0) resolve(html);
          });
        });
      }
      return promise;
    }
  }
  var amdLoader = { //js加载，含module def, common def, plain js
    _fns: {},  //defid|filename : module def  {fn: fn, depInject: []} 表明依赖已满足
    _exports: {},  //defid|filename: exported object or text content
    _loadedlink: {}, //existed link nodes
    _defers: {},  //defers for modules
    _promises: {},  //promises for deps
    makeDefer: function(name, defined, notDefine){ //defined表示模块为内联定义
      var defers = amdLoader._defers;
      var tmp = name.split('@');
      name = tmp[0];
      var charset = tmp[1] || 'utf-8';
      if(defers[name]) return defers[name];
      var loader = defers[name] = $q.defer();
      var promise = loader.promise;
      if(!notDefine) promise.deploy = function(widget, parent){ //如有需要，用来实例化组件
        var args = 3 <= arguments.length ? slice.call(arguments, 2) : [];
        promise.then(function(def){
          if(isFunction(def.deploy)){
            widget = def.deploy(widget, parent, args);
          }
        });
        return widget;
      }
      if(!defined){
        var exports = amdLoader._exports;
        if(exports[name]){
          loader.resolve(exports[name]);
        }else if(name.substr(0,1) != '%'){ //%开头的组件需内联定义
          ajax.require(name, {
            charset: charset
          }).success(function(){
            amdLoader.postDefine(name, null, notDefine); //构造函数加载完成，处理依赖
          });
        }
      }
      return loader;
    },
    get: function(name){ //加载模块并实例化
      if(!name) return $q.ref();
      name = fullName(name);
      var loader = amdLoader.makeDefer(name);
      return loader.promise;
    },
    getExport: function(file){
      var exports = amdLoader._exports, fns = amdLoader._fns, type;
      file = file.replace(/(\w)\@.*/, '$1');
      if(/^(plugin)\!(.*)/.test(file)){
        type = RegExp.$1;
        file = RegExp.$2;
      }      
      var _def = fns[file];
      if(type == 'plugin'){
        return _def;
      }else if(!exports[file] && _def){
        if(isFunction(_def.fn)){
          var fnResult = _def.fn.apply((exports[file] = observableObj()), _def.depInject);
          if(isDefined(fnResult)) exports[file] = fnResult;
        }
      }
      return exports[file];
    },
    createLink: function(href){//加载样式表
      var head = document.head || document.getElementsByTagName('head')[0] || document.documentElement;
      var link = amdLoader._loadedlink[href];
      if(!link) {
        link = amdLoader._loadedlink[href] = document.createElement("link");
        link.href = href;
        link.rel = "stylesheet";
      }
      head.appendChild(link);
    },
    depPromise: function(depfile, relpath){ //加载define所需依赖
      var that = this;
      var promises = that._promises;
      var promise = $q.ref();

      if(/^text\!/.test(depfile)){
        depfile = fullName(depfile, relpath);
        var file = depfile.replace(/.*\!/, '');
        var exports = that._exports;
        if(exports[depfile]){
          return null;
        }else{
          promise = promises[depfile];
          if(!promise){
            promise = promises[depfile] = new Promise(function(resolve){
              ajax.get(file).success(function(txt){
                exports[depfile] = txt;
                resolve(txt);
              });
            });
          }
          return promise;
        }
      }else{
        var notDefine = (depfile.substr(0, 1) == '!');
        forEach(depfile.split(SPLITER), function(js){ //depfile需要同步加载
          promise = promise.then(
            function(){
              return that.makeDefer(fullName(js.replace(/.*\!/, ''), relpath), false, notDefine).promise
            });
        });
        return promise;
      }
    },
    postDefine: function(file, def, notDefine){ //define函数已执行，开始处理依赖
      $$.define.amd = true;
      var exports = amdLoader._exports;
      var defer = amdLoader.makeDefer(file, true); //不需要ajax.require
      if(defer.def && !def && !defineQueue.length) return; //异步加载packed module
      var promises = [];
      if(!notDefine){
        if(!def){
          if(module.exports) def = {fn: module.exports}, delete module.exports;
          else def = defineQueue.shift();
        }
        if(!def) throw("define not found for " + file); //error

        if(isString(def.fn)){ //def.fn为文本
          exports["text!"+file] = def.fn;
          return;
        }else if(!isFunction(def.fn)){ //def.fn为JSON对象
          exports[file] = def.fn || {};
          defer.resolve(def);
          return;
        }
        def.name = file;
        if(isArray(def.deps)) fullNames(def.deps, file);
        promises.push(require(def.deps).then(function(di){
          def.depInject = di;
          def._deps = def.deps;
          delete def.deps;
          amdLoader._fns[file] = def;
        }));
        def.deploy = function(widget, parent, args){
          (widget._lazyPromise || $q.ref()).then(function(){
            amdLoader.instantiate(def, widget, args);
          });
          return widget;
        };
      }
      $q.all(promises).then(function(){
        defer.def = def;
        defer.resolve(def, true);
      });
    },
    instantiate: function(def, widget, extendArr){ //满足依赖后，逐个实例化
      if(!widget._preparedDefer) return;
      //scope原型链继承
      var parentScope = widget.parent.scope,
          scope = widget.scope;
      var models = widget.models = new Models(widget);
      widget.update = scope.$update = models.update.bind(models);
      widget.views = new Views(widget);
      scope.$widget = widget;
      scope.$root = widget.$root;
      var wrap = widget.$root[0], prepared = function(){
        parseState(scope, wrap.getAttribute('ne-state'));
        widget._preparedDefer.resolve(widget);
      }
      widget.prepared(function(){
        var parentDestroys = widget.parent.$root && widget.parent.$root[0]['ne-destroy'];
        forEach(['ne-state-extend', 'ne-extend'], function(attr){
          var value = wrap.getAttribute(attr);
          value && _directives[attr].call(widget.parent, parentScope, wrap, value, parentDestroys);
        });
      });
      if(def){
        scope.$moduleid = def.name;
        def.fn.apply(scope, def.depInject);
        prepared();
        if(extendArr){
          if(!isArray(extendArr)){
            extendArr = [extendArr];
          }
          forEach(extendArr, function(obj){
            extend(true, scope, obj);
          });
        }
        loadHtml(def.name, widget); //htmlLoader->extendPromise
      }else{
        prepared();
      }
    }
  };
  
  var pathAlias = {}, easeFns = {linear: function(p){return p}}, bConf = {
    alias: pathAlias,
    easeFns: easeFns
  };
  easeFns['ease-out'] = easeFns.ease = function(p){return Math.sqrt(p)};
  easeFns['ease-in'] = function(p){return p*p};
  $$.conf = function(conf){
    if(isString(conf)) return bConf[conf];
    extend(true, bConf, conf);
  }
  function require(deps, fn){
    var promises = [];
    var fns = amdLoader._fns;
    if(isFunction(deps)){
      fn = deps;
      deps = [];
    }else deps = deps || [];
    for(var i = 0; i < deps.length; i ++){
      if(/\.css$/i.test(deps[i])){
        amdLoader.createLink(deps[i]);
        deps.splice(i--, 1);
      }else if(!deps[i]){
        deps.splice(i--, 1);
      }else{
        if(deps[i].substr(0,1) == '!'){
          promises.push(amdLoader.depPromise(deps[i]));
          deps.splice(i--, 1);
        }
      }
    }
    forEach(deps, function(depfile){
      if(!fns[depfile]){
        promises.push(amdLoader.depPromise(depfile));
      }
    });
    return $q.all(promises).then(function(){
      var di = [];
      if(deps){
        forEach(deps, function(depfile){
          di.push(amdLoader.getExport(depfile));
        });
      }
      if(isFunction(fn)) fn.apply(this, di);
      return di;
    });
  }
  $$.run = function(name){
    if(isArray(name)) fullNames(name);
    if(!isString(name)) return require.apply($$, arguments);
    return amdLoader.get(name).then(function(def){
      if(!def || !def.fn){
        return def;
      }else if(isFunction(def.fn)){
        var mod = observableObj(),
            fnResult = def.fn.apply(mod, def.depInject);
        return (fnResult && typeof fnResult == 'object') ? fnResult : mod;
      }else{
        return def.fn;
      }
    });
  }
  $$.defined = function(name){
    if(!isString(name)) return null;
    name = fullName(name);
    return amdLoader._fns[name] || amdLoader._exports[name];
  }
  $$.widget = function(query, parent){
    if(isString(query)){
      var firstLetter = query.substr(0, 1);
      if(firstLetter == '#'){
        if(!widgetCache[query]) widgetCache[query] = new Widget;
      }else{
        query = fullName(query);
      }
    }else if(query){ //dom node
      if(!query.getAttribute) query = query[0];
      if(!query || !query.getAttribute) return null;
      var node = query;
      query = node["ne-wguid"]; //$$d
      if(!query && isString(node.getAttribute("ne-module"))){ //容器未组件化
        var widgetId = node.getAttribute("ne-id"), nodeId = dom._nodeId(node);
        var widget = widgetCache[nodeId] = (widgetId && widgetCache['#' + widgetId]) || widgetCache[nodeId] || new Widget;
        if(widgetId){
          widgetCache['#' + widgetId] = widget;
        }
        return widget;
      }
    }
    var cache = widgetCache[query] || null, result = [];
    if(!isArray(cache)){
      return parent && cache && !cache.isChildOf(parent) ? null : cache;
    }
    forEach(cache, function(w){
      if(!parent || w.isChildOf(parent)) result.push(w);
    });
    return result;
  }

  $$.rootScope = new Scope;
  var rootWidget = $$.rootWidget = Widget.create();
  rootWidget._preparedDefer.resolve(rootWidget);
  rootWidget._readyDefer.resolve(rootWidget);
  var scripts = document.getElementsByTagName("script"), bScript = scripts[scripts.length-1],
      confFile = bScript && bScript.getAttribute("ne-conf"); //全局配置
  (window.NTES||$$).ready(function(){
    $$.run(confFile).then(function(conf){
      conf && extend(true, bConf, conf);
      compile(); //初始化组件
    });
  });

}).call(this, this.bowlder, function(expr){
  return new Function('obj', 'with(obj)return ' + expr);
});
