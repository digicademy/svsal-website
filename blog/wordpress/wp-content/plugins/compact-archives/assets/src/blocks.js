import './blocks.css';
import edit from './edit';
import transforms from './transforms';

import { registerBlockType } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

/* WPB Compact Archives Block */
registerBlockType( 'wpb-compact-archive/wpb-compact-archive-block', {
	title: __( "WPBeginner's Compact Archives", 'compact-archives' ),
	icon: 'editor-justify',
	category: 'common',
	attributes: {
		compact_archive_type: {
			type: 'string',
			default: 'block',
		},
		compact_archive_text_case: {
			type: 'string',
			default: 'capitalize',
		},
		compact_archive_title: {
			type: 'string',
		},
	},
	keywords: [
		__( 'archive widget', 'wp-call-button' ),
		__( 'compact date archives', 'wp-call-button' ),
		__( 'monthly archives', 'wp-call-button' ),
	],

	edit,
	transforms,

	save: () => null,
} );
