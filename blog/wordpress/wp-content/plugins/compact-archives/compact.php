<?php
/*
Plugin Name: WPBeginner's Compact Archives
Plugin URI: http://www.wpbeginner.com
Description: Displays a compact monthly archive instead of the default long list. Either display it as a block suitable for the body of a page or in a form compact enough for a sidebar.
Version: 4.1.0
Author: WPBeginner
Author URI: http://www.wpbeginner.com
Text Domain: compact-archives
Requires PHP: 5.6
Requires at least: 4.8
Tested up to: 5.8
License: GPL-2.0+
*/

/*
Maintained and supported by WPBeginner, this plugin was originally developed by Rob Marsh. Copyright 2008  Rob Marsh, SJ  (http://rmarsh.com)

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
*/
/**
 * Plugin version for asset cache busting.
 *
 * @deprecated 4.0.0 Replaced with version string generated by wp-scripts.
 *                   This value is no longer be updated.
 */
define( 'WPB_COMPACT_ARCHIVES_VERSION', '3.0.9' );
/*
	Display the monthly archive of posts in a more compact form than the usual long list.

	If $style == 'block' the display will be wide enough to fill the main column of a page:

		2006: Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec
		2005: Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec
		2004: Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec

	If $style == 'initial' (the default) the display will fit into a sidebar.

				2006: J F M A M J J A S O N D
				2005: J F M A M J J A S O N D
				2004: J F M A M J J A S O N D

	If $style == 'numeric' the display will show month numbers.

				2006: 01 02 03 04 05 06 07 08 09 10 11 12
				2005: 01 02 03 04 05 06 07 08 09 10 11 12
				2004: 01 02 03 04 05 06 07 08 09 10 11 12

	$before and $after wrap each line of output. The default values are suitable for such use as:

		<ul>
			<?php compact_archive(); ?>
		</ul>

	Should work fine with whatever kind of permalink you are using.
	The month abbreviations should adapt to the locale set in wp-config.php.
	The year link at the start of each line is wrapped in <strong></strong> and months with no posts
	are wrapped in <span class="emptymonth"></span> so you can differentiate them visually

	If my Post Output Plugin is installed the Compact Archive output will be cached for efficiency.

*/

require_once __DIR__ . '/inc/compat/block-widget-screen.php';
require_once __DIR__ . '/inc/class-wpbeginner-caw-widget.php';
require_once __DIR__ . '/inc/compact-archives.php';

add_action( 'plugins_loaded', 'wpb_caw_bootstrap' );
