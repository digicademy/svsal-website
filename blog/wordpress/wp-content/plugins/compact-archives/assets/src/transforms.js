import { createBlock } from '@wordpress/blocks';

const isMatch = ( { idBase, instance } ) => {
	if ( idBase !== 'wpb-caw-widget' ) {
		return false;
	}

	if ( ! instance?.raw ) {
		// Don't transform if the raw instance is unavailable.
		return false;
	}

	return true;
};

const transform = ( { instance } ) => {
	const rawInstance = instance.raw;

	return createBlock( 'wpb-compact-archive/wpb-compact-archive-block', {
		compact_archive_type: rawInstance.style,
		compact_archive_text_case: rawInstance.text_style,
		compact_archive_title: rawInstance.title,
	} );
};

const transforms = {
	from: [
		{
			type: 'block',
			blocks: [ 'core/legacy-widget' ],
			isMatch,
			transform,
		},
	],
};

export default transforms;
