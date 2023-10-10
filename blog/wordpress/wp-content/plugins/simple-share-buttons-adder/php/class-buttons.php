<?php
/**
 * Buttons.
 *
 * @package SimpleShareButtonsAdder
 */

namespace SimpleShareButtonsAdder;

/**
 * Buttons Class
 *
 * @package SimpleShareButtonsAdder
 */
class Buttons {


	/**
	 * Plugin instance.
	 *
	 * @var object
	 */
	public $plugin;

	/**
	 * Simple Share Buttons Adder instance.
	 *
	 * @var Simple_Share_Buttons_Adder
	 */
	public $class_ssba;

	/**
	 * Admin Panel Class.
	 *
	 * @var object
	 */
	public $admin_panel;

	/**
	 * Class constructor.
	 *
	 * @param object $plugin      Plugin class.
	 * @param object $class_ssba  Simple Share Buttons Adder class.
	 * @param object $admin_panel Admin panel.
	 */
	public function __construct( $plugin, $class_ssba, $admin_panel ) {
		$this->plugin      = $plugin;
		$this->class_ssba  = $class_ssba;
		$this->admin_panel = $admin_panel;
	}

	/**
	 * Format the returned number.
	 *
	 * @param integer $int_number The number to format.
	 *
	 * @return string
	 */
	public function ssba_format_number( $int_number ) {
		// If the number is greater than or equal to 1000.
		if ( $int_number >= 1000 ) {
			// Divide by 1000 and add k.
			$int_number = round( ( $int_number / 1000 ), 1 ) . 'k';
		}

		// Return the number.
		return $int_number;
	}

	/**
	 * Adds a filter around the content.
	 *
	 * @action init, 99
	 */
	public function ssba_add_button_filter() {
		if ( true === is_admin() ) {
			return;
		}

		add_filter( 'the_content', array( $this, 'show_share_buttons' ), $this->class_ssba->get_content_priority() );

		// If we wish to add to excerpts.
		if ( true === $this->class_ssba->is_enabled_on_excerpts() ) {
			add_filter( 'the_excerpt', array( $this, 'show_share_buttons' ) );
		}
	}

	/**
	 * Call back for showing share buttons.
	 *
	 * @param string $content The current page or post content.
	 * @param bool   $boo_shortcode Whether to use shortcode or not.
	 * @param array  $atts Manual replacements for page url/title.
	 *
	 * @return string
	 */
	public function show_share_buttons( $content, $boo_shortcode = false, $atts = '' ) {
		global $post;

		// Variables.
		$html_content   = $content;
		$str_share_text = '';
		$pattern        = get_shortcode_regex();

		// Ssba_hide shortcode is in the post content and instance is not called by shortcode ssba.
		if ( true === isset( $post->post_content ) &&
			preg_match_all( '/' . $pattern . '/s', $post->post_content, $matches ) &&
			array_key_exists( 2, $matches ) &&
			in_array( 'ssba_hide', $matches[2], true ) &&
			! $boo_shortcode
		) {
			// Exit the function returning the content without the buttons.
			return $content;
		}

		// Get sbba settings.
		$arr_settings = $this->class_ssba->get_ssba_settings();

		$page_title      = $post->post_title;
		$plus_omit_pages = ! empty( $arr_settings['ssba_omit_pages_plus'] ) ? explode( ',', $arr_settings['ssba_omit_pages_plus'] ) : '';
		$plus_omitted    = is_array( $plus_omit_pages ) ? in_array( $page_title, array_map( 'trim', $plus_omit_pages ), true ) : false;
		$omit_pages      = ! empty( $arr_settings['ssba_omit_pages'] ) ? explode( ',', $arr_settings['ssba_omit_pages'] ) : '';
		$omitted         = is_array( $omit_pages ) ? in_array( $page_title, array_map( 'trim', $omit_pages ), true ) : false;

		if ( ( 'Y' === $arr_settings['ssba_new_buttons'] && $plus_omitted ) || ( 'Y' !== $arr_settings['ssba_new_buttons'] && $omitted ) ) {
			return $content;
		}

		// Placement on pages/posts/categories/archives/homepage.
		if ( (
			false === is_home() &&
			false === is_front_page() &&
			true === is_page() &&
			(
				'Y' !== $arr_settings['ssba_new_buttons'] &&
				'Y' === $arr_settings['ssba_pages'] ||
				(
					'Y' === $arr_settings['ssba_new_buttons'] &&
					'Y' === $arr_settings['ssba_plus_pages']
				)
			) )
			||
			(
				true === is_single() &&
				(
					'Y' !== $arr_settings['ssba_new_buttons'] &&
					'Y' === $arr_settings['ssba_posts'] ||
					(
						'Y' === $arr_settings['ssba_new_buttons'] &&
						'Y' === $arr_settings['ssba_plus_posts']
					)
				)
			)
			||
			(
				true === is_category() &&
				(
					'Y' !== $arr_settings['ssba_new_buttons'] &&
					'Y' === $arr_settings['ssba_cats_archs'] ||
					(
						'Y' === $arr_settings['ssba_new_buttons'] &&
						'Y' === $arr_settings['ssba_plus_cats_archs']
					)
				)
			)
			||
			(
				true === is_archive() &&
				(
					'Y' !== $arr_settings['ssba_new_buttons'] &&
					'Y' === $arr_settings['ssba_cats_archs'] ||
					(
						'Y' === $arr_settings['ssba_new_buttons'] &&
						'Y' === $arr_settings['ssba_plus_cats_archs']
					)
				)
			)
			||
			(
				(
					true === is_home() ||
					true === is_front_page()
				) &&
				(
					'Y' !== $arr_settings['ssba_new_buttons'] &&
					'Y' === $arr_settings['ssba_homepage'] ||
					(
						'Y' === $arr_settings['ssba_new_buttons'] &&
						'Y' === $arr_settings['ssba_plus_homepage']
					)
				)
			)
			 ||
			 (
				 true === is_front_page() &&
				 (
						 'Y' === $arr_settings['ssba_new_buttons'] &&
						 true === $this->class_ssba->is_enabled_on_excerpts()
				 )
			 )
			||
			$boo_shortcode
		) {
			wp_enqueue_style( "{$this->plugin->assets_prefix}-ssba" );

			// If not shortcode.
			if ( isset( $atts['widget'] ) && 'Y' === $atts['widget'] && '' === $arr_settings['ssba_widget_text'] ) { // Use widget share text.
				$str_share_text = $arr_settings['ssba_widget_text'];
			} else { // Use normal share text.
				$str_share_text = 'Y' !== $arr_settings['ssba_new_buttons'] ? $arr_settings['ssba_share_text'] : $arr_settings['ssba_plus_share_text'];
			}

			// Text placement.
			$text_placement = 'Y' !== $arr_settings['ssba_new_buttons'] ? $arr_settings['ssba_text_placement'] : $arr_settings['ssba_plus_text_placement'];

			// Link or no.
			$text_link = 'Y' !== $arr_settings['ssba_new_buttons'] ? $arr_settings['ssba_link_to_ssb'] : $arr_settings['ssba_plus_link_to_ssb'];

			// Post id.
			$int_post_id = $post->ID;

			// Button Position.
			$button_position = 'Y' !== $arr_settings['ssba_new_buttons'] ? $arr_settings['ssba_before_or_after'] : $arr_settings['ssba_before_or_after_plus'];

			// Button alignment.
			$alignment = 'Y' !== $arr_settings['ssba_new_buttons'] ? $arr_settings['ssba_align'] : $arr_settings['ssba_plus_align'];

			// Wrap id.
			$wrap_id = 'Y' !== $arr_settings['ssba_new_buttons'] ? 'ssba-classic-2' : 'ssba-modern-2';

			// Ssba div.
			$html_share_buttons = '<!-- Simple Share Buttons Adder (' . esc_html( SSBA_VERSION ) . ') simplesharebuttons.com --><div class="' . esc_attr( $wrap_id ) . ' ssba ssbp-wrap' . esc_attr( ' align' . $arr_settings['ssba_plus_align'] ) . ' ssbp--theme-' . esc_attr( $arr_settings['ssba_plus_button_style'] ) . '">';

			// Center if set so.
			$html_share_buttons .= '<div style="text-align:' . esc_attr( $alignment ) . '">';

			// Add custom text if set and set to placement above or left.
			if ( '' !== $str_share_text && ( 'above' === $text_placement || 'left' === $text_placement ) ) {
				// Check if user has left share link box checked.
				if ( 'Y' === $text_link ) {
					// Share text with link.
					$html_share_buttons .= '<a href="https://simplesharebuttons.com" target="_blank" class="ssba-share-text">' . esc_html( $str_share_text ) . '</a>';
				} else {
					// Share text.
					$html_share_buttons .= '<span class="ssba-share-text">' . esc_html( $str_share_text ) . '</span>';
				}
				// Add a line break if set to above.
				$html_share_buttons .= 'above' === $text_placement ? '<br/>' : '';
			}

			// If running standard.
			if ( ! $boo_shortcode ) {
				// Use WordPress functions for page/post details.
				$url_current_page = get_permalink( $post->ID );
				$str_page_title   = get_the_title( $post->ID );
			} else { // Using shortcode.
				// Set page URL and title as set by user or get if needed.
				$url_current_page = isset( $atts['url'] ) ? esc_url( $atts['url'] ) : $this->ssba_current_url( $atts );
				$str_page_title   = ( isset( $atts['title'] ) ? $atts['title'] : get_the_title() );
			}

			// Strip any unwanted tags from the page title.
			$str_page_title = esc_attr( wp_strip_all_tags( $str_page_title ) );

			// The buttons.
			$html_share_buttons .= $this->get_share_buttons( $arr_settings, $url_current_page, $str_page_title, $int_post_id );

			// Add custom text if set and set to placement right or below.
			if ( '' !== $str_share_text && ( 'right' === $text_placement || 'below' === $text_placement ) ) {
				// Add a line break if set to above.
				$html_share_buttons .= 'below' === $text_placement ? '<br/>' : '';

				// Check if user has checked share link option.
				if ( 'Y' === $text_link ) {
					// Share text with link.
					$html_share_buttons .= '<a href="https://simplesharebuttons.com" target="_blank" class="ssba-share-text">' . esc_html( $str_share_text ) . '</a>';
				} else { // Just display the share text.
					// Share text.
					$html_share_buttons .= '<span class="ssba-share-text">' . esc_html( $str_share_text ) . '</span>';
				}
			}

			// Close center if set.
			$html_share_buttons .= '</div></div>';

			// If not using shortcode.
			if ( ! $boo_shortcode ) {
				// Switch for placement of ssba.
				switch ( $button_position ) {
					case 'before': // Before the content.
						$html_content = $html_share_buttons . $content;
						break;
					case 'after': // After the content.
						$html_content = $content . $html_share_buttons;
						break;
					case 'both': // Before and after the content.
						$html_content = $html_share_buttons . $content . $html_share_buttons;
						break;
				}
			} else { // If using shortcode.
				// Just return buttons.
				$html_content = $html_share_buttons;
			}
		}

		// Return content and share buttons.
		return $html_content;
	}

	/**
	 * Function that shows the share bar if enabled.
	 *
	 * @action wp_head, 99
	 */
	public function show_share_bar() {
		global $post, $wp;

		// Get sbba settings.
		$arr_settings = $this->class_ssba->get_ssba_settings();
		$page_title   = isset( $post->post_title ) ? $post->post_title : '';
		$omit_pages   = ! empty( $arr_settings['ssba_omit_pages_bar'] ) ? explode(
			',',
			$arr_settings['ssba_omit_pages_bar']
		) : '';
		$omitted      = is_array( $omit_pages ) ? in_array( $page_title, array_map( 'trim', $omit_pages ), true ) : false;

		if ( ( 'Y' !== $arr_settings['ssba_bar_desktop'] && ! wp_is_mobile() ) || ( 'Y' !== $arr_settings['ssba_bar_mobile'] && wp_is_mobile() ) || 'Y' !== $arr_settings['ssba_bar_enabled'] || $omitted ) {
			return;
		}

		// Get current url.
		$url_current_page = home_url( add_query_arg( array(), $wp->request ) );

		// Placement on pages/posts/categories/archives/homepage.
		if (
			( ! is_home() && ! is_front_page() && is_page() && isset( $arr_settings['ssba_bar_pages'] ) && 'Y' === $arr_settings['ssba_bar_pages'] )
			||
			( is_single() && isset( $arr_settings['ssba_bar_posts'] ) && 'Y' === $arr_settings['ssba_bar_posts'] )
			||
			( is_category() && isset( $arr_settings['ssba_bar_cats_archs'] ) && 'Y' === $arr_settings['ssba_bar_cats_archs'] )
			||
			( is_archive() && isset( $arr_settings['ssba_bar_cats_archs'] ) && 'Y' === $arr_settings['ssba_bar_cats_archs'] )
			||
			( ( is_home() || is_front_page() ) && isset( $arr_settings['ssba_bar_homepage'] ) && 'Y' === $arr_settings['ssba_bar_homepage'] )
		) {

			if ( ! wp_style_is( "{$this->plugin->assets_prefix}-ssba", 'enqueued' ) ) {
				wp_enqueue_style( "{$this->plugin->assets_prefix}-ssba" );
			}

			$html_share_buttons  = '<div id="ssba-bar-2" class="' . esc_attr( $arr_settings['ssba_bar_position'] ) . ' ssbp-wrap ssbp--theme-' . esc_attr( $arr_settings['ssba_bar_style'] ) . '" >';
			$html_share_buttons .= '<div class="ssbp-container">';
			$html_share_buttons .= '<ul class="ssbp-bar-list">';

			// The buttons.
			$html_share_buttons .= $this->get_share_bar( $arr_settings, $url_current_page, $post->post_title, $post->ID );
			$html_share_buttons .= '</div></ul>';
			$html_share_buttons .= '</div>';

			echo $html_share_buttons; // phpcs:ignore XSS ok. Pinterest contains javascript. Cannot sanitize output.
		}
	}

	/**
	 * Shortcode for adding buttons.
	 *
	 * @param array $atts The current shortcodes attributes.
	 *
	 * @shortcode ssba-buttons
	 *
	 * @return string
	 */
	public function ssba_buttons( $atts ) {
		// Get buttons - NULL for $content, TRUE for shortcode flag.
		$html_share_buttons = $this->show_share_buttons( null, true, $atts );

		// Return buttons.
		return $html_share_buttons;
	}

	/**
	 * Shortcode for adding buttons.
	 *
	 * @param array $atts The current shortcodes attributes.
	 *
	 * @shortcode ssba
	 *
	 * @return string
	 */
	public function ssba_orig_buttons( $atts ) {
		// Get buttons - NULL for $content, TRUE for shortcode flag.
		$html_share_buttons = $this->show_share_buttons( null, true, $atts );

		// Return buttons.
		return $html_share_buttons;
	}

	/**
	 * Shortcode for hiding buttons
	 *
	 * @param string $content The current page or posts content.
	 *
	 * @shortcode ssba_hide
	 */
	public function ssba_hide( $content ) {
		// No need to do anything here!
	}

	/**
	 * Get URL function.
	 *
	 * @param array $atts The supplied attributes.
	 *
	 * @return string
	 */
	public function ssba_current_url( $atts ) {
		global $post;

		if ( ! isset( $_SERVER['SERVER_NAME'] ) || ! isset( $_SERVER['REQUEST_URI'] ) ) {
			return;
		}

		// If multisite has been set to true.
		if ( isset( $atts['multisite'] ) && isset( $_SERVER['QUERY_STRING'] ) ) {
			global $wp;

			$url = add_query_arg( sanitize_text_field( wp_unslash( $_SERVER['QUERY_STRING'] ) ), '', home_url( $wp->request ) ); // WPCS: CSRF ok.

			return esc_url( $url );
		}

		// Add http.
		$url_current_page = 'http';

		// Add s to http if required.
		if ( isset( $_SERVER['HTTPS'] ) && 'on' === $_SERVER['HTTPS'] ) {
			$url_current_page .= 's';
		}

		// Add colon and forward slashes.
		$url_current_page .= '://' . sanitize_text_field( wp_unslash( $_SERVER['SERVER_NAME'] . $_SERVER['REQUEST_URI'] ) );

		$url_current_page = '_' === $_SERVER['SERVER_NAME'] ? get_permalink( $post->ID ) : $url_current_page;

		// Return url.
		return esc_url( $url_current_page );
	}

	/**
	 * Get set share buttons.
	 *
	 * @param array   $arr_settings The current ssba settings.
	 * @param string  $url_current_page The current pages url.
	 * @param string  $str_page_title The page title.
	 * @param integer $int_post_id The post id.
	 *
	 * @return string
	 */
	public function get_share_buttons( $arr_settings, $url_current_page, $str_page_title, $int_post_id ) {
		// Variables.
		$html_share_buttons = '';

		// Explode saved include list and add to a new array.
		$arr_selected_ssba = 'Y' === $arr_settings['ssba_new_buttons'] ? explode( ',', $arr_settings['ssba_selected_plus_buttons'] ) : explode( ',', $arr_settings['ssba_selected_buttons'] );

		// Check if array is not empty.
		if ( is_array( $arr_selected_ssba ) && '' !== $arr_selected_ssba[0] ) {
			// Add post ID to settings array.
			$arr_settings['post_id'] = $int_post_id;

			// If show counters option is selected.
			if ( 'Y' === $arr_settings['ssba_show_share_count'] ) {
				// Set show flag to true.
				$boo_show_share_count = true;

				// If show counters once option is selected.
				if ( 'Y' === $arr_settings['ssba_share_count_once'] ) {
					// If not a page or post.
					if ( ! is_page() && ! is_single() ) {
						// Let show flag to false.
						$boo_show_share_count = false;
					}
				}
			} else {
				// Set show flag to false.
				$boo_show_share_count = false;
			}

			if ( 'Y' === $arr_settings['ssba_new_buttons'] ) {
				$html_share_buttons .= '<ul class="ssbp-list">';
			}

			// For each included button.
			foreach ( $arr_selected_ssba as $str_selected ) {
				// Add a list item for each selected option.
				$html_share_buttons .= $this->get_button( $arr_settings, $url_current_page, $str_page_title, $boo_show_share_count, $str_selected );
			}

			if ( 'Y' === $arr_settings['ssba_new_buttons'] ) {
				$html_share_buttons .= '</ul>';
			}
		}

		// Return share buttons.
		return $html_share_buttons;
	}

	/**
	 * Get set share buttons.
	 *
	 * @param array   $arr_settings The current ssba settings.
	 * @param string  $url_current_page The current pages url.
	 * @param string  $str_page_title The page title.
	 * @param integer $int_post_id The post id.
	 *
	 * @return string
	 */
	public function get_share_bar( $arr_settings, $url_current_page, $str_page_title, $int_post_id ) {
		// Variables.
		$html_share_buttons = '';

		// Set bar call.
		$arr_settings = array_merge(
			$arr_settings,
			array(
				'bar_call' => 'Y',
			)
		);

		// Explode saved include list and add to a new array.
		$arr_selected_ssba = explode( ',', $arr_settings['ssba_selected_bar_buttons'] );

		// Check if array is not empty.
		if ( '' !== $arr_settings['ssba_selected_bar_buttons'] ) {
			// Add post ID to settings array.
			$arr_settings['post_id'] = $int_post_id;

			// If show counters option is selected.
			if ( 'Y' === $arr_settings['ssba_bar_show_share_count'] ) {
				// Set show flag to true.
				$boo_show_share_count = true;

				// If show counters once option is selected.
				if ( isset( $arr_settings['ssba_bar_count_once'] ) && 'Y' === $arr_settings['ssba_bar_count_once'] ) {
					// If not a page or post.
					if ( ! is_page() && ! is_single() ) {
						// Let show flag to false.
						$boo_show_share_count = false;
					}
				}
			} else {
				// Set show flag to false.
				$boo_show_share_count = false;
			}

			// For each included button.
			foreach ( $arr_selected_ssba as $str_selected ) {
				if ( '' !== $str_selected ) {
					$str_get_button = 'ssba_' . $str_selected;

					// Add a list item for each selected option.
					$html_share_buttons .= $this->get_button( $arr_settings, $url_current_page, $str_page_title, $boo_show_share_count, $str_selected, 'bar' );
				}
			}
		}

		// Return share buttons.
		return $html_share_buttons;
	}

	/**
	 * Get button.
	 *
	 * @param array  $arr_settings The current ssba settings.
	 * @param string $url_current_page The current page url.
	 * @param string $str_page_title The page title.
	 * @param bool   $boo_show_share_count Show share count or not.
	 * @param string $button_name Button name string.
	 * @param string $button_type Button type string.
	 *
	 * @return string
	 */
	public function get_button( $arr_settings, $url_current_page, $str_page_title, $boo_show_share_count, $button_name, $button_type = 'plus' ) {
		$nofollow  = ( 'Y' === $arr_settings['ssba_plus_rel_nofollow']
						   && 'Y' === $arr_settings['ssba_new_buttons']
						   && ! isset(
				$arr_settings['bar_call']
			) )
						 ||
						 ( 'Y' === $arr_settings['ssba_bar_rel_nofollow']
						   && isset(
							   $arr_settings['bar_call']
						   ) ) ? ' rel=nofollow ' : '';

		$network       = $button_name;
		$flattr_id     = isset( $arr_settings['ssba_plus_flattr_user_id'] ) ? $arr_settings['ssba_plus_flattr_user_id'] : '';
		$network_url   = self::get_share_url( $button_name, $str_page_title, '', $url_current_page, $flattr_id );
		$network_color = 'Y' === $arr_settings['ssba_new_buttons'] || 'Y' === $arr_settings['ssba_bar_buttons'] ? self::get_button_color( $button_name ) : '';
		$network_full  = ucwords( str_replace( '_', ' ', $button_name ) );
		$image_name    = str_replace( array( 'get_pocket', 'diggit', '_' ), array( 'pocket', 'digg', '' ), $button_name );
		$icon_code     = self::get_button_image( $button_name );
		$icon_white    = self::get_button_image( $button_name, 'white' );
		$print         = 'print' === $button_name ? 'onclick="window.print()"' : '';
		$target        =
			( 'Y' === $arr_settings['ssba_plus_share_new_window']
			&& 'Y' === $arr_settings['ssba_new_buttons']
			&& ! isset(
				$arr_settings['bar_call']
			) )
			||
			( 'Y' === $arr_settings['ssba_share_new_window']
			&& 'Y' !== $arr_settings['ssba_new_buttons']
			&& ! isset(
				$arr_settings['bar_call']
			) )
			||
			( 'Y' === $arr_settings['ssba_bar_share_new_window']
			&& isset(
				$arr_settings['bar_call']
			) ) ? ' target=_blank ' : '';
		$plus_class    = 'Y' === $arr_settings['ssba_new_buttons'] || isset( $arr_settings['bar_call'] ) ? " ssbp-{$button_name} ssbp-btn" : '';
		$button_back   = $arr_settings['ssba_plus_button_color'] ? esc_attr( 'background: ' . $arr_settings[ "ssba_{$button_type}_button_color" ] . ';' ) : '';
		$count_class   = 'Y' === $arr_settings['ssba_new_buttons'] || isset( $arr_settings['bar_call'] ) ? ' ssbp-each-share' : ' ssba_sharecount';

		$html_share_buttons = '';

		// Add li if plus.
		if ( 'Y' === $arr_settings['ssba_new_buttons'] || isset( $arr_settings['bar_call'] ) ) {
			$html_share_buttons .= "<li class='ssbp-li--{$button_name}'>";
		}

		// Share link.
		$html_share_buttons .= '<a data-site="' . $button_name . '" class="ssba_' . $button_name . '_share ssba_share_link' . esc_attr( $plus_class ) . '" href="' . $network_url . '" ' . esc_attr( $target . $nofollow ) . ' style="color:' . esc_attr( $network_color ) . '; background-color: ' . esc_attr( $network_color ) . '; height: ' . esc_attr( $arr_settings['ssba_plus_height'] ) . 'px; width: ' . esc_attr( $arr_settings['ssba_plus_width'] ) . 'px; ' . $button_back . '" ' . $print . '>';

		// If image set is not custom.
		if ( 'custom' !== $arr_settings['ssba_image_set'] && 'Y' !== $arr_settings['ssba_new_buttons'] && ! isset( $arr_settings['bar_call'] ) ) {
			// Show ssba image.
			$html_share_buttons .= '<img src="' . plugins_url() . '/simple-share-buttons-adder/buttons/' . esc_attr( $arr_settings['ssba_image_set'] ) . '/' . $button_name . '.png" style="width: ' . esc_html( $arr_settings['ssba_size'] ) . 'px;" title="' . $button_name . '" class="ssba ssba-img" alt="Share on ' . $button_name . '" />';
		} elseif ( 'Y' !== $arr_settings['ssba_new_buttons'] && ! isset( $arr_settings['bar_call'] ) ) { // If using custom images.
			// Show custom image.
			$html_share_buttons .= '<img src="' . esc_url( $arr_settings[ 'ssba_custom_' . $button_name ] ) . '" style="width: ' . esc_html( $arr_settings['ssba_size'] ) . 'px;" title="' . $button_name . '" class="ssba ssba-img" alt="Share on ' . $button_name . '" />';
		}

		if ( 'Y' === $arr_settings['ssba_new_buttons'] || true === isset( $arr_settings['bar_call'] )) {
			$html_share_buttons .= '<span>';
			$html_share_buttons .= $icon_code;
			$html_share_buttons .= '</span>';
			$html_share_buttons .= '<span class="color-icon">';
			$html_share_buttons .= $icon_white;
			$html_share_buttons .= '</span>';
		}

		// Close href.
		$html_share_buttons .= '<div title="' . $network_full . '" class="ssbp-text">' . $network_full . '</div>';

		// Get and add share count.
		if ( ( ( 'Y' === $arr_settings['ssba_show_share_count'] && 'Y' !== $arr_settings['ssba_new_buttons'] )
			||
			( 'Y' === $arr_settings['ssba_plus_show_share_count'] && 'Y' === $arr_settings['ssba_new_buttons'] )
			||
			( 'Y' === $arr_settings['ssba_bar_show_share_count'] && isset( $arr_settings['bar_call'] )
			)
			&& $boo_show_share_count
		) ) {
			$html_share_buttons .= '<span class="' . esc_attr( $count_class ) . '">' . esc_html(
				$this->get_share_count(
					$url_current_page,
					$arr_settings,
					$button_name
				)
			) . '</span>';
		}
		// Close href.
		$html_share_buttons .= '</a>';

		// Add closing li if plus.
		if ( 'Y' === $arr_settings['ssba_new_buttons'] || isset( $arr_settings['bar_call'] ) ) {
			$html_share_buttons .= '</li>';
		}

		// Return share buttons.
		return $html_share_buttons;
	}

	/**
	 * Get facebook share count.
	 *
	 * @param string $url_current_page Current url.
	 * @param array  $arr_settings Current ssba settings.
	 * @param string $button_name The button name.
	 *
	 * @return string
	 */
	public function get_share_count( $url_current_page, $arr_settings, $button_name ) {
		$cache_key       = sprintf(
			$button_name . '_sharecount_%s',
			wp_hash( $url_current_page )
		);
		$share_count_url = $this->get_share_count_url( $button_name );

		// Get the longer cached value from the Transient API.
		$long_cached_count = get_transient( "ssba_{$cache_key}" );
		if ( false === $long_cached_count ) {
			$long_cached_count = 0;
		}

		// If sharedcount.com is enabled.
		if ( ( ( 'Y' === $arr_settings['sharedcount_enabled'] && 'Y' !== $arr_settings['ssba_new_buttons'] )
			||
			( isset( $arr_settings['plus_sharedcount_enabled'] ) && 'Y' === $arr_settings['plus_sharedcount_enabled'] && 'Y' === $arr_settings['ssba_new_buttons'] )
			||
			( isset( $arr_settings['bar_sharedcount_enabled'] ) && 'Y' === $arr_settings['bar_sharedcount_enabled'] && isset( $arr_settings['bar_call'] )
			)
		) ) {
			$shared_plan = 'Y' !== $arr_settings['ssba_new_buttons'] ? $arr_settings['sharedcount_plan'] : '';
			$shared_plan = '' === $shared_plan && 'Y' === $arr_settings['ssba_new_buttons'] ? $arr_settings['plus_sharedcount_plan'] : '';
			$shared_plan = isset( $arr_settings['bar_call'] ) ? $arr_settings['bar_sharedcount_plan'] : '';

			// Request from sharedcount.com.
			$sharedcount = wp_safe_remote_get(
				'https://' . $shared_plan . '.sharedcount.com/url?url=' . $url_current_page . '&apikey=' . $arr_settings['sharedcount_api_key'],
				array(
					'timeout' => 6,
				)
			);

			// If no error.
			if ( is_wp_error( $sharedcount ) ) {
				return $this->ssba_format_number( $long_cached_count );
			}

			// Decode and return count.
			$shared_resp = json_decode( $sharedcount['body'], true );
			$sharedcount = $long_cached_count;

			if ( isset( $shared_resp[ $button_name ]['share_count'] ) ) {
				$sharedcount = (int) $shared_resp[ $button_name ]['share_count'];
				wp_cache_set( $cache_key, $sharedcount, 'ssba', MINUTE_IN_SECONDS * 2 );
				set_transient( "ssba_{$cache_key}", $sharedcount, DAY_IN_SECONDS );
			}

			return $this->ssba_format_number( $sharedcount );
		} else {
			// Get results from facebook.
			$html_share_details = wp_safe_remote_get(
				$share_count_url . $url_current_page,
				array(
					'timeout' => 6,
				)
			);

			// If no error.
			if ( is_wp_error( $html_share_details ) ) {
				return $this->ssba_format_number( $long_cached_count );
			}

			// Decode and return count.
			$arr_share_details = json_decode( $html_share_details['body'], true );
			$int_share_count   = $long_cached_count;

			if ( isset( $arr_share_details['share']['share_count'] ) ) {
				$int_facebook_share_count = (int) $arr_share_details['share']['share_count'];

				wp_cache_set( $cache_key, $int_share_count, 'ssba', MINUTE_IN_SECONDS * 2 );
				set_transient( "ssba_{$cache_key}", $int_share_count, DAY_IN_SECONDS );
			}

			return $this->ssba_format_number( $int_share_count );
		}
	}

	/**
	 * Get share count URL.
	 *
	 * @param string $button Button string name.
	 *
	 * @return string Share count URL for button.
	 */
	public function get_share_count_url( $button ) {
		$count_urls = array(
			'facebook'    => 'http://graph.facebook.com/',
			'reddit'      => 'http://www.reddit.com/api/info.json?url=',
			'pinterest'   => 'https://api.pinterest.com/v1/urls/count.json?url=',
			'linkedin'    => 'http://www.linkedin.com/countserv/count/share?url=',
			'stumbleupon' => 'http://www.stumbleupon.com/services/1.01/badge.getinfo?url=',
			'tumblr'      => 'http://api.tumblr.com/v2/share/stats?url=',
			'yummly'      => 'http://www.yummly.com/services/yum-count?url=',
		);

		return true === isset( $count_urls[ $button ] ) ? $count_urls[ $button ] : '';
	}

	/**
	 * Get button color.
	 *
	 * @param string $button Button name.
	 *
	 * @return string Button color.
	 */
	public static function get_button_color( $button ) {
		$colors = array(
			'airbnb'          => '#FF5A5F',
			'amazon'          => '#FFB300',
			'blogger'         => '#ff8000',
			'blm'             => '#000000',
			'buffer'          => '#323B43',
			'copy'            => '#14682B',
			'delicious'       => '#205cc0',
			'diaspora'        => '#000000',
			'diggit'          => '#262626',
			'douban'          => '#2E963D',
			'email'           => '#7d7d7d',
			'evernote'        => '#5BA525',
			'facebook'        => '#4267B2',
			'flattr'          => '#f67c1a',
			'flickr'          => '#ff0084',
			'flipboard'       => '#e12828',
			'get_pocket'      => '#ef4056',
			'getpocket'       => '#ef4056',
			'gmail'           => '#D44638',
			'googlebookmarks' => '#4285F4',
			'hackernews'      => '#ff4000',
			'instagram'       => '#bc2a8d',
			'instapaper'      => '#000000',
			'iorbix'          => '#364447',
			'kakao'           => '#F9DD4A',
			'kindleit'        => '#363C3D',
			'kooapp'          => '#FACD00',
			'line'            => '#00c300',
			'linkedin'        => '#0077b5',
			'livejournal'     => '#00b0ea',
			'mailru'          => '#168de2',
			'medium'          => '#333333',
			'meneame'         => '#ff6400',
			'messenger'       => '#448AFF',
			'odnoklassniki'   => '#d7772d',
			'outlook'         => '#3070CB',
			'patreon'         => '#F96854',
			'pinterest'       => '#CB2027',
			'print'           => '#222222',
			'qzone'           => '#F1C40F',
			'quora'           => '#a62100',
			'refind'          => '#4286f4',
			'reddit'          => '#ff4500',
			'renren'          => '#005baa',
			'skype'           => '#00aff0',
			'snapchat'        => '#fffc00',
			'stumbleupon'     => '#eb4924',
			'soundcloud'      => '#ff8800',
			'spotify'         => '#1ED760',
			'surfingbird'     => '#6dd3ff',
			'telegram'        => '#0088cc',
			'tencentqq'       => '#5790F7',
			'threema'         => '#000000',
			'tiktok'          => '#25F4EE',
			'trello'          => '#0D63DE',
			'tripadvisor'     => '#00AF87',
			'tumblr'          => '#32506d',
			'twitch'          => '#6441A4',
			'twitter'         => '#55acee',
			'vk'              => '#4c6c91',
			'viber'           => '#645EA4',
			'wechat'          => '#4EC034',
			'weibo'           => '#ff9933',
			'whatsapp'        => '#25d366',
			'wordpress'       => '#21759b',
			'xing'            => '#1a7576',
			'yelp'            => '#d32323',
			'youtube'         => '#FF0000',
			'yahoo_mail'      => '#720e9e',
			'yummly'          => '#E16120',
		);

		return isset( $colors[ $button ] ) ? $colors[ $button ] : '';
	}

	/**
	 * Get share URL.
	 *
	 * @param string $button Button name string.
	 * @param string $title Title string.
	 * @param string $description Description string.
	 * @param string $share_url Share URL string.
	 * @param string $user_id User ID string.
	 * @param string $subject Subject string.
	 * @param string $message Message string.
	 * @param string $image Image string.
	 * @param string $username Username string.
	 * @param string $bookmarklet Bookmarklet string.
	 * @param string $agg Agg string.
	 * @param string $popup Popup string.
	 * @param string $viber Viber string.
	 *
	 * @return string
	 */
	public static function get_share_url(
		$button,
		$title = '',
		$description = '',
		$share_url = '',
		$user_id = '',
		$subject = '',
		$message = '',
		$image = '',
		$username = '',
		$bookmarklet = '',
		$agg = '',
		$popup = '',
		$viber = ''
	) {
		$share_urls = array(
			'blogger'         => "https://www.blogger.com/blog-this.g?n={$title}&t={$description}&u={$share_url}",
			'buffer'          => "https://buffer.com/add?text={$title}&url={$share_url}",
			'diaspora'        => "https://share.diasporafoundation.org/?title={$title}&url={$share_url}",
			'delicious'       => "https://del.icio.us/save?provider=sharethis&title={$title}&url={$share_url}&v=5",
			'diggit'          => "https://digg.com/submit?url={$share_url}",
			'douban'          => "http://www.douban.com/recommend/?title={$title}&url={$share_url}",
			'copy'            => $share_url,
			'email'           => "mailto:?subject={$title}&body={$share_url}",
			'evernote'        => "http://www.evernote.com/clip.action?title={$title}&url={$share_url}",
			'facebook'        => "https://www.facebook.com/sharer.php?t={$title}&u={$share_url}",
			'flipboard'       => "https://share.flipboard.com/bookmarklet/popout?ext=sharethis&title={$title}&url={$share_url}&utm_campaign=widgets&utm_content=hostname&utm_source=sharethis&v=2",
			'flattr'          => "https://flattr.com/submit/auto?user={$user_id}&title={$title}&url={$share_url}",
			'get_pocket'      => "https://getpocket.com/edit?url={$share_url}",
			'gmail'           => "https://mail.google.com/mail/?view=cm&to=&su{$title}&body{$share_url}&bcc=&cc=",
			'googlebookmarks' => "https://www.google.com/bookmarks/mark?op=edit&bkmk={$share_url}&title{$title}&annotation{$description}",
			'hackernews'      => "https://news.ycombinator.com/submitlink?u={$share_url}&t={$title}",
			'instapaper'      => "http://www.instapaper.com/edit?url={$share_url}&title={$title}&description={$description}",
			'iorbix'          => "https://iorbix.com/m-share?url={$share_url}&title={$title}",
			'kakao'           => "https://story.kakao.com/share?url={$share_url}",
			'kindleit'        => "https://pushtokindle.fivefilters.org/send.php?url={$share_url}",
			'kooapp'          => "https://www.kooapp.com/create?title={$title}&link={$share_url}",
			'line'            => "https://lineit.line.me/share/ui?url={$share_url}&text{$title}",
			'linkedin'        => "https://www.linkedin.com/shareArticle?title={$title}&url={$share_url}",
			'livejournal'     => "https://www.livejournal.com/update.bml?event={$share_url}&subject{$title}",
			'mailru'          => "https://connect.mail.ru/share?share_url={$share_url}",
			'meneame'         => "https://meneame.net/submit.php?url={$share_url}",
			'messenger'       => "https://www.facebook.com/dialog/send?link={$share_url}&app_id=291494419107518&redirect_uri=https://www.sharethis.com",
			'odnoklassniki'   => "https://connect.ok.ru/dk?st.cmd=WidgetSharePreview&st.shareUrl{$share_url}",
			'outlook'         => "https://outlook.live.com/mail/deeplink/compose?path=mail inbox&subject={$subject}&body={$message}",
			'pinterest'       => "https://pinterest.com/pin/create/button/?description={$title}&media={$image}&url={$share_url}",
			'qzone'           => "http://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url={$share_url}",
			'print'           => '#',
			'reddit'          => "https://reddit.com/submit?title={$title}&url={$share_url}",
			'refind'          => "https://refind.com?url={$share_url}",
			'renren'          => "http://widget.renren.com/dialog/share?resourceUrl={$share_url}&srcUrl={$share_url}&title={$title}&description={$description}",
			'skype'           => "https://web.skype.com/share?url={$share_url}&text{$title}",
			'snapchat'        => "https://snapchat.com/scan?attachmentUrl={$share_url}&utm_source=sharethis",
			'surfingbird'     => "http://surfingbird.ru/share?url={$share_url}&description={$description}&title={$title}",
			'telegram'        => "https://t.me/share/url?url={$share_url}&text={$title}&to=",
			'stumbleupon'     => "http://www.stumbleupon.com/submit?url={$share_url}&title={$title}",
			'tencentqq'       => "https://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url={$share_url}&title={$title}&summary={$share_url}&desc={$description}&pics={$image}",
			'threema'         => "threema://compose?text={$share_url}&id=",
			'trello'          => "https://trello.com/add-card?mode={$popup}&url={$share_url}&desc={$description}",
			'tumblr'          => "https://www.tumblr.com/share?t={$title}&u={$share_url}&v=3",
			'twitter'         => "https://twitter.com/intent/tweet?text={$title}&url={$share_url}&via={$username}",
			'vk'              => "https://vk.com/share.php?url={$share_url}",
			'viber'           => "viber://forward?text={$share_url}&url={$viber}",
			'wechat'          => "https://api.qrserver.com/v1/create-qr-code/?data={$share_url}&size=154x154",
			'weibo'           => "http://service.weibo.com/share/share.php?title={$title}&url={$share_url}&pic={$image}",
			'whatsapp'        => "https://web.whatsapp.com/send?text={$share_url}",
			'wordpress'       => "http://wordpress.com/wp-admin/press-this.php?u={$share_url}&t={$title}&s{$description}i=",
			'yahoo_mail'      => "http://compose.mail.yahoo.com/?to=&subject={$title}&body={$share_url}",
			'yummly'          => "https://www.yummly.com/urb/verify?url={$share_url}&title={$title}&urbtype={$bookmarklet}&type={$agg}&vendor=sharethis&image={$image}",
			'xing'            => "https://www.xing.com/spi/shares/new?url={$share_url}",
		);

		if (wp_is_mobile()) {
			$share_urls['whatsapp'] = "whatsapp://send?text={$share_url}";
			$share_urls['messenger'] = "fb-messenger://share/?link={$share_url}&app_id=291494419107518";
		}

		return isset( $share_urls[ $button ] ) ? $share_urls[ $button ] : '';
	}

	/**
	 * Get button image.
	 *
	 * @param string  $button Button name string.
	 * @param boolean $white Whether to fetch the white version of the icon.
	 *
	 * @return string SVG image body.
	 */
	public static function get_button_image( $button, $white = false ) {
		$path = str_replace( '/php', '', plugin_dir_path(__FILE__));

		$button_name = str_replace(
			array(
				'getpocket',
				'get_pocket',
				'diggit',
				'_',
			),
			array(
				'pocket',
				'pocket',
				'digg',
				'',
			),
			$button
		);

		$button_file_name = ( false === $white ) ?
			sprintf( '%s.svg.php', $button_name ) :
			sprintf( '%s-white.svg.php', $button_name );

		$button_file_path = sprintf( '%simages/networks/%s', $path, $button_file_name );

		if ( true === is_readable( $button_file_path ) ) {
			ob_start();
			include $button_file_path;
			return ob_get_clean();
		}

		return '';
	}
}
