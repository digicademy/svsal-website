<?php
/**
 * The Config display for GDPR tab.
 *
 * @package SimpleShareButtonsAdder
 */

// User type options.
$user_types = array(
	'eu'     => esc_html__( 'Only visitors in the EU', 'sharethis-custom' ),
	'always' => esc_html__( 'All visitors globally', 'sharethis-custom' ),
);

$languages = array(
	'English' => 'en',
	'German'  => 'de',
	'Spanish' => 'es',
	'French'  => 'fr',
);

$publisher_name = ! empty( $gdpr_config['publisher_name'] ) ? $gdpr_config['publisher_name'] : '';
$enabled        = ! empty( $gdpr_config['enabled'] ) ? $gdpr_config['enabled'] : false;
?>
<label class="control-label">
	<?php echo esc_html__( 'GDPR', 'simple-share-buttons-adder' ); ?>
</label>
<div class="input-div">
	<input type="checkbox" id="sharethis-enabled" <?php checked( 'true', $enabled ); ?>>
</div>
<div class="well">
	<label class="control-label">
		<?php
		echo esc_html__(
			'PUBLISHER NAME * (this will be displayed in the consent tool)',
			'sharethis-share-buttons'
		);
		?>
	</label>
	<div class="input-div">
		<input type="text" id="sharethis-publisher-name" placeholder="Enter your company name" value="<?php echo esc_attr( $publisher_name ); ?>">
	</div>
	<label class="control-label">
		<?php
		echo esc_html__(
			'WHICH USERS SHOULD BE ASKED FOR CONSENT?',
			'sharethis-share-buttons'
		);
		?>
	</label>
	<div class="input-div">
		<select id="sharethis-user-type">
			<?php foreach ( $user_types as $user_value => $name ) : ?>
				<option value="<?php echo esc_attr( $user_value ); ?>" <?php echo selected( $user_value, $gdpr_config['display'] ); ?>>
					<?php echo esc_html( $name ); ?>
				</option>
			<?php endforeach; ?>
		</select>
	</div>
	<label class="control-label">
		<?php echo esc_html__( 'SELECT LANGUAGE', 'sharethis-share-buttons' ); ?>
	</label>
	<div class="input-div">
		<select id="st-language">
			<?php foreach ( $languages as $language => $code ) : ?>
				<option value="<?php echo esc_attr( $code ); ?>" <?php echo selected( $code, $gdpr_config['language'] ); ?>>
					<?php echo esc_html( $language ); ?>
				</option>
			<?php endforeach; ?>
		</select>
	</div>
</div>
<div class="accor-wrap">
	<div class="accor-tab">
		<span class="accor-arrow">&#9658;</span>
		<?php echo esc_html__( 'Appearance', 'simple-share-buttons-adder' ); ?>
	</div>
	<div class="accor-content">
		<div class="well">
			<?php require plugin_dir_path( __FILE__ ) . 'appearance.php'; ?>
		</div>
	</div>
</div>
<div class="accor-wrap">
	<div class="accor-tab">
		<span class="accor-arrow">&#9658;</span>
		<?php echo esc_html__( 'Purposes', 'simple-share-buttons-adder' ); ?>
	</div>
	<div class="accor-content">
		<div class="well">
			<?php require plugin_dir_path( __FILE__ ) . 'purposes.php'; ?>
		</div>
	</div>
</div>
