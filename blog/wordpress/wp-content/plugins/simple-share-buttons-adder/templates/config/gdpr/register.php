<?php
/**
 * Create account section of GDPR tab.
 *
 * @package SimpleShareButtonsAdder
 */

?>
<h3>
	<?php echo esc_html__( 'Create an account', 'sharethis-custom' ); ?>
</h3>

<div class="sharethis-account-creation">
	<div class="page-content" data-size="small" style="text-align: left;">
		<div class="input">
			<input type="text" id="st-email" name="email" placeholder="john@acme.com">
		</div>
		<div class="input " style="margin-bottom: 10px;">
			<input type="password" id="st-password" name="password" minlength="6"
				placeholder="Create a password">
		</div>
		<div style="margin: 20px 0 50px;" class="item gdpr-check">
			<input id="email-enabled" type="checkbox"/>
			<label class="gdpr">
				<?php echo esc_html__( 'Subscribe to our monthly newsletter for tips and trends to grow your site.', 'sharethis-custom' ); ?>
			</label>
		</div>
	</div>
	<div class="sharethis-login-message">
		<p style="font-size:.9rem;">
			<?php echo esc_html__( 'By clicking "Register," you certify that you are agreeing to our', 'sharethis-custom' ); ?>
			<a href="/privacy/" target="_blank" rel="nofollow">
				<?php esc_html_e( 'Privacy Policy', 'simple-share-buttons-adder' ); ?></a>
			<?php esc_html_e( 'and', 'simple-share-buttons-adder' ); ?> <a
				href="/publisher-terms-of-use/" target="_blank" rel="nofollow">
				<?php esc_html_e( 'Terms of Service', 'simple-share-buttons-adder' ); ?></a>
			<?php esc_html_e( 'for Publishers', 'simple-share-buttons-adder' ); ?>.
		</p>
	</div>

	<a class="create-account st-rc-link medium-btn" href="#">
		<?php esc_html_e( 'Register', 'sharethis' ); ?>
	</a>
</div>
