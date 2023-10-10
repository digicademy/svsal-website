<?php
/**
 * Facebook SDK header template.
 *
 * The template that gets injected into the header when Facebook App ID is entered.
 *
 * @package SimpleShareButtonsAdder
 */

$args = false === empty( $args ) ? $args : array();

$data = wp_parse_args(
	$args,
	array(
		'facebook_app_id'           => null,
		'facebook_insights_enabled' => false,
	)
);
?>
<script>
	window.fbAsyncInit = function() {
		FB.init({
			appId: '<?php echo esc_js( $data['facebook_app_id'] ); ?>',
			autoLogAppEvents: true,
			xfbml: true,
			version: 'v13.0',
		})
	}
</script>
<script>
	(function(d, s, id) {
		var js, fjs = d.getElementsByTagName(s)[0]
		if (d.getElementById(id)) {
			return
		}
		js     = d.createElement(s)
		js.id  = id
		js.src = "<?php echo esc_js( '//connect.facebook.net/en_US/sdk.js' ); ?>"
		fjs.parentNode.insertBefore(js, fjs)
	}(document, 'script', 'facebook-jssdk'))
</script>

<?php if ( true === $data['facebook_insights_enabled'] ) : ?>
<meta property="fb:app_id" content="<?php echo esc_attr( $data['facebook_app_id'] ); ?>" />
<?php endif; ?>
