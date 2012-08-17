/* $Id: model.js 409 2011-01-07 08:05:15Z roland $
 * $Revision: 409 $
 * $HeadURL: svn+ssh://ipenburg.xs4all.nl/srv/svnroot/claudine/trunk/widget/scripts/model.js $
 * $Date: 2011-01-07 09:05:15 +0100 (Fri, 07 Jan 2011) $
 */

(function() {

var UNDEF		= new String('undefined');
var DIV			= new String('div').toString();

PeopleInSpaceSituation = function(obj) {
	var self = this;

	this.url	= new String();
	this.template = new Template();

	for (var p in obj) {
		if (typeof this[p] != UNDEF) {
			this[p] = obj[p];
		}
	}

	this.get_situation = function(cb, cb_complete, cb_request) {
		
		var OPERA_WIN = new RegExp(/Opera.*Windows/).test(navigator.userAgent);

		var fresh = new Array();
		var xslt;

		if (typeof XSLTProcessor != UNDEF && !OPERA_WIN) {
			xslt = new XSLTProcessor();
			xslt.importStylesheet(self.template.xsl);
		}

		cb_data = function(txt, xml) {
			var fragment;
			if (xml && xslt) {
				fragment = xslt.transformToFragment(xml, document);
			}
			else {
				var re = new RegExp("(\\w|\\W)*<item><title>((\\w|\\W)*)<\/title><description>((\\w|\\W)*)<\/description>(\\w|\\W)*", "gim")
				fragment = txt.replace(re, "<div class='amount'>$2</div><div class='location'>$4</div>");
				fragment = new Element(DIV).set('html', fragment);
				fragment = document.createDocumentFragment().appendChild(fragment);
			}
			if (fragment) {
				if (fragment.childNodes[0].childNodes[0]) {
					if (fragment.childNodes[0].childNodes[0].childNodes[0]) {
						var div = new Element(DIV);
						while (record = fragment.childNodes[0].childNodes[0]) {
							new Element(DIV, {
								text: new Number(record.childNodes[0].nodeValue)
							}).inject(div);
							record.parentElement.removeChild(record);
						}
						fragment = div;
					}
				}
			}
			if (fragment) {
				cb(fragment);
			}
		}

		new Request({method: 'get', url: self.url,
			onSuccess	: cb_data,
			onComplete	: cb_complete,
			onRequest	: cb_request,
			noCache		: true
		}).send();

	}
}

})();
