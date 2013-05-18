(function() {

var UNDEF		= new String('undefined');
var DIV			= new String('div').toString();

PeopleInSpaceSituation = function(obj) {
	var self = this;

	this.url	= new String();
	this.template = new Template();
	this.amount = new String();

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
			if (self.template.xsl) {
				xslt.importStylesheet(self.template.xsl);
			}
		}

		cb_data = function(txt, xml, amount) {
			var fragment;
			if (amount) {
				fragment = "<div class='amount'>".concat(amount, "</div><div class='location'></div>");
				fragment = new Element(DIV).set('html', fragment);
				fragment = document.createDocumentFragment().appendChild(fragment);
			}
			else if (xml && xslt) {
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

		if (self.amount) {
			cb_data(null, null, self.amount);
		}
		else {
			new Request({method: 'get', url: self.url,
				onSuccess	: cb_data,
				onComplete	: cb_complete,
				onRequest	: cb_request,
				noCache		: true
			}).send();
		}

	}
}

})();
