    //解析模板指令，将模板中的变量替换成数据，然后初始化渲染页面视图，
	//并将每个指令对应的节点绑定更新函数，添加监听数据的订阅者，一旦数据有变动，收到通知，更新视图
	function Compile(el,vm){
		this.el = this.isElementNode(el)?el:document.querySelector(el);
		this.vm = vm;
		if(this.el){
			this.fragment=this.node2Fragment(this.el);
			this.init();
			this.el.appendChild(this.fragment);
		}
	}
	Compile.prototype={
		init: function(){
			this.compileElement(this.fragment);
		},
		// 将该元素下的所有元素添加到fragment中
		node2Fragment: function(el){
            var fragment = document.createDocumentFragment(),child;
            while(child=el.firstChild){ //还是得到nodelist中的每个元素，会有#text这个元素，nodeType===3
            	//console.log('child=',child);
            	fragment.appendChild(child);
            }

            return fragment; // 里面有textNode
		},
		compileElement: function(el){
			var childNodes = el.childNodes; // 得到element元素的所有孩子节点，为niodelist类数组对象
			//该对象有iterator接口，可以用[...xx]或Array.from(xx)转为数组
			// 其实不用转也可，Nodelist本身也有foreach方法
			childNodes.forEach(node=>{ // 箭头函数不改变this的指向
				var text = node.textContent; // innerText
				var reg = /\{\{(.*)\}\}/g; // . 除去回车和换行的其他==[^\n\r] *任意个
				if(this.isElementNode(node)){ //普通元素
					this.compile(node);  //解析指令
				}else if(this.isTextNode(node)&&reg.test(text)){ //若是nodeType型元素，将{{}}过滤出来
					this.compileText(node,RegExp.$1); //与正则表达式匹配的第一个 子匹配(以括号为标志)字符串
				}
				   // 递归遍历，来进行指令解析
				if(node.childNodes&&node.childNodes.length){
					this.compileElement(node); 
				}
			});
		},
		// (node, vm, exp, dir) node为element元素 vm为mvvm对象 exp为指令的内容 dir为指令去掉v-
		// v-on:click="sayHi" exp===sayHi  dir===on:click
		compile: function(node){
			var nodeAttrs = node.attributes; // NamedNodeMap类数组，无forEach
			//// 如 <span v-text="content"></span> 中指令为 v-text
			//  v-on:click="sayHi"
            [...nodeAttrs].forEach(attr=>{
            	var attrName=attr.name; // v-text v-on:click
            	if(this.isDirective(attrName)){
            		var exp = attr.value;  // content  sayHi       
            		var dir = attrName.substring(2); //text  on
            		if(this.isEventDirective(dir)){ // 事件指令 即dir中包含on
            			compileUtil.eventHandler(node,this.vm,exp,attrName); //jdkskdk

            		}else{ //普通指令
            			compileUtil[dir]&&compileUtil[dir](node,this.vm,exp);
            		}
            	}
            })

		},
		compileText: function(node, exp) {
           compileUtil.text(node, this.vm, exp);
        },

    	isDirective: function(attr) {
        	return attr.indexOf('v-') == 0; //是否是指令
    	},

   		isEventDirective: function(dir) {
        	return dir.indexOf('on') === 0; //是否事件绑定指令
   		 },

    	isElementNode: function(node) {
       		 return node.nodeType == 1; // 元素
    	},

   		 isTextNode: function(node) {
        	return node.nodeType == 3; // nodeList中的#text
    	}
	}
 /*
在DOM中实际上有一个叫做textNode的元素，相应的还有document.createTextNode的JS方法，
而在IE和Chrome浏览器中会将源代码中的  换行符  渲染成一个textNode，只是视觉上不可见。
然而，通过childNodes来获取子元素的时候，结果会包含这些textNode，所以会得到题主所见的情况。
而解决方法很简单，主要有两种：
第一，使用children代替childNodes
第二，遍历childNodes，根据nodeType(===3)过滤掉textNode
 */


 var compileUtil = {
 	 _getVMVal: function(vm, exp) {
        var val;
        exp = exp.split('.');
        exp.forEach(function(k) {
            val = vm._data[k];
        });
        return val;
    },

    _setVMVal: function(vm, exp, value) {
        var val = vm._data;
        exp = exp.split('.');
        exp.forEach(function(k, i) {
            // 非最后一个key，更新val的值
            if (i < exp.length - 1) {
                val = val[k];
            } else {
                val[k] = value;
            }
        });
    },
    // 两种情况，1 v-bind   2 其他指令
    // 情况1： v-bind:class='[xxx]' xxx在data中定义  v-bind:class='xxx' 'xxx'即类名 v-bind:class='{xxx: y(boolean)}'
    // dir=bind:class
    // 情况2： 比如 v-text  dir='text'  exp 为data
    //--------------将每个指令对应的节点绑定更新函数，添加监听数据的订阅者--------------------------
    bind: function(node,vm,exp,dir){
 		var updaterFn = updater[dir+'Updater'];
 		updaterFn && updaterFn(node,this._getVMVal(vm,exp)); 
 		new Watcher(vm,exp,function(value,oldval){
 			updaterFn && updaterFn(node,value,oldval);
 		})
 	},
    // 普通指令 v-text v-html v-model
    // 调用this.bind this.bind 中有watch 作为 observer和compile的桥梁，进行双向数据绑定
    text: function(node, vm, exp) {
        this.bind(node, vm, exp, 'text'); 
    },

    html: function(node, vm, exp) {
        this.bind(node, vm, exp, 'html');
    },

    model: function(node, vm, exp) {
        this.bind(node, vm, exp, 'model');

        var me = this,
            val = this._getVMVal(vm, exp);
        node.addEventListener('input', function(e) {
            var newValue = e.target.value;
            if (val === newValue) {
                return;
            }

            me._setVMVal(vm, exp, newValue);
            val = newValue;
        });
    },

    class: function(node, vm, exp) {
        this.bind(node, vm, exp, 'class');
    }, 

    // 事件处理指令 v-on
    eventHandler: function(node, vm, exp, attrName) {
        var eventType = attrName.split(':')[1], // v-on:click  取出 click
            fn = vm.methods && vm.methods[exp]; // exp = sayHi

        if (eventType && fn) {
            node.addEventListener(eventType, fn.bind(vm), false);
            
        }
    }
 }



//更新指令的具体操作
 var updater = {
 	// node 为element元素，value为元素的值
 	// v-text
    textUpdater: function(node, value) {
        node.textContent = typeof value == 'undefined' ? '' : value;
    },
    // v-html
    htmlUpdater: function(node, value) {
        node.innerHTML = typeof value == 'undefined' ? '' : value;
    },
  
    classUpdater: function(node, value, oldValue) {
        var className = node.className;
        className = className.replace(oldValue, '').replace(/\s$/, '');

        var space = className && String(value) ? ' ' : '';

        node.className = className + space + value;
    },
  //v-model 主要针对input标签
    modelUpdater: function(node, value, oldValue) {
        node.value = typeof value == 'undefined' ? '' : value;
    }
};