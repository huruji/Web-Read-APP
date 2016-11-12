/**
 * 
 * @authors huruji (594613537@qq.com)
 * @date    2016-11-13 01:33:25
 * @version $Id$
 */

(function(){
				var Util = (function(){
					var prefix = "html_reader_"
					var StorageGetter = function(key){
						return localStorage.getItem( prefix + key );
					}
					var StorageSetter = function(key, val) {
						return localStorage.setItem( prefix + key, val);
					}
					var getBSONP = function(url,callback){
						return $.jsonp({
							url:url,
							cache:true,
							callback:"duokan_fiction_chapter",
							success : function(result) {
								
								var data = $.base64.decode(result)
								
								var json = decodeURIComponent(escape(data));
								
								callback(json);
							}
						})
					}
					return {
						StorageGetter: StorageGetter,
						StorageSetter: StorageSetter,
						getBSONP:getBSONP
					}
				})();

				var Dom = {
					top_nav: $("#top-nav"),
					bottom_nav: $(".bottom_nav"),
					font_container:$(".font-container"),
					font_button:$("#font-button"),
					bk_container:$(".bk-container"),
					body:$("body")
				}

				var Win = $(window);
				var Doc = $(document);
				var RootContainer = $("#fiction_container");
				var initFontSize = parseInt(Util.StorageGetter("font_size")) || 14;
				RootContainer.css("font-size",initFontSize)
				var backgroundColor = Util.StorageGetter("background_color") || "#E9DFC6";
				Dom.body.css("background-color",backgroundColor);
				var bkCurrentIndex = Util.StorageGetter("bk_current_index");
				Dom.bk_container.eq(bkCurrentIndex-1).find("div").addClass("bk-container-current");
				var readerModel;
				var readerUI;
				function main() {
					//todo 整个项目的入口函数
					readerModel = ReaderModel();
					readerUI= ReaderBaseFrame(RootContainer);
					readerModel.init(function(data){
						readerUI(data);
					});
					EventHanlder();
				}

				function ReaderModel() {
					//todo 实现和阅读器相关的数据交互的方法
					var Charter_id;
					var chapterTotal;
                    var curChapterID;

					var init = function(UIcallback) {
						getFictionInfo(function() {
							console.log("Util.StorageGetter(last_chapter_id)"+Util.StorageGetter("last_chapter_id"));
							Chapter_id = Util.StorageGetter("last_chapter_id") ? Util.StorageGetter("last_chapter_id") : Chapter_id;
							getCurChapterContent(Chapter_id, function(data) {
								UIcallback && UIcallback(data);
							})
						})
					}

					var getFictionInfo = function(callback){
						$.get("/data/chapter.json",function(data) {
							//todo 获得章节信息之后的回调
							Chapter_id = parseInt(data.chapters[1].chapter_id);
							curChapterID = parseInt(data.chapters[1].chapter_id);
							chapterTotal = data.chapters.length;
							callback && callback();
						},"json");
					}
					var getCurChapterContent = function(chapter_id,callback) {
						$.get("/data/data" + chapter_id + ".json",function(data) {
							if(data.result == 0) {
								var url = data.jsonp;
								Util.getBSONP(url, function(data) {
									callback && callback(data);
								})
							}
						},"json");
					}

					var prevChapter = function(UIcallback) {
						curChapterID = parseInt(curChapterID, 10);
						console.log(curChapterID)
						if(curChapterID == 0) {
							return;
						}
						curChapterID = curChapterID - 1;
						getCurChapterContent(curChapterID, UIcallback);
						Util.StorageSetter("last_chapter_id",curChapterID);
					}

					var nextChapter = function(UIcallback) {
						console.log(typeof curChapterID);
						curChapterID = parseInt(curChapterID, 10);
						console.log("Charter_id"+parseInt(curChapterID, 10))
						if(curChapterID == chapterTotal) {
							return;
						}
						console.log("chapterTotal:"+chapterTotal);
						curChapterID = curChapterID + 1;
						getCurChapterContent(curChapterID, UIcallback);
						Util.StorageSetter("last_chapter_id",curChapterID);
						console.log("Util.StorageGetter(last_chapter_id)"+Util.StorageGetter("last_chapter_id"));
					}

					return {
						init: init,
						prevChapter: prevChapter,
						nextChapter: nextChapter 
					}
				}

				function ReaderBaseFrame( container) {
					//todo 渲染基本的UI结构
					function parseChapterData(jsonData) {
						var jsonObj = JSON.parse(jsonData);
						var html = "<h4>" + jsonObj.t + "</h4>";
						jsonObj.p.forEach(function(e){
							html += "<p>" + e + "</p>";
						});
						return html;
					}
					return function(data) {
						container.html(parseChapterData(data));
					}

				}

				function EventHanlder() {
					//todo 交互的时间绑定
					$("#action_mid").click(function() {
						if(Dom.top_nav.css('display') == 'none') {
							Dom.bottom_nav.show();
							Dom.top_nav.show();
						} else {
							Dom.bottom_nav.hide();
							Dom.top_nav.hide();
							Dom.font_container.hide();
							Dom.font_button.removeClass("current");
						}
					})

					Win.scroll(function(){
						Dom.bottom_nav.hide();
						Dom.top_nav.hide();
						Dom.font_container.hide();
						Dom.font_button.removeClass("current");
					})

					Dom.font_button.click(function(){
						if( Dom.font_container.css("display") == "none") {
							Dom.font_container.show();
							$(this).addClass("current");
						} else{
							Dom.font_container.hide();
							$(this).removeClass("current");
						}
					})

					$("#night-button").click(function(){
						//todo 触发背景切换的事件
						if( Dom.bk_container.eq(-1).find("div").hasClass("bk-container-current") ) {
							Dom.bk_container.eq(0).trigger("click");
							$(this).find("#night_icon").css("display","none");
							$(this).find("#day_icon").css("display","block")
						} else {
							Dom.bk_container.eq(-1).trigger("click");
							$(this).find("#night_icon").css("display","block");
							$(this).find("#day_icon").css("display","none")
						}
					})
					
					$("#large-font").click(function(){
						if(initFontSize > 20){
							return;
						}
						initFontSize+=1;
						RootContainer.css("font-size",initFontSize);
						Util.StorageSetter("font_size",initFontSize);
					})

					$("#small-font").click(function(){
						if(initFontSize < 12){
							return;
						}
						initFontSize-=1;
						RootContainer.css("font-size",initFontSize);
					})

					Dom.bk_container.click(function(){
						var currentIndex = $(this).index();
						var bk_content = $(this).find("div");
						var bkColor = $(this).css("background-color");
						if( bk_content.hasClass( "bk-container-current")) {
							return;
						}
						Dom.bk_container.each(function(){
							$(this).find("div").removeClass("bk-container-current");
						})
						bk_content.addClass("bk-container-current");
						Dom.body.css("background-color",bkColor);
						Util.StorageSetter("background_color",bkColor);
						Util.StorageSetter("bk_current_index",currentIndex);
					})

					$("#prev_button").click( function() {
						//todo 获得章节的翻页数据 -> 拿出数据渲染
						readerModel.prevChapter(function(data){
							readerUI(data);
							Win.scrollTop(0);
						})
					})

					$("#next_button").click( function() {
						//todo 获得章节的翻页数据 -> 拿出数据渲染
						readerModel.nextChapter(function(data) {
							readerUI(data);
							Win.scrollTop(0);
						})
					})
				}

				main();
			})()