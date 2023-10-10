<?php
/**
 * Simple_Share_Buttons_Adder
 *
 * @package SimpleShareButtonsAdder
 */

namespace SimpleShareButtonsAdder;

/**
 * Simple Share Buttons Adder Class.
 *
 * @package SimpleShareButtonsAdder
 */
class Simple_Share_Buttons_Adder {

	/**
	 * Plugin instance.
	 *
	 * @var object Plugin object.
	 */
	public $plugin;

	/**
	 * Class constructor.
	 *
	 * @param object $plugin Plugin class.
	 */
	public function __construct( $plugin ) {
		$this->plugin = $plugin;
	}

	/**
	 * Get the SSBA option settings.
	 *
	 * @action init
	 * @return array
	 */
	public function get_ssba_settings() {
		if ( SSBA_VERSION < 8 ) {
			$this->convert_settings();
		}

		$ssba_settings = get_option( 'ssba_settings', true );

		$ssba_settings = Util::parse_args(
			$ssba_settings,
			array(
				'ssba_content_priority' => 10,
			)
		);

		return $ssba_settings;
	}

	/**
	 * Get a single SSBA setting by name.
	 *
	 * @param string $name       Setting name string.
	 * @param mixed  $default    Default value in case setting is empty.
	 * @param bool   $check_plus Whether to check for plus value or just look for $name as-is (default = true).
	 * @param string $prefix     Which prefix to prepend onto setting check (default = ssba).
	 *
	 * @return mixed|null
	 */
	public function get_ssba_setting( $name, $default = null, $check_plus = true, $prefix = 'ssba' ) {
		$settings = $this->get_ssba_settings();

		if ( true === $check_plus ) {
			// Is 'Plus' enabled?
			$is_plus_enabled = 'Y' === $settings['ssba_new_buttons'];

			// Look up the plus equivalent value, if so.
			$setting_check = sprintf( '%s_%s', $is_plus_enabled ? 'plus' : '', $name );
		} else {
			$setting_check = $name;
		}

		// Should we prefix the check with ssba?
		$setting_check = sprintf( '%s%s', false === empty( $prefix ) ? $prefix . '_' : '', $setting_check );

		return false === empty( $settings[ $setting_check ] ) ? $settings[ $setting_check ] : $default;
	}

	/**
	 * Convert settings to non JSON if they exist.
	 */
	private function convert_settings() {
		// On update convert settings to non-json.
		// Only update if ssba_settings exist already.
		if ( true === empty( get_option( 'convert_json_ssba_settings' ) )
			&& false === empty( get_option( 'ssba_settings' ) )
		) {
			$convert_settings = json_decode( get_option( 'ssba_settings' ), true );

			update_option( 'ssba_settings', $convert_settings );
			update_option( 'convert_json_ssba_settings', true );
		} elseif ( empty( get_option( 'ssba_settings' ) ) ) {
			update_option( 'convert_json_ssba_settings', true );
		}

		// On update convert settings to non-json.
		// Only update if ssba_settings exist already.
		if ( empty( get_option( 'convert_json_ssba_buttons' ) ) && ! empty( get_option( 'ssba_buttons' ) ) ) {
			$convert_buttons = json_decode( get_option( 'ssba_buttons' ), true );

			update_option( 'ssba_buttons', $convert_buttons );
			update_option( 'convert_json_ssba_buttons', true );

			wp_safe_redirect( '/' );
		} elseif ( empty( get_option( 'ssba_buttons' ) ) ) {
			update_option( 'convert_json_ssba_buttons', true );
		}
	}

	/**
	 * Update an array of options.
	 *
	 * @param array $arr_options The options array.
	 */
	public function ssba_update_options( $arr_options ) {
		// If not given an array.
		if ( false === is_array( $arr_options ) ) {
			return esc_html__( 'Value parsed not an array', 'simple-share-buttons-adder' );
		}

		// Get ssba settings.
		$ssba_settings = get_option( 'ssba_settings', true );

		// Loop through array given.
		foreach ( $arr_options as $name => $value ) {
			// Update/add the option in the array.
			$ssba_settings[ $name ] = $value;
		}

		// Update the option in the db.
		update_option( 'ssba_settings', $ssba_settings );
	}

	/**
	 * Add setting link to plugin page.
	 *
	 * @param array $links Links array.
	 *
	 * @return array Modified links array.
	 */
	public function add_action_links( $links ) {
		$mylinks = array(
			'<a href="' . admin_url( 'options-general.php?page=simple-share-buttons-adder' ) . '">Settings</a>',
		);

		return array_merge( $links, $mylinks );
	}

	/**
	 * Are new buttons active?
	 *
	 * @return bool
	 */
	public function are_new_buttons_active() {
		$settings = $this->get_ssba_settings();

		return 'Y' === $settings['ssba_new_buttons'];
	}

	/**
	 * Has accepted ShareThis terms?
	 *
	 * @return bool
	 */
	public function has_accepted_sharethis_terms() {
		return 'Y' === $this->get_ssba_setting( 'accepted_sharethis_terms', 'N', false, '' );
	}

	/**
	 * Is enabled on Posts?
	 *
	 * @return bool
	 */
	public function is_enabled_on_posts() {
		return 'Y' === $this->get_ssba_setting( 'posts', 'N' );
	}

	/**
	 * Is enabled on Pages?
	 *
	 * @return bool
	 */
	public function is_enabled_on_pages() {
		return 'Y' === $this->get_ssba_setting( 'pages', 'N' );
	}

	/**
	 * Is enabled on Homepage?
	 *
	 * @return bool
	 */
	public function is_enabled_on_homepage() {
		return 'Y' === $this->get_ssba_setting( 'homepage', 'N' );
	}

	/**
	 * Is enabled on Categories or Archives?
	 *
	 * @return bool
	 */
	public function is_enabled_on_categories() {
		return 'Y' === $this->get_ssba_setting( 'cats_archs', 'N' );
	}

	/**
	 * Is enabled for Excerpts?
	 *
	 * @return bool
	 */
	public function is_enabled_on_excerpts() {
		return 'Y' === $this->get_ssba_setting( 'excerpts', 'N' );
	}

	/**
	 * Is enabled on this page?
	 *
	 * @return bool
	 */
	public function is_enabled_on_this_page() {
		if ( true === is_single() ) {
			return $this->is_enabled_on_posts();
		} elseif ( true === is_page() ) {
			return $this->is_enabled_on_pages();
		} elseif ( true === is_home() || true === is_front_page() ) {
			return $this->is_enabled_on_homepage();
		} elseif ( true === is_category() || true === is_archive() ) {
			return $this->is_enabled_on_categories();
		}

		return false;
	}

	/**
	 * Are Facebook Insights enabled?
	 *
	 * @return bool
	 */
	public function are_facebook_insights_enabled() {
		return 'Y' === $this->get_ssba_setting( 'facebook_insights', 'N', true, '' );
	}

	/**
	 * Get Facebook App ID or empty string.
	 *
	 * @return string
	 */
	public function get_facebook_app_id() {
		return $this->get_ssba_setting( 'facebook_app_id', '', true, '' );
	}

	/**
	 * Ignore Facebook SDK?
	 *
	 * NOTE: This is enabled if the user wants to use their own SDK version.
	 *
	 * @return bool
	 */
	public function ignore_facebook_sdk() {
		return 'Y' === $this->get_ssba_setting( 'ignore_facebook_sdk', 'N', true, '' );
	}

	/**
	 * Get Font Family.
	 *
	 * @return string
	 */
	public function get_font_family() {
		return $this->get_ssba_setting( 'font_family', '' );
	}

	/**
	 * Are custom styles enabled?
	 *
	 * @return bool
	 */
	public function are_custom_styles_enabled() {
		return 'Y' === $this->get_ssba_setting( 'custom_styles_enabled', 'N' );
	}

	/**
	 * Get content priority.
	 *
	 * @return int
	 */
	public function get_content_priority() {
		return (int) $this->get_ssba_setting( 'content_priority', 10, false );
	}

	/* Share Bar */

	/**
	 * Are Share Bar custom styles enabled?
	 *
	 * @return bool
	 */
	public function are_bar_custom_styles_enabled() {
		return 'Y' === $this->get_ssba_setting( 'custom_styles_enabled', 'N', false, 'ssba_bar' );
	}

	/**
	 * Get bar height string.
	 *
	 * @return string Bar height number string.
	 */
	public function get_bar_height() {
		return $this->get_ssba_setting( 'height', '48', false, 'ssba_bar' );
	}

	/**
	 * Get bar height style.
	 *
	 * @return string
	 */
	public function get_bar_height_style() {
		$bar_height = $this->get_bar_height();

		return 'height: ' . $bar_height . 'px !important;';
	}

	/**
	 * Get bar width string.
	 *
	 * @return string Bar width number string.
	 */
	public function get_bar_width() {
		return $this->get_ssba_setting( 'width', '48', false, 'ssba_bar' );
	}

	/**
	 * Get bar width style.
	 *
	 * @return string
	 */
	public function get_bar_width_style() {
		$bar_width = $this->get_bar_width();

		return 'width: ' . $bar_width . 'px !important;';
	}
}
