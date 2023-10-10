<?php

use WPB\CompactArchives\Compat;

/**
 * The compact archive widget.
 */
class WPBeginner_CAW_Widget extends WP_Widget {

	public function __construct() {
		$widget_ops = array(
			'classname'             => 'wpb_caw_widget',
			'description'           => __( 'Create a widget for Compact Archives plugin', 'compact-archives' ),
			'show_instance_in_rest' => true,
		);
		parent::__construct( 'wpb-caw-widget', __( 'Compact Archives Widget', 'compact-archives' ), $widget_ops );
	}

	/**
	 * Render the widget.
	 *
	 * @param array $args     Arguments used by theme when registering the sidebar.
	 * @param array $instance The active widget instance.
	 * @return void
	 */
	public function widget( $args, $instance ) {
		$before_widget = $args['before_widget'];
		$after_widget  = $args['after_widget'];
		$before_title  = $args['before_title'];
		$after_title   = $args['after_title'];

		$title        = apply_filters( 'widget_title', $instance['title'] );
		$widget_style = $instance['style'];
		switch ( $instance['text_style'] ) {
			case 'none':
				$text_style = '';
				break;
			case 'capitalize':
				$text_style = 'text-transform: capitalize;';
				break;
			case 'uppercase':
			default:
				$text_style = 'text-transform: uppercase;';
				break;
		}

		// Before and after arguments are registered by the theme author in code they are considered safe.
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo $before_widget;
		if ( $title ) {
			// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			echo $before_title . wp_strip_all_tags( $title ) . $after_title;
		} ?>
		<ul class="compact-archives"<?php echo $text_style ? ' style="' . esc_attr( $text_style ) . '" ' : ''; ?>>
			<?php compact_archive( $widget_style ); ?>
		</ul>
		<?php
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo $after_widget;
	}

	/**
	 * Save changes to the widget.
	 *
	 * @param array $new_instance The new options saved in the dashboard.
	 * @param array $old_instance The previous options.
	 * @return array The widget options to save to the database.
	 */
	public function update( $new_instance, $old_instance ) {
		$instance          = $old_instance;
		$instance['title'] = wp_strip_all_tags( $new_instance['title'] );

		if ( in_array( $new_instance['style'], array( 'initial', 'block', 'numeric' ), true ) ) {
			$instance['style'] = $new_instance['style'];
		} else {
			$instance['style'] = 'initial';
		}

		if ( in_array( $new_instance['text_style'], array( 'none', 'capitalize', 'uppercase' ), true ) ) {
			$instance['text_style'] = $new_instance['text_style'];
		} else {
			$instance['text_style'] = 'uppercase';
		}
		return $instance;
	}

	/**
	 * Echo the form for updating the widget.
	 *
	 * @param array $instance Current widget settings.
	 */
	public function form( $instance ) {
		$defaults   = array(
			'title'      => __( 'Archives by Month', 'caw-domain' ),
			'style'      => 'initial',
			'text_style' => 'uppercase',
		);
		$instance   = wp_parse_args( (array) $instance, $defaults );
		$style      = $instance['style'];
		$text_style = $instance['text_style'];

		/*
		 * Check if Compact Archives Widget plugin is installed.
		 * Ask user to deactivate it if it is installed.
		 */
		if ( Compat\is_plugin_active( 'compact-archives-widget/compact-archives-widget.php' ) ) {
			?>
			<p style="background-color: #FFD5D5; padding: 10px;">
					<?php
					printf(
						/* Translators: 1: Link to the plugin page; 2: closing link tag; 3: opening strong tag; 4: closing string tag; 5: line break. */
						esc_html__( '%3$sNotice.%4$s%5$sThe %3$sCompact Archives Widget%4$s plugin is active on your WordPress and it\'s not needed anymore . Please, %1$sdeactivate it from here%2$s.', 'compact-archives' ),
						'<a href="' . admin_url( 'plugins.php' ) . '">',
						'</a>',
						'<strong>',
						'</strong>',
						'<br />'
					);
					?>
			</p>
			<?php } ?>
			<p>
				<label for="<?php echo esc_attr( $this->get_field_id( 'title' ) ); ?>">
					<?php esc_html_e( 'Title:', 'compact-archives' ); ?>
				</label>
				<input class="widefat" id="<?php echo esc_attr( $this->get_field_id( 'title' ) ); ?>" name="<?php echo esc_attr( $this->get_field_name( 'title' ) ); ?>" type="text" value="<?php echo esc_attr( $instance['title'] ); ?>" />
			</p>

			<p>
				<label for="<?php echo esc_attr( $this->get_field_id( 'style' ) ); ?>">
					<?php esc_html_e( 'Select the style:', 'compact-archives' ); ?>
				</label><br />
				<select name="<?php echo esc_attr( $this->get_field_name( 'style' ) ); ?>" >
					<option <?php selected( 'initial', $style ); ?> value="initial">
						<?php esc_html_e( 'Initials', 'compact-archives' ); ?>
					</option>
					<option <?php selected( 'block', $style ); ?> value="block">
						<?php esc_html_e( 'Block', 'compact-archives' ); ?>
					</option>
					<option <?php selected( 'numeric', $style ); ?> value="numeric">
						<?php esc_html_e( 'Numeric', 'compact-archives' ); ?>
					</option>
				</select>
			</p>

			<p>
				<label for="<?php echo esc_attr( $this->get_field_id( 'text_style' ) ); ?>">
					<?php esc_attr_e( 'Transform text:', 'compact-archives' ); ?>
				</label>
				<select name="<?php echo esc_attr( $this->get_field_name( 'text_style' ) ); ?>" >
					<option <?php selected( 'None', $text_style ); ?> value="none">
						<?php esc_attr_e( 'None transformation', 'compact-archives' ); ?>
					</option>
					<option <?php selected( 'uppercase', $text_style ); ?> value="uppercase">
						<?php esc_attr_e( 'UPPERCASE', 'compact-archives' ); ?>
					</option>
					<option <?php selected( 'capitalize', $text_style ); ?> value="capitalize">
						<?php esc_attr_e( 'Capitalize', 'compact-archives' ); ?>
					</option>
				</select>
			</p>
		<?php
	}
}
