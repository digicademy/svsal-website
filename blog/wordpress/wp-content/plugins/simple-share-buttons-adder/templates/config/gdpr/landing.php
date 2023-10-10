<?php
/**
 * Template for GDPR landing page display.
 *
 * @package SimpleShareButtonsAdder
 */

?>
<h2 style="text-decoration: underline;">
	<?php esc_html_e( 'Check out our new GDPR Compliance Tool!', 'simple-share-buttons-adder' ); ?>
</h2>
<div class="row">
	<div class="col-md-12">
		<img src="<?php echo esc_url( plugin_dir_url( __FILE__ ) . '../../../images/gdpr-ex.png' ); ?>"/>
	</div>
	<div class="col-md-6">
		<h3><?php esc_html_e( 'Confirm Consent', 'simple-share-buttons-adder' ); ?></h3>
		<p>
			<?php
			esc_html_e(
				'A simple and streamlined way to confirm a user’s initial acceptance or rejection of cookie collection',
				'simple-share-buttons-adder'
			);
			?>
		</p>
	</div>
	<div class="col-md-6">
		<h3><?php esc_html_e( 'Select Purpose', 'simple-share-buttons-adder' ); ?></h3>
		<p>
			<?php
			esc_html_e(
				'A transparent system of verifying the intent of collecting a user’s cookies, and giving the option to opt in or out',
				'simple-share-buttons-adder'
			);
			?>
		</p>
	</div>
</div>
<div class="row">
	<div class="col-md-6">
		<h3><?php esc_html_e( 'Indicate Company', 'simple-share-buttons-adder' ); ?></h3>
		<p>
			<?php
			esc_html_e(
				'A comprehensive record of company-level information that allows users to monitor and control the recipients of cookie collection',
				'simple-share-buttons-adder'
			);
			?>
		</p>
	</div>
	<div class="col-md-6">
		<h3><?php esc_html_e( 'Access Data Rights', 'simple-share-buttons-adder' ); ?></h3>
		<p>
			<?php
			esc_html_e(
				'A centralized database where users can review the latest privacy policies and information pertaining to their cookie collection',
				'simple-share-buttons-adder'
			);
			?>
		</p>
	</div>
</div>
<div class="row register-section">
	<button id="register-selection"><?php esc_html_e( 'Register to enable', 'simple-share-buttons-adder' ); ?></button>
</div>
<div class="row">
	<h2 style="text-decoration: underline;"><?php esc_html_e( 'FAQs', 'simple-share-buttons-adder' ); ?></h2>
	<div class="accor-wrap">
		<div class="accor-tab">
			<span class="accor-arrow">&#9658;</span>
			<?php esc_html_e( 'What is GDPR?', 'simple-share-buttons-adder' ); ?>
		</div>
		<div class="accor-content">
			<div class="well">
				<?php
				esc_html_e(
					'GDPR (General Data Protection Regulation) is a European regulation to provide EU citizens and residents with greater control of their personal data and to streamline the rules for international businesses working in Europe. GDPR affects all companies based in the EU as well as companies anywhere in the world that handle data related to EU residents.',
					'simple-share-buttons-adder'
				);
				?>
			</div>
		</div>
	</div>
	<div class="accor-wrap">
		<div class="accor-tab">
			<span class="accor-arrow">&#9658;</span>
			<?php esc_html_e( 'What is “Personal Data” as it relates to GDPR?', 'simple-share-buttons-adder' ); ?>
		</div>
		<div class="accor-content">
			<div class="well">
				<?php
				esc_html_e(
					'Under GDPR personal data refers to any information that can directly or indirectly identify an individual. Personal information ShareThis collects includes cookies and IP addresses. We do not collect emails, addresses, phone numbers, or national ID numbers which is also considered personal information.',
					'simple-share-buttons-adder'
				);
				?>
			</div>
		</div>
	</div>
	<div class="accor-wrap">
		<div class="accor-tab">
			<span class="accor-arrow">&#9658;</span>
			<?php esc_html_e( 'What is a Data Protection Officer (DPO)?', 'simple-share-buttons-adder' ); ?>
		</div>
		<div class="accor-content">
			<div class="well">
				<?php
				esc_html_e(
					'A DPO is required for companies that handle large scale processing of data. The DPO’s role is to monitor the company’s compliance under GDPR and to communicate with the data protection authorities. ShareThis is working with a DPO.',
					'simple-share-buttons-adder'
				);
				?>
			</div>
		</div>
	</div>
	<div class="accor-wrap">
		<div class="accor-tab">
			<span class="accor-arrow">&#9658;</span>
			<?php esc_html_e( 'What is a CMP?', 'simple-share-buttons-adder' ); ?>
		</div>
		<div class="accor-content">
			<div class="well">
				<?php
				esc_html_e(
					'A consent management platform (CMP) is a tool that collects and stores consented data as well as communicates the consent status of users and their cookies to other vendors within the CMP’s framework. It is customizable by the publisher and editable by the consumer.',
					'simple-share-buttons-adder'
				);
				?>
			</div>
		</div>
	</div>
	<div class="accor-wrap">
		<div class="accor-tab">
			<span class="accor-arrow">&#9658;</span>
			<?php
			esc_html_e(
				'Are you a member of any self-regulating organizations? Have you any data-related certification?',
				'simple-share-buttons-adder'
			);
			?>
		</div>
		<div class="accor-content">
			<div class="well">
				<?php
				esc_html_e(
					'ShareThis is a member of the IAB, NAI, and DAA in the North American markets and EDAA in Europe.',
					'simple-share-buttons-adder'
				);
				?>
			</div>
		</div>
	</div>
	<div class="accor-wrap">
		<div class="accor-tab">
			<span class="accor-arrow">&#9658;</span>
			<?php
			esc_html_e(
				'How do you manage requests from individuals regarding their data?',
				'simple-share-buttons-adder'
			);
			?>
		</div>
		<div class="accor-content">
			<div class="well">
				<?php
				esc_html_e(
					'For consumers who wish not to have their data processed, or to request withdrawal of consent or deletion of data, our existing opt-out procedure can be found on our',
					'simple-share-buttons-adder'
				);
				?>
				<a href="https://www.sharethis.com/privacy/" target="_blank">
					<?php esc_html_e( 'privacy page', 'simple-share-buttons-adder' ); ?>
				</a>
				<?php
				esc_html_e(
					'&nbsp;or emailed to&nbsp;',
					'simple-share-buttons-adder'
				);
				?>
				<a href="mailto:privacy@sharethis.com">privacy@sharethis.com</a>.
			</div>
		</div>
	</div>
	<div class="accor-wrap">
		<div class="accor-tab">
			<span class="accor-arrow">&#9658;</span>
			<?php
			esc_html_e(
				'How long can you keep personal data?',
				'simple-share-buttons-adder'
			);
			?>
		</div>
		<div class="accor-content">
			<div class="well">
				<?php
				esc_html_e(
					'We believe Usage Data is relevant for up to 13 months so we retain that data for up to 14 months from the date of collection.  Our cookies expire 13 months after they are last updated.',
					'simple-share-buttons-adder'
				);
				?>
			</div>
		</div>
	</div>
	<div class="accor-wrap">
		<div class="accor-tab">
			<span class="accor-arrow">&#9658;</span>
			<?php
			esc_html_e(
				'What do I need to do to comply with GDPR?',
				'simple-share-buttons-adder'
			);
			?>
		</div>
		<div class="accor-content">
			<div class="well">
				<?php
				esc_html_e(
					'Please review the ShareThis Terms of Use for what ShareThis expects of our publishers in order to be GDPR compliant and to continue using ShareThis tools. Included in our Terms of Use:',
					'simple-share-buttons-adder'
				);
				?>

				<ul class="bullets max-width">
					<li>
						<?php
						esc_html_e(
							'ShareThis expects that by maintaining our publisher tools on your website, you agree to these terms of service and will collect, process, and pass personal data on the basis of this consent.',
							'simple-share-buttons-adder'
						);
						?>
					</li>
					<li>
						<?php
						esc_html_e(
							'To receive consented data, we expect our publishers to have a GDPR compliant consent mechanism of choice on their website.',
							'simple-share-buttons-adder'
						);
						?>
					</li>
					<li>
						<?php
						esc_html_e(
							'ShareThis expects our publishers to collect, process, and transfer EU/EEA User Personal Data to ShareThis once they have solicited and obtained informed consent from each individual user.',
							'simple-share-buttons-adder'
						);
						?>
					</li>
				</ul>
			</div>
		</div>
	</div>
	<div class="accor-wrap">
		<div class="accor-tab">
			<span class="accor-arrow">&#9658;</span>
			<?php
			esc_html_e(
				'If I choose to show the tool to people only in the EU, how can I check to make sure it’s working?',
				'simple-share-buttons-adder'
			);
			?>
		</div>
		<div class="accor-content">
			<div class="well">
				<?php
				esc_html_e(
					'There are many free and paid VPN services that you can use to check the appearance of your site in other geographic regions.',
					'simple-share-buttons-adder'
				);
				?>
			</div>
		</div>
	</div>
	<div class="accor-wrap">
		<div class="accor-tab">
			<span class="accor-arrow">&#9658;</span>
			<?php
			esc_html_e(
				'If I use the Compliance Tool am I compliant with GDPR?',
				'simple-share-buttons-adder'
			);
			?>
		</div>
		<div class="accor-content">
			<div class="well">
				<?php
				esc_html_e(
					'In order to be GDPR compliant with ShareThis, ShareThis expects a publisher to use a consumer management platform of their choosing, which can include the ShareThis GDPR Compliance Tool.  Our publishers must collect, process, and transfer EU/EEA User Personal Data to ShareThis only after it has been solicited with obtained informed consent from each individual user.  For general GDPR compliance, please seek legal counsel to understand how the law affects your publisher business in full.',
					'simple-share-buttons-adder'
				);
				?>
			</div>
		</div>
	</div>
</div>
