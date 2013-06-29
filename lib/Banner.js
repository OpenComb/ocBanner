module.exports = {

	layout: "controlpanel"
	, view: "ocbanner/templates/BannerForm.html"
	, process: function(seed,nut)
	{
		nut.model._id = seed._id||'' ;

		this.former().load(function(err,doc){

			if(doc)
			{
				var arrayvals = ["banner-id","banner-prior","banner-date-start","banner-date-end"] ;
				for(var i=0;i<arrayvals.length;i++)
				{
					helper._.isArray(doc[arrayvals[i]]) || (doc[arrayvals[i]]=[doc[arrayvals[i]]]) ;
					nut.model[arrayvals[i]] = doc[arrayvals[i]] ;
					delete(doc[arrayvals[i]]) ;
				}

				nut.model.imagefile = doc.imagefile ;
				nut.model.id = doc.id ;
				nut.model.type = doc.type ;

				console.log(nut.model) ;
			}
			else
			{
				nut.model["banner-id"] = [""] ;
				nut.model["banner-prior"] = ["1"] ;
				nut.model["banner-date-start"] = [""] ;
				nut.model["banner-date-end"] = [""] ;
				nut.model["type"] = "pic" ;
			}
		}) ;
	}

	, viewIn: function(){

		require("ocframework/public/lib/3party/bootstrap-datepicker/js/bootstrap-datepicker.js") ;
		require("ocframework/public/lib/3party/bootstrap-datepicker/js/locales/bootstrap-datepicker.zh-CN.js") ;

		$(".banner-type a").click(function(){
			var type = $(this).parents("li.banner-type").attr("banner-type") ;
			var selector = ".for-"+type ;
			$(".control-group").hide() ;
			$(selector).show() ;

			$("[name=type]").val(type) ;
		}) ;

		$(".banner-type").filter(".active").find("a").click() ;

		$(".btnAddBanner").click(function(){
			$(".banner-item-template .banner-item")
				.clone(true)
				.appendTo(".banners")
				.append(this)
				.find('[name=banner-date-start],[name=banner-date-end]')
					.datepicker({
						format: 'yyyy-mm-dd'
					});
		}) ;
		$(".btnDelBanner").click(function(){
			$(".btnAddBanner").appendTo($(".banner-item-template")) ;
			$(this).parents(".banner-item").remove() ;
			$(".banners .banner-item").last().append($(".btnAddBanner")) ;
		}) ;

		$(".banners .banner-item").last().append($(".btnAddBanner")) ;

		// date picker
		$('.controls [name=banner-date-start],.controls [name=banner-date-end]').datepicker({
			format: 'yyyy-mm-dd'
		});
	}

	, actions: {

		list: {
			view: "ocbanner/templates/BannerList.html"
			, process: function(seed,nut)
			{
				nut.model.host = this.req.headers.host ;

				helper.db.coll("banners").find().page(10,seed.page||1,this.hold(function(err,page){
					if(err) throw err ;
					nut.model.page = page ;
				})) ;
			}

			, viewIn: function()
			{
				var $deletingItem ;
				$(".delete-banner").click(function(){
					$deletingItem = $(this).parents('.banner-item') ;
					$(".deleteConfirm").modal() ;
				})
				$(".btnConfirmDelete").click(function(){
					if(!$deletingItem)
						return ;
					$.action("/ocbanner/Banner:del",{_id:$deletingItem.attr("_id")},function(err,nut){
						if(nut.model.delbannerid)
						{
							$("[_id="+nut.model.delbannerid+"]").hide(300) ;
						}
						nut.msgqueue.popup() ;
					}) ;
				})
			}
		}

		, save: {
			process: function(seed,nut)
			{
				nut.view.disable() ;
				this.former().save() ;
			}
		}

		, del: {
			process: function(seed,nut)
			{
				nut.view.disable() ;
				this.former().remove(function(err,doc){
					nut.model.delbannerid = doc._id ;
				}) ;
			}
		}

		, display: {
			layout: null
			, view: "ocbanner/templates/BannerDisplay.html"
			, process: function(seed,nut){
				nut.view.disable() ;
				if(!seed.id)
				{
					nut.message("missing arg id",null,"error") ;
					return ;
				}

				helper.db.coll("banners").findOne({id:parseInt(seed.id)},this.hold(function(err,doc){
					if(err)
					{
						nut.message("sever error",null,"error") ;
						helper.log.error(err) ;
						return ;
					}
					if(!doc)
					{
						nut.message("banner id not exists",null,"error") ;
						return ;
					}

					if(doc.type=='turning')
					{
						var bannerBox = [] ;
						var maxnum = 0 ;

						var arrayvals = ["banner-id","banner-prior","banner-date-start","banner-date-end"] ;
						for(var i=0;i<arrayvals.length;i++)
						{
							helper._.isArray(doc[arrayvals[i]]) || (doc[arrayvals[i]]=[doc[arrayvals[i]]]) ;
						}

						var now = new Date() ;
						this.each(doc["banner-id"],function(idx,id){

							var dateStart = doc["banner-date-start"][idx]? new Date(doc["banner-date-start"][idx]): null ;
							var dateEnd = doc["banner-date-end"][idx]? new Date(doc["banner-date-end"][idx]): null ;
							if( dateStart && dateStart>now )
								return ;
							if( dateEnd && dateEnd<now )
								return ;

							helper.db.coll("banners").findOne({id:parseInt(id)},this.hold(function(err,itemdoc){
								if(!itemdoc || itemdoc.type!='pic')
								{
									return ;
								}
								itemdoc.prior = parseInt(doc["banner-prior"][idx]) ;
								itemdoc["prior-region"] = [maxnum,maxnum+=itemdoc.prior] ;
								bannerBox.push(itemdoc) ;
							})) ;
						}) ;

						this.step(function(){
							var num = Math.random() * maxnum ;
							for(var i=0;i<bannerBox.length;i++)
							{
								if( num>=bannerBox[i]["prior-region"][0] && num<bannerBox[i]["prior-region"][1] )
								{
									nut.model.doc = bannerBox[i] ;
									return ;
								}
							}
						}) ;
					}
					else if (doc.type=='pic')
					{
						nut.model.doc = doc ;
					}
				})) ;

				this.step(function(){
					if( nut.model.doc )
					{
						nut.view.enable() ;
						//console.log(nut.model.doc) ;
						if( !nut.model.doc.imageurl && nut.model.doc.imagefile )
						{
							nut.model.doc.imageurl = "/" + nut.model.doc.imagefile ;
						}
					}
				}) ;
			}
		}

	}
}

module.exports.__as_controller=true ;