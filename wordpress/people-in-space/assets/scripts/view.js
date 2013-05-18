(function() {

var UNDEF				= new String('undefined');
var EMPTY				= new String('');
var TXT					= new String('text');
var AMOUNT				= new String('amount');
var LIMIT				= new Number(16);
var STRINGS				= new String('.lproj/scripts/strings.js');
var DASHBOARDCLIENT		=
	typeof widget != UNDEF && /AppleWebKit\//.test(navigator.userAgent);

new Element('script', {
	src: navigator.language.concat(STRINGS).replace(
		DASHBOARDCLIENT ? /.*?\// : /.*?-/, EMPTY
	),
	charset: 'utf-8'
}).inject(document.getElement('head'));

function loc(key) {
	try {
		var ret = localizedStrings[key];
		if (ret === undefined) ret = key;
		return ret;
	}
	catch (ex) {}
	return key;
}

var SPACE				= new String(' ');

var SPINNER_RATE		= new Number(1000 / 24);

var STYLE_PATH			= new String('style/');
var DASHBOARD_STYLE		= new String('dashboard.css');
var OPERA_STYLE			= new String('opera.css');

PeopleInSpaceView = function(obj) {
	var self = this;

	var APP_LABEL			= new String("How Many People Are In Space Right Now?");
	var DONE_BUTTON			= new String("Done");
	var COPYRIGHT			= new String("Copyright");
	var APP_ATTRIBUTION		= new String(
		loc('Widget').concat(
		' CC-BY-SA <a href="http://www.xs4all.nl/~ipenburg/" onclick="widget.openURL(this.href); return false;">Roland&nbsp;van&nbsp;Ipenburg &lt;ipenburg@xs4all.nl&gt;</a>'
	));
	var DATA_ATTRIBUTION	= new String(
		new String(loc('Concept &amp; data by')).concat(
		' <a href="http://bradeshbach.com" onclick="widget.openURL(this.href); return false;">Brad&nbsp;Eshbach</a>'
	));
	var IMAGE_ATTRIBUTION	= new String(
		new String(loc('Images by')).concat(
		' <a href="http://grin.hq.nasa.gov/ABSTRACTS/GPN-2000-001087.html" onclick="widget.openURL(this.href); return false;">Great&nbsp;Images&nbsp;in&nbsp;NASA</a>'
	));

	var OPERA				= new RegExp(/Opera/);
	var DOT					= new String('.');
	var UNDERSCORE			= new String('_');
	var SLASH				= new String('/');
	var GT					= new String('>');
	var PX					= new String('px');
	var ZERO_PX				= new String('0').concat(PX);
	var ZERO_PERCENT		= new String('0').concat('%');
	var RADIX				= new Number(10);
	var DELAY				= new Number(300);
	var BGPOS				= new String('background-position');
	var DIV					= new String('div').toString();
	var HANDHELD			= new String('handheld');

	var MODE				= new String('mode');
	var INFO				= new String('info');
	var INFO_TEMP			= new String(INFO.concat(UNDERSCORE, 'temp'));
	var DONE				= new String('done');
	var FRONT				= new String('front');
	var BACK				= new String('back');
	var FLIPPER				= new String('flipper');
	var SPINNER				= new String('spinner');
	var PIPE				= new String('pipe');
	var VISUAL				= new String('visual');
	var LABEL				= new String('label');
	var INITIAL				= new String('initial');
	var LISTENING			= new String('listening');
	var LENGTH				= new String('length');

	var SPINNER_CHILDREN 	= DOT.concat(SPINNER, SPACE, GT, SPACE, DIV);

	this.props = {
		label			: new String(APP_LABEL),
		container		: new Element(DIV)
	};

	this.props.container = obj;

	var busy_level = 0;
	this.busy = function() {
		self._spinterval = setInterval(cf_spinner(self), SPINNER_RATE); 
		busy_level++;
		busy_level = Math.max(busy_level, 1);
		if (self.props.container.getElement(SPINNER_CHILDREN)) {
			self.props.container.getElement(SPINNER_CHILDREN).setStyle(
				'display', 'block'
			); 
		}
	}

	this.idle = function() {
		busy_level--;
		if (busy_level < 1) {
			if (self.props.container.getElement(SPINNER_CHILDREN)) {
				self.props.container.getElement(SPINNER_CHILDREN).setStyle(
					'display', 'none'
				); 
			}
			clearInterval(self._spinterval);
		}
	}

	function insert_css(file) {
    	new Element('link', {
			'type'	: 'text/css',
			'rel'	: 'stylesheet',
			'href'	: file
		}).inject(document.getElement('head'));
	}

	this.refresh = function(situation) {
		self.props.container.getElement(DOT.concat(PIPE)).empty();
		situation.inject(self.props.container.getElement(DOT.concat(PIPE)));
	}

	function transform_amount() {
		if (self.props.container.getElement(
			DOT.concat(PIPE)).getElement(DIV).childNodes.length == 0
		) {
			return;
		}
		var amount = new Number(self.props.container.getElement(
			DOT.concat(PIPE)).getElement(DIV).getElement(DIV).get(TXT));
		var current = self.props.container.getElement(
			DOT.concat(INFO)).getElements(DIV).length;
		for (var i = 0; i <= LIMIT; i++) {
			// Non-existing to be filled slot:
			var mutate = function() {};
			if (i <= amount && i > current) {
				mutate = function() {
					new Element(DIV).inject(self.props.container.getElement(DOT.concat(INFO)));
				}
			}
			// Existing redundant slot:
			else if (i > amount && i <= current) {
				mutate = function() {
					self.props.container.getElement(DOT.concat(INFO)).getElement(DIV).destroy();
				}
			}
			mutate.delay(DELAY * i);
		}
	}

	var add_spinner = function() {
		var spinner = self.props.container.getElement(SPINNER_CHILDREN); 
		if (spinner == null) {
			spinner = new Element(DIV).inject(
				self.props.container.getElement(DOT.concat(SPINNER))
			);
		}
	}

	var cf_spinner = function(view) {
		var spinner = view.props.container.getElement(SPINNER_CHILDREN); 
		var pos_x = 0;
		if (spinner.getStyle(BGPOS)) {
			pos_x = spinner.getStyle(BGPOS).split(SPACE, 2)[0];
			if (isNaN(pos_x)) {
				pos_x = 0;
			}
		}
		var frame_height = parseInt(spinner.getStyle('height'), RADIX);

		return function() {
			var pos_y = parseInt(
				spinner.getStyle(BGPOS).split(SPACE, 2)[1],
				RADIX
			) - frame_height;
			if (isNaN(pos_y)) {
				pos_y = 0;
			}
			spinner.setStyle(BGPOS, EMPTY.concat(pos_x, PX, SPACE, pos_y, PX));
		}

	}

	var switchmode = function(event) {
    	self.props.container.getElement(
			DOT.concat(MODE)
		).removeClass().addClass(MODE.concat(SPACE, event.widgetMode));
	}

	var fullscreen = function() {
		if (!DASHBOARDCLIENT && testMediaQuery(HANDHELD) ) {
			var width = Math.max( MIN_WIDTH, screen.availWidth );
			var height = Math.max( MIN_HEIGHT, screen.availHeight );
			window.resizeTo(width, height);
		}
	}

	var varnish = function(event) {
		if (event.relatedNode.className == PIPE) {
			transform_amount();
		}
		if (event.relatedNode.className.indexOf(INFO) == 0) {
			var deleted = event.type == 'DOMNodeRemoved' ? 1 : 0;
			event.relatedNode.set(
				'class',
				event.relatedNode.get('class').replace(
					/amount\d*/, AMOUNT.concat(
						(event.relatedNode.getChildren().length - deleted)
					)
				)
			);
		}
	}

	var paint = function() {
		self.props.container.empty();
		new Element(DIV, {
			'class'	: MODE,
			'html'	: EMPTY.concat(
				'<div class="', FRONT, '">',
					'<div class="', INFO, SPACE, AMOUNT, '"></div>',
					'<div class="', VISUAL, '"></div>',
					'<a class="', FLIPPER, '"></a>',
				'</div>',
				'<div class="', BACK, '"></div>',
				'<div class="', PIPE, '"></div>',
				($$('.cappalmasshared').length == 0 )
					? EMPTY.concat('<div class="cappalmasshared">',
						'<div class="', SPINNER, '"></div></div>'
					)
					: EMPTY
			)
		}).injectInside(self.props.container);
		add_spinner();
		if (DASHBOARDCLIENT) {
			flipper = new AppleInfoButton(
				document.getElement(DOT.concat(FLIPPER)),
				document.getElement(DOT.concat(FRONT)),
				'white', 'white',
				show_back
			);
		}
		else {
			self.props.container.getElement(
				DOT.concat(FLIPPER)).addEvent('click', show_back);
		}
	}

	var paint_back = function() {
		var label = self.props.label;
		var intf = EMPTY.concat('<h1>', label, '</h1>', '<ul>');
		new Array(APP_ATTRIBUTION, DATA_ATTRIBUTION, IMAGE_ATTRIBUTION).each(
			function(item) {
				intf = intf.concat('<li>', item, '</li>')
			}
		);
		intf = intf.concat('</ul></div></div><a class="', DONE, '"></a>');
		new Element(DIV).set('html', intf).injectInside(
			self.props.container.getElement(DOT.concat(BACK))
		);
		if (DASHBOARDCLIENT) {
			glassButton = new AppleGlassButton(
				document.getElement(DOT.concat(DONE)), loc(DONE_BUTTON), show_front
			);
		}
		else {
			self.props.container.getElement(DOT.concat(DONE)).addEvent(
				'click', show_front
			);
		}
	}

	var show_back = function() {
		var FADE_TIME	= new Number(3000);
		var FADE_DELAY	= new Number(1000);
		if (window.widget && widget.prepareForTransition) {
			widget.prepareForTransition("ToBack");
		}
		if (typeof transFader != UNDEF) {
			transFader.pause();
		}
		paint_back();
		document.getElement(DOT.concat(FRONT)).setStyle('display', 'none');
		document.getElement(DOT.concat(BACK)).setStyle('display', 'block');
		if (window.widget && widget.performTransition) {
			setTimeout("widget.performTransition()", 0);
		}
	}	

	var show_front = function() {
		if (window.widget && widget.prepareForTransition) {
			widget.prepareForTransition("ToFront");
		}
		document.getElement(DOT.concat(BACK)).setStyle('display', 'none');
		if (typeof transFader != UNDEF) {
			transFader.setFadeTime(FADE_TIME);
			transFader.delay = FADE_DELAY;
		}
		document.getElement(DOT.concat(FRONT)).setStyle('display', 'block');
		document.getElement(DOT.concat(BACK)).empty();
		if (typeof transFader != UNDEF) {
			transFader.resume();
		}
		if (window.widget && widget.performTransition) {
			setTimeout("widget.performTransition()", 0);
		}
	}

	var checked = !DASHBOARDCLIENT;
	if (DASHBOARDCLIENT) {
		insert_css(STYLE_PATH.concat(DASHBOARD_STYLE));
	}
	if (OPERA.test(navigator.userAgent) ) {
		insert_css(STYLE_PATH.concat(OPERA_STYLE));
	}

	document.getElement('body').removeClass(INITIAL);
	fullscreen();

	paint();

	if (typeof widget != UNDEF) {
		if (widget.addEventListener) {
			widget.addEventListener('widgetmodechange', switchmode, false);
		}
	}

	if (document.addEventListener) {
		// Workaround for broken removeEventListener:
		if (!document.getElement('body').hasClass(LISTENING)) {
			self.props.container.addEventListener(
				'DOMNodeInserted', varnish, false
			);
			self.props.container.addEventListener(
				'DOMNodeRemoved', varnish, false
			);
			document.getElement('body').addClass(LISTENING);
		}
	}

}

})();
