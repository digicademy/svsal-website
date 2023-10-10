<?php
/**
 * Compatibility fixes for WP 5.8 Block widgets screen.
 */

namespace WPB\CompactArchives\Compat;

/**
 * Determines whether a plugin is active.
 *
 * Only plugins installed in the plugins/ folder can be active.
 *
 * Plugins in the mu-plugins/ folder can't be "activated," so this function will
 * return false for those plugins.
 *
 * For more information on this and similar theme functions, check out
 * the {@link https://developer.wordpress.org/themes/basics/conditional-tags/
 * Conditional Tags} article in the Theme Developer Handbook.
 *
 * @since 2.5.0
 *
 * @param string $plugin Path to the plugin file relative to the plugins directory.
 * @return bool True, if in the active plugins list. False, not in the list.
 */
function is_plugin_active( $plugin ) {
	// Defer to Core function when available.
	if ( function_exists( 'is_plugin_active' ) ) {
		return \is_plugin_active( $plugin );
	}
	return in_array( $plugin, (array) get_option( 'active_plugins', array() ), true ) || is_plugin_active_for_network( $plugin );
}

/**
 * Determines whether the plugin is active for the entire network.
 *
 * Only plugins installed in the plugins/ folder can be active.
 *
 * Plugins in the mu-plugins/ folder can't be "activated," so this function will
 * return false for those plugins.
 *
 * For more information on this and similar theme functions, check out
 * the {@link https://developer.wordpress.org/themes/basics/conditional-tags/
 * Conditional Tags} article in the Theme Developer Handbook.
 *
 * @since 3.0.0
 *
 * @param string $plugin Path to the plugin file relative to the plugins directory.
 * @return bool True if active for the network, otherwise false.
 */
function is_plugin_active_for_network( $plugin ) {
	// Defer to Core function when available.
	if ( function_exists( 'is_plugin_active_for_network' ) ) {
		return \is_plugin_active_for_network( $plugin );
	}

	if ( ! is_multisite() ) {
		return false;
	}

	$plugins = get_site_option( 'active_sitewide_plugins' );
	if ( isset( $plugins[ $plugin ] ) ) {
		return true;
	}

	return false;
}
