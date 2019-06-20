function MVVM(options) {
    this.$options = options;
    Object.keys(options).forEach(key=>{
    	this[key]=options[key];
    })
    var data = this._data = this.$options.data;
    observer(data, this);
    this.$compile = new Compile(options.el || document.body, this)
}