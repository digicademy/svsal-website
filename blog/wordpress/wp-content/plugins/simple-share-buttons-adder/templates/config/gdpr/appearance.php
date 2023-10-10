<?php
/**
 * Appearence display for gdpr config.
 *
 * @package SimpleShareButtonsAdder
 */

// Get GDPR Config.
$ssba_settings = get_option( 'ssba_settings', true );
$gdpr_config   = true === isset( $ssba_settings['ssba_gdpr_config'] ) ? $ssba_settings['ssba_gdpr_config'] : array();

// Template vars.
$colors = array(
	'#e31010',
	'#000000',
	'#ffffff',
	'#09cd18',
	'#ff6900',
	'#fcb900',
	'#7bdcb5',
	'#00d084',
	'#8ed1fc',
	'#0693e3',
	'#abb8c3',
	'#eb144c',
	'#f78da7',
	'#9900ef',
	'#b80000',
	'#db3e00',
	'#fccb00',
	'#008b02',
	'#006b76',
	'#1273de',
	'#004dcf',
	'#5300eb',
	'#eb9694',
	'#fad0c3',
	'#fef3bd',
	'#c1e1c5',
	'#bedadc',
	'#c4def6',
	'#bed3f3',
	'#d4c4fb',
);
?>
<div class="col-md-12">
	<h3><?php echo esc_html__( 'Form Color', 'simple-share-buttons-adder' ); ?></h3>
</div>

<div id="sharethis-form-color" class="col-md-12">
	<?php foreach ( $colors as $color ) : ?>
		<div class="color<?php echo true === isset( $gdpr_config['color'] ) && $color === $gdpr_config['color'] ? esc_attr( ' selected' ) : ''; ?>"
			data-value="<?php echo esc_attr( $color ); ?>"
			style="max-width: 30px; max-height: 30px; overflow: hidden;"
		>
			<span style="content: ' '; background-color:<?php echo esc_html( $color ); ?>; padding: 40px;"></span>
		</div>
	<?php endforeach; ?>
</div>
