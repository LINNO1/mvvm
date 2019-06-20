//----------------------------------订阅者 收到属性变化并执行相应的函数-----------------------
// vm 为 mvvm对象 exp 为指令的内容(一般为data值) cb回调(updater中不同指令对应的操作)
	function Watcher(vm,exp,cb){
		this.init(vm,exp,cb);
	}
	Watcher.prototype={
		init: function(vm,exp,cb){
			this.vm=vm;
			this.exp=exp;
			this.cb=cb;
			this.value=this.get(); 
		},
		get: function(){
			console.log('watcher get')
			Dep.target=this; // 用来判定是否需要添加订阅者
			var value = this.vm.data[this.exp];
			Dep.target = null;
			return value;  // 即this.value<===this.vm.data[this.exp]
		},
		update: function(){
           this.run();
		},
		run: function(){
			console.log('watcher run')
			var value=this.vm.data[this.exp];
			var oldVal=this.value;
			if(value!=oldVal){
				this.value=value;
				this.cb.call(this.vm,value,oldVal); // 执行回调
			}
		}
	}