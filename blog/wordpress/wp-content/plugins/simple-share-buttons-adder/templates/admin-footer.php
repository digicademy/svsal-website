<?php
/**
 * Admin footer template.
 *
 * The template wrapper for the admin footer.
 *
 * @package SimpleShareButtonsAdder
 */

?>
	</div>
	<?php if ( true === empty( get_option( 'ssba-hide-review' ) ) ) : ?>
		<div class="ssba-review-us">
			<h3>
				<?php echo esc_html__( 'Love this plugin?', 'simple-share-buttons-adder' ); ?>
				<p>
					<a href="https://wordpress.org/support/plugin/simple-share-buttons-adder/reviews/#new-post" target="_blank">
						<?php
						echo esc_html__(
							'Please spread the word by leaving us a 5 star review!',
							'simple-share-buttons-adder'
						);
						?>
					</a>
				</p>
				<div id="close-review-us">close</div>
			</h3>
		</div>
	<?php endif; ?>
</div>
