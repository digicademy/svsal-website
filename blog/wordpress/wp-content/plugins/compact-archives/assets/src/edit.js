/* global WpbCompactArchiveShims */
import { Disabled, PanelBody, SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/*
 * This is to account for the deprecation of these components in
 * @wordpress/editor in WP 5.2. In WP 5.8 the new widget screen started
 * throwing a PHP notice if the editor script was enqueued so we've hacked
 * this to enable support for earlier versions of WP.
 *
 * Once WP minimum version is bumped to 5.2, return to the standard imports
 * from the @wordpress/block-editor library.
 */
const { InspectorControls, RichText } =
	WpbCompactArchiveShims.wpFiveTwo || WpbCompactArchiveShims.wpFiveZero;

const wpbcaBlockVars = window.wpbca_block_vars;

const edit = ( { attributes, setAttributes } ) => {
	const compactArchiveType = attributes.compact_archive_type;
	const compactArchiveTextCase = attributes.compact_archive_text_case;

	let textTransform;
	if ( compactArchiveTextCase === 'capitalize' ) {
		textTransform = 'capitalize';
	} else if ( compactArchiveTextCase === 'uppercase' ) {
		textTransform = 'uppercase';
	}

	let renderedArchive = wpbcaBlockVars.ca_initial;

	if ( compactArchiveType === 'block' ) {
		renderedArchive = wpbcaBlockVars.ca_block;
	} else if ( compactArchiveType === 'numeric' ) {
		renderedArchive = wpbcaBlockVars.ca_numeric;
	}

	return (
		<>
			<InspectorControls>
				<PanelBody>
					<SelectControl
						label={ __(
							'Select Archive Type',
							'compact-archives'
						) }
						onChange={ ( value ) => {
							setAttributes( {
								compact_archive_type: value,
							} );
						} }
						options={ [
							{
								value: 'initial',
								label: __( 'Initial', 'compact-archives' ),
							},
							{
								value: 'block',
								label: __( 'Block', 'compact-archives' ),
							},
							{
								value: 'numeric',
								label: __( 'Numeric', 'compact-archives' ),
							},
						] }
						value={ attributes.compact_archive_type }
					/>
					{ attributes.compact_archive_type === 'block' && (
						<SelectControl
							label={ __( 'Transform Text', 'compact-archives' ) }
							onChange={ ( value ) => {
								setAttributes( {
									compact_archive_text_case: value,
								} );
							} }
							options={ [
								{
									value: 'none',
									label: __( 'None', 'compact-archives' ),
								},
								{
									value: 'capitalize',
									label: __(
										'Capitalize',
										'compact-archives'
									),
								},
								{
									value: 'uppercase',
									label: __(
										'Uppercase',
										'compact-archives'
									),
								},
							] }
							value={ attributes.compact_archive_text_case }
						/>
					) }
				</PanelBody>
			</InspectorControls>
			<RichText
				className="wpb-compact-archive-block-title"
				value={ attributes.compact_archive_title }
				onChange={ ( value ) => {
					setAttributes( {
						compact_archive_title: value,
					} );
				} }
				placeholder={ __(
					'Enter a title (Leave empty to disable)',
					'compact-archives'
				) }
				formattingControls={ [ 'bold', 'italic', 'link' ] }
				tagName="p"
			/>
			<Disabled className="wpb-compact-archive-block">
				<ul
					style={ {
						textTransform,
					} }
					dangerouslySetInnerHTML={ {
						/*
						 * This is rendered safe by running the PHP generated HTML through KSES before
						 * making it available to JavaScript.
						 */
						__html: renderedArchive,
					} }
				></ul>
			</Disabled>
		</>
	);
};

export default edit;
