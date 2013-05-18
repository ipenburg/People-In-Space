(function() {

var UNDEF	= new String('undefined');
var RADIX	= new Number(10);

function prx(url) {
	if (typeof widget != UNDEF) {
		if (typeof widget.proxify != UNDEF) {
			url = widget.proxify(url);
		}
	}
	return url;
}

var PROPS = prx("http://www.xs4all.nl/~ipenburg/widgets/people-in-space/properties.xml");
var DIV				= new String('div').toString();
var TXT				= new String('text');
var HTML			= new String('html');
var BODY			= new String('body');
var CLASS_ID		= new String('PeopleInSpaceWidget');
var CONFIG			= new String('config > interval');
var REFRESH			= new String('refresh > interval');
var TEMPLATE		= new String('template > div');

Template = function(xsl) {
	this.xsl = xsl;
}

PeopleInSpace = function() {
	var self = this;

	props = {
		config: null
	};

	var remoted = {
		props:	new Number(0)
	};
	var wp = document.getElement('div.'.concat(CLASS_ID) );
	self.view = new PeopleInSpaceView(wp ? wp : document.getElement(BODY) );

	function _initialize() {

		cb_props = function(txt, xml) {
			if (!$defined(xml.getElement) ) {
				xml = new Element(DIV).set(HTML, txt);
			}
			self.config = xml;
			self.situation = new PeopleInSpaceSituation({
				url: prx(self.config.getElement('url').get(TXT) ),
				template: new Template(self.config.getElement(TEMPLATE))
			});
			self._ready = true;
			if (self._running != true) {
				self.start();
			}
			_initialize.delay(parseInt(self.config.getElement(CONFIG).get(TXT), RADIX));
		}

		cb_ajax_start = function() {
			if ($defined(self.view) ) {
				self.view.busy();
			}
		}

		cb_ajax_stop = function() {
			if ($defined(self.view) ) {
				self.view.idle();
			}
		}

		new Request({method: 'get', url: PROPS, onSuccess: cb_props}).send();

	}

	this.start = function() {
		self._startable = true;
		if (self._ready) {
			self._start();
			self._running = true;
		}
	}

	var cf_cb_situation = function() {
		return function(situation) {
			self.view.refresh(situation);
		}
	}

	var cb_tick = function() {
		self.situation.get_situation(cf_cb_situation(), cb_ajax_stop, cb_ajax_start);
		arguments.callee.delay(parseInt(self.config.getElement(REFRESH).get(TXT), RADIX));
	}

	this._start = function() {
		setTimeout(cb_tick, 0); 
	}

	this._args = arguments;

	_initialize();

}

window.addEvent('load', function() { new PeopleInSpace().start() } );

})();
