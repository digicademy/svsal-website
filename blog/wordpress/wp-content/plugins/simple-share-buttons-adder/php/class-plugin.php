<?php
/**
 * Bootstraps the Simple Share Buttons Adder plugin.
 *
 * @package SimpleShareButtonsAdder
 */

namespace SimpleShareButtonsAdder;

/**
 * Main plugin bootstrap file.
 */
class Plugin extends Plugin_Base {

	/**
	 * Plugin constructor.
	 */
	public function __construct() {
		parent::__construct();

		// Define some prefixes to use througout the plugin.
		$this->assets_prefix = strtolower( preg_replace( '/\B([A-Z])/', '-$1', __NAMESPACE__ ) );
		$this->meta_prefix   = strtolower( preg_replace( '/\B([A-Z])/', '_$1', __NAMESPACE__ ) );

		// Globals.
		$class_ssba       = new Simple_Share_Buttons_Adder( $this );
		$database         = new Database( $this, $class_ssba );
		$forms            = new Forms( $this );
		$forms_validation = new Forms_Validation();
		$widget_class     = new Widget();
		$admin_panel      = new Admin_Panel( $this, $class_ssba, $forms, $forms_validation, $widget_class );

		// Initiate classes.
		$classes = array(
			$class_ssba,
			$database,
			$admin_panel,
			$widget_class,
			$forms,
			new Styles( $this, $class_ssba ),
			new Admin_Bits( $this, $class_ssba, $database, $admin_panel ),
			new Buttons( $this, $class_ssba, $admin_panel ),
		);

		// Add classes doc hooks.
		foreach ( $classes as $instance ) {
			$this->add_doc_hooks( $instance );
		}

		// Define some prefixes to use througout the plugin.
		$this->assets_prefix = strtolower( preg_replace( '/\B([A-Z])/', '-$1', __NAMESPACE__ ) );
		$this->meta_prefix   = strtolower( preg_replace( '/\B([A-Z])/', '_$1', __NAMESPACE__ ) );
	}

	/**
	 * Register assets.
	 *
	 * @action wp_enqueue_scripts
	 */
	public function register_assets() {
		$propertyid = get_option( 'ssba_property_id' );

		wp_register_script(
			"{$this->assets_prefix}-ssba",
			"{$this->dir_url}js/ssba.js",
			array( 'jquery' ),
			filemtime( "{$this->dir_path}js/ssba.js" ),
			true
		);

		wp_register_style(
			"{$this->assets_prefix}-indie",
			'//fonts.googleapis.com/css?family=Indie+Flower',
			array(),
			SSBA_VERSION
		);

		wp_register_style(
			"{$this->assets_prefix}-reenie",
			'//fonts.googleapis.com/css?family=Reenie+Beanie',
			array(),
			SSBA_VERSION
		);

		wp_register_style(
			"{$this->assets_prefix}-ssba",
			"{$this->dir_url}css/ssba.css",
			array(),
			filemtime( "{$this->dir_path}css/ssba.css" )
		);

		wp_register_style(
			"{$this->assets_prefix}-font-awesome",
			'//maxcdn.bootstrapcdn.com/font-awesome/4.3.0/css/font-awesome.min.css',
			array(),
			SSBA_VERSION
		);

		if ( false === empty( $propertyid ) ) {
			wp_register_script(
				"{$this->assets_prefix}-mu",
				"//platform-api.sharethis.com/js/sharethis.js#property={$propertyid}&product=gdpr-compliance-tool-v2&source=simple-share-buttons-adder-wordpress",
				null,
				SSBA_VERSION,
				false
			);
		}
	}

	/**
	 * Register admin scripts/styles.
	 *
	 * @action admin_enqueue_scripts
	 */
	public function register_admin_assets() {
		wp_register_script(
			"{$this->assets_prefix}-admin",
			"{$this->dir_url}js/admin.js",
			array( 'jquery', 'jquery-ui-sortable', 'wp-util' ),
			filemtime( "{$this->dir_path}js/admin.js" ),
			false
		);
		wp_register_script(
			"{$this->assets_prefix}-bootstrap-js",
			"{$this->dir_url}js/extras/bootstrap.js",
			array(),
			filemtime( "{$this->dir_path}js/extras/bootstrap.js" ),
			false
		);
		wp_register_script(
			"{$this->assets_prefix}-colorpicker",
			"{$this->dir_url}js/extras/colorpicker.js",
			array(),
			filemtime( "{$this->dir_path}js/extras/colorpicker.js" ),
			false
		);
		wp_register_script(
			"{$this->assets_prefix}-switch",
			"{$this->dir_url}js/extras/switch.js",
			array(),
			filemtime( "{$this->dir_path}js/extras/switch.js" ),
			false
		);

		wp_register_style(
			"{$this->assets_prefix}-admin",
			"{$this->dir_url}css/admin.css",
			false,
			time()
		);

		wp_register_style(
			"{$this->assets_prefix}-readable",
			"{$this->dir_url}css/readable.css",
			array(),
			filemtime( "{$this->dir_path}css/readable.css" )
		);

		wp_register_style(
			"{$this->assets_prefix}-colorpicker",
			"{$this->dir_url}css/colorpicker.css",
			array(),
			filemtime( "{$this->dir_path}css/colorpicker.css" )
		);

		wp_register_style(
			"{$this->assets_prefix}-switch",
			"{$this->dir_url}css/switch.css",
			array(),
			filemtime( "{$this->dir_path}css/switch.css" )
		);

		wp_register_style(
			"{$this->assets_prefix}-admin-theme",
			"{$this->dir_url}css/admin-theme.css",
			"{$this->assets_prefix}-font-awesome",
			filemtime( "{$this->dir_path}css/admin-theme.css" )
		);

		wp_register_style(
			"{$this->assets_prefix}-font-awesome",
			'//maxcdn.bootstrapcdn.com/font-awesome/4.3.0/css/font-awesome.min.css',
			array(),
			SSBA_VERSION
		);

		wp_register_style(
			"{$this->assets_prefix}-styles",
			"{$this->dir_url}css/style.css",
			array(),
			filemtime( "{$this->dir_path}css/style.css" )
		);

		wp_register_style(
			"{$this->assets_prefix}-indie",
			'//fonts.googleapis.com/css?family=Indie+Flower',
			array(),
			SSBA_VERSION
		);

		wp_register_style(
			"{$this->assets_prefix}-reenie",
			'//fonts.googleapis.com/css?family=Reenie+Beanie',
			array(),
			SSBA_VERSION
		);
	}
}
