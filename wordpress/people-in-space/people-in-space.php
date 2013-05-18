<?php
/*
Plugin Name: People in Space
Plugin URI: http://ipenburg.home.xs4all.nl/widgets/people-in-space/
Description: Displays the number of people who are currently in space.
Version: 1.0.0
Author: Roland van Ipenburg
Author URI: http://ipenburg.home.xs4all.nl
License: CC-BY-SA-30
*/

class PeopleInSpaceWidget extends WP_Widget {

	public function __construct() {
		$WIDGET_TITLE = 'People in Space';
		$WIDGET_DESC = 'Displays the number of people who are currently in space';
		$WIDGET_ID = 'PeopleInSpaceWidget';
		$ASSETS = 'assets/';
		$INDEX = 'index.html';
		$CONTROLLER = 'scripts/controller.js';

		parent::__construct(
		 	$WIDGET_ID,
			$WIDGET_TITLE,
			array(
				'description' => $WIDGET_DESC,
			)
		);

		require_once(ABSPATH . '/wp-admin/includes/plugin.php');
		define( 'PLUGIN_PATH', plugin_dir_path(__FILE__) );
		define( 'PLUGIN_URL', plugin_dir_url(__FILE__) );
		define( 'ASSETS',  $ASSETS);
		define( 'INDEX',  PLUGIN_PATH . ASSETS . $INDEX);
		define( 'CONTROLLER',  PLUGIN_PATH . ASSETS . $CONTROLLER);

		$WIDGET_ID = 'PeopleInSpaceWidget';
    	extract($args, EXTR_SKIP);

		$controller = file_get_contents(CONTROLLER);
		$props_url = preg_replace('/.*var\s+PROPS\s+=\s+prx\("(.*?)".*/is', '$1', $controller);
		$props = file_get_contents($props_url);
		$dom = DOMDocument::loadXML($props);
		$xpath = new DOMXpath($dom);

		$res = $xpath->query('//url');
		for ($i = 0; $i < $res->length; $i++) {
			$feed_url = $res->item($i)->nodeValue;
			$feed = file_get_contents($feed_url);
			$dom = DOMDocument::loadXML($feed);
			$xpath = new DOMXpath($dom);
			$rss = $xpath->query('/rss/channel/item/title');
			for ($j = 0; $j < $rss->length; $j++) {
				$pis = $rss->item($j)->nodeValue;
			}
		}

		$dom = DOMDocument::loadHTMLFile(INDEX);
		$xpath = new DOMXpath($dom);

		$res = $xpath->query('//link[@rel="stylesheet"]/@href');
		for ($i = 0; $i < $res->length; $i++) {
			$src = PLUGIN_URL . ASSETS . $res->item($i)->nodeValue;
			$handle_base = $WIDGET_ID . '_style_';
			$handle = $handle_base . (($i == $res->length - 1) ? '' : $i);
			wp_register_style(
				$handle, $src,
				(($i > 1) ? array($handle_base . ($i - 1)) : array())
			);
		}
		add_action( 'wp_enqueue_scripts',
			create_function( '', 'wp_enqueue_style( "PeopleInSpaceWidget_style_" );' )
		);

		$res = $xpath->query('//script/@src');
		$handle_base = $WIDGET_ID . '_script_';
		for ($i = 0; $i < $res->length; $i++) {
			$src = PLUGIN_URL . ASSETS . $res->item($i)->nodeValue;
			$handle = $handle_base . (($i == $res->length - 1) ? '' : $i);
			wp_register_script(
				$handle, $src,
				(($i > 1) ? array($handle_base . ($i - 1)) : array())
			);
		}
		add_action( 'wp_enqueue_scripts',
			create_function( '', 'wp_enqueue_script( "PeopleInSpaceWidget_script_" );' )
		);

		if ($pis) {
		    $this->html .= $pis;
		}
		else {
			$res = $xpath->query('//body');
			if ($res->length > 0) {
				# TODO: return the tags as well:
				$this->html .= $res->item(0)->nodeValue;
			}
		}
		$this->html = '<div class="' . $WIDGET_ID . ' initial" data-count="' . $pis . '">' .
			$this->html . '</div>';

	}

	public function widget($args, $instance) {
	    echo $before_widget .
			$this->html .
			$after_widget;
	}
										   
}

add_action( 'widgets_init',
	create_function( '', 'register_widget( "PeopleInSpaceWidget" );' )
);
