// --------------来实现数据劫持--------------------------------------
	function observer(data){
		if(!data||typeof data !=='object'){
			return; 
		}
		Object.keys(data).forEach((key)=>{
			defineReactive(data,key,data[key]);
		})

	} //缺点：新加的属性没有set 和get方法
	function defineReactive(data,key,value){
		//observer(data);
		var dep=new Dep(); // 每个数据的每个属性都有一个dep
		Object.defineProperty(data,key,{
			enumerable: true,
			configurable: false,
			get: function(){
				console.log('get ',value);
				if(Dep.target){
					dep.addSub(Dep.target); // Dep.target为watcher的实例化对象
					console.log('dep=',dep.subs)
				}
				return value;
			},
			set: function(newVal){			
				if(newVal===value) return;
				console.log('set');
				value=newVal;
				dep.notify(); // 当数据变化时通知订阅者ss
			}
		})

	}
	Dep.target=null;
	function Dep(){
		this.subs=[];
	}
	Dep.prototype={
		addSub: function(s){
			this.subs.push(s);
		},
		notify: function(){
			this.subs.forEach(function(s){
				s.update();
			})
		}
	}