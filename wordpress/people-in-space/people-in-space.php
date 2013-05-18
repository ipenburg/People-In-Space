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

		$WIDGET_ID = 'PeopleInSpaceWidget';
    	extract($args, EXTR_SKIP);
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
		#add_action( 'wp_enqueue_scripts',
		#	create_function( '', 'wp_enqueue_style( "PeopleInSpaceWidget_style_" );' )
		#);

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
		#add_action( 'wp_enqueue_scripts',
		#	create_function( '', 'wp_enqueue_script( "PeopleInSpaceWidget_script_" );' )
		#);

		$res = $xpath->query('//body');
		if ($res->length > 0) {
		    $this->html .= $res->item(0)->nodeValue;
		}

	}

	public function widget($args, $instance) {
	    echo $before_widget;
		echo $this->html;
		echo $after_widget;
	}
										   
}

add_action( 'widgets_init',
	create_function( '', 'register_widget( "PeopleInSpaceWidget" );' )
);
