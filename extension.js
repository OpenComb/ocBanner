exports.onload = function()
{
	// control panel menu items
	helper.template("ocframework/templates/ControlPanel.html",this.hold(function(err,tpl){

		if(err) throw err ;

		tpl.$("#sidemenu").prepend(
			'<li id="sidemenu-item-user">'
				+ '<h3>Banner</h3>'
				+ '<ul class="toggle">'
				+ '<li><i class="icon-group"></i> <a class="stay" href="/ocbanner/Banner">新建Banner</a></li>'
				+ '<li><i class="icon-group"></i> <a class="stay" href="/ocbanner/Banner:list">Banner 管理</a></li>'
				+ '</ul>'
				+ '</li>'
		) ;

		tpl.compile() ;
	})) ;
}
