<?php
/**
 * Utilities.
 *
 * @package SimpleShareButtonsAdder
 */

namespace SimpleShareButtonsAdder;

/**
 * Utilities Class
 *
 * @package SimpleShareButtonsAdder
 */
class Util {
	/**
	 * Merges user defined arguments into defaults array.
	 *
	 * This function is used throughout this plugin to allow for both string or array
	 * to be merged into another array.
	 *
	 * @param string|array|object $args     Value to merge with $defaults.
	 * @param array               $defaults Optional. Array that serves as the defaults.
	 *                                      Default empty array.
	 * @return array Merged user defined values with defaults.
	 */
	public static function parse_args( $args, $defaults = array() ) {
		$parsed_args = isset( $parsed_args ) ? $parsed_args : array();

		if ( is_object( $args ) ) {
			$parsed_args = get_object_vars( $args );
		} elseif ( is_array( $args ) ) {
			$parsed_args =& $args;
		} else {
			self::parse_args( $args, $parsed_args );
		}

		if ( is_array( $defaults ) && $defaults ) {
			foreach ( $parsed_args as $parsed_arg_key => $parsed_arg ) {
				if ( true === empty( $parsed_arg ) && true === isset( $defaults[ $parsed_arg_key ] ) ) {
					$parsed_args[ $parsed_arg_key ] = $defaults[ $parsed_arg_key ];
				}
			}

			return array_merge( $defaults, $parsed_args );
		}

		return $parsed_args;
	}
}
