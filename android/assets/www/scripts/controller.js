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

var PROPS = prx("http://ipenburg.home.xs4all.nl/widgets/people-in-space/properties.xml");
var DIV				= new String('div').toString();
var TXT				= new String('text');
var HTML			= new String('html');
var BODY			= new String('body');
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
	self.view = new PeopleInSpaceView(document.getElement(BODY));

	function _initialize() {

		cb_props = function(txt, xml) {
			if (!$defined(xml.getElement) ) {
				xml = new Element(DIV).set(HTML, txt);
			}
			self.config = xml;
			self.situation = new PeopleInSpaceSituation({
				url: prx(self.config.getElement('url').textContent ),
				template: new Template(self.config.getElement(TEMPLATE))
			});
			self._ready = true;
			if (self._running != true) {
				self.start();
			}
			_initialize.delay(parseInt(self.config.getElement(CONFIG).textContent, RADIX));
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
		arguments.callee.delay(parseInt(self.config.getElement(REFRESH).textContent, RADIX));
	}

	this._start = function() {
		setTimeout(cb_tick, 0); 
	}

	this._args = arguments;

	_initialize();

}

window.addEvent('load', function() { new PeopleInSpace().start() } );

})();
